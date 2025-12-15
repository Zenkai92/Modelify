import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProjectForm from './ProjectForm'

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

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123-test' }
  })
}))

describe('Composant ProjectForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    mockInsert.mockReturnValue({
      select: mockSelect
    })
    mockSelect.mockResolvedValue({
      data: [{ id: 999 }],
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

    const submitButton = screen.getByText(/Soumettre la demande/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1)
      
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Mon Super Projet 3D',
          descriptionClient: 'Je veux une modélisation de voiture.',
          typeProject: 'personnel',
          goal: 'Impression 3D',
          userId: 'user-123-test',
          status: 'en attente'
        })
      ])
    })

    expect(await screen.findByText(/Votre demande a été soumise avec succès/i)).toBeInTheDocument()
  })
})