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

const ProjectForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    descriptionClient: '',
    typeProject: user?.user_metadata?.role === 'professionnel' ? 'professionnel' : 'personnel',
    goal: '',
    files: [],
    nbElements: 'unique',
    dimensionLength: '',
    dimensionWidth: '',
    dimensionHeight: '',
    dimensionNoConstraint: false,
    detailLevel: 'standard'
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
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
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
      formDataToSend.append('typeProject', formData.typeProject);
      formDataToSend.append('goal', formData.goal);
      formDataToSend.append('userId', user.id);
      formDataToSend.append('nbElements', formData.nbElements);
      formDataToSend.append('detailLevel', formData.detailLevel);
      formDataToSend.append('dimensionNoConstraint', formData.dimensionNoConstraint);
      
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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/projects`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la création du projet');
      }

      const data = await response.json();
      const projectId = data.projectId;

      setModalState({
        show: true,
        status: 'success',
        projectId: projectId,
        message: 'Votre demande a été soumise avec succès !'
      });

      setFormData({
        title: '',
        descriptionClient: '',
        typeProject: user?.user_metadata?.role === 'professionnel' ? 'professionnel' : 'personnel',
        goal: '',
        files: [],
        nbElements: 'unique',
        dimensionLength: '',
        dimensionWidth: '',
        dimensionHeight: '',
        dimensionNoConstraint: false,
        detailLevel: 'standard'
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
      if (!formData.title || !formData.descriptionClient || !formData.goal) {
        alert("Veuillez remplir tous les champs obligatoires");
        return;
      }
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  return (
    <>
      <div className="mb-4">
        <div className="progress project-form-progress">
          <div 
            className="progress-bar" 
            role="progressbar" 
            style={{ width: step === 1 ? '50%' : '100%' }}
            aria-valuenow={step === 1 ? 50 : 100} 
            aria-valuemin="0" 
            aria-valuemax="100"
          >
            Étape {step} / 2
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
              <label htmlFor="goal" className="form-label">Usage final du modèle *</label>
              <select
                className="form-select"
                id="goal"
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                required
              >
                <option value="">Sélectionnez un usage...</option>
                <option value="personnel">Usage personnel</option>
                <option value="personnel">Usage éducatif/pédagogique</option>
                <option value="personnel">Usage créatif/artistique</option>
                <option value="commercial">Usage événementiel</option>
                <option value="commercial">Usage lié aux jeux/divertissement</option>
                <option value="commercial">Usage commercial</option>
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
                    value="unique"
                    checked={formData.nbElements === 'unique'}
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
                    value="multiple"
                    checked={formData.nbElements === 'multiple'}
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