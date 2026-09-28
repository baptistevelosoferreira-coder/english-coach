// Premier lancement : présentation du parcours et choix de l'objectif quotidien.
import { $, $$ } from "../util.js";
import { etat, sauver } from "../store.js";
import { app, ecrans, ouvrir } from "../nav.js";
import { jour } from "../util.js";

export const OBJECTIFS = [
  { xp: 20, nom: "Tranquille", desc: "≈ 5 min / jour" },
  { xp: 40, nom: "Régulier", desc: "≈ 10 min / jour" },
  { xp: 60, nom: "Sérieux", desc: "≈ 15 min / jour" },
  { xp: 90, nom: "Intensif", desc: "≈ 20 min / jour" },
];

let objectif = 40;

ecrans.bienvenue = function () {
  app.innerHTML = `<div class="intro">
      <div class="logo">🇬🇧</div>
      <h1>English Coach</h1>
      <p class="muet grand">Reprends l'anglais sur des bases solides, un peu chaque jour.</p>
      <ol class="etapes-intro">
        <li><b>🧱 Les Fondations</b><span>8 modules pour maîtriser les verbes et les temps essentiels.</span></li>
        <li><b>🎯 Le test de positionnement</b><span>Il mesure ton niveau et choisit ce que tu dois travailler.</span></li>
        <li><b>🚀 Ton parcours personnalisé</b><span>Vocabulaire essentiel, grammaire, anglais pro, puis vie quotidienne.</span></li>
      </ol>
      <p class="muet petit">Tout ce que tu apprends revient en révision juste avant que tu l'oublies : c'est la méthode la plus efficace pour retenir sur le long terme.</p>
    </div>
    <div class="bas-fixe"><button class="btn principal" id="go">C'est parti</button></div>`;
  $("#go").onclick = choisirObjectif;
};

function choisirObjectif() {
  app.innerHTML = `<div class="etape-onb"><h2>Combien de temps par jour ?</h2>
      <p class="muet">La régularité compte plus que la durée : mieux vaut 10 minutes tous les jours qu'une heure le dimanche.</p>
      <div class="grille">${OBJECTIFS.map((o) => `<button class="choix-carte ${o.xp === objectif ? "choisi" : ""}" data-xp="${o.xp}"><span class="flex"><b>${o.nom}</b></span><small>${o.desc}</small></button>`).join("")}</div></div>
    <div class="bas-fixe"><button class="btn principal" id="go">Commencer</button></div>`;
  $$("[data-xp]").forEach((b) => (b.onclick = () => { objectif = +b.dataset.xp; choisirObjectif(); }));
  $("#go").onclick = () => {
    etat.profil = { objectif, debut: jour() };
    sauver();
    ouvrir("accueil");
  };
}
