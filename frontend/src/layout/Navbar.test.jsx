import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Navbar from './Navbar'
import * as AuthContext from '../contexts/AuthContext'

describe('Composant Navbar', () => {
  it('affiche les liens Connexion/Inscription quand déconnecté', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null })
    
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByText('Inscription')).toBeInTheDocument()
    expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument()
  })

  it('affiche le menu utilisateur et Mon Portail quand connecté', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { user_metadata: { firstName: 'John', lastName: 'Doe' } },
      signOut: vi.fn()
    })

    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.getByText(/John Doe/)).toBeInTheDocument()
    expect(screen.getByText('Mon Portail')).toBeInTheDocument()
    // La déconnexion se fait depuis la sidebar du portail, pas la Navbar
    expect(screen.queryByText('Déconnexion')).not.toBeInTheDocument()
  })

  it("affiche l'info-bulle « Mes Commandes » après un achat", () => {
    sessionStorage.setItem('recent_purchase', '1')
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { user_metadata: { firstName: 'John', lastName: 'Doe' } },
      signOut: vi.fn()
    })

    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.getByText(/Mes Commandes/)).toBeInTheDocument()
    sessionStorage.removeItem('recent_purchase')
  })

  it("n'affiche pas l'info-bulle sans achat récent", () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { user_metadata: { firstName: 'John', lastName: 'Doe' } },
      signOut: vi.fn()
    })

    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.queryByText(/Mes Commandes/)).not.toBeInTheDocument()
  })
})