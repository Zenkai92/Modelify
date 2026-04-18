import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';

const OVERVIEW_EXTENSIONS = ['.stl', '.obj', '.3mf', '.gltf', '.glb'];
const DOWNLOAD_EXTENSIONS = ['.stl', '.obj', '.f3d', '.3mf', '.gltf', '.glb', '.ply', '.zip'];

const FileInfo = ({ file }) => file ? (
  <div className="mt-1 small text-success">
    <i className="bi bi-check-circle me-1"></i>
    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} Mo)
  </div>
) : null;

const EditProductModal = ({ product, onClose, onProductUpdated }) => {
  const { session } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    file_formats: '',
  });
  const [overviewFile, setOverviewFile] = useState(null);
  const [downloadFile, setDownloadFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title || '',
        description: product.description || '',
        price: product.price != null ? String(product.price) : '',
        category: product.category || '',
        file_formats: Array.isArray(product.file_formats)
          ? product.file_formats.join(', ')
          : product.file_formats || '',
      });
      setOverviewFile(null);
      setDownloadFile(null);
      setConfirmDelete(false);
      setError('');
      setSuccess('');
    }
  }, [product]);

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

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('file_formats', form.file_formats);
      if (overviewFile) formData.append('overview_model_file', overviewFile);
      if (downloadFile) formData.append('download_model_file', downloadFile);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erreur lors de la mise à jour');
      }

      setSuccess('Produit mis à jour avec succès !');
      if (onProductUpdated) onProductUpdated();
      setTimeout(() => { setSuccess(''); onClose(); }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erreur lors de la suppression');
      }
      if (onProductUpdated) onProductUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!product) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1050,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)',
          padding: '1.25rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 1,
        }}>
          <h5 style={{ margin: 0, color: '#fff', fontWeight: 700 }}>
            <i className="bi bi-pencil me-2"></i>Modifier le produit
          </h5>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', lineHeight: 1, cursor: 'pointer', opacity: 0.8 }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div className="alert alert-danger py-2 mb-3">
              <i className="bi bi-exclamation-circle-fill me-2"></i>{error}
            </div>
          )}
          {success && (
            <div className="alert alert-success py-2 mb-3">
              <i className="bi bi-check-circle-fill me-2"></i>{success}
            </div>
          )}

          <div className="row g-3">
            <div className="col-12">
              <label className="form-label fw-semibold">Titre <span className="text-danger">*</span></label>
              <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} required />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Description</label>
              <textarea name="description" className="form-control" value={form.description} onChange={handleChange} rows={3} placeholder="Optionnelle" />
            </div>

            <div className="col-6">
              <label className="form-label fw-semibold">Prix (€) <span className="text-danger">*</span></label>
              <input type="number" name="price" className="form-control" value={form.price} onChange={handleChange} min="0" step="0.01" required />
            </div>

            <div className="col-6">
              <label className="form-label fw-semibold">Catégorie <span className="text-danger">*</span></label>
              <input type="text" name="category" className="form-control" value={form.category} onChange={handleChange} required />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Formats de fichier <span className="text-danger">*</span></label>
              <input type="text" name="file_formats" className="form-control" value={form.file_formats} onChange={handleChange} placeholder="ex: STL, OBJ" required />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Fichier Aperçu 3D</label>
              <input
                type="file"
                className="form-control"
                accept={OVERVIEW_EXTENSIONS.join(',')}
                onChange={handleFileChange(setOverviewFile, OVERVIEW_EXTENSIONS)}
              />
              <div className="form-text text-muted">
                Laisser vide pour conserver le fichier actuel — max 50 Mo
              </div>
              <FileInfo file={overviewFile} />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Fichier de téléchargement</label>
              <input
                type="file"
                className="form-control"
                accept={DOWNLOAD_EXTENSIONS.join(',')}
                onChange={handleFileChange(setDownloadFile, DOWNLOAD_EXTENSIONS)}
              />
              <div className="form-text text-muted">
                Laisser vide pour conserver le fichier actuel — max 50 Mo
              </div>
              <FileInfo file={downloadFile} />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center gap-2 mt-4">
            {/* Suppression */}
            {!confirmDelete ? (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => setConfirmDelete(true)}
                disabled={loading || deleting}
              >
                <i className="bi bi-trash me-1"></i>Supprimer
              </button>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <span className="small text-danger fw-semibold">Confirmer ?</span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> : 'Oui'}
                </button>
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Non
                </button>
              </div>
            )}

            {/* Sauvegarde */}
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={loading || deleting}>
                Annuler
              </button>
              <button
                type="submit"
                className="btn text-white fw-semibold"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #7c3aed 100%)', border: 'none' }}
                disabled={loading || deleting}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Mise à jour...</>
                ) : (
                  <><i className="bi bi-check-lg me-1"></i>Enregistrer</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditProductModal;
