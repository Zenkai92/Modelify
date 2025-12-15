import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Login from './Login'

// Mock du hook useAuth
const mockSignIn = vi.fn()
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    user: null
  })
}))

describe('Page Login', () => {
  it('affiche les champs email et mot de passe', () => {
    render(<BrowserRouter><Login /></BrowserRouter>)
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument()
  })

  it('appelle la fonction signIn avec les bonnes données', async () => {
    render(<BrowserRouter><Login /></BrowserRouter>)
    
    // Simuler la saisie
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'password123' } })
    
    // Simuler le succès de signIn
    mockSignIn.mockResolvedValue({ error: null })

    // Soumettre
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('affiche un message d\'erreur si la connexion échoue', async () => {
    render(<BrowserRouter><Login /></BrowserRouter>)
    
    // Remplir les champs pour passer la validation HTML5
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@test.com' } })
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'wrongpass' } })

    // Simuler l'échec de signIn
    mockSignIn.mockResolvedValue({ error: { message: 'Identifiants invalides' } })

    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }))

    expect(await screen.findByText('Identifiants invalides')).toBeInTheDocument()
  })
})