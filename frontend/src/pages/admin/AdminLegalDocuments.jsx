import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminLegalDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const { session } = useAuth();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/legal`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des documents');
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const openEdit = (doc) => {
    setEditing({ ...doc });
    setSaveError(null);
    document.body.style.overflow = 'hidden';
  };

  const closeEdit = () => {
    setEditing(null);
    setSaveError(null);
    document.body.style.overflow = '';
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/legal/${editing.slug}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ title: editing.title, content: editing.content }),
        }
      );
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur lors de la sauvegarde');
      }
      const updated = await response.json();
      setDocuments((prev) => prev.map((d) => (d.slug === updated.slug ? updated : d)));
      closeEdit();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <div className="card shadow-sm border-0 rounded-3">
        <div className="card-header bg-white border-bottom py-3">
          <h5 className="mb-0 fw-bold dashboard-card-title">
            <i className="bi bi-file-earmark-text me-2"></i>
            Documents légaux
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="border-0 py-3 ps-4">Document</th>
                  <th className="border-0 py-3">Version</th>
                  <th className="border-0 py-3">Dernière mise à jour</th>
                  <th className="border-0 py-3 pe-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.slug}>
                    <td className="ps-4">
                      <span className="fw-bold text-dark">{doc.title}</span>
                      <br />
                      <small className="text-muted font-monospace">{doc.slug}</small>
                    </td>
                    <td>
                      <span className="badge bg-secondary">v{doc.version}</span>
                    </td>
                    <td>{new Date(doc.updated_at).toLocaleDateString('fr-FR')}</td>
                    <td className="pe-4">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => openEdit(doc)}
                      >
                        <i className="bi bi-pencil me-1"></i>Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal d'édition — téléportée dans <body> pour éviter les conflits de z-index */}
      {editing && createPortal(
        <div
          className="modal d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1055 }}
          onClick={(e) => e.target === e.currentTarget && closeEdit()}
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-pencil-square me-2"></i>
                  Modifier — {editing.title}
                </h5>
                <button className="btn-close" onClick={closeEdit}></button>
              </div>
              <div className="modal-body">
                {saveError && (
                  <div className="alert alert-danger py-2">{saveError}</div>
                )}

                <div className="mb-3">
                  <label className="form-label fw-semibold">Titre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Contenu{' '}
                    <span className="text-muted fw-normal small">
                      (syntaxe Markdown — ### Titre, **gras**, - liste, [lien](url))
                    </span>
                  </label>
                  <textarea
                    className="form-control font-monospace"
                    rows={22}
                    value={editing.content}
                    onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <span className="text-muted small me-auto">
                  Version actuelle : v{editing.version} — sera incrémentée à la sauvegarde
                </span>
                <button className="btn btn-secondary" onClick={closeEdit} disabled={saving}>
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sauvegarde…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i>Sauvegarder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AdminLegalDocuments;
