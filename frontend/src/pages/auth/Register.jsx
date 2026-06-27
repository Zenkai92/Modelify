import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import FloatingShapes from '../../components/FloatingShapes'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    setError('')
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Veuillez remplir tous les champs obligatoires')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return false
    }
    if (formData.password.length < 12) {
      setError('Le mot de passe doit contenir au moins 12 caractères')
      return false
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins une majuscule')
      return false
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins un chiffre')
      return false
    }
    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      setError('Le mot de passe doit contenir au moins un caractère spécial')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) return

    setLoading(true)

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: 'user'
    }

    const { error } = await signUp(formData.email, formData.password, userData)

    if (error) {
      setError(error.message)
    } else {
      navigate('/login', {
        state: { message: 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.' }
      })
    }

    setLoading(false)
  }

  return (
    <div className="auth-section">
      <FloatingShapes />

      <div className="container position-relative register-container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <h2 className="card-title text-center mb-4 fw-bold register-title">Inscription</h2>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="firstName" className="form-label">Prénom *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="lastName" className="form-label">Nom *</label>
                      <input
                        type="text"
                        className="form-control"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">Mot de passe *</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                      <ul className="list-unstyled mt-2 mb-0" style={{ fontSize: '0.78rem' }}>
                        {[
                          { label: '12 caractères minimum', ok: formData.password.length >= 12 },
                          { label: 'Une lettre majuscule', ok: /[A-Z]/.test(formData.password) },
                          { label: 'Un chiffre', ok: /[0-9]/.test(formData.password) },
                          { label: 'Un caractère spécial (!@#$…)', ok: /[^A-Za-z0-9]/.test(formData.password) },
                        ].map(({ label, ok }) => (
                          <li key={label} className={ok ? 'text-success' : 'text-danger'}>
                            <i className={`bi ${ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1`}></i>
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe *</label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => setConfirmTouched(true)}
                        onFocus={() => setConfirmTouched(false)}
                        required
                      />
                      {confirmTouched && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="text-danger small mt-1">
                          Les mots de passe ne correspondent pas
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary register-btn"
                      disabled={loading}
                    >
                      {loading ? 'Inscription...' : 'S\'inscrire'}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-4">
                  <p className="mb-0 text-muted">
                    Déjà un compte ?{' '}
                    <Link to="/login" className="text-decoration-none fw-bold register-link">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
