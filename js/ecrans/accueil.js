// Accueil : où j'en suis, et la prochaine chose à faire.
import { $, echapper } from "../util.js";
import { etat, xpDuJour } from "../store.js";
import { C, titreDe } from "../contenu.js";
import { cartesDues, solide } from "../srs.js";
import { app, ecrans, ouvrir, entete } from "../nav.js";
import { nbModulesFinis, fondationsFinies, prochaineEtape, recommandations } from "../progression.js";

export function ouvrirElement(id) {
  if (C.modules[id]) return ouvrir("module", id);
  if (C.points[id]) return ouvrir("pointGrammaire", id);
  if (C.decks[id]) return ouvrir("deck", id);
}

ecrans.accueil = function () {
  const obj = etat.profil.objectif;
  const xpj = xpDuJour();
  const etape = prochaineEtape();
  const dues = cartesDues().length;
  const nbCartes = Object.keys(etat.cartes).length;
  const nbSolides = Object.keys(etat.cartes).filter(solide).length;
  const phase = !fondationsFinies() && !etat.test ? 1 : !etat.test ? 2 : 3;

  let prochaine;
  if (etape.type === "revisions") prochaine = { ico: "🔁", sur: "Révisions du jour", titre: `${etape.nb} carte${etape.nb > 1 ? "s" : ""} à revoir`, desc: "Révise avant d'apprendre du nouveau : c'est là que la mémoire se consolide." };
  else if (etape.type === "module") { const m = C.modules[etape.id]; prochaine = { ico: m.ico, sur: `Fondations · module ${C.fondations.indexOf(m) + 1} / ${C.fondations.length}`, titre: m.titre, desc: m.objectif }; }
  else if (etape.type === "test") prochaine = { ico: "🎯", sur: "Étape 2", titre: "Le test de positionnement", desc: "24 questions pour mesurer ton niveau et choisir tes priorités." };
  else if (etape.type === "reco") prochaine = { ico: "⭐", sur: "Recommandé pour toi", titre: titreDe(etape.id), desc: "Choisi d'après ton test de positionnement." };
  else prochaine = { ico: "🎮", sur: "Tout est à jour", titre: "Entraîne-toi en jouant", desc: "Machine à conjuguer ou défi chrono, dans l'onglet Révisions." };

  app.innerHTML = entete() + `
    <div class="carte">
      <div class="ligne"><span class="petit-titre">🎯 Objectif du jour</span><span class="muet">${Math.min(xpj, obj)} / ${obj} XP</span></div>
      <div class="barre or"><i style="width:${Math.min(100, (xpj / obj) * 100)}%"></i></div>
      ${xpj >= obj ? `<p class="muet petit">Objectif atteint, bravo ! 🎉</p>` : ""}
    </div>

    <button class="prochaine" id="prochaine">
      <span class="ico">${prochaine.ico}</span>
      <span class="flex"><small>${echapper(prochaine.sur)}</small><b>${echapper(prochaine.titre)}</b><span class="muet">${echapper(prochaine.desc)}</span></span>
      <span class="fleche">›</span>
    </button>

    <div class="sous-titre">Ton parcours</div>
    <div class="frise">
      <div class="phase ${phase > 1 ? "faite" : "active"}"><span>🧱</span><b>Fondations</b><small>${nbModulesFinis()} / ${C.fondations.length}</small></div>
      <div class="phase ${phase > 2 ? "faite" : phase === 2 ? "active" : ""}"><span>🎯</span><b>Test</b><small>${etat.test ? "Niveau " + etat.test.niveau : "à venir"}</small></div>
      <div class="phase ${phase === 3 ? "active" : ""}"><span>🚀</span><b>Parcours</b><small>${phase === 3 ? recommandations().length + " conseillés" : "verrouillé"}</small></div>
    </div>

    <div class="stats">
      <div class="stat"><span class="ico">🔁</span><div><b>${dues}</b><small>à réviser</small></div></div>
      <div class="stat"><span class="ico">🧠</span><div><b>${nbSolides} / ${nbCartes}</b><small>bien ancrés</small></div></div>
    </div>`;

  $("#prochaine").onclick = () => {
    if (etape.type === "revisions") return ouvrir("sessionRevision");
    if (etape.type === "module" || etape.type === "reco") return ouvrirElement(etape.id);
    if (etape.type === "test") return ouvrir("test");
    ouvrir("revisions");
  };
};
