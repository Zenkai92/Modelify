import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ProjectForm from './ProjectForm'

const mockInsert = vi.fn()
const mockSelect = vi.fn()

// Mock global fetch
global.fetch = vi.fn()

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
    
    // Mock fetch response
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ projectId: 999 })
    })

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
    expect(screen.getByText(/Suivant/i)).toBeInTheDocument()
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

    fireEvent.click(screen.getByText(/Suivant/i))

    const submitButton = screen.getByText(/Soumettre la demande/i)
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/projects',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })

    expect(await screen.findByText(/Votre demande a été soumise avec succès/i)).toBeInTheDocument()
  })
})