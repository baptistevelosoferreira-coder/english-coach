// Premier lancement : choix de la langue, présentation du parcours et objectif quotidien.
// Contient aussi l'écran « Changer de langue ».
import { $, $$, echapper, jour } from "../util.js";
import { etat, sauver, chargerEtat } from "../store.js";
import { chargerContenu } from "../contenu.js";
import { choisirVoix } from "../voix.js";
import { L, LANGUES, choisirLangue, langueChoisie } from "../langue.js";
import { app, ecrans, ouvrir } from "../nav.js";

export const OBJECTIFS = [
  { xp: 20, nom: "Tranquille", desc: "≈ 5 min / jour" },
  { xp: 40, nom: "Régulier", desc: "≈ 10 min / jour" },
  { xp: 60, nom: "Sérieux", desc: "≈ 15 min / jour" },
  { xp: 90, nom: "Intensif", desc: "≈ 20 min / jour" },
];

let objectif = 40;

// Résumé de la progression d'une langue (lu directement dans sa sauvegarde)
function resume(langue) {
  try {
    const e = JSON.parse(localStorage.getItem(langue.cleStockage));
    if (e && e.profil) {
      const n = Object.keys(e.modules || {}).length;
      return `⚡ ${e.xp} XP · ${n} module${n > 1 ? "s" : ""} terminé${n > 1 ? "s" : ""}`;
    }
  } catch (e) { /* rien */ }
  return "Pas encore commencé";
}

ecrans.langues = function () {
  const premiere = !langueChoisie;
  app.innerHTML = `${premiere ? "" : `<button class="retour-haut" id="retour">← Retour</button>`}
    <div class="etape-onb">
      ${premiere ? `<div class="logo centre">🌍</div>` : ""}
      <h2>${premiere ? "Quelle langue veux-tu apprendre ?" : "Changer de langue"}</h2>
      <p class="muet">Chaque langue a sa propre progression : tu peux passer de l'une à l'autre sans rien perdre.</p>
      <div class="grille">${Object.values(LANGUES).map((l) => `<button class="choix-carte ${!premiere && l.code === L.code ? "choisi" : ""}" data-langue="${l.code}">
          <span class="drapeau">${l.drapeau}</span>
          <span class="flex"><b>${echapper(l.nom.charAt(0).toUpperCase() + l.nom.slice(1))}${l.code === "pt" ? " du Portugal" : ""}</b><small>${echapper(resume(l))}</small></span>
        </button>`).join("")}</div>
    </div>`;
  $("#retour")?.addEventListener("click", () => ouvrir("accueil"));
  $$("[data-langue]").forEach((b) => (b.onclick = async () => {
    b.disabled = true;
    choisirLangue(b.dataset.langue);
    chargerEtat();
    choisirVoix();
    await chargerContenu();
    ouvrir(etat.profil ? "accueil" : "bienvenue");
  }));
};

ecrans.bienvenue = function () {
  app.innerHTML = `<div class="intro">
      <div class="logo">${L.drapeau}</div>
      <h1>${echapper(L.appli)}</h1>
      <p class="muet grand">${echapper(L.intro.accroche)}</p>
      <ol class="etapes-intro">
        <li><b>🧱 Les Fondations</b><span>8 modules pour maîtriser les verbes et les temps essentiels.</span></li>
        <li><b>🎯 Le test de positionnement</b><span>Il mesure ton niveau et choisit ce que tu dois travailler.</span></li>
        <li><b>🚀 Ton parcours personnalisé</b><span>${echapper(L.intro.etape3)}</span></li>
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
