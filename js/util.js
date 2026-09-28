// Petits outils partagés par toute l'application.
import { L } from "./langue.js";

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
   Comparaison des réponses tapées : chaque langue a sa propre façon
   de normaliser (contractions en anglais, accents en portugais…).
   --------------------------------------------------------------- */
export const normaliser = (s) => L.normaliser(s);
const sansAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

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
   Pour la grammaire on ne tolère rien : « work » au lieu de « works », c'est justement l'erreur.
   Une faute d'accent seule est signalée, mais la réponse compte. */
export function verifierSaisie(tape, reponses, tolerance = false) {
  const t = normaliser(tape);
  const attendus = reponses.map(normaliser);
  if (attendus.includes(t)) return { ok: true, presque: false };
  if (L.accents && attendus.some((a) => sansAccents(a) === sansAccents(t))) return { ok: true, presque: true, raison: "accents" };
  if (tolerance) {
    const sansArticle = (s) => s.replace(L.articles, "");
    if (attendus.some((a) => sansArticle(a) === sansArticle(t))) return { ok: true, presque: false };
    if (attendus.some((a) => a.length >= 5 && distance(sansAccents(sansArticle(a)), sansAccents(sansArticle(t))) === 1)) return { ok: true, presque: true, raison: "frappe" };
  }
  return { ok: false, presque: false };
}

// Découpe une phrase en mots pour les exercices « remets dans l'ordre »
export const decouper = (phrase) => phrase.replace(/[.,!?]/g, "").split(" ").filter(Boolean);
