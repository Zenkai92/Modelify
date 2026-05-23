import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Markdown from 'react-markdown';
import './LegalDocuments.css';

const SECTIONS = [
  { slug: 'mentions-legales',          label: 'Mentions légales' },
  { slug: 'politique-confidentialite', label: 'Politique de confidentialité' },
  { slug: 'cgu',                       label: "Conditions générales d'utilisation" },
  { slug: 'cgv',                       label: 'Conditions générales de vente' },
  { slug: 'paiement-remboursement',    label: 'Paiement & remboursement' },
  { slug: 'sav',                       label: 'Service après-vente' },
];

const LegalSection = ({ doc }) => (
  <section id={doc.slug} className="legal-section">
    <h2 className="legal-section-title">{doc.title}</h2>
    <Markdown>{doc.content}</Markdown>
    <p className="text-muted small mt-3">
      Version {doc.version} — mise à jour le{' '}
      {new Date(doc.updated_at).toLocaleDateString('fr-FR')}
    </p>
  </section>
);

const LegalDocuments = () => {
  const { hash } = useLocation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/legal`);
        if (!response.ok) throw new Error('Erreur lors du chargement des documents légaux');
        const data = await response.json();
        // Preserve display order from SECTIONS
        const ordered = SECTIONS
          .map((s) => data.find((d) => d.slug === s.slug))
          .filter(Boolean);
        setDocuments(ordered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (hash) {
        const el = document.querySelector(hash);
        if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [hash, loading]);

  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="container">
          <h1>Informations légales</h1>
          <p className="legal-header-subtitle">
            Retrouvez ici l'ensemble de nos documents légaux et contractuels.
          </p>
        </div>
      </header>

      <div className="container legal-container">
        <div className="row">
          <aside className="col-lg-3 d-none d-lg-block">
            <nav className="legal-toc">
              <h6 className="legal-toc-title">Sommaire</h6>
              <ul className="list-unstyled">
                {SECTIONS.map(({ slug, label }) => (
                  <li key={slug}>
                    <a href={`#${slug}`} className="legal-toc-link">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <main className="col-lg-9">
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
              </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && documents.map((doc) => (
              <LegalSection key={doc.slug} doc={doc} />
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default LegalDocuments;
