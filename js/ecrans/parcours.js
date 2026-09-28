// Onglet Parcours : les Fondations, le test, puis tout le reste une fois le test passé.
import { $$, echapper } from "../util.js";
import { etat } from "../store.js";
import { C } from "../contenu.js";
import { app, ecrans, ouvrir, entete } from "../nav.js";
import { etoilesHTML } from "../lecon.js";
import { ouvrirElement } from "./accueil.js";
import {
  moduleFini, moduleOuvert, nbModulesFinis, testOuvert, suiteOuverte,
  deckFini, estRecommande, rang, leconsDeck,
} from "../progression.js";

// Thèmes prévus pour la partie « vie quotidienne » (prochaine étape du projet)
const QUOTIDIEN_A_VENIR = ["✈️ À l'aéroport", "🚇 Transports", "🏨 À l'hôtel", "🍽️ Au restaurant", "🛒 Faire ses courses", "💊 Pharmacie & santé", "🆘 Urgences", "💬 Small talk"];

function carteElement(id, { ico, titre, sous, fini, ouvert = true, etoiles }) {
  const reco = !fini && estRecommande(id);
  return `<button class="element ${ouvert ? "" : "verrou"} ${reco ? "reco" : ""}" data-id="${id}" ${ouvert ? "" : "disabled"}>
    <span class="ico">${ouvert ? ico : "🔒"}</span>
    <span class="flex"><b>${echapper(titre)}</b><small>${echapper(sous)}</small></span>
    ${fini ? (etoiles ? etoilesHTML(etoiles) : "✅") : reco ? `<span class="badge-reco">Conseillé</span>` : ""}
  </button>`;
}

ecrans.parcours = function () {
  let html = entete() + `<h1 class="titre-page">🧭 Parcours</h1>`;

  // Étape 1
  html += `<div class="section"><div class="sous-titre">Étape 1 · 🧱 Les Fondations <span class="muet">${nbModulesFinis()} / ${C.fondations.length}</span></div>
    <p class="muet petit">Les verbes et les temps essentiels, dans l'ordre où on les acquiert naturellement.</p>`;
  C.fondations.forEach((m, i) => {
    html += carteElement(m.id, { ico: m.ico, titre: `${i + 1}. ${m.titre}`, sous: m.objectif, fini: moduleFini(m.id), ouvert: moduleOuvert(m.id), etoiles: etat.modules[m.id]?.etoiles });
  });
  html += `</div>`;

  // Étape 2
  html += `<div class="section"><div class="sous-titre">Étape 2 · 🎯 Test de positionnement</div>`;
  html += `<button class="element ${testOuvert() ? "" : "verrou"}" id="test" ${testOuvert() ? "" : "disabled"}>
      <span class="ico">${testOuvert() ? "🎯" : "🔒"}</span>
      <span class="flex"><b>${etat.test ? `Ton niveau : ${etat.test.niveau}` : "Mesurer mon niveau"}</b>
      <small>${etat.test ? "Tu peux le repasser pour mettre à jour tes recommandations" : testOuvert() ? "24 questions, environ 5 minutes" : "Se débloque à la fin des Fondations"}</small></span></button></div>`;

  // Étape 3
  const ouvert = suiteOuverte();
  html += `<div class="section"><div class="sous-titre">Étape 3 · 🚀 Ton parcours personnalisé</div>`;
  if (!ouvert) html += `<p class="muet petit">🔒 Se débloque après le test de positionnement : il choisira par quoi commencer.</p>`;

  C.parcoursVocab.forEach((col) => {
    html += `<div class="groupe"><h3>${col.ico} ${echapper(col.titre)}</h3><p class="muet petit">${echapper(col.description || "")}</p>`;
    col.decks.slice().sort((a, b) => rang(a.niveau) - rang(b.niveau)).forEach((d) => {
      const faites = Array.from({ length: leconsDeck(d) }, (_, n) => etat.decks[`${d.id}-${n}`]).filter(Boolean).length;
      html += carteElement(d.id, { ico: d.ico, titre: d.titre, sous: `${d.niveau} · ${d.mots.length} mots · ${faites} / ${leconsDeck(d)} leçons`, fini: deckFini(d), ouvert });
    });
    html += `</div>`;
  });

  html += `<div class="groupe"><h3>📘 Grammaire</h3><p class="muet petit">Un cours d'une minute + 8 exercices par point.</p>`;
  C.grammaire.slice().sort((a, b) => rang(a.niveau) - rang(b.niveau)).forEach((p) => {
    html += carteElement(p.id, { ico: p.ico, titre: p.titre, sous: `${p.niveau} · ${p.resume}`, fini: !!etat.grammaire[p.id], ouvert, etoiles: etat.grammaire[p.id]?.etoiles });
  });
  html += `</div>`;

  html += `<div class="groupe"><h3>🌍 Vie quotidienne UK / US</h3><p class="muet petit">Pour te débrouiller seul en Angleterre ou aux États-Unis. Prochaine étape du projet :</p>
    <div class="puces">${QUOTIDIEN_A_VENIR.map((t) => `<span class="puce">${t}</span>`).join("")}</div></div></div>`;

  app.innerHTML = html;
  $$("[data-id]").forEach((b) => (b.onclick = () => ouvrirElement(b.dataset.id)));
  const t = document.getElementById("test");
  if (t) t.onclick = () => ouvrir("test");
};
