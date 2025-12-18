import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Register from './Register'

// Mock partiel
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: vi.fn(),
    user: null
  })
}))

describe('Page Register', () => {
  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </BrowserRouter>
    )

    // Passer à l'étape 2
    fireEvent.click(screen.getByText(/Suivant/i))

    // Remplir les champs obligatoires
    fireEvent.change(screen.getByLabelText(/Prénom \*/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/^Nom \*/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'john@example.com' } })

    // Remplir les mots de passe différemment
    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: '654321' } })

    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    expect(await screen.findByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument()
  })
})