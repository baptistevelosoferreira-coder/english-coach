// Petits outils partagés par toute l'application.

export const $ = (sel, racine = document) => racine.querySelector(sel);
export const $$ = (sel, racine = document) => [...racine.querySelectorAll(sel)];

export function melanger(tableau) {
  const t = tableau.slice();
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

export const hasard = (t) => t[Math.floor(Math.random() * t.length)];

export function echapper(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Date du jour au format AAAA-MM-JJ (heure locale)
export function jour(decalage = 0) {
  const d = new Date();
  d.setDate(d.getDate() + decalage);
  return d.toLocaleDateString("fr-CA");
}

/* ---------------------------------------------------------------
   Comparaison des réponses tapées
   On développe les contractions pour que « don't » et « do not »
   soient acceptés de la même façon, et on ignore majuscules,
   ponctuation finale et espaces en trop.
   --------------------------------------------------------------- */
export function normaliser(s) {
  return String(s)
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\bcan't\b/g, "can not")
    .replace(/\bcannot\b/g, "can not")
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bshan't\b/g, "shall not")
    .replace(/n't\b/g, " not")
    .replace(/'m\b/g, " am")
    .replace(/'re\b/g, " are")
    .replace(/'ll\b/g, " will")
    .replace(/'ve\b/g, " have")
    .replace(/'d\b/g, " would")
    .replace(/\b(he|she|it|that|there|what|who|where|how)'s\b/g, "$1 is")
    .replace(/[.,!?;:"«»()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Distance d'édition (nombre de lettres à changer pour passer de a à b)
export function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/* Vérifie une réponse tapée.
   tolerance = true : une faute de frappe d'une lettre est acceptée (vocabulaire).
   Pour la grammaire on ne tolère rien : « work » au lieu de « works », c'est justement l'erreur. */
export function verifierSaisie(tape, reponses, tolerance = false) {
  const t = normaliser(tape);
  const attendus = reponses.map(normaliser);
  if (attendus.includes(t)) return { ok: true, presque: false };
  if (tolerance) {
    const sansArticle = (s) => s.replace(/^(to|a|an|the) /, "");
    if (attendus.some((a) => sansArticle(a) === sansArticle(t))) return { ok: true, presque: false };
    if (attendus.some((a) => a.length >= 5 && distance(sansArticle(a), sansArticle(t)) === 1)) return { ok: true, presque: true };
  }
  return { ok: false, presque: false };
}

// Découpe une phrase en mots pour les exercices « remets dans l'ordre »
export const decouper = (phrase) => phrase.replace(/[.,!?]/g, "").split(" ").filter(Boolean);
