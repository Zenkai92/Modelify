import React, { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FloatingShapes from '../components/FloatingShapes'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'particulier',
    companyName: '',
    streetAddress: '',
    city: '',
    postalCode: ''
  })
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmTouched, setConfirmTouched] = useState(false)
  const { signUp, user } = useAuth()
  const navigate = useNavigate()

  // Rediriger si déjà connecté
  if (user) {
    return <Navigate to="/" replace />
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateStep = () => {
    setError('')
    if (step === 1) {
      return true
    }
    if (step === 2) {
      if (formData.role === 'particulier') {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Veuillez remplir tous les champs obligatoires')
          return false
        }
      } else {
        if (!formData.companyName || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Veuillez remplir tous les champs obligatoires')
          return false
        }
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
      return true
    }
    return true
  }

  const handleNext = (e) => {
    e.preventDefault()
    if (validateStep()) {
      setStep(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    setStep(prev => prev - 1)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateStep()) return

    setLoading(true)

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      companyName: formData.companyName,
      streetAddress: formData.streetAddress,
      city: formData.city,
      postalCode: formData.postalCode
    }

    const { error } = await signUp(formData.email, formData.password, userData)
    
    if (error) {
      setError(error.message)
      setStep(2)
    } else {
      navigate('/login', { 
        state: { message: 'Inscription réussie ! Vérifiez votre email pour confirmer votre compte.' }
      })
    }
    
    setLoading(false)
  }

  const renderStep1 = () => (
    <div className="mb-4">
      <h4 className="text-center mb-4">Je suis...</h4>
      <div className="d-flex justify-content-center gap-3">
        <div 
          className={`card p-3 cursor-pointer register-role-card ${formData.role === 'particulier' ? 'border-primary shadow active' : ''}`}
          onClick={() => setFormData({...formData, role: 'particulier'})}
        >
          <div className="text-center">
            <i className="bi bi-person fs-1 mb-2 register-icon"></i>
            <h5 className="mb-0">Particulier</h5>
          </div>
        </div>
        <div 
          className={`card p-3 cursor-pointer register-role-card ${formData.role === 'professionnel' ? 'border-primary shadow active' : ''}`}
          onClick={() => setFormData({...formData, role: 'professionnel'})}
        >
          <div className="text-center">
            <i className="bi bi-building fs-1 mb-2 register-icon"></i>
            <h5 className="mb-0">Entreprise</h5>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <>
      {formData.role === 'particulier' ? (
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
      ) : (
        <div className="mb-3">
          <label htmlFor="companyName" className="form-label">Nom de l'entreprise *</label>
          <input
            type="text"
            className="form-control"
            id="companyName"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            required
          />
        </div>
      )}

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
    </>
  )

  const renderStep3 = () => (
    <>
      <div className="mb-3">
        <label htmlFor="streetAddress" className="form-label">Adresse</label>
        <input
          type="text"
          className="form-control"
          id="streetAddress"
          name="streetAddress"
          value={formData.streetAddress}
          onChange={handleChange}
        />
      </div>

      <div className="row">
        <div className="col-md-8 mb-3">
          <label htmlFor="city" className="form-label">Ville</label>
          <input
            type="text"
            className="form-control"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4 mb-3">
          <label htmlFor="postalCode" className="form-label">Code postal</label>
          <input
            type="text"
            className="form-control"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
          />
        </div>
      </div>
    </>
  )

  return (
    <div className="auth-section">
      <FloatingShapes />

      <div className="container position-relative register-container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                <h2 className="card-title text-center mb-4 fw-bold register-title">Inscription</h2>
                
                {/* Progress Bar */}
                <div className="progress mb-4 register-progress">
                  <div
                    className="progress-bar register-progress-bar"
                    role="progressbar"
                    style={{ width: `${(step / 3) * 100}%` }}
                    aria-valuenow={(step / 3) * 100}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {step === 1 && renderStep1()}
                  {step === 2 && renderStep2()}
                  {step === 3 && renderStep3()}

                  <div className="d-flex justify-content-between mt-4">
                    {step > 1 && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handlePrev}
                      >
                        Précédent
                      </button>
                    )}
                    
                    {step < 3 ? (
                      <button
                        type="button"
                        className="btn btn-primary ms-auto register-btn"
                        onClick={handleNext}
                      >
                        Suivant
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary ms-auto register-btn"
                        disabled={loading}
                      >
                        {loading ? 'Inscription...' : 'S\'inscrire'}
                      </button>
                    )}
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