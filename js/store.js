// Sauvegarde de la progression dans le navigateur (localStorage),
// avec export / import pour ne jamais la perdre.
import { jour } from "./util.js";

const CLE = "english-coach";
const VERSION = 1;

const etatVide = () => ({
  version: VERSION,
  profil: null,          // { objectif, debut }
  xp: 0,
  xpJour: 0,
  jourXp: null,
  serie: 0,
  dernierJour: null,
  modules: {},           // fondations : { f1: { etoiles: 3 } }
  test: null,            // résultat du test de positionnement
  decks: {},             // vocabulaire : { "marketing-bases-0": { etoiles } }
  grammaire: {},         // points de grammaire : { perfect: { etoiles } }
  cartes: {},            // cartes de révision espacée (FSRS)
  erreurs: {},           // carnet d'erreurs : { f2: 4, perfect: 1 }
  productions: [],       // phrases écrites par l'utilisateur
  records: { chrono: 0, machine: 0 },
});

function charger() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE));
    if (brut && brut.version === VERSION) return { ...etatVide(), ...brut };
  } catch (e) { /* stockage indisponible ou abîmé : on repart de zéro */ }
  return etatVide();
}

export let etat = charger();

export function sauver() {
  try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* navigation privée, quota… */ }
}

export function reinitialiser() {
  etat = etatVide();
  sauver();
}

/* ---------- XP, série de jours, objectif quotidien ---------- */
export const serieActive = () => (etat.dernierJour === jour() || etat.dernierJour === jour(-1) ? etat.serie : 0);
export const xpDuJour = () => (etat.jourXp === jour() ? etat.xpJour : 0);

export function gagnerXP(n) {
  if (etat.dernierJour !== jour()) {
    etat.serie = etat.dernierJour === jour(-1) ? etat.serie + 1 : 1;
    etat.dernierJour = jour();
  }
  if (etat.jourXp !== jour()) { etat.jourXp = jour(); etat.xpJour = 0; }
  etat.xp += n;
  etat.xpJour += n;
  sauver();
}

export function noterErreur(tag) {
  if (!tag) return;
  etat.erreurs[tag] = (etat.erreurs[tag] || 0) + 1;
}

/* ---------- Export / import ---------- */
export function exporter() {
  const blob = new Blob([JSON.stringify(etat, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `english-coach-sauvegarde-${jour()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const texteSauvegarde = () => JSON.stringify(etat);

export async function importer(fichier) {
  return importerTexte(await fichier.text());
}

export function importerTexte(texte) {
  let donnees;
  try { donnees = JSON.parse(texte); } catch (e) { throw new Error("Ce texte n'est pas une sauvegarde English Coach."); }
  if (!donnees || donnees.version !== VERSION || !("cartes" in donnees)) throw new Error("Ce fichier n'est pas une sauvegarde English Coach.");
  etat = { ...etatVide(), ...donnees };
  sauver();
}
