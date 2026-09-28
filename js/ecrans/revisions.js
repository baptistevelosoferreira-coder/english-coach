// Onglet Révisions : la séance de révision espacée, les jeux et le carnet d'erreurs.
import { $, $$, echapper } from "../util.js";
import { etat, gagnerXP } from "../store.js";
import { C, titreDe } from "../contenu.js";
import { cartesDues, prochaineRevision } from "../srs.js";
import { exerciceDeCarte } from "../exercices.js";
import { lancerLecon, ecranFin } from "../lecon.js";
import { app, ecrans, ouvrir, entete } from "../nav.js";
import { moduleFini } from "../progression.js";
import { L } from "../langue.js";

const MAX_SEANCE = 25;

ecrans.revisions = function () {
  const dues = cartesDues();
  const prochaine = prochaineRevision();
  const carnet = Object.entries(etat.erreurs).filter(([id]) => C.modules[id] || C.points[id] || C.decks[id]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const premierTemps = L.conj.TEMPS[0].module;
  const machineOuverte = moduleFini(premierTemps), chronoOuvert = moduleFini(C.fondations[0].id);

  app.innerHTML = entete() + `<h1 class="titre-page">🔁 Révisions</h1>
    <div class="carte revision-du-jour">
      ${dues.length
        ? `<div class="gros-chiffre">${dues.length}</div><p>carte${dues.length > 1 ? "s" : ""} à réviser aujourd'hui</p>
           <button class="btn principal" id="go">Réviser${dues.length > MAX_SEANCE ? ` (${MAX_SEANCE} pour commencer)` : ""}</button>`
        : `<div class="gros-chiffre">✅</div><p>Rien à réviser pour l'instant.</p>
           <p class="muet petit">${prochaine ? "Prochaine révision : " + prochaine.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "Termine un module pour remplir tes révisions."}</p>`}
    </div>
    <p class="muet petit">Chaque carte revient juste avant que tu l'oublies : d'abord après quelques jours, puis de plus en plus espacée. Une erreur la fait revenir plus vite.</p>

    <div class="sous-titre">🎮 S'entraîner en jouant</div>
    <button class="jeu ${machineOuverte ? "" : "verrou"}" id="machine" ${machineOuverte ? "" : "disabled"}>
      <span class="ico">🎰</span><span class="flex"><b>Machine à conjuguer</b><small>${machineOuverte ? `Un sujet, un verbe, un temps : à toi de conjuguer ! Record : ${etat.records.machine}` : `Se débloque avec le module ${C.fondations.findIndex((m) => m.id === premierTemps) + 1}`}</small></span></button>
    <button class="jeu chaud ${chronoOuvert ? "" : "verrou"}" id="chrono" ${chronoOuvert ? "" : "disabled"}>
      <span class="ico">⚡</span><span class="flex"><b>Défi chrono</b><small>${chronoOuvert ? `60 secondes, un max de bonnes réponses. Record : ${etat.records.chrono}` : "Se débloque avec le module 1"}</small></span></button>

    <div class="sous-titre">📓 Carnet d'erreurs</div>
    ${carnet.length
      ? `<p class="muet petit">Les règles sur lesquelles tu te trompes le plus. Touche-en une pour revoir le cours.</p>` +
        carnet.map(([id, n]) => `<button class="element" data-id="${id}"><span class="flex"><b>${echapper(titreDe(id))}</b></span><span class="compteur">${n} erreur${n > 1 ? "s" : ""}</span></button>`).join("")
      : `<p class="muet petit">Vide pour l'instant. Tes erreurs seront notées ici, règle par règle.</p>`}`;

  $("#go")?.addEventListener("click", () => ouvrir("sessionRevision"));
  $("#machine").onclick = () => ouvrir("machine");
  $("#chrono").onclick = () => ouvrir("chrono");
  $$("[data-id]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.id;
    if (C.points[id]) ouvrir("pointGrammaire", id, "revisions");
    else if (C.modules[id]) ouvrir("module", id);
    else ouvrir("deck", id);
  }));
};

ecrans.sessionRevision = function () {
  const ids = cartesDues().slice(0, MAX_SEANCE);
  if (!ids.length) return ouvrir("revisions");
  lancerLecon({
    titre: "Révisions",
    revision: true,
    exercices: ids.map((id) => exerciceDeCarte(id, etat.cartes[id])),
    onQuitter: () => ouvrir("revisions"),
    onFin: (r) => {
      const gain = Math.min(25, ids.length);
      gagnerXP(gain);
      const restantes = cartesDues().length;
      ecranFin({
        titre: "Révisions terminées !",
        etoiles: 0,
        precision: r.precision,
        gain,
        messages: [restantes ? `Il reste ${restantes} carte${restantes > 1 ? "s" : ""} à revoir aujourd'hui.` : "Tout est à jour 👏 Les cartes reviendront au bon moment."],
        onContinuer: () => ouvrir("revisions"),
      });
    },
  });
};
