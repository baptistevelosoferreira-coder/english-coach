// Tout ce qui est propre à l'anglais : textes, voix, comparaison des réponses, conjugaison.

/* On développe les contractions pour que « don't » et « do not » soient acceptés
   de la même façon, et on ignore majuscules, ponctuation et espaces en trop. */
function normaliser(s) {
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

/* ---------- Conjugaison (machine à conjuguer) ---------- */
const SUJETS = [
  { texte: "I", p: "1s" }, { texte: "you", p: "2" }, { texte: "he", p: "3s" }, { texte: "she", p: "3s" },
  { texte: "we", p: "pl" }, { texte: "they", p: "pl" }, { texte: "my boss", p: "3s" }, { texte: "my friends", p: "pl" },
];

// Chaque temps se débloque avec un module des Fondations
const TEMPS = [
  { id: "present", nom: "présent simple", module: "f2", formes: ["aff"] },
  { id: "present", nom: "présent simple", module: "f3", formes: ["neg", "q"] },
  { id: "continu", nom: "présent en -ing", module: "f4", formes: ["aff", "neg", "q"] },
  { id: "preterit", nom: "prétérit", module: "f7", formes: ["aff", "neg", "q"] },
  { id: "futur", nom: "futur (will)", module: "f8", formes: ["aff", "neg", "q"] },
];

const FORMES = { aff: "affirmation", neg: "négation", q: "question" };

// Verbes d'état : jamais au présent en -ing
const ETATS = ["need", "want", "like", "know", "understand"];

const beMaintenant = (p) => (p === "1s" ? "am" : p === "3s" ? "is" : "are");
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function lireVerbes(json) {
  return json.verbes.map(([base, s3, ing, passe, pp, fr]) => ({ infinitif: "to " + base, base, s3, ing, passe, pp, fr }));
}

const verbesPossibles = (verbes, temps) => verbes.filter((v) => !(temps.id === "continu" && ETATS.includes(v.base)));

/* Renvoie les réponses acceptées (ex. « Does she work? ») et une astuce en cas d'erreur.
   Les contractions (doesn't / does not) sont acceptées automatiquement par la comparaison. */
function conjuguer(v, sujet, temps, forme) {
  const s = sujet.texte, p = sujet.p;
  const troisieme = p === "3s";
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
    if (forme === "aff") { phrase = `${s} ${v.passe}`; astuce = `${v.base} → ${v.passe} au prétérit`; }
    if (forme === "neg") { phrase = `${s} didn't ${v.base}`; astuce = "didn't + verbe à la base"; }
    if (forme === "q") { phrase = `Did ${s} ${v.base}?`; astuce = "Did + sujet + verbe à la base"; }
  } else if (temps === "futur") {
    if (forme === "aff") phrase = `${s} will ${v.base}`;
    if (forme === "neg") phrase = `${s} won't ${v.base}`;
    if (forme === "q") phrase = `Will ${s} ${v.base}?`;
    astuce = "will + verbe à la base (sans to)";
  }
  phrase = majuscule(phrase);
  return { phrase, reponses: [phrase], astuce };
}

export default {
  code: "en",
  appli: "English Coach",
  drapeau: "🇬🇧",
  nom: "anglais",          // « le cours d'anglais »
  le: "l'anglais",         // « reprendre l'anglais »
  en: "en anglais",        // « écris en anglais »
  de: "d'anglais",         // « professeur d'anglais »
  adjectif: "anglaise",    // « une voix anglaise »
  cleStockage: "english-coach",
  voix: { prefixe: "en", preferees: [/en[-_]gb/i, /en[-_]us/i], defaut: "en-GB" },
  languageTool: "en-GB",
  consigneAnalyse: "",
  intro: {
    accroche: "Reprends l'anglais sur des bases solides, un peu chaque jour.",
    etape3: "Vocabulaire essentiel, grammaire, anglais pro, puis vie quotidienne.",
  },
  normaliser,
  accents: false,
  articles: /^(to|a|an|the) /,
  pieges: ["do", "does", "did", "is", "are", "was", "were", "have", "has", "will", "to", "the", "a"],
  conj: {
    SUJETS, TEMPS, FORMES, lireVerbes, verbesPossibles, conjuguer,
    aide: "Écris la phrase : sujet + verbe",
    exemple: "she · work · négation → She doesn't work",
  },
};
