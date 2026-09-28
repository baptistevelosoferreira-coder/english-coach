// Point d'entrée : charge le contenu, enregistre les écrans et ouvre le bon écran.
import { chargerContenu } from "./contenu.js";
import { etat } from "./store.js";
import { app, ouvrir } from "./nav.js";
import "./ecrans/bienvenue.js";
import "./ecrans/accueil.js";
import "./ecrans/parcours.js";
import "./ecrans/module.js";
import "./ecrans/test.js";
import "./ecrans/vocabulaire.js";
import "./ecrans/grammaire.js";
import "./ecrans/revisions.js";
import "./ecrans/jeux.js";
import "./ecrans/profil.js";

async function demarrer() {
  try {
    await chargerContenu();
  } catch (e) {
    app.innerHTML = `<div class="intro"><div class="logo">⚠️</div><h1>Impossible de charger le contenu</h1>
      <p class="muet">${location.protocol === "file:"
        ? "L'appli doit être ouverte via un serveur web (GitHub Pages, ou « python3 -m http.server » en local), pas en double-cliquant sur le fichier."
        : "Vérifie ta connexion internet puis recharge la page."}</p></div>`;
    console.error(e);
    return;
  }
  ouvrir(etat.profil ? "accueil" : "bienvenue");
}

demarrer();

// Mode hors connexion : le « service worker » garde une copie de l'appli sur l'appareil
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
