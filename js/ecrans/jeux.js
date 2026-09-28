// Les jeux : la machine à conjuguer et le défi chrono.
// Ils ne font réviser que ce que tu as déjà appris.
import { $, $$, echapper, hasard, melanger, verifierSaisie } from "../util.js";
import { etat, sauver, gagnerXP, noterErreur } from "../store.js";
import { C } from "../contenu.js";
import { conjuguer, SUJETS, TEMPS, NOMS_FORMES } from "../conjugaison.js";
import { app, ecrans, ouvrir, raccourcis } from "../nav.js";
import { moduleFini } from "../progression.js";

// Verbes d'état : jamais au présent en -ing
const ETATS = ["need", "want", "like", "know", "understand"];

/* =============== Machine à conjuguer =============== */
const MANCHES = 10;
let M = null;

ecrans.machine = function () {
  const temps = TEMPS.filter((t) => moduleFini(t.module));
  M = { temps, manche: 0, score: 0, combo: 0, bonnes: 0 };
  manche();
};

function tirage() {
  const t = hasard(M.temps);
  const forme = hasard(t.formes);
  const verbes = C.verbes.filter((v) => !(t.id === "continu" && ETATS.includes(v.base)));
  return { t, forme, v: hasard(verbes), s: hasard(SUJETS) };
}

function manche() {
  if (M.manche >= MANCHES) return finMachine();
  const q = tirage();
  const attendu = conjuguer(q.v, q.s, q.t.id, q.forme);
  app.innerHTML = `<div class="lecon-haut"><button class="fermer" id="quitter">✕</button>
      <div class="barre"><i style="width:${(M.manche / MANCHES) * 100}%"></i></div><span class="muet">${M.manche + 1} / ${MANCHES}</span></div>
    <div class="score-jeu"><span class="points">${M.score}</span><span class="combo">${M.combo >= 3 ? `🔥 x${multiplicateur()}` : M.combo ? `${M.combo} d'affilée` : ""}</span></div>
    <div class="machine">
      <div class="rouleau" id="r0"><small>sujet</small><b>…</b></div>
      <div class="rouleau" id="r1"><small>verbe</small><b>…</b></div>
      <div class="rouleau" id="r2"><small>temps</small><b>…</b></div>
      <div class="rouleau" id="r3"><small>forme</small><b>…</b></div>
    </div>
    <textarea id="saisie" rows="2" placeholder="Écris la phrase : sujet + verbe" disabled autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    <p class="muet petit centre">Exemple : she · work · négation → <i>She doesn't work</i></p>
    <div class="bas-fixe" id="bas"><button class="btn principal" id="verifier" disabled>Vérifier</button></div>`;
  $("#quitter").onclick = () => ouvrir("revisions");

  // Petite animation de « machine à sous » avant d'afficher le tirage
  const valeurs = [q.s.en, `to ${q.v.base}`, q.t.nom, NOMS_FORMES[q.forme]];
  const hasards = [SUJETS.map((s) => s.en), C.verbes.map((v) => "to " + v.base), M.temps.map((t) => t.nom), Object.values(NOMS_FORMES)];
  let tours = 0;
  const anim = setInterval(() => {
    if (!document.getElementById("r0")) return clearInterval(anim); // l'écran a été quitté
    tours++;
    valeurs.forEach((val, i) => {
      if (tours >= 4 + i * 3) { $(`#r${i} b`).textContent = val; $(`#r${i}`).classList.add("fixe"); }
      else $(`#r${i} b`).textContent = hasard(hasards[i]);
    });
    if (tours >= 13) {
      clearInterval(anim);
      $(`#r1`).insertAdjacentHTML("beforeend", `<small>${echapper(q.v.fr)}</small>`);
      const t = $("#saisie");
      t.disabled = false; t.focus();
      t.oninput = () => { $("#verifier").disabled = !t.value.trim(); };
      t.onkeydown = (ev) => { if (ev.key === "Enter") { ev.preventDefault(); if (!$("#verifier").disabled) verifier(); } };
    }
  }, 70);

  const verifier = () => {
    const t = $("#saisie");
    t.disabled = true;
    const ok = verifierSaisie(t.value, [attendu.phrase]).ok;
    if (ok) { M.score += 10 * multiplicateur(); M.combo++; M.bonnes++; }
    else { M.combo = 0; noterErreur(q.t.module); sauver(); }
    const bas = $("#bas");
    bas.className = "retour " + (ok ? "ok" : "ko");
    bas.innerHTML = `<div><h3>${ok ? "✅ Bien joué !" : "❌ Pas tout à fait…"}</h3>
      <div class="detail">${ok ? "" : `Bonne réponse : <b>${echapper(attendu.phrase)}</b>`}${attendu.astuce ? `<div class="expl">💡 ${echapper(attendu.astuce)}</div>` : ""}</div>
      <button class="btn ${ok ? "principal" : "rouge"}" id="continuer">Continuer</button></div>`;
    const suite = () => { M.manche++; manche(); };
    $("#continuer").onclick = suite;
    raccourcis.touche = (k) => { if (k === "Enter") suite(); };
  };
  $("#verifier").onclick = verifier;
}

const multiplicateur = () => Math.min(3, 1 + Math.floor(M.combo / 3));

function finMachine() {
  const record = M.score > etat.records.machine;
  if (record) etat.records.machine = M.score;
  const gain = Math.min(15, M.bonnes);
  if (gain) gagnerXP(gain); else sauver();
  ecranJeu({ titre: record && M.score ? "Nouveau record !" : "Partie terminée !", ico: record && M.score ? "🏆" : "🎰",
    score: M.score, detail: `${M.bonnes} / ${MANCHES}`, record: etat.records.machine, gain, rejouer: "machine" });
}

/* =============== Défi chrono =============== */
const DUREE = 60;
let D = null;

function questionsChrono() {
  const pool = [];
  C.fondations.filter((m) => moduleFini(m.id)).forEach((m) => m.exercices.forEach((e) => {
    if (e.type === "choix" && e.texte.includes("___")) pool.push({ texte: e.texte, options: e.options, bonne: e.bonne, expl: e.explication, tag: m.id });
  }));
  C.grammaire.filter((p) => etat.grammaire[p.id]).forEach((p) => p.items.forEach((it) => {
    if (it[0] === "q") pool.push({ texte: it[1], options: it[2], bonne: it[3], expl: it[4], tag: p.id });
  }));
  return pool;
}

ecrans.chrono = function () {
  const pool = questionsChrono();
  D = { pool, file: melanger(pool), fin: Date.now() + DUREE * 1000, score: 0, combo: 0, bonnes: 0, total: 0, fini: false };
  D.timer = setInterval(tictac, 100);
  questionChrono();
};

function tictac() {
  const reste = Math.max(0, D.fin - Date.now());
  const barre = $(".barre.temps");
  if (barre) {
    barre.querySelector("i").style.width = (reste / (DUREE * 1000)) * 100 + "%";
    barre.classList.toggle("urgent", reste < 10000);
    $(".chrono-temps").textContent = Math.ceil(reste / 1000) + " s";
  }
  if (reste <= 0) finChrono();
}

function questionChrono() {
  if (D.fini) return;
  if (!D.file.length) D.file = melanger(D.pool);
  const q = D.file.pop();
  const ordre = melanger(q.options.map((o, k) => ({ o, ok: k === q.bonne })));
  app.innerHTML = `<div class="lecon-haut"><button class="fermer" id="quitter">✕</button>
      <div class="barre temps"><i></i></div><span class="chrono-temps"></span></div>
    <div class="score-jeu"><span class="points">${D.score}</span><span class="combo">${D.combo >= 3 ? `🔥 x${Math.min(4, 1 + Math.floor(D.combo / 3))}` : D.combo ? `${D.combo} d'affilée` : ""}</span></div>
    <div class="question"><div class="texte">${echapper(q.texte)}</div></div>
    <div class="options">${ordre.map((x, k) => `<button class="option" data-ok="${x.ok ? 1 : 0}"><kbd>${k + 1}</kbd>${echapper(x.o)}</button>`).join("")}</div>
    <div id="info" class="muet expl-chrono"></div>`;
  tictac();
  $("#quitter").onclick = () => { clearInterval(D.timer); D.fini = true; ouvrir("revisions"); };
  const boutons = $$("[data-ok]");
  let bloque = false;
  const repondre = (b) => {
    if (bloque || D.fini) return;
    bloque = true;
    D.total++;
    const ok = b.dataset.ok === "1";
    b.classList.add(ok ? "bon" : "faux");
    if (ok) { D.score += 10 * Math.min(4, 1 + Math.floor(D.combo / 3)); D.combo++; D.bonnes++; }
    else {
      D.combo = 0;
      noterErreur(q.tag);
      boutons.find((x) => x.dataset.ok === "1").classList.add("bon");
      $("#info").textContent = "💡 " + (q.expl || "");
    }
    boutons.forEach((x) => (x.disabled = true));
    setTimeout(questionChrono, ok ? 350 : 1800);
  };
  boutons.forEach((b) => (b.onclick = () => repondre(b)));
  raccourcis.touche = (k) => { if (boutons[+k - 1]) repondre(boutons[+k - 1]); };
}

function finChrono() {
  if (D.fini) return;
  D.fini = true;
  clearInterval(D.timer);
  raccourcis.touche = null;
  const record = D.score > etat.records.chrono;
  if (record) etat.records.chrono = D.score;
  const gain = Math.min(20, D.bonnes);
  if (gain) gagnerXP(gain); else sauver();
  ecranJeu({ titre: record && D.score ? "Nouveau record !" : "Temps écoulé !", ico: record && D.score ? "🏆" : "⏱️",
    score: D.score, detail: `${D.bonnes} / ${D.total}`, record: etat.records.chrono, gain, rejouer: "chrono" });
}

function ecranJeu({ titre, ico, score, detail, record, gain, rejouer }) {
  app.innerHTML = `<div class="fin"><div class="gros">${ico}</div><h1>${titre}</h1>
      <div class="recap">
        <div class="tuile-recap or"><small>Score</small><b>${score}</b></div>
        <div class="tuile-recap vert"><small>Bonnes réponses</small><b>${detail}</b></div>
      </div>
      <p class="muet">🏆 Record : ${record} · ⚡ +${gain} XP</p></div>
    <div class="bas-fixe"><div><button class="btn principal" id="rejouer">Rejouer</button><button class="btn" id="sortir">Retour</button></div></div>`;
  $("#rejouer").onclick = () => ouvrir(rejouer);
  $("#sortir").onclick = () => ouvrir("revisions");
}
