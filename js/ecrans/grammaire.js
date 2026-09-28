// Un point de grammaire : la fiche (le cours en 1 minute), puis 8 exercices.
import { $, echapper, melanger, jour } from "../util.js";
import { etat, gagnerXP } from "../store.js";
import { C, cartesDe } from "../contenu.js";
import { ajouterCartes } from "../srs.js";
import { depuisGrammaire } from "../exercices.js";
import { lancerLecon, ecranFin, etoilesHTML } from "../lecon.js";
import { app, ecrans, ouvrir } from "../nav.js";

ecrans.pointGrammaire = function (id, retour = "parcours") {
  const p = C.points[id];
  const fait = etat.grammaire[id];
  app.innerHTML = `<button class="retour-haut" id="retour">← ${retour === "revisions" ? "Révisions" : "Parcours"}</button>
    <div class="badge">${p.niveau} · LE COURS EN 1 MINUTE</div>
    <h1 class="titre-module">${p.ico} ${echapper(p.titre)}</h1>
    ${fait ? `<div class="grandes-etoiles petit">${etoilesHTML(fait.etoiles)}</div>` : ""}
    <div class="fiche">${p.fiche}</div>
    <div class="espace-bas"></div>
    <div class="bas-fixe"><button class="btn principal" id="go">${fait ? "Refaire les exercices" : "S'entraîner · 8 exercices"}</button></div>`;
  $("#retour").onclick = () => ouvrir(retour);
  $("#go").onclick = () => lancerLecon({
    titre: p.titre,
    exercices: melanger(p.items).map((it) => depuisGrammaire(it, id)),
    onQuitter: () => ouvrir("pointGrammaire", id, retour),
    onFin: (r) => {
      etat.grammaire[id] = { etoiles: Math.max(r.etoiles, fait?.etoiles || 0), date: jour() };
      ajouterCartes(cartesDe(id));
      const gain = fait ? 5 : 15 + (r.etoiles === 3 ? 5 : 0);
      gagnerXP(gain);
      ecranFin({ titre: "Point de grammaire terminé !", etoiles: r.etoiles, precision: r.precision, gain,
        messages: [r.etoiles < 3 ? "Refais ce point plus tard pour décrocher les 3 étoiles." : "Zéro faute, bravo !"],
        onContinuer: () => ouvrir(retour) });
    },
  });
};
