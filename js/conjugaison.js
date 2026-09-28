// Conjugue un verbe anglais : sujet + temps + forme (affirmative, négative, question).
// Utilisé par la machine à conjuguer. Les temps se débloquent avec les modules des Fondations.

export const SUJETS = [
  { en: "I", p: "1s" }, { en: "you", p: "2" }, { en: "he", p: "3s" }, { en: "she", p: "3s" },
  { en: "we", p: "pl" }, { en: "they", p: "pl" }, { en: "my boss", p: "3s" }, { en: "my friends", p: "pl" },
];

export const TEMPS = [
  { id: "present", nom: "présent simple", module: "f2", formes: ["aff"] },
  { id: "present", nom: "présent simple", module: "f3", formes: ["neg", "q"] },
  { id: "continu", nom: "présent en -ing", module: "f4", formes: ["aff", "neg", "q"] },
  { id: "preterit", nom: "prétérit", module: "f7", formes: ["aff", "neg", "q"] },
  { id: "futur", nom: "futur (will)", module: "f8", formes: ["aff", "neg", "q"] },
];

export const NOMS_FORMES = { aff: "affirmation", neg: "négation", q: "question" };

const beMaintenant = (p) => (p === "1s" ? "am" : p === "3s" ? "is" : "are");
const bePasse = (p) => (p === "1s" || p === "3s" ? "was" : "were");
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/* Renvoie la phrase attendue (ex. « Does she work? ») et une astuce en cas d'erreur.
   Les contractions (doesn't / does not) sont acceptées automatiquement par la comparaison. */
export function conjuguer(v, sujet, temps, forme) {
  const s = sujet.en, p = sujet.p;
  const troisieme = p === "3s";
  const estBe = v.base === "be";
  let phrase, astuce;

  if (temps === "present") {
    if (forme === "aff") { phrase = `${s} ${troisieme ? v.s3 : v.base}`; astuce = troisieme ? "he / she / it → verbe + s" : "Pas de s avec I, you, we, they"; }
    if (forme === "neg") { phrase = `${s} ${troisieme ? "doesn't" : "don't"} ${v.base}`; astuce = "don't / doesn't + verbe sans s"; }
    if (forme === "q") { phrase = `${troisieme ? "Does" : "Do"} ${s} ${v.base}?`; astuce = "Do / Does + sujet + verbe sans s"; }
  } else if (temps === "continu") {
    const be = beMaintenant(p);
    if (forme === "aff") phrase = `${s} ${be} ${v.ing}`;
    if (forme === "neg") phrase = `${s} ${be} not ${v.ing}`;
    if (forme === "q") phrase = `${majuscule(be)} ${s} ${v.ing}?`;
    astuce = "am / is / are + verbe en -ing";
  } else if (temps === "preterit") {
    if (estBe) {
      const be = bePasse(p);
      phrase = forme === "aff" ? `${s} ${be}` : forme === "neg" ? `${s} ${be} not` : `${majuscule(be)} ${s}?`;
    } else {
      if (forme === "aff") { phrase = `${s} ${v.passe}`; astuce = `${v.base} → ${v.passe} au prétérit`; }
      if (forme === "neg") { phrase = `${s} didn't ${v.base}`; astuce = "didn't + verbe à la base"; }
      if (forme === "q") { phrase = `Did ${s} ${v.base}?`; astuce = "Did + sujet + verbe à la base"; }
    }
  } else if (temps === "futur") {
    if (forme === "aff") phrase = `${s} will ${v.base}`;
    if (forme === "neg") phrase = `${s} won't ${v.base}`;
    if (forme === "q") phrase = `Will ${s} ${v.base}?`;
    astuce = "will + verbe à la base (sans to)";
  }
  // Majuscule en début de phrase
  return { phrase: majuscule(phrase), astuce };
}
