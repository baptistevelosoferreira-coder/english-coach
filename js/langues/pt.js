// Tout ce qui est propre au portugais du Portugal : textes, voix, comparaison des réponses, conjugaison.

// On ignore majuscules, ponctuation et espaces en trop. Les accents sont vérifiés à part
// (une faute d'accent est signalée, mais la réponse compte).
function normaliser(s) {
  return String(s)
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?;:"«»()¿¡]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------- Conjugaison (machine à conjuguer) ----------
   Personnes : 0 = eu, 1 = tu, 2 = ele / ela / você, 3 = nós, 4 = eles / elas / vocês */
const SUJETS = [
  { texte: "eu", p: 0, pronom: true }, { texte: "tu", p: 1, pronom: true },
  { texte: "ele", p: 2, pronom: true }, { texte: "ela", p: 2, pronom: true }, { texte: "você", p: 2, pronom: true },
  { texte: "nós", p: 3, pronom: true }, { texte: "vocês", p: 4, pronom: true }, { texte: "eles", p: 4, pronom: true },
  { texte: "o meu chefe", p: 2 }, { texte: "os meus amigos", p: 4 },
];

const TEMPS = [
  { id: "presente", nom: "présent", module: "p3", formes: ["aff", "neg"], verbes: "reguliers" },
  { id: "presente", nom: "présent", module: "p4", formes: ["aff", "neg"] },
  { id: "continuo", nom: "estar a + infinitif", module: "p5", formes: ["aff", "neg"] },
  { id: "futuro", nom: "futur proche (ir + inf.)", module: "p5", formes: ["aff", "neg"] },
  { id: "perfeito", nom: "passé (perfeito)", module: "p6", formes: ["aff", "neg"], verbes: "reguliers" },
  { id: "perfeito", nom: "passé (perfeito)", module: "p7", formes: ["aff", "neg"] },
  { id: "imperfeito", nom: "imparfait", module: "p8", formes: ["aff", "neg"] },
];

const FORMES = { aff: "affirmation", neg: "négation" };

const TERMINAISONS = {
  presente: { ar: ["o", "as", "a", "amos", "am"], er: ["o", "es", "e", "emos", "em"], ir: ["o", "es", "e", "imos", "em"] },
  perfeito: { ar: ["ei", "aste", "ou", "ámos", "aram"], er: ["i", "este", "eu", "emos", "eram"], ir: ["i", "iste", "iu", "imos", "iram"] },
  imperfeito: { ar: ["ava", "avas", "ava", "ávamos", "avam"], er: ["ia", "ias", "ia", "íamos", "iam"], ir: ["ia", "ias", "ia", "íamos", "iam"] },
};

function formesRegulieres(inf, temps) {
  const groupe = inf.slice(-2), radical = inf.slice(0, -2);
  return TERMINAISONS[temps][groupe].map((t) => radical + t);
}

function lireVerbes(json) {
  const reguliers = json.reguliers.map(([inf, fr]) => ({ infinitif: inf, fr, irregulier: false }));
  const irreguliers = Object.entries(json.irreguliers).map(([inf, d]) => ({ infinitif: inf, fr: d.fr, irregulier: true, tables: d }));
  return [...reguliers, ...irreguliers];
}

// Les 5 formes d'un verbe à un temps simple
function formes(v, temps) {
  return (v.tables && v.tables[temps]) || formesRegulieres(v.infinitif, temps);
}

const ESTAR = ["estou", "estás", "está", "estamos", "estão"];
const IR = ["vou", "vais", "vai", "vamos", "vão"];
const majuscule = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const verbesPossibles = (verbes, temps) => (temps.verbes === "reguliers" ? verbes.filter((v) => !v.irregulier) : verbes);

function conjuguer(v, sujet, temps, forme) {
  let verbe, astuce;
  if (temps === "continuo") {
    verbe = `${ESTAR[sujet.p]} a ${v.infinitif}`;
    astuce = `estar a + infinitif : estou a ${v.infinitif}, estás a ${v.infinitif}…`;
  } else if (temps === "futuro") {
    verbe = `${IR[sujet.p]} ${v.infinitif}`;
    astuce = `ir + infinitif : vou ${v.infinitif}, vais ${v.infinitif}…`;
  } else {
    const f = formes(v, temps);
    verbe = f[sujet.p];
    astuce = `${v.infinitif} : ${f.join(", ")}`;
  }
  if (forme === "neg") verbe = "não " + verbe;
  const phrase = majuscule(`${sujet.texte} ${verbe}`);
  // En portugais, le pronom sujet est souvent omis : « falo » suffit
  const reponses = sujet.pronom ? [phrase, majuscule(verbe)] : [phrase];
  return { phrase, reponses, astuce };
}

export default {
  code: "pt",
  appli: "Coach Português",
  drapeau: "🇵🇹",
  nom: "portugais",
  le: "le portugais",
  en: "en portugais",
  de: "de portugais",
  adjectif: "portugaise",
  cleStockage: "coach-portugais",
  voix: { prefixe: "pt", preferees: [/pt[-_]pt/i], defaut: "pt-PT" },
  languageTool: "pt-PT",
  consigneAnalyse: "Corrige selon la norme du portugais du Portugal (et non du Brésil) : par exemple « estou a fazer » et non « estou fazendo », « chamo-me » et non « me chamo », « autocarro » et non « ônibus ».",
  intro: {
    accroche: "Apprends le portugais du Portugal sur des bases solides, un peu chaque jour.",
    etape3: "Vocabulaire essentiel, grammaire et vie quotidienne au Portugal.",
  },
  normaliser,
  accents: true,
  articles: /^(o|a|os|as|um|uma) /,
  pieges: ["é", "está", "são", "estão", "tem", "vai", "a", "o", "de", "em", "não", "que"],
  conj: {
    SUJETS, TEMPS, FORMES, lireVerbes, verbesPossibles, conjuguer,
    aide: "Écris le sujet + le verbe conjugué",
    exemple: "ela · falar · négation → Ela não fala",
  },
};
