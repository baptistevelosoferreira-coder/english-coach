// Charge tout le contenu (fichiers JSON du dossier contenu/) et construit
// le registre des cartes de révision : chaque élément appris a un identifiant unique.
//   f1-3          → carte d'un module des Fondations
//   g:perfect:2   → exercice d'un point de grammaire
//   v:es-temps:4  → mot d'un thème de vocabulaire

export const C = {
  fondations: [],   // modules, dans l'ordre
  verbes: [],       // pour la machine à conjuguer
  test: [],         // questions du test de positionnement
  grammaire: [],    // points de grammaire
  parcoursVocab: [],// collections de thèmes (essentiels, pro…)
  decks: {},        // thèmes de vocabulaire par identifiant
  points: {},       // points de grammaire par identifiant
  modules: {},      // modules par identifiant
  cartes: {},       // registre des cartes de révision
};

const lire = async (chemin) => {
  const r = await fetch("contenu/" + chemin);
  if (!r.ok) throw new Error("Impossible de charger " + chemin);
  return r.json();
};

export async function chargerContenu() {
  const s = await lire("sommaire.json");
  const [fondations, verbes, test, grammaire, vocab] = await Promise.all([
    Promise.all(s.fondations.map(lire)),
    lire(s.verbes),
    lire(s.test),
    lire(s.grammaire),
    Promise.all(s.vocabulaire.map(lire)),
  ]);

  C.fondations = fondations;
  fondations.forEach((m) => {
    C.modules[m.id] = m;
    m.cartes.forEach((c) => (C.cartes[c.id] = { type: "f", source: m.id, ...c }));
  });

  C.verbes = verbes.verbes.map(([base, s3, ing, passe, pp, fr]) => ({ base, s3, ing, passe, pp, fr }));
  C.test = test.questions;

  C.grammaire = grammaire.points;
  grammaire.points.forEach((p) => {
    C.points[p.id] = p;
    p.items.forEach((it, i) => {
      if (it[0] !== "o") C.cartes[`g:${p.id}:${i}`] = { type: "g", source: p.id, item: it };
    });
  });

  C.parcoursVocab = vocab;
  vocab.forEach((col) => col.decks.forEach((d) => {
    d.collection = col.id;
    C.decks[d.id] = d;
    d.mots = d.mots.map(([en, fr, exEn, exFr, note], i) => ({ id: `v:${d.id}:${i}`, en, fr, exEn, exFr, note, deck: d.id }));
    d.mots.forEach((w) => (C.cartes[w.id] = { type: "v", source: d.id, mot: w }));
  }));
}

// Nom lisible d'un élément du contenu (module, point de grammaire ou thème)
export function titreDe(id) {
  if (C.modules[id]) return `${C.modules[id].ico} ${C.modules[id].titre}`;
  if (C.points[id]) return `${C.points[id].ico} ${C.points[id].titre}`;
  if (C.decks[id]) return `${C.decks[id].ico} ${C.decks[id].titre}`;
  return id;
}

// Cartes de révision rattachées à un module, un point ou un thème
export const cartesDe = (id) => Object.keys(C.cartes).filter((c) => C.cartes[c].source === id);
