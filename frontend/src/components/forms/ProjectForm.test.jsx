import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProjectForm from './ProjectForm'

// 1. On mocke (simule) la librairie Supabase pour ne pas appeler la vraie BDD
const mockInsert = vi.fn()
const mockSelect = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'http://fake-url.com' } }))
      }))
    }
  }
}))

// 2. On mocke le contexte d'authentification pour simuler un utilisateur connecté
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123-test' }
  })
}))

describe('Composant ProjectForm', () => {
  beforeEach(() => {
    // On nettoie les mocks avant chaque test
    vi.clearAllMocks()
    
    // On configure le comportement par défaut du mock Supabase
    mockInsert.mockReturnValue({
      select: mockSelect
    })
    mockSelect.mockResolvedValue({
      data: [{ id: 999 }], // On simule que la BDD renvoie l'ID 999
      error: null
    })
  })

  it('affiche correctement le formulaire', () => {
    render(<ProjectForm />)
    expect(screen.getByLabelText(/Titre du projet/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description détaillée/i)).toBeInTheDocument()
    expect(screen.getByText(/Soumettre la demande/i)).toBeInTheDocument()
  })

  it('envoie les données correctes à Supabase lors de la soumission', async () => {
    render(<ProjectForm />)

    // 1. Remplir le formulaire
    fireEvent.change(screen.getByLabelText(/Titre du projet/i), {
      target: { value: 'Mon Super Projet 3D' }
    })

    fireEvent.change(screen.getByLabelText(/Description détaillée/i), {
      target: { value: 'Je veux une modélisation de voiture.' }
    })

    fireEvent.change(screen.getByLabelText(/Type de projet/i), {
      target: { value: 'personnel' }
    })

    fireEvent.change(screen.getByLabelText(/Quel est l'objectif/i), {
      target: { value: 'Impression 3D' }
    })

    // 2. Soumettre le formulaire
    const submitButton = screen.getByText(/Soumettre la demande/i)
    fireEvent.click(submitButton)

    // 3. Vérifier que Supabase a été appelé avec les bonnes infos
    await waitFor(() => {
      // On vérifie que la fonction insert a été appelée
      expect(mockInsert).toHaveBeenCalledTimes(1)
      
      // On vérifie les arguments passés à insert
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Mon Super Projet 3D',
          descriptionClient: 'Je veux une modélisation de voiture.',
          typeProject: 'personnel',
          goal: 'Impression 3D',
          userId: 'user-123-test', // L'ID de notre faux utilisateur
          status: 'en attente'
        })
      ])
    })

    // 4. Vérifier que le message de succès apparaît (via le Modal)
    expect(await screen.findByText(/Votre demande a été soumise avec succès/i)).toBeInTheDocument()
  })
})