// Navigation entre les écrans + éléments communs (en-tête, barre du bas, raccourcis clavier).
import { $, $$ } from "./util.js";
import { etat, serieActive } from "./store.js";
import { jour } from "./util.js";

export const app = document.getElementById("app");
const nav = document.getElementById("nav");

// Chaque fichier d'écran s'enregistre ici : ecrans.accueil = fonction d'affichage…
export const ecrans = {};
const ONGLETS = ["accueil", "parcours", "revisions", "profil"];

export function ouvrir(nom, ...args) {
  raccourcis.touche = null;
  window.scrollTo(0, 0);
  if (ONGLETS.includes(nom)) {
    nav.hidden = false;
    $$("button", nav).forEach((b) => b.classList.toggle("actif", b.dataset.onglet === nom));
  } else {
    nav.hidden = true;
  }
  ecrans[nom](...args);
}

export const masquerNav = () => { nav.hidden = true; };

$$("button", nav).forEach((b) => (b.onclick = () => ouvrir(b.dataset.onglet)));

// En-tête affiché en haut des onglets principaux
export function entete() {
  const s = serieActive();
  const allumee = s && etat.dernierJour === jour();
  return `<header class="entete">
    <div class="logo-mini">🇬🇧 <b>English Coach</b></div>
    <div class="pastilles">
      <span class="pastille feu ${allumee ? "" : "eteint"}" title="Jours d'affilée">🔥 ${s}</span>
      <span class="pastille xp" title="Points d'expérience">⚡ ${etat.xp}</span>
    </div>
  </header>`;
}

/* Raccourcis clavier (sur ordinateur) : 1-4 pour choisir, Entrée pour valider.
   Chaque écran place sa fonction dans raccourcis.touche. */
export const raccourcis = { touche: null };
document.addEventListener("keydown", (ev) => {
  const dansChamp = ["TEXTAREA", "INPUT"].includes(document.activeElement?.tagName);
  if (ev.key === "Enter") {
    const v = document.getElementById("verifier");
    if (v && !v.disabled && !document.querySelector(".retour") && !dansChamp) { ev.preventDefault(); v.click(); return; }
    if (raccourcis.touche && !dansChamp) { ev.preventDefault(); raccourcis.touche("Enter"); }
  } else if (/^[1-9]$/.test(ev.key) && raccourcis.touche && !dansChamp) {
    raccourcis.touche(ev.key);
  }
});
