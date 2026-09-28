// Profil : statistiques, objectif quotidien, sauvegarde et réglages.
import { $, $$ } from "../util.js";
import { etat, sauver, serieActive, exporter, importer, reinitialiser } from "../store.js";
import { C } from "../contenu.js";
import { solide } from "../srs.js";
import { app, ecrans, ouvrir, entete } from "../nav.js";
import { nbModulesFinis } from "../progression.js";
import { OBJECTIFS } from "./bienvenue.js";
import { syntheseDisponible } from "../voix.js";

ecrans.profil = function () {
  const cartes = Object.keys(etat.cartes);
  const mots = cartes.filter((id) => id.startsWith("v:")).length;
  app.innerHTML = entete() + `<h1 class="titre-page">👤 Profil</h1>
    <div class="stats">
      <div class="stat"><span class="ico">🔥</span><div><b>${serieActive()}</b><small>jours d'affilée</small></div></div>
      <div class="stat"><span class="ico">⚡</span><div><b>${etat.xp}</b><small>XP au total</small></div></div>
      <div class="stat"><span class="ico">🧱</span><div><b>${nbModulesFinis()} / ${C.fondations.length}</b><small>modules des Fondations</small></div></div>
      <div class="stat"><span class="ico">🎯</span><div><b>${etat.test ? etat.test.niveau : "—"}</b><small>niveau au test</small></div></div>
      <div class="stat"><span class="ico">📚</span><div><b>${mots}</b><small>mots appris</small></div></div>
      <div class="stat"><span class="ico">🧠</span><div><b>${cartes.filter(solide).length} / ${cartes.length}</b><small>cartes bien ancrées</small></div></div>
    </div>

    <div class="sous-titre">Objectif quotidien</div>
    <div class="grille deux">${OBJECTIFS.map((o) => `<button class="choix-carte ${o.xp === etat.profil.objectif ? "choisi" : ""}" data-xp="${o.xp}"><span><b>${o.nom}</b><small>${o.xp} XP · ${o.desc}</small></span></button>`).join("")}</div>

    <div class="sous-titre">Sauvegarde</div>
    <p class="muet petit">Ta progression est enregistrée dans ce navigateur. Exporte-la de temps en temps pour ne jamais la perdre, ou pour la transférer sur un autre appareil.</p>
    <button class="btn" id="exporter">⬇️ Exporter ma progression</button>
    <button class="btn" id="importer">⬆️ Importer une sauvegarde</button>
    <input type="file" id="fichier" accept="application/json,.json" hidden>

    ${!etat.test ? `<div class="sous-titre">Déjà à l'aise ?</div>
      <p class="muet petit">Si tu maîtrises déjà les bases, tu peux passer le test de positionnement sans finir les Fondations.</p>
      <button class="btn" id="test">🎯 Passer le test maintenant</button>` : ""}

    <div class="sous-titre">À propos</div>
    <p class="muet petit">${syntheseDisponible() ? "" : "⚠️ Ton navigateur ne propose pas de voix anglaise : la prononciation ne fonctionnera pas. "}
      Révision espacée : algorithme FSRS (<a href="https://github.com/open-spaced-repetition/ts-fsrs" target="_blank" rel="noopener">ts-fsrs</a>, licence MIT).</p>
    <div class="centre"><button class="lien rouge" id="reset">Tout remettre à zéro</button></div>`;

  $$("[data-xp]").forEach((b) => (b.onclick = () => { etat.profil.objectif = +b.dataset.xp; sauver(); ecrans.profil(); }));
  $("#exporter").onclick = exporter;
  $("#importer").onclick = () => $("#fichier").click();
  $("#fichier").onchange = async (ev) => {
    const f = ev.target.files[0];
    if (!f) return;
    try { await importer(f); alert("Sauvegarde importée !"); ouvrir("accueil"); }
    catch (e) { alert(e.message); }
  };
  $("#test")?.addEventListener("click", () => {
    if (confirm("Passer le test sans finir les Fondations ? Tu pourras toujours revenir aux modules.")) ouvrir("test");
  });
  $("#reset").onclick = () => {
    if (!confirm("Effacer toute ta progression ? Pense à l'exporter avant si tu veux la garder.")) return;
    reinitialiser();
    ouvrir("bienvenue");
  };
};
