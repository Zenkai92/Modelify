import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import * as AuthContext from '../contexts/AuthContext'

describe('Composant ProtectedRoute', () => {
  it('redirige vers /login si l\'utilisateur n\'est pas connecté', () => {
    // Mock user null
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null, loading: false })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<h1>Page de Login</h1>} />
          <Route path="/protected" element={
            <ProtectedRoute>
              <h1>Contenu Privé</h1>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Page de Login')).toBeInTheDocument()
    expect(screen.queryByText('Contenu Privé')).not.toBeInTheDocument()
  })

  it('affiche le contenu enfant si l\'utilisateur est connecté', () => {
    // Mock user présent
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { id: 1 }, loading: false })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <h1>Contenu Privé</h1>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Contenu Privé')).toBeInTheDocument()
  })
})