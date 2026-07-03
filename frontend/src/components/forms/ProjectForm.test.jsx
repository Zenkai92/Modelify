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

  it('affiche correctement le formulaire (étape 1: Informations générales)', () => {
    render(
      <MemoryRouter>
        <ProjectForm />
      </MemoryRouter>
    )
    expect(screen.getByText(/Informations générales/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Titre du projet/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description détaillée/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Images de référence/i)).toBeInTheDocument()
    expect(screen.getByText(/Étape 1 sur 3/i)).toBeInTheDocument()
  })

  it('cumule les images de référence et limite à 5 maximum', async () => {
    render(
      <MemoryRouter>
        <ProjectForm />
      </MemoryRouter>
    )

    const input = screen.getByLabelText(/Images de référence/i)
    const makeFile = (name) => new File(['contenu'], name, { type: 'image/png' })

    // Première sélection : 3 images
    fireEvent.change(input, {
      target: { files: [makeFile('a.png'), makeFile('b.png'), makeFile('c.png')] }
    })
    expect(screen.getByText('3/5 image(s) sélectionnée(s)')).toBeInTheDocument()

    // Deuxième sélection : 3 de plus → limite dépassée, plafonné à 5
    fireEvent.change(input, {
      target: { files: [makeFile('d.png'), makeFile('e.png'), makeFile('f.png')] }
    })
    expect(await screen.findByText(/Vous pouvez ajouter au maximum 5 images/i)).toBeInTheDocument()
    expect(screen.getByText('5/5 image(s) sélectionnée(s)')).toBeInTheDocument()
    expect(screen.queryByText('f.png')).not.toBeInTheDocument()

    // Suppression d'une image de la liste
    fireEvent.click(screen.getByLabelText('Supprimer a.png'))
    expect(screen.getByText('4/5 image(s) sélectionnée(s)')).toBeInTheDocument()
    expect(screen.queryByText('a.png')).not.toBeInTheDocument()
  })

  it('parcourt toutes les étapes et envoie les données', async () => {
    render(
      <MemoryRouter>
        <ProjectForm />
      </MemoryRouter>
    )

    // --- Étape 1 : Infos générales ---
    fireEvent.change(screen.getByLabelText(/Titre du projet/i), {
      target: { value: 'Mon Super Projet 3D' }
    })

    fireEvent.change(screen.getByLabelText(/Description détaillée/i), {
      target: { value: 'Je veux une modélisation de voiture.' }
    })

    fireEvent.click(screen.getByText(/Suivant/i))

    // --- Étape 2 : Formats ---
    await waitFor(() => {
      expect(screen.getByText(/Formats de fichiers souhaités/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText(/STL/i))

    fireEvent.click(screen.getByText(/Suivant/i))

    // --- Étape 3 : Délais et Budget ---
    await waitFor(() => {
      expect(screen.getByText(/Délais et Budget/i)).toBeInTheDocument()
    })

    // Sélection du délai "Non" qui contient le texte "Pas de contrainte"
    fireEvent.click(screen.getByText(/Pas de contrainte/i))

    // Sélection du budget "Moins de 25€"
    fireEvent.click(screen.getByText(/Moins de 25€/i))

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
