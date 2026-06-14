import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';

const OVERVIEW_EXTENSIONS = ['.stl', '.obj', '.3mf', '.gltf', '.glb'];

const FORMAT_OPTIONS = [
  { fmt: 'STL', ext: '.stl' },
  { fmt: 'OBJ', ext: '.obj' },
  { fmt: 'F3D', ext: '.f3d' },
];

const initialForm = {
  title: '',
  description: '',
  price: '',
  category: '',
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
  // { STL: File|null, OBJ: File|null, F3D: File|null }
  const [downloadFiles, setDownloadFiles] = useState({ STL: null, OBJ: null, F3D: null });
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormatToggle = (fmt) => {
    setSelectedFormats((prev) => {
      if (prev.includes(fmt)) {
        setDownloadFiles((df) => ({ ...df, [fmt]: null }));
        return prev.filter((f) => f !== fmt);
      }
      return [...prev, fmt];
    });
  };

  const handleOverviewChange = (e) => {
    const file = e.target.files[0] || null;
    if (!file) { setOverviewFile(null); return; }
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!OVERVIEW_EXTENSIONS.includes(ext)) {
      setError(`Extension aperçu non autorisée. Acceptées : ${OVERVIEW_EXTENSIONS.join(', ')}`);
      e.target.value = '';
      setOverviewFile(null);
      return;
    }
    setError('');
    setOverviewFile(file);
  };

  const handleDownloadFileChange = (fmt, ext) => (e) => {
    const file = e.target.files[0] || null;
    if (!file) { setDownloadFiles((prev) => ({ ...prev, [fmt]: null })); return; }
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (fileExt !== ext) {
      setError(`Le fichier ${fmt} doit avoir l'extension ${ext}`);
      e.target.value = '';
      setDownloadFiles((prev) => ({ ...prev, [fmt]: null }));
      return;
    }
    setError('');
    setDownloadFiles((prev) => ({ ...prev, [fmt]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim() || !form.price || !form.category.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!overviewFile) {
      setError('Veuillez sélectionner un fichier aperçu 3D.');
      return;
    }
    if (selectedFormats.length === 0) {
      setError('Veuillez sélectionner au moins un format de téléchargement.');
      return;
    }
    for (const fmt of selectedFormats) {
      if (!downloadFiles[fmt]) {
        setError(`Veuillez uploader le fichier ${fmt}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('category', form.category);
      formData.append('file_formats', selectedFormats.join(', '));
      formData.append('overview_model_file', overviewFile);
      selectedFormats.forEach((fmt) => {
        formData.append('download_files', downloadFiles[fmt]);
      });

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
      setDownloadFiles({ STL: null, OBJ: null, F3D: null });
      setSelectedFormats([]);
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
    setDownloadFiles({ STL: null, OBJ: null, F3D: null });
    setSelectedFormats([]);
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
                    <input type="text" name="category" className="form-control" value={form.category} onChange={handleChange} placeholder="ex: Architecture, Jeux…" required />
                  </div>

                  {/* Aperçu 3D */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Fichier Aperçu 3D <span className="text-danger">*</span>
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept={OVERVIEW_EXTENSIONS.join(',')}
                      onChange={handleOverviewChange}
                      required
                    />
                    <div className="form-text text-muted">max 50 Mo — {OVERVIEW_EXTENSIONS.join(', ')}</div>
                    <FileInfo file={overviewFile} />
                  </div>

                  {/* Fichiers de téléchargement par format */}
                  <div className="col-12">
                    <label className="form-label fw-semibold d-block">
                      Fichiers de téléchargement <span className="text-danger">*</span>
                    </label>
                    <p className="text-muted small mb-2">Cochez les formats disponibles et uploadez le fichier correspondant.</p>
                    {FORMAT_OPTIONS.map(({ fmt, ext }) => (
                      <div
                        key={fmt}
                        className={`border rounded p-3 mb-2 ${selectedFormats.includes(fmt) ? 'border-primary bg-light' : ''}`}
                      >
                        <div className="form-check mb-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`fmt-${fmt}`}
                            checked={selectedFormats.includes(fmt)}
                            onChange={() => handleFormatToggle(fmt)}
                          />
                          <label className="form-check-label fw-semibold" htmlFor={`fmt-${fmt}`}>
                            {fmt} <span className="text-muted fw-normal small">({ext})</span>
                          </label>
                        </div>
                        {selectedFormats.includes(fmt) && (
                          <div className="mt-2">
                            <input
                              type="file"
                              className="form-control form-control-sm"
                              accept={ext}
                              onChange={handleDownloadFileChange(fmt, ext)}
                            />
                            <FileInfo file={downloadFiles[fmt]} />
                          </div>
                        )}
                      </div>
                    ))}
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
