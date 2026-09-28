// Révision espacée avec FSRS (Free Spaced Repetition Scheduler),
// l'algorithme libre utilisé par Anki : https://github.com/open-spaced-repetition/ts-fsrs
// Chaque élément appris (forme verbale, mot, règle) devient une « carte ».
// FSRS calcule quand la revoir : juste avant que tu l'oublies.
import { fsrs, createEmptyCard, generatorParameters, Rating } from "../vendor/ts-fsrs.mjs";
import { etat, sauver } from "./store.js";

const planificateur = fsrs(generatorParameters({
  request_retention: 0.9,   // on vise 90 % de chances de se souvenir au moment de la révision
  maximum_interval: 365,
  enable_fuzz: true,        // évite que toutes les cartes tombent le même jour
  enable_short_term: false, // pas de répétitions à 1 ou 10 minutes : la leçon joue déjà ce rôle
}));

// Les dates sont stockées en texte dans la sauvegarde : on les reconvertit.
function relire(c) {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

export const connue = (id) => id in etat.cartes;

// Ajoute des cartes après une leçon réussie : première révision planifiée dans quelques jours.
export function ajouterCartes(ids) {
  const maintenant = new Date();
  ids.forEach((id) => {
    if (connue(id)) return;
    const { card } = planificateur.next(createEmptyCard(maintenant), maintenant, Rating.Good);
    etat.cartes[id] = card;
  });
  sauver();
}

/* Enregistre le résultat d'une révision.
   resultat : "faux" (oublié), "presque" (retrouvé avec difficulté) ou "juste". */
export function noter(id, resultat) {
  const maintenant = new Date();
  const carte = etat.cartes[id] ? relire(etat.cartes[id]) : createEmptyCard(maintenant);
  const note = resultat === "faux" ? Rating.Again : resultat === "presque" ? Rating.Hard : Rating.Good;
  etat.cartes[id] = planificateur.next(carte, maintenant, note).card;
  sauver();
}

// Remet des cartes à réviser tout de suite (ex. : erreurs au test de positionnement)
export function aRevoirMaintenant(ids) {
  const maintenant = new Date().toISOString();
  ids.forEach((id) => { if (etat.cartes[id]) etat.cartes[id] = { ...etat.cartes[id], due: maintenant }; });
  sauver();
}

export function cartesDues(maintenant = new Date()) {
  return Object.entries(etat.cartes)
    .filter(([, c]) => new Date(c.due) <= maintenant)
    .sort((a, b) => new Date(a[1].due) - new Date(b[1].due))
    .map(([id]) => id);
}

export function prochaineRevision() {
  const dates = Object.values(etat.cartes).map((c) => new Date(c.due)).filter((d) => d > new Date());
  return dates.length ? new Date(Math.min(...dates)) : null;
}

// Une carte est « solide » quand FSRS estime qu'elle tiendra au moins 3 semaines
export const solide = (id) => etat.cartes[id] && etat.cartes[id].stability >= 21;
