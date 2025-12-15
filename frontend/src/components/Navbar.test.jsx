import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('affiche le menu utilisateur et Déconnexion quand connecté', () => {
    const mockSignOut = vi.fn()
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
      user: { user_metadata: { firstName: 'John', lastName: 'Doe' } },
      signOut: mockSignOut
    })
    
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Navbar />
      </BrowserRouter>
    )
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    // Note: Déconnexion est dans un dropdown, il faut parfois cliquer pour le voir, 
    // mais il est présent dans le DOM
    expect(screen.getByText('Déconnexion')).toBeInTheDocument()
  })
})