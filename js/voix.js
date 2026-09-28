// Prononciation : on utilise la synthèse vocale intégrée au navigateur,
// avec une voix de la langue étudiée (britannique pour l'anglais, du Portugal pour le portugais).
import { L } from "./langue.js";

const disponible = typeof window !== "undefined" && "speechSynthesis" in window;
let voix = null;

export function choisirVoix() {
  if (!disponible) return;
  const candidates = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(L.voix.prefixe));
  voix = null;
  for (const motif of L.voix.preferees) { voix = candidates.find((v) => motif.test(v.lang)); if (voix) break; }
  if (!voix) voix = candidates[0] || null;
}

if (disponible) {
  choisirVoix();
  speechSynthesis.onvoiceschanged = choisirVoix;
}

export const syntheseDisponible = () => disponible;
export const voixTrouvee = () => !!voix;

export function parler(texte, lent = false) {
  if (!disponible || !texte) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = voix ? voix.lang : L.voix.defaut;
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
    u.lang = voix ? voix.lang : L.voix.defaut;
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
