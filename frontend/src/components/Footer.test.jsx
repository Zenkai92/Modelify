import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Footer from './Footer'

// Le composant Footer utilise probablement des liens (Link) de react-router-dom, 
// donc on doit l'envelopper dans un BrowserRouter pour le test.
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Composant Footer', () => {
  it('affiche le nom de l\'application', () => {
    renderWithRouter(<Footer />)
    // Vérifie que le texte "Modelify" est présent
    expect(screen.getByText('Modelify')).toBeInTheDocument()
  })

  it('affiche le texte de copyright', () => {
    renderWithRouter(<Footer />)
    // Vérifie la présence du copyright (insensible à la casse)
    expect(screen.getByText(/Tous droits réservés/i)).toBeInTheDocument()
  })

  it('contient les liens de navigation', () => {
    renderWithRouter(<Footer />)
    // Vérifie que le lien "Accueil" existe et pointe vers "/"
    const homeLink = screen.getByRole('link', { name: /Accueil/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })
})
