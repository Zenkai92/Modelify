// Point d'entrée unique pour les appels à l'API backend.
// Centralise l'URL de base (VITE_API_URL) et l'en-tête d'authentification,
// pour éviter les URLs codées en dur et les duplications dans les composants.

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Appelle l'API backend.
 * @param {string} path - chemin commençant par /api (ex: '/api/projects')
 * @param {object} options - options fetch standard + `token` (JWT Supabase)
 * @returns {Promise<Response>}
 */
export function apiFetch(path, { token, headers = {}, ...options } = {}) {
  const finalHeaders = { ...headers };
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }
  return fetch(`${API_URL}${path}`, { ...options, headers: finalHeaders });
}
