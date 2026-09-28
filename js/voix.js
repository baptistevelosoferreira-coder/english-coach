// Prononciation : on utilise la synthèse vocale intégrée au navigateur,
// en choisissant de préférence une voix britannique.

const disponible = typeof window !== "undefined" && "speechSynthesis" in window;
let voix = null;

function choisirVoix() {
  const anglaises = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
  voix = anglaises.find((v) => /en[-_]gb/i.test(v.lang))
    || anglaises.find((v) => /en[-_]us/i.test(v.lang))
    || anglaises[0] || null;
}

if (disponible) {
  choisirVoix();
  speechSynthesis.onvoiceschanged = choisirVoix;
}

export const syntheseDisponible = () => disponible;

export function parler(texte, lent = false) {
  if (!disponible || !texte) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = voix ? voix.lang : "en-GB";
  if (voix) u.voice = voix;
  u.rate = lent ? 0.65 : 0.92;
  speechSynthesis.speak(u);
}

// Lit plusieurs phrases à la suite (pour écouter un dialogue en entier)
export function parlerSuite(textes, surLigne = () => {}) {
  if (!disponible) return;
  speechSynthesis.cancel();
  textes.forEach((texte, i) => {
    const u = new SpeechSynthesisUtterance(texte);
    u.lang = voix ? voix.lang : "en-GB";
    if (voix) u.voice = voix;
    u.rate = 0.92;
    u.onstart = () => surLigne(i);
    u.onend = () => { if (i === textes.length - 1) surLigne(-1); };
    speechSynthesis.speak(u);
  });
}

export function silence() {
  if (disponible) speechSynthesis.cancel();
}
