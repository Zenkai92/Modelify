import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProjectForm from './ProjectForm'

global.fetch = vi.fn()


vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123-test' },
    session: { access_token: 'fake-token' }
  })
}))

describe('Composant ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ projectId: 999 })
    })
  })

  it('affiche correctement le formulaire (étape 1: Niveau)', () => {
    render(
      <MemoryRouter>
        <ProjectForm />
      </MemoryRouter>
    )
    expect(screen.getByText(/Quel est votre niveau de connaissance en modélisation 3D/i)).toBeInTheDocument()
    expect(screen.getByText(/Débutant/i)).toBeInTheDocument()
    expect(screen.getByText(/Initié \/ Expert/i)).toBeInTheDocument()
    // Le bouton commencer doit être présent (initialement disabled)
    expect(screen.getByText(/Commencer/i)).toBeInTheDocument()
  })

  it('parcourt toutes les étapes et envoie les données', async () => {
    render(
      <MemoryRouter>
        <ProjectForm />
      </MemoryRouter>
    )

    // --- Étape 1 : Sélection du niveau ---
    // On clique sur le card "Initié / Expert"
    fireEvent.click(screen.getByText(/Initié \/ Expert/i))
    
    // Le bouton commencer s'active, on clique dessus
    fireEvent.click(screen.getByText(/Commencer/i))

    // --- Étape 2 : Infos générales ---
    await waitFor(() => {
      expect(screen.getByLabelText(/Titre du projet/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Titre du projet/i), {
      target: { value: 'Mon Super Projet 3D' }
    })

    fireEvent.change(screen.getByLabelText(/Description détaillée/i), {
      target: { value: 'Je veux une modélisation de voiture.' }
    })

    fireEvent.change(screen.getByLabelText(/Usage final du modèle/i), {
      target: { value: 'Personnel' }
    })

    fireEvent.click(screen.getByText(/Suivant/i))

    // --- Étape 3 : Caractéristiques ---
    await waitFor(() => {
      expect(screen.getByText(/Caractéristiques du modèle/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText(/Objet unique monobloc/i))
    fireEvent.click(screen.getByLabelText(/Pas de contrainte dimensionnelle/i))

    fireEvent.click(screen.getByText(/Suivant/i))

    // --- Étape 4 : Formats ---
    await waitFor(() => {
      expect(screen.getByText(/Formats de fichiers souhaités/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText(/STL/i))

    fireEvent.click(screen.getByText(/Suivant/i))

    // --- Étape 5 : Délais et Budget ---
    await waitFor(() => {
      expect(screen.getByText(/Délais et Budget/i)).toBeInTheDocument()
    })

    // Sélection du délai "Non" qui contient le texte "Pas de contrainte"
    fireEvent.click(screen.getByText(/Pas de contrainte/i))
    
    // Sélection du budget "Moins de 100€"
    fireEvent.click(screen.getByText(/Moins de 100€/i))

    const submitButton = screen.getByText(/Soumettre la demande/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })

    expect(await screen.findByText(/Votre demande a été soumise avec succès/i)).toBeInTheDocument()
  })
})