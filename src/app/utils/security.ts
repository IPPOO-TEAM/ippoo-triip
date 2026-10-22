/**
 * Utilitaires de sécurité pour l'assainissement du code CSS dynamique.
 * Prévient les injections XSS et CSS via dangerouslySetInnerHTML.
 */

/**
 * Assainit un identifiant CSS (ex: id de chart, clé de variable CSS).
 * Conserve uniquement les caractères alphanumériques, tirets et underscores.
 */
export function sanitizeCSSIdentifier(id: string, fallback = "default"): string {
  const cleaned = id.replace(/[^a-zA-Z0-9-_]/g, "");
  return cleaned || fallback;
}

/**
 * Assainit une valeur CSS dynamique (ex: couleur hex, hsl, rgb).
 * Supprime les balises HTML, délimiteurs CSS, commentaires et fonctions à risque.
 */
export function sanitizeCSSValue(val: string): string {
  return val
    .replace(/<[^>]*>/g, "")
    .replace(/\\|\/\*|\*\/|[{};<>]/g, "")
    .replace(/(url|expression)\s*\(/gi, "");
}
