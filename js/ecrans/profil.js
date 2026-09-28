// Profil : statistiques, objectif quotidien, sauvegarde et réglages.
import { $, $$ } from "../util.js";
import { etat, sauver, serieActive, exporter, importer, importerTexte, texteSauvegarde, reinitialiser } from "../store.js";
import { confirmer, informer } from "../dialogue.js";
import { C } from "../contenu.js";
import { solide } from "../srs.js";
import { app, ecrans, ouvrir, entete } from "../nav.js";
import { nbModulesFinis } from "../progression.js";
import { OBJECTIFS } from "./bienvenue.js";
import { syntheseDisponible, voixTrouvee } from "../voix.js";
import { L } from "../langue.js";

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

    <div class="sous-titre">Langue étudiée</div>
    <button class="element" data-aller-langue><span class="ico">${L.drapeau}</span><span class="flex"><b>${L.nom.charAt(0).toUpperCase() + L.nom.slice(1)}</b><small>Toucher pour changer de langue (chaque langue garde sa progression)</small></span><span class="fleche">›</span></button>

    <div class="sous-titre">Objectif quotidien</div>
    <div class="grille deux">${OBJECTIFS.map((o) => `<button class="choix-carte ${o.xp === etat.profil.objectif ? "choisi" : ""}" data-xp="${o.xp}"><span><b>${o.nom}</b><small>${o.xp} XP · ${o.desc}</small></span></button>`).join("")}</div>

    <div class="sous-titre">Sauvegarde</div>
    <p class="muet petit">Ta progression est enregistrée dans ce navigateur. Exporte-la de temps en temps pour ne jamais la perdre, ou pour la transférer sur un autre appareil.</p>
    <button class="btn" id="exporter">⬇️ Exporter ma progression</button>
    <div id="zone-export" class="carte zone-sauvegarde" hidden>
      <p class="petit">Copie ce texte et garde-le (dans tes notes, un e-mail…). Tu pourras le recoller ici pour retrouver ta progression.</p>
      <textarea id="texte-export" rows="4" readonly></textarea>
      <div class="rangee"><button class="btn principal" id="copier">Copier</button><button class="btn" id="telecharger">Télécharger le fichier</button></div>
    </div>
    <button class="btn" id="importer">⬆️ Importer une sauvegarde</button>
    <div id="zone-import" class="carte zone-sauvegarde" hidden>
      <p class="petit">Colle le texte de ta sauvegarde, ou choisis le fichier exporté.</p>
      <textarea id="texte-import" rows="4" placeholder="Colle ta sauvegarde ici"></textarea>
      <div class="rangee"><button class="btn principal" id="importer-texte">Importer le texte</button><button class="btn" id="choisir-fichier">Choisir un fichier</button></div>
      <input type="file" id="fichier" accept="application/json,.json" hidden>
    </div>

    ${!etat.test ? `<div class="sous-titre">Déjà à l'aise ?</div>
      <p class="muet petit">Si tu maîtrises déjà les bases, tu peux passer le test de positionnement sans finir les Fondations.</p>
      <button class="btn" id="test">🎯 Passer le test maintenant</button>` : ""}

    <div class="sous-titre">À propos</div>
    <p class="muet petit">${!syntheseDisponible() ? "⚠️ Ton navigateur ne sait pas lire à voix haute : la prononciation ne fonctionnera pas. " : voixTrouvee() ? "" : `⚠️ Aucune voix ${L.adjectif} trouvée sur cet appareil : la prononciation risque d'être approximative. `}
      Révision espacée : algorithme FSRS (<a href="https://github.com/open-spaced-repetition/ts-fsrs" target="_blank" rel="noopener">ts-fsrs</a>, licence MIT).</p>
    <div class="centre"><button class="lien rouge" id="reset">Tout remettre à zéro</button></div>`;

  $$("[data-xp]").forEach((b) => (b.onclick = () => { etat.profil.objectif = +b.dataset.xp; sauver(); ecrans.profil(); }));
  $("#exporter").onclick = () => {
    $("#zone-export").hidden = !$("#zone-export").hidden;
    $("#texte-export").value = texteSauvegarde();
  };
  $("#copier").onclick = async () => {
    const t = $("#texte-export");
    try { await navigator.clipboard.writeText(t.value); $("#copier").textContent = "Copié ✓"; }
    catch (e) { t.focus(); t.select(); $("#copier").textContent = "Texte sélectionné"; }
  };
  $("#telecharger").onclick = exporter;
  $("#importer").onclick = () => { $("#zone-import").hidden = !$("#zone-import").hidden; };
  $("#choisir-fichier").onclick = () => $("#fichier").click();
  const apresImport = async (action) => {
    try { await action(); await informer("Sauvegarde importée !"); ouvrir("accueil"); }
    catch (e) { informer(e.message); }
  };
  $("#importer-texte").onclick = () => apresImport(() => importerTexte($("#texte-import").value));
  $("#fichier").onchange = (ev) => { const f = ev.target.files[0]; if (f) apresImport(() => importer(f)); };
  $("#test")?.addEventListener("click", async () => {
    if (await confirmer("Passer le test sans finir les Fondations ? Tu pourras toujours revenir aux modules.", "Passer le test")) ouvrir("test");
  });
  $("#reset").onclick = async () => {
    if (!(await confirmer("Effacer toute ta progression ? Pense à l'exporter avant si tu veux la garder.", "Tout effacer", true))) return;
    reinitialiser();
    ouvrir("bienvenue");
  };
};
