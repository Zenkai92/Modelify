// Constantes partagées pour l'affichage des projets
// (statuts, budgets) — utilisées par les listes client et admin
// et par la page de détails, pour éviter les mappings dupliqués.

// Libellé affiché pour chaque statut (par défaut : le statut brut)
export const STATUS_LABELS = {
  devis_refusé: 'devis refusé',
};

export const statusLabel = (status) => STATUS_LABELS[status] || status;

// Classe Bootstrap du badge selon le statut
export const STATUS_BADGE_CLASSES = {
  'en attente': 'bg-warning text-dark',
  devis_envoyé: 'bg-info text-dark',
  devis_refusé: 'bg-danger',
  paiement_attente: 'bg-info text-dark',
  payé: 'bg-success',
  'en cours': 'bg-primary',
  terminé: 'bg-success',
};

export const statusBadgeClass = (status) =>
  STATUS_BADGE_CLASSES[status] || 'bg-secondary';

// Libellés des tranches de budget du formulaire de demande
export const BUDGET_LABELS = {
  less_25: 'Moins de 25€',
  '25_50': '25€ - 50€',
  '50_100': '50€ - 100€',
  '100_300': '100€ - 300€',
  '300_500': '300€ - 500€',
  more_500: 'Plus de 500€',
  // Anciennes tranches conservées pour les projets existants
  less_100: 'Moins de 100€',
  '500_1000': '500€ - 1000€',
  more_1000: 'Plus de 1000€',
  discuss: 'À discuter',
};

export const budgetLabel = (budget) => BUDGET_LABELS[budget] || budget;
