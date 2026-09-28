// Les règles de progression : ce qui est débloqué, ce qui est recommandé,
// et quelle est la prochaine étape à proposer.
import { C } from "./contenu.js";
import { etat } from "./store.js";
import { cartesDues } from "./srs.js";

export const NIVEAUX = [
  { id: "A1", nom: "Débutant" },
  { id: "A2", nom: "Élémentaire" },
  { id: "B1", nom: "Intermédiaire" },
  { id: "B2", nom: "Avancé" },
];
export const rang = (niveau) => NIVEAUX.findIndex((n) => n.id === niveau);

/* ---------- Étape 1 : les Fondations ---------- */
export const moduleFini = (id) => !!etat.modules[id];
export function moduleOuvert(id) {
  const i = C.fondations.findIndex((m) => m.id === id);
  return i === 0 || moduleFini(C.fondations[i - 1].id);
}
export const nbModulesFinis = () => C.fondations.filter((m) => moduleFini(m.id)).length;
export const fondationsFinies = () => nbModulesFinis() === C.fondations.length;
export const prochainModule = () => C.fondations.find((m) => !moduleFini(m.id));

/* ---------- Étape 2 : le test de positionnement ---------- */
export const testOuvert = () => fondationsFinies() || !!etat.test;
export const suiteOuverte = () => !!etat.test;

/* ---------- Étape 3 : le parcours personnalisé ---------- */
export const leconsDeck = (deck) => Math.ceil(deck.mots.length / 6);
export const deckFini = (deck) => Array.from({ length: leconsDeck(deck) }, (_, n) => etat.decks[`${deck.id}-${n}`]).every(Boolean);
export const pointFini = (id) => !!etat.grammaire[id];

// Recommandations issues du test : ce que tu as raté, puis ce qui correspond à ton niveau
export function recommandations() {
  if (!etat.test) return [];
  const r = rang(etat.test.niveau);
  const liste = [];
  const ajouter = (id) => { if (!liste.includes(id)) liste.push(id); };
  etat.test.manques.forEach(ajouter);
  C.parcoursVocab.forEach((col) => col.decks.forEach((d) => { if (rang(d.niveau) <= r + 1) ajouter(d.id); }));
  C.grammaire.forEach((p) => { if (rang(p.niveau) >= r - 1 && rang(p.niveau) <= r + 1) ajouter(p.id); });
  return liste.filter((id) => !estFini(id));
}
export const estRecommande = (id) => recommandations().includes(id);

export function estFini(id) {
  if (C.modules[id]) return moduleFini(id);
  if (C.points[id]) return pointFini(id);
  if (C.decks[id]) return deckFini(C.decks[id]);
  return false;
}

/* La prochaine étape proposée sur l'accueil :
   d'abord les révisions en attente (elles ne doivent pas s'accumuler),
   puis le prochain contenu nouveau. */
export function prochaineEtape() {
  const dues = cartesDues().length;
  if (dues >= 5) return { type: "revisions", nb: dues };
  const m = prochainModule();
  if (m) return { type: "module", id: m.id };
  if (!etat.test) return { type: "test" };
  const reco = recommandations()[0];
  if (reco) return { type: "reco", id: reco };
  if (dues) return { type: "revisions", nb: dues };
  return { type: "libre" };
}
