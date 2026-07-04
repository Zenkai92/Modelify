import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ModalStatusProject from '../ModalStatusProject';
import Toast from '../Toast';
import { apiFetch } from '../../lib/api';
import './ProjectForm.css';

const TOTAL_STEPS = 3;
const MAX_IMAGES = 5;

const ProjectForm = ({ initialData = null }) => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState(initialData ? {
    title: initialData.title || '',
    descriptionClient: initialData.descriptionClient || '',
    format: initialData.format ? (typeof initialData.format === 'string' ? initialData.format.split(',') : initialData.format) : [],
    files: [], // Files cannot be pre-filled
    deadlineType: initialData.deadlineType || '',
    deadlineDate: initialData.deadlineDate || '',
    budget: initialData.budget || ''
  } : {
    title: '',
    descriptionClient: '',
    format: [],
    files: [],
    deadlineType: '',
    deadlineDate: '',
    budget: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    show: false,
    status: 'success',
    projectId: null,
    message: ''
  });

  const [toast, setToast] = useState({ message: '', type: 'error' });

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      const newFiles = Array.from(files || []);
      const combined = [...formData.files];
      newFiles.forEach(file => {
        if (!combined.some(f => f.name === file.name && f.size === file.size)) {
          combined.push(file);
        }
      });
      if (combined.length > MAX_IMAGES) {
        showToast(`Vous pouvez ajouter au maximum ${MAX_IMAGES} images`);
      }
      setFormData(prev => ({
        ...prev,
        files: combined.slice(0, MAX_IMAGES)
      }));
      // Permet de resélectionner les mêmes fichiers plus tard
      e.target.value = '';
    } else if (type === 'checkbox') {
      if (name === 'format') {
        setFormData(prev => {
          if (checked) {
            return { ...prev, format: [...prev.format, value] };
          } else {
            return { ...prev, format: prev.format.filter(f => f !== value) };
          }
        });
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('descriptionClient', formData.descriptionClient);
      formDataToSend.append('format', formData.format.join(','));
      formDataToSend.append('userId', user.id);
      formDataToSend.append('deadlineType', formData.deadlineType);
      if (formData.deadlineDate) formDataToSend.append('deadlineDate', formData.deadlineDate);
      formDataToSend.append('budget', formData.budget);

      if (formData.files && formData.files.length > 0) {
        formData.files.forEach((file) => {
          formDataToSend.append('files', file);
        });
        console.log('[ProjectForm] fichiers envoyés:', formData.files.map(f => `${f.name} (${f.type}, ${f.size}b)`));
      } else {
        console.log('[ProjectForm] aucun fichier dans formData.files');
      }

      const path = initialData ? `/api/projects/${initialData.id}` : '/api/projects';
      const method = initialData ? 'PUT' : 'POST';

      const response = await apiFetch(path, {
        method: method,
        token: session.access_token,
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la création du projet');
      }

      const data = await response.json();
      const projectId = data.projectId || (initialData && initialData.id);

      setModalState({
        show: true,
        status: 'success',
        projectId: projectId,
        message: initialData ? 'Votre projet a été modifié avec succès !' : 'Votre demande a été soumise avec succès !'
      });

      // Reset form if just created
      if (!initialData) {
        setFormData({
          title: '',
          descriptionClient: '',
          format: [],
          files: [],
          deadlineType: '',
          deadlineDate: '',
          budget: ''
        });
        setStep(1);
        const fileInput = document.getElementById('files');
        if (fileInput) fileInput.value = '';
      }

    } catch (error) {
      console.error('Erreur:', error);
      setModalState({
        show: true,
        status: 'error',
        projectId: null,
        message: error.message || 'Une erreur est survenue. Veuillez réessayer.'
      });
    }

    setIsSubmitting(false);
  };

  const closeModal = () => {
    if (modalState.status === 'success') {
      navigate('/app?view=status-commandes');
    }
    setModalState({ ...modalState, show: false });
  };

  const nextStep = () => {
    if (step === 1) { // General Info
      if (!formData.title || !formData.descriptionClient) {
        showToast("Veuillez remplir tous les champs obligatoires");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) { // Formats
      if (formData.format.length === 0) {
        showToast("Veuillez sélectionner au moins un format de fichier");
        return;
      }
      setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const getProgress = () => Math.round((step / TOTAL_STEPS) * 100);

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, message: '' })}
      />

      <div className="mb-4">
        <div className="d-flex justify-content-between mb-2">
            <span className="fw-bold step-label">{`Étape ${step} sur ${TOTAL_STEPS}`}</span>
        </div>
        <div className="progress project-form-progress">
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${getProgress()}%` }}
            aria-valuenow={getProgress()}
            aria-valuemin="0"
            aria-valuemax="100"
          >
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <>
            <h3 className="mb-4">Informations générales</h3>
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Titre du projet *</label>
              <input
                type="text"
                className="form-control"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="descriptionClient" className="form-label">Description détaillée *</label>
              <textarea
                className="form-control"
                id="descriptionClient"
                name="descriptionClient"
                rows="5"
                value={formData.descriptionClient}
                onChange={handleChange}
                placeholder="Décrivez votre projet en détail, incluez les dimensions, matériaux, style souhaité, etc."
                required
              ></textarea>
            </div>

            <div className="mb-3">
              <label htmlFor="files" className="form-label">Images de référence</label>
              <input
                type="file"
                className="form-control"
                id="files"
                name="files"
                onChange={handleChange}
                multiple
                accept="image/*,.pdf"
              />
              <div className="form-text">
                Formats acceptés : JPG, PNG, GIF, PDF (max 10MB par fichier, {MAX_IMAGES} images maximum)
              </div>
              {formData.files.length > 0 && (
                <div className="mt-2">
                  <ul className="list-group mb-2">
                    {formData.files.map((file, index) => (
                      <li key={`${file.name}-${index}`} className="list-group-item d-flex justify-content-between align-items-center py-2">
                        <span className="text-truncate me-2">
                          <i className="bi bi-image me-2"></i>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeFile(index)}
                          aria-label={`Supprimer ${file.name}`}
                        >
                          Supprimer
                        </button>
                      </li>
                    ))}
                  </ul>
                  <small className="text-muted">
                    {formData.files.length}/{MAX_IMAGES} image(s) sélectionnée(s)
                  </small>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end mt-5">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={nextStep}
              >
                Suivant
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="mb-4">Formats de fichiers souhaités</h3>
            <p className="text-muted mb-4">Sélectionnez un ou plusieurs formats de livraison pour votre modèle 3D.</p>

            <div className="mb-4">
              <div className="row g-3">
                {['STL', 'OBJ', 'F3D'].map((format) => (
                  <div className="col-md-6" key={format}>
                    <div className={`card h-100 ${formData.format.includes(format) ? 'border-primary bg-light' : ''}`}>
                      <div className="card-body">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            name="format"
                            value={format}
                            id={`format-${format}`}
                            checked={formData.format.includes(format)}
                            onChange={handleChange}
                          />
                          <label className="form-check-label stretched-link fw-bold" htmlFor={`format-${format}`}>
                            {format}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="d-flex justify-content-between mt-5">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={prevStep}
              >
                Précédent
              </button>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={nextStep}
              >
                Suivant
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3 className="mb-4">Délais et Budget</h3>

            <div className="mb-4">
              <label className="form-label fw-bold mb-3">Avez-vous une date limite ? *</label>
              <div className="row g-3">
                {[
                  { id: 'deadlineFlexible', value: 'flexible', label: 'Oui', sub: '(préciser la date)', icon: 'bi-calendar-check text-primary' },
                  { id: 'deadlineNone', value: 'none', label: 'Non', sub: 'Pas de contrainte', icon: 'bi-infinity text-success' }
                ].map((option) => (
                   <div className="col-md-6" key={option.id}>
                    <div
                        className={`card h-100 cursor-pointer selection-card ${formData.deadlineType === option.value ? 'border-primary bg-light ring-2' : ''}`}
                        onClick={() => handleChange({ target: { name: 'deadlineType', value: option.value, type: 'radio', checked: true } })}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <div className="card-body text-center p-3">
                        <i className={`bi ${option.icon} fs-3 mb-2 d-block`}></i>
                        <div className="form-check d-none">
                            <input
                            className="form-check-input"
                            type="radio"
                            name="deadlineType"
                            id={option.id}
                            value={option.value}
                            checked={formData.deadlineType === option.value}
                            onChange={handleChange}
                            required
                            />
                        </div>
                        <label className="form-check-label w-100 cursor-pointer" htmlFor={option.id}>
                            <div className="fw-bold mb-0">{option.label}</div>
                            <small className="text-muted small-text">{option.sub}</small>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formData.deadlineType === 'flexible' && (
              <div className="mb-4 animate-fade-in">
                <label htmlFor="deadlineDate" className="form-label">Date limite souhaitée</label>
                <input
                  type="date"
                  className="form-control"
                  id="deadlineDate"
                  name="deadlineDate"
                  value={formData.deadlineDate}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="mb-4">
              <label className="form-label fw-bold mb-3">Budget indicatif *</label>
              <div className="row g-3">
              {[
                { value: 'less_25', label: 'Moins de 25€' },
                { value: '25_50', label: '25€ - 50€' },
                { value: '50_100', label: '50€ - 100€' },
                { value: '100_300', label: '100€ - 300€' },
                { value: '300_500', label: '300€ - 500€' },
                { value: 'more_500', label: 'Plus de 500€' }
              ].map((option) => (
                <div className="col-6 col-md-4" key={option.value}>
                    <div
                        className={`card h-100 cursor-pointer selection-card ${formData.budget === option.value ? 'border-primary bg-light' : ''}`}
                        onClick={() => handleChange({ target: { name: 'budget', value: option.value, type: 'radio', checked: true } })}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      <div className="card-body text-center d-flex align-items-center justify-content-center p-2">
                        <div className="form-check d-none">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="budget"
                            id={`budget-${option.value}`}
                            value={option.value}
                            checked={formData.budget === option.value}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <label className="form-check-label fw-bold w-100 cursor-pointer small" htmlFor={`budget-${option.value}`}>
                            {option.label}
                        </label>
                      </div>
                    </div>
                </div>
              ))}
              </div>
            </div>

            <div className="d-flex justify-content-between mt-5">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={prevStep}
              >
                Précédent
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
              </button>
            </div>
          </>
        )}
      </form>

      <ModalStatusProject
        show={modalState.show}
        status={modalState.status}
        projectId={modalState.projectId}
        message={modalState.message}
        onClose={closeModal}
      />
    </>
  );
};

export default ProjectForm;
