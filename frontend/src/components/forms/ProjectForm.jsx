import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { useAuth } from '../../contexts/AuthContext';
import ModalStatusProject from '../modalStatusProject';
import './ProjectForm.css';

const detailLevelOptions = [
  { value: 'basique', label: <span><strong>Volumique</strong> - Formes simples pour valider les proportions</span> },
  { value: 'standard', label: <span><strong>Intermédiaire</strong> - Modèle fonctionnel avec détails essentiels</span> },
  { value: 'hd', label: <span><strong>Avancé</strong> - haute fidélité et détails soignés</span> }
];

const ProjectForm = ({ initialData = null }) => {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialData ? {
    ...initialData,
    format: initialData.format ? (typeof initialData.format === 'string' ? initialData.format.split(',') : initialData.format) : [],
    files: [], // Les fichiers ne peuvent pas être pré-remplis
    dimensionLength: initialData.dimensionLength || '',
    dimensionWidth: initialData.dimensionWidth || '',
    dimensionHeight: initialData.dimensionHeight || '',
    dimensionNoConstraint: initialData.dimensionNoConstraint || false,
    deadlineDate: initialData.deadlineDate || '',
    budget: initialData.budget || ''
  } : {
    title: '',
    descriptionClient: '',
    use: '',
    format: [],
    files: [],
    nbElements: 'unique',
    dimensionLength: '',
    dimensionWidth: '',
    dimensionHeight: '',
    dimensionNoConstraint: false,
    detailLevel: 'standard',
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

  const getUnit = (value) => {
    const val = parseFloat(value);
    if (isNaN(val)) return '';
    if (val >= 0.01 && val < 1) return 'mm';
    if (val >= 1) return 'cm';
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      const fileArray = Array.from(files || []);
      console.log("Files selected:", fileArray);
      setFormData(prev => ({
        ...prev,
        [name]: fileArray
      }));
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
    
    console.log("--- DEBUG SUBMIT ---");
    console.log("Files in state:", formData.files);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('descriptionClient', formData.descriptionClient);
      formDataToSend.append('use', formData.use);
      formDataToSend.append('format', formData.format.join(','));
      formDataToSend.append('userId', user.id);
      formDataToSend.append('nbElements', formData.nbElements);
      formDataToSend.append('detailLevel', formData.detailLevel);
      formDataToSend.append('dimensionNoConstraint', formData.dimensionNoConstraint);
      formDataToSend.append('deadlineType', formData.deadlineType);
      if (formData.deadlineDate) formDataToSend.append('deadlineDate', formData.deadlineDate);
      formDataToSend.append('budget', formData.budget);
      
      if (!formData.dimensionNoConstraint) {
          if (formData.dimensionLength) formDataToSend.append('dimensionLength', formData.dimensionLength);
          if (formData.dimensionWidth) formDataToSend.append('dimensionWidth', formData.dimensionWidth);
          if (formData.dimensionHeight) formDataToSend.append('dimensionHeight', formData.dimensionHeight);
      }

      if (formData.files && formData.files.length > 0) {
        console.log(`Appending ${formData.files.length} files to FormData`);
        formData.files.forEach((file, index) => {
          console.log(`File ${index}:`, file.name, file.size, file.type);
          formDataToSend.append('files', file);
        });
      } else {
        console.log("No files to append");
      }

      // Log FormData entries for debugging
      for (let pair of formDataToSend.entries()) {
        if (pair[0] === 'files') {
            console.log('FormData Entry: files', pair[1].name);
        } else {
            console.log('FormData Entry:', pair[0], pair[1]);
        }
      }

      const url = initialData 
        ? `${import.meta.env.VITE_API_URL}/api/projects/${initialData.id}`
        : `${import.meta.env.VITE_API_URL}/api/projects`;
      
      const method = initialData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
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

      setFormData({
        title: '',
        descriptionClient: '',
        use: '',
        format: [],
        files: [],
        nbElements: 'unique',
        dimensionLength: '',
        dimensionWidth: '',
        dimensionHeight: '',
        dimensionNoConstraint: false,
        detailLevel: 'standard',
        deadlineType: '',
        deadlineDate: '',
        budget: ''
      });
      
      const fileInput = document.getElementById('files');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Erreur:', error);
      setModalState({
        show: true,
        status: 'error',
        projectId: null,
        message: 'Une erreur est survenue. Veuillez réessayer.'
      });
    }
    
    setIsSubmitting(false);
  };

  const closeModal = () => {
    if (modalState.status === 'success') {
      navigate('/');
    }
    setModalState({ ...modalState, show: false });
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.title || !formData.descriptionClient || !formData.use) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
    }
    if (step === 2) {
      if (formData.nbElements !== 'Objet unique monobloc' && formData.nbElements !== 'Plusieurs pièces assemblées') {
        alert("Veuillez indiquer le nombre d'éléments à modéliser");
        return;
      }
      if (!formData.dimensionNoConstraint && (!formData.dimensionLength || !formData.dimensionWidth || !formData.dimensionHeight)) {
        alert("Veuillez renseigner les dimensions ou cocher 'Pas de contrainte dimensionnelle'");
        return;
      }
    }
    if (step === 3) {
      if (formData.format.length === 0) {
        alert("Veuillez sélectionner au moins un format de fichier");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <>
      <div className="mb-4">
        <div className="d-flex justify-content-between mb-2">
            <span className="fw-bold step-label">Étape {step} sur 4</span>
            <span className="text-muted">{step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%'}</span>
        </div>
        <div className="progress project-form-progress">
          <div 
            className="progress-bar" 
            role="progressbar" 
            style={{ width: step === 1 ? '25%' : step === 2 ? '50%' : step === 3 ? '75%' : '100%' }}
            aria-valuenow={step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100} 
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
              <label htmlFor="use" className="form-label">Usage final du modèle *</label>
              <select
                className="form-select"
                id="use"
                name="use"
                value={formData.use}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un usage...</option>
                <option value="Personnel">Usage personnel</option>
                <option value="Éducatif / Pédagogique">Usage éducatif/pédagogique</option>
                <option value="Créatif / Artistique">Usage créatif/artistique</option>
                <option value="Événementiel">Usage événementiel</option>
                <option value="Divertissement">Usage lié aux jeux/divertissement</option>
                <option value="Commercial">Usage commercial</option>
              </select>
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
                Formats acceptés : JPG, PNG, GIF, PDF (max 10MB par fichier)
              </div>
              {formData.files.length > 0 && (
                <div className="mt-2">
                  <small className="text-muted">
                    {formData.files.length} fichier(s) sélectionné(s)
                  </small>
                </div>
              )}
            </div>

            <div className="text-center">
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
            <h3 className="mb-4">Caractéristiques du modèle</h3>
            <div className="mb-3">
              <label className="form-label">Nombre d'éléments à modéliser</label>
              <div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="nbElements"
                    id="nbUnique"
                    value="Objet unique monobloc"
                    checked={formData.nbElements === 'Objet unique monobloc'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="nbUnique">Objet unique monobloc</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="nbElements"
                    id="nbMultiple"
                    value="Plusieurs pièces assemblées"
                    checked={formData.nbElements === 'Plusieurs pièces assemblées'}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="nbMultiple">Plusieurs pièces assemblées</label>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Dimensions réelles souhaitées</label>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  name="dimensionNoConstraint"
                  id="dimensionNoConstraint"
                  checked={formData.dimensionNoConstraint}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="dimensionNoConstraint">
                  Pas de contrainte dimensionnelle
                </label>
              </div>
              {!formData.dimensionNoConstraint && (
                <div className="row">
                  <div className="col-md-4 mb-2 position-relative">
                    <input
                      type="number"
                      className="form-control"
                      name="dimensionLength"
                      placeholder="Longueur"
                      value={formData.dimensionLength}
                      onChange={handleChange}
                      step="0.01"
                    />
                    <span className="unit-indicator text-muted">{getUnit(formData.dimensionLength)}</span>
                  </div>
                  <div className="col-md-4 mb-2 position-relative">
                    <input
                      type="number"
                      className="form-control"
                      name="dimensionWidth"
                      placeholder="Largeur"
                      value={formData.dimensionWidth}
                      onChange={handleChange}
                      step="0.01"
                    />
                    <span className="unit-indicator text-muted">{getUnit(formData.dimensionWidth)}</span>
                  </div>
                  <div className="col-md-4 mb-2 position-relative">
                    <input
                      type="number"
                      className="form-control"
                      name="dimensionHeight"
                      placeholder="Hauteur"
                      value={formData.dimensionHeight}
                      onChange={handleChange}
                      step="0.01"
                    />
                    <span className="unit-indicator text-muted">{getUnit(formData.dimensionHeight)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Complexité du modèle</label>
              <Select
                options={detailLevelOptions}
                value={detailLevelOptions.find(option => option.value === formData.detailLevel)}
                onChange={(selectedOption) => {
                  setFormData(prev => ({
                    ...prev,
                    detailLevel: selectedOption.value
                  }));
                }}
                placeholder="Sélectionnez un niveau de détail"
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>

            <div className="d-flex justify-content-between">
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

        {step === 4 && (
          <>
            <h3 className="mb-4">Délais et Budget</h3>
            
            <div className="mb-4">
              <label className="form-label fw-bold">Avez-vous une date limite ? *</label>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="deadlineType"
                  id="deadlineUrgent"
                  value="urgent"
                  checked={formData.deadlineType === 'urgent'}
                  onChange={handleChange}
                  required
                />
                <label className="form-check-label" htmlFor="deadlineUrgent">
                  Oui, c'est urgent (préciser la date ci-dessous)
                </label>
              </div>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="deadlineType"
                  id="deadlineFlexible"
                  value="flexible"
                  checked={formData.deadlineType === 'flexible'}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="deadlineFlexible">
                  Oui, mais je suis flexible (préciser la date souhaitée ci-dessous)
                </label>
              </div>
              <div className="form-check mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  name="deadlineType"
                  id="deadlineNone"
                  value="none"
                  checked={formData.deadlineType === 'none'}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="deadlineNone">
                  Non, pas de contrainte de délai
                </label>
              </div>
            </div>

            {(formData.deadlineType === 'urgent' || formData.deadlineType === 'flexible') && (
              <div className="mb-4">
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
              <label className="form-label fw-bold">Budget indicatif *</label>
              {[
                { value: 'less_100', label: 'Moins de 100€' },
                { value: '100_300', label: '100€ - 300€' },
                { value: '300_500', label: '300€ - 500€' },
                { value: '500_1000', label: '500€ - 1000€' },
                { value: 'more_1000', label: 'Plus de 1000€' },
                { value: 'discuss', label: 'À discuter' }
              ].map((option) => (
                <div className="form-check mb-2" key={option.value}>
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
                  <label className="form-check-label" htmlFor={`budget-${option.value}`}>
                    {option.label}
                  </label>
                </div>
              ))}
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