// Fabrique les exercices à partir du contenu (modules, grammaire, vocabulaire).
// Tous les exercices ont la même forme, puis sont joués par le moteur de leçon (lecon.js).
import { C } from "./contenu.js";
import { melanger, hasard, decouper } from "./util.js";
import { L } from "./langue.js";

const CONSIGNES = {
  choix: "Choisis la bonne réponse",
  saisie: "Complète",
  erreur: "Touche le mot qui est faux",
  vf: "Cette phrase est-elle correcte ?",
  ordre: "Remets les mots dans l'ordre",
  ecoute: "Écoute et écris ce que tu entends",
  paires: "Associe les paires",
};

function tuilesAvecPieges(mots, nb = 2) {
  const bas = mots.map((m) => m.toLowerCase());
  const pieges = melanger(L.pieges.filter((p) => !bas.includes(p))).slice(0, nb); // petits mots-pièges propres à la langue
  return melanger([...mots, ...pieges]);
}

/* ---------- Exercices écrits dans les fichiers JSON (modules des Fondations) ---------- */
export function depuisJSON(ex, tag) {
  const base = { tag, consigne: ex.consigne || CONSIGNES[ex.type], explication: ex.explication };
  switch (ex.type) {
    case "choix": return { ...base, type: "choix", texte: ex.texte, sous: ex.sous, options: melanger(ex.options), bonne: ex.options[ex.bonne] };
    case "saisie": return { ...base, type: "saisie", texte: ex.texte, sous: ex.sous, reponses: ex.reponses };
    case "erreur": return { ...base, type: "erreur", mots: ex.texte.split(" "), k: ex.k, correction: ex.correction };
    case "vf": return { ...base, type: "vf", texte: ex.texte, vrai: ex.vrai, correction: ex.correction };
    case "ordre": {
      const mots = decouper(ex.texte);
      return { ...base, type: "ordre", texte: ex.fr, mots, tuiles: tuilesAvecPieges(mots), bonne: ex.texte };
    }
    case "ecoute": return { ...base, type: "ecoute", audio: ex.texte, reponses: [ex.texte] };
    case "paires": return { ...base, type: "paires", paires: ex.paires };
    default: throw new Error("Type d'exercice inconnu : " + ex.type);
  }
}

/* ---------- Exercices de grammaire (format compact de grammaire.json) ---------- */
export function depuisGrammaire(it, tag) {
  const [t] = it;
  if (t === "q") return { type: "choix", tag, consigne: CONSIGNES.choix, texte: it[1], options: melanger(it[2]), bonne: it[2][it[3]], explication: it[4] };
  if (t === "e") return { type: "erreur", tag, consigne: CONSIGNES.erreur, mots: it[1].split(" "), k: it[2], correction: it[3], explication: it[4] };
  if (t === "v") return { type: "vf", tag, consigne: CONSIGNES.vf, texte: it[1], vrai: it[2], correction: it[3], explication: it[4] };
  const mots = decouper(it[1]);
  return { type: "ordre", tag, consigne: CONSIGNES.ordre, texte: it[2], mots, tuiles: tuilesAvecPieges(mots), bonne: it[1] };
}

/* ---------- Exercices de vocabulaire ---------- */
const autresMots = (w, n) => melanger(C.decks[w.deck].mots.filter((x) => x !== w)).slice(0, n);

export const vocab = {
  decouverte: (w) => ({ type: "decouverte", mot: w, tag: w.deck }),
  enFr: (w) => ({
    type: "choix", tag: w.deck, carte: w.id, consigne: "Que veut dire… ?", texte: w.en, audio: w.en,
    options: melanger([w, ...autresMots(w, 3)]).map((x) => x.fr), bonne: w.fr, exemple: w,
  }),
  frEn: (w) => ({
    type: "choix", tag: w.deck, carte: w.id, consigne: `Comment dit-on ${L.en} ?`, texte: w.fr,
    options: melanger([w, ...autresMots(w, 3)]).map((x) => x.en), bonne: w.en, exemple: w,
  }),
  ecrire: (w) => ({
    type: "saisie", tag: w.deck, carte: w.id, consigne: `Écris ${L.en}`, texte: w.fr,
    reponses: w.en.split(" / "), tolerance: true, exemple: w,
  }),
  phrase: (w) => {
    const mots = decouper(w.exEn);
    return { type: "ordre", tag: w.deck, consigne: "Traduis la phrase", texte: w.exFr, mots, tuiles: tuilesAvecPieges(mots), bonne: w.exEn };
  },
  dictee: (w) => ({ type: "ecoute", tag: w.deck, consigne: CONSIGNES.ecoute, audio: w.exEn, reponses: [w.exEn] }),
  paires: (mots) => ({ type: "paires", consigne: CONSIGNES.paires, paires: mots.map((w) => [w.en, w.fr]) }),
};

// Une leçon de vocabulaire : découvrir, reconnaître, associer, puis produire
export function leconVocab(mots) {
  const a = mots.slice(0, 3), b = mots.slice(3);
  const ex = [
    ...a.map(vocab.decouverte), ...melanger(a).map(vocab.enFr),
    ...b.map(vocab.decouverte), ...melanger(b).map(vocab.enFr),
    vocab.paires(mots),
    ...melanger(mots).slice(0, 3).map(vocab.frEn),
    ...melanger(mots).slice(0, 3).map(vocab.ecrire),
    vocab.phrase(hasard(mots)),
    vocab.dictee(hasard(mots)),
  ];
  return ex;
}

/* ---------- Une carte de révision → un exercice ----------
   Les nouvelles cartes de vocabulaire sont d'abord révisées en QCM,
   puis dès qu'elles sont un peu installées, il faut écrire le mot (plus efficace). */
export function exerciceDeCarte(id, carteSRS) {
  const c = C.cartes[id];
  if (!c) return null;
  let ex;
  if (c.type === "f") {
    ex = { type: "saisie", tag: c.source, consigne: "Complète", texte: c.texte, sous: c.sous, reponses: c.reponses, explication: c.explication };
  } else if (c.type === "g") {
    ex = depuisGrammaire(c.item, c.source);
  } else {
    ex = carteSRS && carteSRS.reps >= 2 ? vocab.ecrire(c.mot) : vocab.frEn(c.mot);
  }
  return { ...ex, carte: id };
}
