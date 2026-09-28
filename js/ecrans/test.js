// Test de positionnement : 6 questions par niveau (A1 → B2), sans correction pendant le test.
// Résultat : ton niveau, et la liste de ce que tu dois travailler en priorité.
import { $, $$, echapper, melanger, jour } from "../util.js";
import { etat, sauver, gagnerXP } from "../store.js";
import { C, titreDe, cartesDe } from "../contenu.js";
import { aRevoirMaintenant } from "../srs.js";
import { app, ecrans, ouvrir, raccourcis } from "../nav.js";
import { NIVEAUX, recommandations } from "../progression.js";
import { ouvrirElement } from "./accueil.js";
import { confirmer } from "../dialogue.js";

const SEUIL = 4; // bonnes réponses sur 6 pour valider un niveau
let questions = [], reponses = [];

ecrans.test = function () {
  app.innerHTML = `<button class="retour-haut" id="retour">← Parcours</button>
    <div class="intro-test">
      <div class="logo">🎯</div>
      <h1>Test de positionnement</h1>
      <p>24 questions, de plus en plus difficiles. Pas de correction pendant le test : réponds comme tu le sens.</p>
      <div class="astuce">💡 Si tu ne sais pas, choisis « Je ne sais pas » plutôt que de deviner : le résultat sera plus juste, et tes recommandations aussi.</div>
      ${etat.test ? `<p class="muet">Dernier résultat : niveau <b>${etat.test.niveau}</b> (${etat.test.date})</p>` : ""}
    </div>
    <div class="bas-fixe"><button class="btn principal" id="go">Commencer le test</button></div>`;
  $("#retour").onclick = () => ouvrir("parcours");
  $("#go").onclick = () => {
    questions = NIVEAUX.flatMap((n) => melanger(C.test.filter((q) => q.niveau === n.id)));
    reponses = [];
    question(0);
  };
};

function question(i) {
  if (i >= questions.length) return resultat();
  const q = questions[i];
  const ordre = melanger(q.options.map((o, k) => ({ o, k }))); // l'ordre des choix change à chaque fois
  app.innerHTML = `<div class="lecon-haut"><button class="fermer" id="quitter">✕</button>
      <div class="barre bleu"><i style="width:${(i / questions.length) * 100}%"></i></div><span class="muet">${i + 1} / ${questions.length}</span></div>
    <h2 class="consigne">Choisis la bonne réponse</h2>
    <div class="question"><div class="texte">${echapper(q.texte)}</div></div>
    <div class="options">
      ${ordre.map((x, i) => `<button class="option" data-k="${x.k}"><kbd>${i + 1}</kbd>${echapper(x.o)}</button>`).join("")}
      <button class="option discret" data-k="-1">🤷 Je ne sais pas</button>
    </div>`;
  $("#quitter").onclick = async () => { if (await confirmer("Quitter le test ? Tes réponses seront perdues.", "Quitter", true)) ouvrir("parcours"); };
  const repondre = (k) => { reponses[i] = k === q.bonne; question(i + 1); };
  $$(".option").forEach((b) => (b.onclick = () => repondre(+b.dataset.k)));
  raccourcis.touche = (k) => { if (+k <= ordre.length) repondre(ordre[+k - 1].k); };
}

function resultat() {
  raccourcis.touche = null;
  const scores = {};
  NIVEAUX.forEach((n) => (scores[n.id] = { ok: 0, total: 0 }));
  questions.forEach((q, i) => { scores[q.niveau].total++; if (reponses[i]) scores[q.niveau].ok++; });

  let niveau = "A1";
  for (const n of NIVEAUX) {
    if (scores[n.id].ok >= SEUIL) niveau = n.id; else break;
  }
  const manques = [...new Set(questions.filter((q, i) => !reponses[i]).map((q) => q.lien))];

  // Les modules des Fondations ratés reviennent tout de suite en révision
  aRevoirMaintenant(manques.filter((id) => C.modules[id]).flatMap(cartesDe));

  const premierTest = !etat.test;
  etat.test = { date: jour(), niveau, scores, manques };
  sauver();
  if (premierTest) gagnerXP(20);

  const recos = recommandations().slice(0, 6);
  const nomNiveau = NIVEAUX.find((n) => n.id === niveau).nom;
  app.innerHTML = `<div class="resultat-test">
      <div class="logo">🏅</div>
      <p class="muet">Ton niveau estimé</p>
      <div class="niveau-gros">${niveau}</div>
      <p class="petit-titre">${nomNiveau}</p>
      <div class="carte">
        ${NIVEAUX.map((n) => `<div class="ligne"><b>${n.id}</b><div class="barre ${scores[n.id].ok >= SEUIL ? "" : "or"}" style="flex:1;margin:0 12px"><i style="width:${(scores[n.id].ok / scores[n.id].total) * 100}%"></i></div><span class="muet">${scores[n.id].ok} / ${scores[n.id].total}</span></div>`).join("")}
      </div>
      ${manques.length ? `<div class="sous-titre">Points à retravailler</div><div class="puces">${manques.map((id) => `<span class="puce">${echapper(titreDe(id))}</span>`).join("")}</div>` : ""}
      <div class="sous-titre">🚀 Par quoi commencer</div>
      ${recos.map((id) => `<button class="element reco" data-id="${id}"><span class="flex"><b>${echapper(titreDe(id))}</b></span><span class="fleche">›</span></button>`).join("")}
      ${manques.some((id) => C.modules[id]) ? `<p class="muet petit">🔁 Les modules des Fondations concernés ont été remis dans tes révisions du jour.</p>` : ""}
    </div>
    <div class="espace-bas"></div>
    <div class="bas-fixe"><button class="btn principal" id="go">Voir mon parcours</button></div>`;
  $$("[data-id]").forEach((b) => (b.onclick = () => ouvrirElement(b.dataset.id)));
  $("#go").onclick = () => ouvrir("parcours");
}
