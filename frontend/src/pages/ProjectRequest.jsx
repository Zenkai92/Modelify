import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ProjectRequest = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    descriptionClientClient: '',
    typeProject: '',
    goal: '',
    files: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Utiliser directement l'ID de l'utilisateur auth
      const projectData = {
        title: formData.title,
        descriptionClient: formData.descriptionClient,
        typeProject: formData.typeProject,
        goal: formData.goal,
        userId: user.id, // Utiliser userId au lieu de user_id
        status: 'en attente'
      };

      // Gestion du fichier si nécessaire
      if (formData.files) {
        projectData.filename = formData.files.name;
        projectData.file_size = formData.files.size;
      }

      const { data, error } = await supabase
        .from('Projects')
        .insert([projectData])
        .select();

      if (error) throw error;

      setSubmitMessage('Votre demande a été soumise avec succès ! Nous vous recontacterons bientôt.');
      setFormData({
        title: '',
        descriptionClient: '',
        typeProject: '',
        goal: '',
        files: null
      });
    } catch (error) {
      console.error('Erreur:', error);
      setSubmitMessage('Une erreur est survenue. Veuillez réessayer.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <h1 className="text-center mb-5">Demande de projet de modélisation 3D</h1>
          
          {submitMessage && (
            <div className={`alert ${submitMessage.includes('succès') ? 'alert-success' : 'alert-danger'}`}>
              {submitMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
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
              <label htmlFor="descriptionClient" className="form-label">descriptionClient détaillée *</label>
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

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="typeProject" className="form-label">Type de projet *</label>
                <select
                  className="form-select"
                  id="typeProject"
                  name="typeProject"
                  value={formData.typeProject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionnez un type</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="personnel">Personnel</option>
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label htmlFor="goal" className="form-label">Quel est l'objectif ? *</label>
                <input
                  type="text"
                  className="form-control"
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  placeholder="Ex: Visualisation, Impression 3D, etc."
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="files" className="form-label">Fichiers de référence / Images</label>
              <input
                type="file"
                className="form-control"
                id="files"
                name="files"
                onChange={handleChange}
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.gif,.bmp,.tiff"
              />
              <div className="form-text">
                Formats acceptés : JPG, PNG, GIF, PDF, DOC, DOCX, etc. (max 10MB par fichier)
              </div>
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjectRequest;