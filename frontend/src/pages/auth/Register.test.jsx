import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Register from './Register'

// Define the mock function
const mockSignUp = vi.fn()

// Mock the context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    signInWithGoogle: vi.fn(),
    user: null
  })
}))

describe('Page Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const fillForm = ({ password, confirmPassword }) => {
    fireEvent.change(screen.getByLabelText(/Prénom \*/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/^Nom \*/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), { target: { value: password } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: confirmPassword } })
  }

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </BrowserRouter>
    )

    fillForm({ password: 'Password1234!', confirmPassword: 'Autre1234!' })
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }))

    expect(await screen.findByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('affiche une erreur si le mot de passe est trop faible', async () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </BrowserRouter>
    )

    fillForm({ password: '123456', confirmPassword: '123456' })
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }))

    expect(await screen.findByText(/au moins 12 caractères/i)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('appelle la fonction signUp avec les bonnes données en cas de succès', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </BrowserRouter>
    )

    fillForm({ password: 'Password1234!', confirmPassword: 'Password1234!' })
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1)
      expect(mockSignUp).toHaveBeenCalledWith(
        'jane@example.com',
        'Password1234!',
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'user'
        })
      )
    })
  })
})
