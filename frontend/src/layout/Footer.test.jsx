import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Footer from './Footer'

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {component}
    </BrowserRouter>
  )
}

describe('Composant Footer', () => {
  it('affiche le nom de l\'application', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByText('Modelify')).toBeInTheDocument()
  })

  it('affiche le texte de copyright', () => {
    renderWithRouter(<Footer />)
    expect(screen.getByText(/Tous droits réservés/i)).toBeInTheDocument()
  })

  it('contient les liens de navigation', () => {
    renderWithRouter(<Footer />)
    const homeLink = screen.getByRole('link', { name: /Accueil/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })
})
