import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Register from './Register'

// Define the mock function
const mockSignUp = vi.fn()

// Mock the context
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    user: null
  })
}))

describe('Page Register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </BrowserRouter>
    )

    // Step 1: Role selection (default is Particulier) -> Next
    fireEvent.click(screen.getByText(/Suivant/i))

    // Step 2: Personal Info
    fireEvent.change(screen.getByLabelText(/Prénom \*/i), { target: { value: 'John' } })
    fireEvent.change(screen.getByLabelText(/^Nom \*/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'john@example.com' } })

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), { target: { value: '123456' } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: '654321' } })

    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    expect(await screen.findByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('appelle la fonction signUp avec les bonnes données en cas de succès', async () => {
    mockSignUp.mockResolvedValue({ error: null })

    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Register />
      </BrowserRouter>
    )

    // Step 1: Role selection -> Next
    fireEvent.click(screen.getByText(/Suivant/i))

    // Step 2: Personal Info
    fireEvent.change(screen.getByLabelText(/Prénom \*/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/^Nom \*/i), { target: { value: 'Doe' } })
    fireEvent.change(screen.getByLabelText(/Email \*/i), { target: { value: 'jane@example.com' } })

    fireEvent.change(screen.getByLabelText(/^Mot de passe \*/i), { target: { value: 'Password1234' } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: 'Password1234' } })

    fireEvent.click(screen.getByRole('button', { name: /Suivant/i }))

    // Step 3: Address (Optional but step exists) -> Submit
    // Wait for step 3 to appear
    await waitFor(() => {
        expect(screen.getByText(/Adresse/i)).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1)
      expect(mockSignUp).toHaveBeenCalledWith(
        'jane@example.com',
        'Password1234',
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'particulier'
        })
      )
    })
  })
})
