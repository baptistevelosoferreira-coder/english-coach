// La langue étudiée en ce moment. Chaque langue a sa propre progression.
import en from "./langues/en.js";
import pt from "./langues/pt.js";

export const LANGUES = { en, pt };
const CLE = "coach-langue";

function lireChoix() {
  try {
    const code = localStorage.getItem(CLE);
    if (LANGUES[code]) return code;
    // Les personnes qui utilisaient déjà l'appli en anglais restent en anglais
    if (localStorage.getItem(en.cleStockage)) return "en";
  } catch (e) { /* stockage indisponible */ }
  return null;
}

const choix = lireChoix();
export let L = choix ? LANGUES[choix] : en;
export let langueChoisie = !!choix;

export function choisirLangue(code) {
  L = LANGUES[code];
  langueChoisie = true;
  try { localStorage.setItem(CLE, code); } catch (e) {}
}
