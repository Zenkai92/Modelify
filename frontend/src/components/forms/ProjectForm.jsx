import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ModalStatusProject from '../modalStatusProject';

const ProjectForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    descriptionClient: '',
    typeProject: '',
    goal: '',
    files: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState({
    show: false,
    status: 'success',
    projectId: null,
    message: ''
  });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: Array.from(files)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const uploadImages = async (projectId, files) => {
    const uploadedUrls = [];
    
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      const { error: imageError } = await supabase
        .from('ProjectsImages')
        .insert([{
          projectId: projectId,
          fileUrl: publicUrl,
          file_type: 'image'
        }]);

      if (imageError) throw imageError;
      uploadedUrls.push(publicUrl);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const projectData = {
        title: formData.title,
        descriptionClient: formData.descriptionClient,
        typeProject: formData.typeProject,
        goal: formData.goal,
        userId: user.id,
        status: 'en attente'
      };

      const { data, error } = await supabase
        .from('Projects')
        .insert([projectData])
        .select();

      if (error) throw error;

      const projectId = data[0]?.id;

      if (formData.files && formData.files.length > 0) {
        try {
          await uploadImages(projectId, formData.files);
        } catch (uploadError) {
          alert('Le projet a été créé mais il y a eu un problème avec l\'upload des images.');
        }
      }

      setModalState({
        show: true,
        status: 'success',
        projectId: projectId,
        message: 'Votre demande a été soumise avec succès !'
      });

      setFormData({
        title: '',
        descriptionClient: '',
        typeProject: '',
        goal: '',
        files: []
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
    setModalState({ ...modalState, show: false });
  };

  return (
    <>
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
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
          </button>
        </div>
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