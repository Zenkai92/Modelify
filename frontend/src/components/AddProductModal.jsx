import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';

// Formats rendus par Model3D (Three.js)
const OVERVIEW_EXTENSIONS = ['.stl', '.obj', '.3mf', '.gltf', '.glb'];
// Formats acceptés pour le téléchargement (tout format 3D)
const DOWNLOAD_EXTENSIONS = ['.stl', '.obj', '.f3d', '.3mf', '.gltf', '.glb', '.ply', '.zip'];

const initialForm = {
  title: '',
  description: '',
  price: '',
  category: '',
  file_formats: '',
};

const FileInfo = ({ file }) => file ? (
  <div className="mt-1 small text-success">
    <i className="bi bi-check-circle me-1"></i>
    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} Mo)
  </div>
) : null;

const AddProductModal = ({ open, onClose, onProductAdded }) => {
  const { session } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [overviewFile, setOverviewFile] = useState(null);
  const [downloadFile, setDownloadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (setter, allowedExts) => (e) => {
    const file = e.target.files[0] || null;
    if (!file) { setter(null); return; }

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(ext)) {
      setError(`Extension non autorisée. Extensions acceptées : ${allowedExts.join(', ')}`);
      e.target.value = '';
      setter(null);
      return;
    }
    setError('');
    setter(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.price || !form.category.trim() || !form.file_formats.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!overviewFile) {
      setError('Veuillez sélectionner un fichier aperçu 3D.');
      return;
    }
    if (!downloadFile) {
      setError('Veuillez sélectionner un fichier de téléchargement.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('file_formats', form.file_formats);
      formData.append('overview_model_file', overviewFile);
      formData.append('download_model_file', downloadFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erreur lors de la création du produit');
      }

      setSuccess('Produit ajouté avec succès !');
      setForm(initialForm);
      setOverviewFile(null);
      setDownloadFile(null);
      if (onProductAdded) onProductAdded();
      setTimeout(() => { setSuccess(''); onClose(); }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setForm(initialForm);
    setOverviewFile(null);
    setDownloadFile(null);
    setError('');
    setSuccess('');
  };

  return (
    <>
      {open &&
        createPortal(
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.55)',
              zIndex: 1050,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '540px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  position: 'sticky', top: 0, zIndex: 1,
                }}
              >
                <h5 style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
                  <i className="bi bi-plus-circle me-2"></i>Ajouter un produit
                </h5>
                <button
                  onClick={handleClose}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', lineHeight: 1, cursor: 'pointer', opacity: 0.8 }}
                >
                  &times;
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                {error && (
                  <div className="alert alert-danger py-2 mb-3" role="alert">
                    <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
                  </div>
                )}
                {success && (
                  <div className="alert alert-success py-2 mb-3" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>{success}
                  </div>
                )}

                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Titre <span className="text-danger">*</span></label>
                    <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} placeholder="Nom du produit" required />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea name="description" className="form-control" value={form.description} onChange={handleChange} rows={3} placeholder="Description du produit (optionnelle)" />
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-semibold">Prix (€) <span className="text-danger">*</span></label>
                    <input type="number" name="price" className="form-control" value={form.price} onChange={handleChange} placeholder="0.00" min="0" step="0.01" required />
                  </div>

                  <div className="col-6">
                    <label className="form-label fw-semibold">Catégorie <span className="text-danger">*</span></label>
                    <input type="text" name="category" className="form-control" value={form.category} onChange={handleChange} placeholder="ex: Architecture, Jeux, ..." required />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Fichier Aperçu 3D <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept={OVERVIEW_EXTENSIONS.join(',')}
                      onChange={handleFileChange(setOverviewFile, OVERVIEW_EXTENSIONS)}
                      required
                    />
                    <div className="form-text text-muted">max 50 Mo</div>
                    <FileInfo file={overviewFile} />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Formats de fichier <span className="text-danger">*</span></label>
                    <input type="text" name="file_formats" className="form-control" value={form.file_formats} onChange={handleChange} placeholder="ex: STL, OBJ, F3D" required />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Fichier de téléchargement <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept={DOWNLOAD_EXTENSIONS.join(',')}
                      onChange={handleFileChange(setDownloadFile, DOWNLOAD_EXTENSIONS)}
                      required
                    />
                    <div className="form-text text-muted">max 50 Mo</div>
                    <FileInfo file={downloadFile} />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" className="btn btn-light" onClick={handleClose} disabled={loading}>
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn text-white fw-semibold"
                    style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', border: 'none' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Upload en cours...</>
                    ) : (
                      <><i className="bi bi-plus-lg me-1"></i>Ajouter le produit</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default AddProductModal;
