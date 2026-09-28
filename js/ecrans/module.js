// Un module des Fondations, en 4 étapes :
// 1. Découvrir (dialogue en contexte)  2. Comprendre (la règle)
// 3. S'entraîner (du plus facile au plus dur)  4. Produire (écrire sur soi)
import { $, $$, echapper, jour } from "../util.js";
import { parler, parlerSuite, silence } from "../voix.js";
import { etat, sauver, gagnerXP } from "../store.js";
import { C, cartesDe } from "../contenu.js";
import { ajouterCartes } from "../srs.js";
import { depuisJSON } from "../exercices.js";
import { lancerLecon, ecranFin } from "../lecon.js";
import { app, ecrans, ouvrir } from "../nav.js";

const ETAPES = ["Découvrir", "Comprendre", "S'entraîner", "Produire"];
let resultatEntrainement = null;

function cadre(m, etape, contenu, bas) {
  app.innerHTML = `<button class="retour-haut" id="retour">← Parcours</button>
    <div class="etapes">${ETAPES.map((e, i) => `<span class="${i === etape ? "active" : i < etape ? "faite" : ""}">${i + 1}. ${e}</span>`).join("")}</div>
    <div class="badge">${m.niveau} · MODULE ${C.fondations.indexOf(m) + 1}</div>
    <h1 class="titre-module">${m.ico} ${echapper(m.titre)}</h1>
    ${contenu}
    <div class="espace-bas"></div>
    <div class="bas-fixe">${bas}</div>`;
  $("#retour").onclick = () => { silence(); ouvrir("parcours"); };
  window.scrollTo(0, 0);
}

// Met en évidence, dans le dialogue, les formes étudiées dans le module
function surligner(texte, formes) {
  let html = echapper(texte);
  const motif = formes.slice().sort((a, b) => b.length - a.length).map((f) => echapper(f).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  if (!motif) return html;
  return html.replace(new RegExp(`(^|[^A-Za-z&#;'])(${motif})(?=[^A-Za-z']|$)`, "gi"), "$1<mark>$2</mark>");
}

ecrans.module = function (id) {
  const m = C.modules[id];
  const d = m.dialogue;
  cadre(m, 0, `
    <p class="muet">🎯 ${echapper(m.objectif)}</p>
    <div class="carte dialogue">
      <div class="ligne"><b>🎬 ${echapper(d.titre)}</b><button class="lien" id="tout">▶ Tout écouter</button></div>
      <p class="muet petit">${echapper(d.contexte)}</p>
      ${d.lignes.map(([qui, en, fr], i) => `<div class="replique" data-i="${i}">
        <button class="haut-parleur petit" data-dire="${i}" aria-label="Écouter">🔊</button>
        <div><small class="qui">${echapper(qui)}</small><div class="en">${surligner(en, d.surligner)}</div><div class="fr" hidden>${echapper(fr)}</div></div>
      </div>`).join("")}
      <button class="lien" id="traduire">👁 Afficher la traduction</button>
    </div>
    <p class="muet petit">Écoute le dialogue et repère les mots surlignés : essaie de deviner la règle avant de passer à l'étape suivante.</p>`,
    `<button class="btn principal" id="suite">J'ai lu le dialogue →</button>`);

  $$("[data-dire]").forEach((b) => (b.onclick = () => parler(d.lignes[+b.dataset.dire][1])));
  $("#tout").onclick = () => parlerSuite(d.lignes.map((l) => l[1]), (i) => {
    $$(".replique").forEach((r) => r.classList.toggle("lecture", +r.dataset.i === i));
  });
  $("#traduire").onclick = (ev) => {
    const cachees = $(".fr").hidden;
    $$(".fr").forEach((f) => (f.hidden = !cachees));
    ev.target.textContent = cachees ? "🙈 Masquer la traduction" : "👁 Afficher la traduction";
  };
  $("#suite").onclick = () => { silence(); comprendre(m); };
};

function comprendre(m) {
  cadre(m, 1, `<div class="fiche">${m.fiche}</div>`, `<button class="btn principal" id="suite">S'entraîner →</button>`);
  $("#suite").onclick = () => entrainer(m);
}

function entrainer(m) {
  lancerLecon({
    titre: m.titre,
    exercices: m.exercices.map((e) => depuisJSON(e, m.id)),
    onQuitter: () => ouvrir("module", m.id),
    onFin: (r) => { resultatEntrainement = r; produire(m, 0); },
  });
}

function produire(m, n) {
  const p = m.production[n];
  cadre(m, 3, `
    <div class="carte">
      <b>✍️ À toi d'écrire</b>
      <p>${echapper(p.consigne)}</p>
      <textarea id="texte" rows="4" placeholder="Écris en anglais…" spellcheck="false"></textarea>
    </div>
    <div id="comparaison"></div>
    <p class="muet petit">Écrire toi-même, c'est ce qui fait passer une règle de « je la connais » à « je sais l'utiliser ».</p>`,
    `<button class="btn principal" id="comparer" disabled>Comparer avec un modèle</button>`);
  const t = $("#texte");
  t.oninput = () => { $("#comparer").disabled = t.value.trim().length < 3; };
  $("#comparer").onclick = () => {
    t.disabled = true;
    etat.productions.push({ module: m.id, date: jour(), texte: t.value.trim() });
    sauver();
    $("#comparaison").innerHTML = `<div class="carte modele">
        <div class="ligne"><b>📝 Un exemple de réponse</b><button class="haut-parleur petit" id="hp">🔊</button></div>
        <p class="en">${echapper(p.modele)}</p>
        <b>Vérifie ta phrase :</b>
        ${p.verifs.map((v, i) => `<label class="verif"><input type="checkbox" id="v${i}"> ${echapper(v)}</label>`).join("")}
      </div>`;
    $("#hp").onclick = () => parler(p.modele);
    const dernier = n === m.production.length - 1;
    $(".bas-fixe").innerHTML = `<button class="btn principal" id="fin">${dernier ? "Terminer le module" : "Suivant"}</button>`;
    $("#fin").onclick = () => (dernier ? terminer(m) : produire(m, n + 1));
  };
}

function terminer(m) {
  const r = resultatEntrainement || { etoiles: 1, precision: 1 };
  const deja = etat.modules[m.id];
  etat.modules[m.id] = { etoiles: Math.max(r.etoiles, deja?.etoiles || 0), date: jour() };
  ajouterCartes(cartesDe(m.id));
  const gain = deja ? 10 : 30 + (r.etoiles === 3 ? 10 : 0);
  gagnerXP(gain);
  const suivant = C.fondations[C.fondations.indexOf(m) + 1];
  ecranFin({
    titre: "Module terminé !",
    etoiles: r.etoiles,
    precision: r.precision,
    gain,
    messages: [
      `🧠 ${cartesDe(m.id).length} formes ajoutées à tes révisions`,
      suivant ? `🔓 Module suivant : ${suivant.ico} ${echapper(suivant.titre)}` : "🎯 Fondations terminées : le test de positionnement est débloqué !",
    ],
    onContinuer: () => ouvrir("accueil"),
  });
}
