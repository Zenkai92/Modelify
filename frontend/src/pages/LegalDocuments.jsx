import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './LegalDocuments.css';

/* ─────────────────────────────────────────────
   Composants individuels – un par formalité
───────────────────────────────────────────── */

export const MentionsLegales = () => (
  <section id="mentions-legales" className="legal-section">
    <h2 className="legal-section-title">
      <span className="legal-icon">⚖️</span> Mentions légales
    </h2>

    <h3>Éditeur du site</h3>
    <p>
      Le site <strong>Modelify</strong> est édité par la société Modelify SAS, au capital de
      10 000 €, immatriculée au Registre du Commerce et des Sociétés de Paris sous le
      numéro 123 456 789, dont le siège social est situé au :
    </p>
    <address>
      12 rue de l'Innovation<br />
      75001 Paris, France<br />
      E-mail : <a href="mailto:contact@modelify.fr">contact@modelify.fr</a><br />
      Téléphone : +33 1 23 45 67 89
    </address>

    <h3>Directeur de la publication</h3>
    <p>Le directeur de la publication est M. Jean Dupont, Président de Modelify SAS.</p>

    <h3>Hébergement</h3>
    <p>
      Ce site est hébergé par la société <strong>Supabase Inc.</strong>, 970 Toa Payoh North,
      Singapore 318992. Pour tout signalement de contenu illicite, veuillez contacter
      l'hébergeur directement.
    </p>

    <h3>Propriété intellectuelle</h3>
    <p>
      L'ensemble des contenus présents sur ce site (textes, images, graphismes, logo,
      icônes, sons, logiciels, etc.) sont la propriété exclusive de Modelify SAS ou font
      l'objet d'une autorisation d'utilisation. Toute reproduction, représentation,
      modification, publication ou adaptation de tout ou partie des éléments du site, quel
      que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite
      préalable de Modelify SAS.
    </p>

    <h3>Liens hypertextes</h3>
    <p>
      Modelify SAS ne peut être tenu responsable du contenu des sites tiers vers lesquels
      des liens hypertextes pourraient pointer depuis ce site.
    </p>
  </section>
);

/* ─────────────────────────────────────────────────────────── */

export const PolitiqueConfidentialite = () => (
  <section id="politique-confidentialite" className="legal-section">
    <h2 className="legal-section-title">
      <span className="legal-icon">🔒</span> Politique de confidentialité
    </h2>

    <p>
      Modelify SAS accorde une importance capitale à la protection de vos données
      personnelles et s'engage à traiter vos données conformément au Règlement Général
      sur la Protection des Données (RGPD – UE 2016/679) et à la loi Informatique et
      Libertés.
    </p>

    <h3>Données collectées</h3>
    <p>Nous collectons les données suivantes :</p>
    <ul>
      <li>Identité : nom, prénom, adresse e-mail ;</li>
      <li>Données de connexion : adresse IP, logs d'accès ;</li>
      <li>Données relatives aux projets soumis via la plateforme ;</li>
      <li>Données de paiement (traitées de manière sécurisée par nos partenaires).</li>
    </ul>

    <h3>Finalités du traitement</h3>
    <p>Vos données sont collectées pour :</p>
    <ul>
      <li>La création et la gestion de votre compte utilisateur ;</li>
      <li>Le traitement de vos demandes de projets 3D ;</li>
      <li>L'envoi de communications liées à votre compte ou à nos services ;</li>
      <li>L'amélioration de nos services et de l'expérience utilisateur ;</li>
      <li>Le respect de nos obligations légales et contractuelles.</li>
    </ul>

    <h3>Base légale</h3>
    <p>
      Le traitement de vos données repose sur l'exécution du contrat, votre consentement
      ou nos intérêts légitimes, selon les cas.
    </p>

    <h3>Durée de conservation</h3>
    <p>
      Vos données sont conservées pendant la durée de votre relation contractuelle avec
      Modelify, puis archivées pour une durée de 5 ans conformément aux obligations légales.
    </p>

    <h3>Vos droits</h3>
    <p>Conformément au RGPD, vous disposez des droits suivants :</p>
    <ul>
      <li><strong>Droit d'accès</strong> à vos données ;</li>
      <li><strong>Droit de rectification</strong> en cas d'inexactitude ;</li>
      <li><strong>Droit à l'effacement</strong> (droit à l'oubli) ;</li>
      <li><strong>Droit à la portabilité</strong> de vos données ;</li>
      <li><strong>Droit d'opposition</strong> au traitement ;</li>
      <li><strong>Droit à la limitation</strong> du traitement.</li>
    </ul>
    <p>
      Pour exercer ces droits, contactez notre DPO à :{' '}
      <a href="mailto:dpo@modelify.fr">dpo@modelify.fr</a>. Vous avez également le
      droit d'introduire une réclamation auprès de la CNIL (
      <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>).
    </p>

    <h3>Cookies</h3>
    <p>
      Ce site utilise des cookies techniques nécessaires à son bon fonctionnement. Aucun
      cookie publicitaire ou de traçage tiers n'est utilisé sans votre consentement
      explicite.
    </p>
  </section>
);

/* ─────────────────────────────────────────────────────────── */

export const ConditionsGeneralesUtilisation = () => (
  <section id="cgu" className="legal-section">
    <h2 className="legal-section-title">
      <span className="legal-icon">📋</span> Conditions générales d'utilisation (CGU)
    </h2>
    <p className="legal-update">Dernière mise à jour : 1er janvier 2025</p>

    <h3>Article 1 – Objet</h3>
    <p>
      Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir
      les modalités et conditions d'accès et d'utilisation de la plateforme Modelify,
      accessible à l'adresse <strong>modelify.fr</strong>.
    </p>

    <h3>Article 2 – Acceptation</h3>
    <p>
      L'accès et l'utilisation de la plateforme impliquent l'acceptation pleine et entière
      des présentes CGU. Toute personne refusant ces conditions doit cesser d'utiliser le
      site.
    </p>

    <h3>Article 3 – Accès au service</h3>
    <p>
      L'accès à certaines fonctionnalités de la plateforme nécessite la création d'un
      compte utilisateur. L'utilisateur s'engage à fournir des informations exactes et à
      les maintenir à jour. Les identifiants de connexion sont personnels et
      confidentiels.
    </p>

    <h3>Article 4 – Obligations de l'utilisateur</h3>
    <p>L'utilisateur s'engage à :</p>
    <ul>
      <li>Ne pas utiliser la plateforme à des fins illicites ;</li>
      <li>Ne pas porter atteinte aux droits de tiers ;</li>
      <li>Ne pas tenter de compromettre la sécurité du service ;</li>
      <li>Ne pas soumettre de contenu diffamatoire, obscène ou contraire aux bonnes mœurs ;</li>
      <li>Respecter les droits de propriété intellectuelle de Modelify SAS.</li>
    </ul>

    <h3>Article 5 – Responsabilité</h3>
    <p>
      Modelify SAS met tout en œuvre pour assurer la disponibilité du service mais ne peut
      garantir une accessibilité permanente. La responsabilité de Modelify SAS ne saurait
      être engagée en cas d'interruption du service due à des causes indépendantes de sa
      volonté.
    </p>

    <h3>Article 6 – Modification des CGU</h3>
    <p>
      Modelify SAS se réserve le droit de modifier les présentes CGU à tout moment. Les
      utilisateurs seront informés par e-mail ou via la plateforme. La poursuite de
      l'utilisation du service après notification vaut acceptation des nouvelles conditions.
    </p>

    <h3>Article 7 – Droit applicable</h3>
    <p>
      Les présentes CGU sont soumises au droit français. Tout litige sera porté devant les
      tribunaux compétents de Paris.
    </p>
  </section>
);

/* ─────────────────────────────────────────────────────────── */

export const ConditionsGeneralesVente = () => (
  <section id="cgv" className="legal-section">
    <h2 className="legal-section-title">
      <span className="legal-icon">🛒</span> Conditions générales de vente (CGV)
    </h2>
    <p className="legal-update">Dernière mise à jour : 1er janvier 2025</p>

    <h3>Article 1 – Champ d'application</h3>
    <p>
      Les présentes Conditions Générales de Vente s'appliquent à toutes les commandes
      passées sur la plateforme Modelify pour des prestations de modélisation 3D.
    </p>

    <h3>Article 2 – Commande</h3>
    <p>
      La commande est validée dès lors que l'utilisateur soumet son formulaire de demande
      de projet et reçoit une confirmation par e-mail de la part de Modelify SAS. Un devis
      personnalisé peut être établi avant validation définitive.
    </p>

    <h3>Article 3 – Prix</h3>
    <p>
      Les prix sont indiqués en euros TTC. Modelify SAS se réserve le droit de modifier
      ses tarifs à tout moment, les prix applicables étant ceux en vigueur au moment de
      la confirmation de commande.
    </p>

    <h3>Article 4 – Livraison</h3>
    <p>
      Les fichiers 3D sont livrés par voie électronique, dans les délais convenus lors de
      la confirmation de commande. En cas de retard imputable à Modelify SAS, le client
      sera informé dans les meilleurs délais.
    </p>

    <h3>Article 5 – Propriété des livrables</h3>
    <p>
      Une fois le paiement intégralement reçu, les droits d'utilisation du fichier 3D
      produit sont cédés au client pour un usage défini dans le devis. Modelify SAS
      conserve les droits moraux sur les créations.
    </p>

    <h3>Article 6 – Droit de rétractation</h3>
    <p>
      Conformément à l'article L221-28 du Code de la consommation, le droit de
      rétractation ne s'applique pas aux contenus numériques personnalisés dont l'exécution
      a commencé avec l'accord du consommateur. Néanmoins, une solution amiable sera
      systématiquement recherchée.
    </p>

    <h3>Article 7 – Litiges</h3>
    <p>
      En cas de litige, le client est invité à contacter Modelify SAS en priorité à
      l'adresse <a href="mailto:contact@modelify.fr">contact@modelify.fr</a>. À défaut
      de résolution amiable, le tribunal de Paris sera compétent.
    </p>
  </section>
);

/* ─────────────────────────────────────────────────────────── */

export const ModalitesPaiementRemboursement = () => (
  <section id="paiement-remboursement" className="legal-section">
    <h2 className="legal-section-title">
      <span className="legal-icon">💳</span> Modalités de paiement et remboursement
    </h2>

    <h3>Moyens de paiement acceptés</h3>
    <p>Modelify accepte les modes de paiement suivants :</p>
    <ul>
      <li>Carte bancaire (Visa, Mastercard, American Express) via notre partenaire sécurisé ;</li>
      <li>Virement bancaire (coordonnées communiquées sur devis) ;</li>
      <li>PayPal.</li>
    </ul>

    <h3>Sécurité des paiements</h3>
    <p>
      Toutes les transactions sont sécurisées par un protocole de chiffrement SSL/TLS. Les
      données bancaires ne sont jamais stockées sur nos serveurs et sont traitées
      directement par nos prestataires de paiement certifiés PCI-DSS.
    </p>

    <h3>Facturation</h3>
    <p>
      Une facture est émise et envoyée par e-mail à chaque paiement validé. Pour les
      professionnels, la TVA applicable est celle en vigueur en France (20 %).
    </p>

    <h3>Politique de remboursement</h3>
    <p>Un remboursement peut être accordé dans les cas suivants :</p>
    <ul>
      <li>
        <strong>Annulation avant démarrage :</strong> remboursement intégral si le projet
        n'a pas encore été pris en charge par notre équipe.
      </li>
      <li>
        <strong>Non-conformité du livrable :</strong> si le fichier livré ne correspond pas
        aux spécifications validées dans le devis, une correction gratuite ou un
        remboursement partiel sera proposé.
      </li>
      <li>
        <strong>Cas de force majeure :</strong> remboursement total en cas d'impossibilité
        de réalisation imputable à Modelify SAS.
      </li>
    </ul>
    <p>
      Pour toute demande de remboursement, contactez-nous à{' '}
      <a href="mailto:facturation@modelify.fr">facturation@modelify.fr</a> dans un délai
      de 14 jours suivant la livraison.
    </p>

    <h3>Délais de remboursement</h3>
    <p>
      Les remboursements validés sont traités sous 5 à 10 jours ouvrés selon votre
      établissement bancaire.
    </p>
  </section>
);

/* ─────────────────────────────────────────────────────────── */

export const ServiceApresVente = () => (
  <section id="sav" className="legal-section">
    <h2 className="legal-section-title">
      <span className="legal-icon">🛠️</span> Service après-vente (SAV)
    </h2>

    <h3>Notre engagement</h3>
    <p>
      Modelify SAS s'engage à fournir un service après-vente réactif et de qualité. Notre
      équipe est disponible pour répondre à toutes vos questions et résoudre les éventuels
      problèmes rencontrés après livraison.
    </p>

    <h3>Garantie sur les livrables</h3>
    <p>
      Chaque fichier 3D livré bénéficie d'une garantie de <strong>30 jours</strong> à
      compter de la date de livraison. Durant cette période, toute modification mineure
      liée à une non-conformité avec le cahier des charges initial est prise en charge
      gratuitement.
    </p>

    <h3>Comment nous contacter ?</h3>
    <p>Notre équipe SAV est joignable via les canaux suivants :</p>
    <ul>
      <li>
        <strong>E-mail :</strong>{' '}
        <a href="mailto:sav@modelify.fr">sav@modelify.fr</a> — réponse sous 48 h
        ouvrées.
      </li>
      <li>
        <strong>Formulaire en ligne :</strong> accessible depuis votre espace personnel,
        rubrique « Mes projets ».
      </li>
      <li>
        <strong>Téléphone :</strong> +33 1 23 45 67 89, du lundi au vendredi de 9 h à
        18 h.
      </li>
    </ul>

    <h3>Processus de prise en charge</h3>
    <ol>
      <li>Soumission de votre demande via l'un des canaux ci-dessus ;</li>
      <li>Confirmation de réception par e-mail et attribution d'un numéro de dossier ;</li>
      <li>Analyse de votre demande sous 48 h ouvrées ;</li>
      <li>Proposition de solution (correction, échange ou remboursement) ;</li>
      <li>Clôture du dossier après validation de votre part.</li>
    </ol>

    <h3>Médiation</h3>
    <p>
      En cas d'absence de réponse satisfaisante de notre SAV, vous pouvez recourir
      gratuitement au médiateur de la consommation agréé auprès duquel Modelify SAS est
      adhérent. Coordonnées disponibles sur demande à{' '}
      <a href="mailto:contact@modelify.fr">contact@modelify.fr</a>.
    </p>
  </section>
);

/* ─────────────────────────────────────────────────────────────────
   Page principale – assemble tous les composants
──────────────────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'mentions-legales',         label: 'Mentions légales',                       icon: '⚖️'  },
  { id: 'politique-confidentialite', label: 'Politique de confidentialité',           icon: '🔒'  },
  { id: 'cgu',                       label: "Conditions générales d'utilisation",     icon: '📋'  },
  { id: 'cgv',                       label: 'Conditions générales de vente',          icon: '🛒'  },
  { id: 'paiement-remboursement',    label: 'Paiement & remboursement',               icon: '💳'  },
  { id: 'sav',                       label: 'Service après-vente',                    icon: '🛠️' },
];

const LegalDocuments = () => {
  const { hash } = useLocation();

  // Scroll vers l'ancre au chargement ou au changement de hash
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hash]);

  return (
    <div className="legal-page">
      {/* En-tête */}
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
          {/* Sommaire latéral (sticky) */}
          <aside className="col-lg-3 d-none d-lg-block">
            <nav className="legal-toc">
              <h6 className="legal-toc-title">Sommaire</h6>
              <ul className="list-unstyled">
                {SECTIONS.map(({ id, label, icon }) => (
                  <li key={id}>
                    <a href={`#${id}`} className="legal-toc-link">
                      <span className="me-2">{icon}</span>{label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Contenu */}
          <main className="col-lg-9">
            <MentionsLegales />
            <PolitiqueConfidentialite />
            <ConditionsGeneralesUtilisation />
            <ConditionsGeneralesVente />
            <ModalitesPaiementRemboursement />
            <ServiceApresVente />
          </main>
        </div>
      </div>
    </div>
  );
};

export default LegalDocuments;
