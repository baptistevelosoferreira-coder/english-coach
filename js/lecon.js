// Le moteur de leçon : affiche les exercices un par un, corrige, explique,
// et remet à la fin de la leçon les questions ratées.
import { $, $$, echapper, hasard, melanger, verifierSaisie, normaliser } from "./util.js";
import { parler, silence } from "./voix.js";
import { noterErreur, sauver } from "./store.js";
import { noter } from "./srs.js";
import { app, masquerNav, raccourcis } from "./nav.js";

let L = null;

// Exercice affiché en ce moment (utilisé par les tests automatiques)
export const exerciceEnCours = () => (L && L.i < L.exos.length ? L.exos[L.i] : null);

/* options :
   titre, exercices,
   revision : true → chaque carte est notée dans la révision espacée (1re tentative seulement)
   onFin(resultat), onQuitter() */
export function lancerLecon(options) {
  const exos = options.exercices.filter(Boolean).map((e) => ({ ...e, tentative: 0 }));
  L = { ...options, exos, i: 0, n: exos.filter((e) => e.type !== "decouverte").length, reussis: 0, erreurs: 0 };
  masquerNav();
  afficher();
}

const aNoter = (e) => e.type !== "decouverte" && e.type !== "paires";

function afficher() {
  if (L.i >= L.exos.length) return terminer();
  const e = L.exos[L.i];
  app.innerHTML = `
    <div class="lecon-haut">
      <button class="fermer" id="quitter" aria-label="Quitter">✕</button>
      <div class="barre"><i style="width:${(L.reussis / Math.max(1, L.n)) * 100}%"></i></div>
    </div>
    ${e.type === "decouverte" ? "" : `<h2 class="consigne">${echapper(e.consigne)}</h2>`}
    <div id="corps"></div>
    <div class="bas-fixe" id="bas"><button class="btn principal" id="verifier" disabled>Vérifier</button></div>`;
  $("#quitter").onclick = () => {
    if (confirm("Quitter ? Ta progression dans cette leçon sera perdue.")) { silence(); L.onQuitter(); }
  };
  const btn = $("#verifier");
  let verifier = null;
  const pret = (fn) => { verifier = fn; btn.disabled = !fn; };
  btn.onclick = () => verifier && corriger(verifier());
  raccourcis.touche = null;
  RENDUS[e.type](e, $("#corps"), pret);
  window.scrollTo(0, 0);
}

/* ---------- Les différents types d'exercices ---------- */
const RENDUS = {
  decouverte(e, corps) {
    const w = e.mot;
    corps.innerHTML = `<div class="badge">✨ NOUVEAU</div>
      <div class="carte-mot">
        <div class="ligne-mot"><button class="haut-parleur" id="hp" aria-label="Écouter">🔊</button><div class="mot-en">${echapper(w.en)}</div></div>
        <div class="mot-fr">${echapper(w.fr)}</div>
        <div class="exemple-mot"><button class="haut-parleur petit" id="hp2" aria-label="Écouter la phrase">🔊</button>
          <div><div>${echapper(w.exEn)}</div><div class="muet">${echapper(w.exFr)}</div></div></div>
        ${w.note ? `<div class="astuce">💡 ${echapper(w.note)}</div>` : ""}
      </div>`;
    $("#hp").onclick = () => parler(w.en);
    $("#hp2").onclick = () => parler(w.exEn);
    setTimeout(() => parler(w.en), 250);
    const bas = $("#bas");
    bas.innerHTML = `<button class="btn principal" id="continuer">Continuer</button>`;
    const suite = () => { L.i++; afficher(); };
    $("#continuer").onclick = suite;
    raccourcis.touche = (k) => { if (k === "Enter") suite(); };
  },

  choix(e, corps, pret) {
    corps.innerHTML = `<div class="question">${e.audio ? `<button class="haut-parleur" id="hp" aria-label="Écouter">🔊</button>` : ""}
        <div><div class="texte">${echapper(e.texte)}</div>${e.sous ? `<div class="sous">${echapper(e.sous)}</div>` : ""}</div></div>
      <div class="options">${e.options.map((o, k) => `<button class="option" data-k="${k}"><kbd>${k + 1}</kbd>${echapper(o)}</button>`).join("")}</div>`;
    if (e.audio) { $("#hp").onclick = () => parler(e.audio); setTimeout(() => parler(e.audio), 250); }
    const boutons = $$(".option", corps);
    const choisir = (b) => {
      boutons.forEach((x) => x.classList.toggle("choisi", x === b));
      pret(() => {
        boutons.forEach((x) => (x.disabled = true));
        const ok = e.options[b.dataset.k] === e.bonne;
        b.classList.add(ok ? "bon" : "faux");
        if (!ok) boutons.find((x) => e.options[x.dataset.k] === e.bonne)?.classList.add("bon");
        return { ok, bonne: e.bonne };
      });
    };
    boutons.forEach((b) => (b.onclick = () => choisir(b)));
    raccourcis.touche = (k) => { const b = boutons[+k - 1]; if (b && !b.disabled) choisir(b); };
  },

  saisie(e, corps, pret) {
    corps.innerHTML = `<div class="question"><div><div class="texte">${echapper(e.texte)}</div>${e.sous ? `<div class="sous">${echapper(e.sous)}</div>` : ""}</div></div>
      <textarea id="saisie" rows="2" placeholder="Écris ta réponse en anglais" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>`;
    const t = $("#saisie");
    t.focus();
    t.oninput = () => pret(t.value.trim() ? () => {
      t.disabled = true;
      const r = verifierSaisie(t.value, e.reponses, e.tolerance);
      return { ok: r.ok, presque: r.presque, bonne: e.reponses[0], note: r.presque ? "Petite faute d'orthographe. On écrit : " + e.reponses[0] : null };
    } : null);
    t.onkeydown = (ev) => { if (ev.key === "Enter") { ev.preventDefault(); if (!$("#verifier").disabled) $("#verifier").click(); } };
  },

  erreur(e, corps, pret) {
    corps.innerHTML = `<div class="tuiles phrase-tuiles">${e.mots.map((m, k) => `<button class="tuile" data-k="${k}">${echapper(m)}</button>`).join("")}</div>`;
    const tuiles = $$(".tuile", corps);
    tuiles.forEach((b) => (b.onclick = () => {
      tuiles.forEach((x) => x.classList.toggle("choisi", x === b));
      pret(() => {
        tuiles.forEach((x) => (x.disabled = true));
        const ok = +b.dataset.k === e.k;
        b.classList.remove("choisi");
        b.classList.add(ok ? "bon" : "faux");
        if (!ok) tuiles[e.k].classList.add("bon");
        return { ok, bonne: `« ${e.mots[e.k].replace(/[.,!?]/g, "")} » → « ${e.correction} »` };
      });
    }));
  },

  vf(e, corps, pret) {
    corps.innerHTML = `<div class="question"><div class="texte">${echapper(e.texte)}</div></div>
      <div class="options"><button class="option" data-v="1"><kbd>1</kbd>✅ Oui, elle est correcte</button><button class="option" data-v="0"><kbd>2</kbd>❌ Non, il y a une faute</button></div>`;
    const boutons = $$(".option", corps);
    const choisir = (b) => {
      boutons.forEach((x) => x.classList.toggle("choisi", x === b));
      pret(() => {
        boutons.forEach((x) => (x.disabled = true));
        const ok = (b.dataset.v === "1") === e.vrai;
        b.classList.add(ok ? "bon" : "faux");
        return { ok, bonne: e.vrai ? "la phrase était correcte" : e.correction };
      });
    };
    boutons.forEach((b) => (b.onclick = () => choisir(b)));
    raccourcis.touche = (k) => { const b = boutons[+k - 1]; if (b && !b.disabled) choisir(b); };
  },

  ordre(e, corps, pret) {
    const choisis = [];
    corps.innerHTML = `<div class="question"><div class="texte petit">${echapper(e.texte)}</div></div>
      <div class="reponse-zone tuiles" id="zone"></div>
      <div class="tuiles" id="banque">${e.tuiles.map((m, k) => `<button class="tuile" data-k="${k}">${echapper(m)}</button>`).join("")}</div>`;
    const zone = $("#zone");
    const banque = $$("#banque .tuile");
    const maj = () => {
      zone.innerHTML = choisis.map((k) => `<button class="tuile" data-k="${k}">${echapper(e.tuiles[k])}</button>`).join("");
      $$(".tuile", zone).forEach((b) => (b.onclick = () => { choisis.splice(choisis.indexOf(+b.dataset.k), 1); maj(); }));
      banque.forEach((b) => b.classList.toggle("utilisee", choisis.includes(+b.dataset.k)));
      pret(choisis.length ? () => {
        $$(".tuile", corps).forEach((b) => (b.disabled = true));
        const tape = choisis.map((k) => e.tuiles[k]).join(" ");
        return { ok: normaliser(tape) === normaliser(e.mots.join(" ")), bonne: e.bonne };
      } : null);
    };
    banque.forEach((b) => (b.onclick = () => {
      if (choisis.includes(+b.dataset.k)) return;
      choisis.push(+b.dataset.k);
      parler(b.textContent);
      maj();
    }));
  },

  ecoute(e, corps, pret) {
    corps.innerHTML = `<button class="haut-parleur gros" id="hp" aria-label="Écouter">🔊</button>
      <div class="centre"><button class="lien" id="lent">🐢 Plus lentement</button></div>
      <textarea id="saisie" rows="2" placeholder="Écris ce que tu entends" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
      <div id="diff" class="diff"></div>`;
    $("#hp").onclick = () => parler(e.audio);
    $("#lent").onclick = () => parler(e.audio, true);
    setTimeout(() => parler(e.audio), 300);
    const t = $("#saisie");
    t.oninput = () => pret(t.value.trim() ? () => {
      t.disabled = true;
      const ok = verifierSaisie(t.value, e.reponses).ok;
      if (!ok) {
        // on montre mot par mot ce qui était juste
        const tapes = normaliser(t.value).split(" ");
        $("#diff").innerHTML = e.audio.split(" ").map((m, i) => `<span class="${normaliser(m) === tapes[i] ? "ok" : "ko"}">${echapper(m)}</span>`).join(" ");
      }
      return { ok, bonne: e.audio };
    } : null);
    t.onkeydown = (ev) => { if (ev.key === "Enter") { ev.preventDefault(); if (!$("#verifier").disabled) $("#verifier").click(); } };
  },

  paires(e, corps, pret) {
    const gauche = melanger(e.paires.map((p, i) => ({ t: p[0], i }))), droite = melanger(e.paires.map((p, i) => ({ t: p[1], i })));
    corps.innerHTML = `<div class="paires">
      <div class="colonne">${gauche.map((x) => `<button class="option" data-i="${x.i}" data-cote="g">${echapper(x.t)}</button>`).join("")}</div>
      <div class="colonne">${droite.map((x) => `<button class="option" data-i="${x.i}" data-cote="d">${echapper(x.t)}</button>`).join("")}</div></div>`;
    let sel = null, trouves = 0, fautes = 0;
    $$(".option", corps).forEach((b) => (b.onclick = () => {
      if (b.disabled) return;
      if (b.dataset.cote === "g") parler(b.textContent);
      if (!sel || sel.dataset.cote === b.dataset.cote) {
        sel?.classList.remove("choisi");
        sel = b; b.classList.add("choisi");
        return;
      }
      const a = sel; sel = null;
      a.classList.remove("choisi");
      if (a.dataset.i === b.dataset.i) {
        [a, b].forEach((x) => { x.classList.add("bon"); x.disabled = true; setTimeout(() => x.classList.add("valide"), 300); });
        if (++trouves === e.paires.length) corriger({ ok: true, paires: true, fautes });
      } else {
        fautes++;
        [a, b].forEach((x) => { x.classList.add("faux"); setTimeout(() => x.classList.remove("faux"), 450); });
      }
    }));
  },
};

/* ---------- Correction ---------- */
function corriger(r) {
  raccourcis.touche = null;
  const e = L.exos[L.i];
  e.tentative++;
  if (r.ok) L.reussis++;
  else {
    L.erreurs++;
    noterErreur(e.tag);
    L.exos.push({ ...e }); // la question reviendra à la fin de la leçon
  }
  if (r.paires && r.fautes) L.erreurs += Math.min(r.fautes, 2);
  if (L.revision && e.carte && e.tentative === 1) noter(e.carte, !r.ok ? "faux" : r.presque ? "presque" : "juste");
  sauver();

  const exemple = e.exemple;
  const bravo = hasard(["Excellent !", "Bravo !", "Parfait !", "Super !", "Bien joué !"]);
  const bas = $("#bas");
  bas.className = "retour " + (r.ok ? "ok" : "ko");
  bas.innerHTML = `<div>
      <h3>${r.ok ? (r.presque ? "Presque !" : "✅ " + bravo) : "❌ Pas tout à fait…"}</h3>
      <div class="detail">
        ${r.note ? echapper(r.note) : !r.ok ? "Bonne réponse : <b>" + echapper(r.bonne) + "</b>" : ""}
        ${e.explication ? `<div class="expl">💡 ${echapper(e.explication)}</div>` : ""}
        ${exemple ? `<div class="expl"><i>${echapper(exemple.exEn)}</i> — ${echapper(exemple.exFr)}</div>` : ""}
      </div>
      <button class="btn ${r.ok ? "principal" : "rouge"}" id="continuer">Continuer</button></div>`;
  $(".lecon-haut .barre i").style.width = (L.reussis / Math.max(1, L.n)) * 100 + "%";
  const suite = () => { L.i++; afficher(); };
  $("#continuer").onclick = suite;
  raccourcis.touche = (k) => { if (k === "Enter") suite(); };
}

function terminer() {
  silence();
  const total = L.reussis + L.erreurs;
  const precision = total ? L.reussis / total : 1;
  const etoiles = precision >= 0.95 ? 3 : precision >= 0.8 ? 2 : 1;
  L.onFin({ reussis: L.reussis, erreurs: L.erreurs, precision, etoiles });
}

export const etoilesHTML = (n) => `<span class="etoiles">${"★".repeat(n)}<span class="vide">${"★".repeat(3 - n)}</span></span>`;

// Écran de fin commun à toutes les leçons
export function ecranFin({ titre, etoiles, precision, gain, messages = [], onContinuer }) {
  app.innerHTML = `<div class="fin">
      <div class="gros">${etoiles === 3 ? "🏆" : "🎉"}</div>
      <h1>${echapper(titre)}</h1>
      ${etoiles ? `<div class="grandes-etoiles">${etoilesHTML(etoiles)}</div>` : ""}
      <div class="recap">
        <div class="tuile-recap or"><small>XP gagnés</small><b>⚡ ${gain}</b></div>
        <div class="tuile-recap vert"><small>Précision</small><b>🎯 ${Math.round(precision * 100)} %</b></div>
      </div>
      ${messages.map((m) => `<p class="petit-titre">${m}</p>`).join("")}
    </div>
    <div class="bas-fixe"><button class="btn principal" id="continuer">Continuer</button></div>`;
  $("#continuer").onclick = onContinuer;
  raccourcis.touche = (k) => { if (k === "Enter") onContinuer(); };
}
