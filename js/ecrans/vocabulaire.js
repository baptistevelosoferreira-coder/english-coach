// Un thème de vocabulaire : des leçons de 6 mots, puis les mots rejoignent les révisions.
import { $, $$, echapper, jour } from "../util.js";
import { parler } from "../voix.js";
import { etat, gagnerXP } from "../store.js";
import { C } from "../contenu.js";
import { ajouterCartes, solide } from "../srs.js";
import { leconVocab } from "../exercices.js";
import { lancerLecon, ecranFin, etoilesHTML } from "../lecon.js";
import { app, ecrans, ouvrir } from "../nav.js";
import { leconsDeck } from "../progression.js";

const TAILLE = 6;

ecrans.deck = function (id) {
  const d = C.decks[id];
  const col = C.parcoursVocab.find((c) => c.id === d.collection);
  const lecons = Array.from({ length: leconsDeck(d) }, (_, n) => ({ n, mots: d.mots.slice(n * TAILLE, (n + 1) * TAILLE), fait: etat.decks[`${d.id}-${n}`] }));
  const appris = lecons.filter((l) => l.fait).flatMap((l) => l.mots);

  app.innerHTML = `<button class="retour-haut" id="retour">← Parcours</button>
    <div class="badge">${d.niveau} · ${echapper(col.titre.toUpperCase())}</div>
    <h1 class="titre-module">${d.ico} ${echapper(d.titre)}</h1>
    ${lecons.map((l, i) => {
      const ouverte = i === 0 || lecons[i - 1].fait;
      return `<button class="element ${ouverte ? "" : "verrou"}" data-n="${l.n}" ${ouverte ? "" : "disabled"}>
        <span class="ico">${ouverte ? (l.fait ? "✅" : "📖") : "🔒"}</span>
        <span class="flex"><b>Leçon ${l.n + 1}</b><small>${l.mots.map((w) => echapper(w.en)).join(" · ")}</small></span>
        ${l.fait ? etoilesHTML(l.fait.etoiles) : ""}</button>`;
    }).join("")}
    <div class="sous-titre">Mots appris (${appris.length} / ${d.mots.length})</div>
    <div class="carte liste-mots">${appris.length ? appris.map((w) => `<div class="mot-ligne">
        <button class="haut-parleur petit" data-dire="${echapper(w.en)}" aria-label="Écouter">🔊</button>
        <div class="flex"><b>${echapper(w.en)}</b><span class="muet">${echapper(w.fr)}</span></div>
        <span title="${solide(w.id) ? "Bien ancré" : "En cours d'apprentissage"}">${solide(w.id) ? "🧠" : "🌱"}</span></div>`).join("")
      : `<p class="muet">Termine une leçon pour voir tes mots ici.</p>`}</div>`;

  $("#retour").onclick = () => ouvrir("parcours");
  $$("[data-dire]").forEach((b) => (b.onclick = () => parler(b.dataset.dire)));
  $$("[data-n]").forEach((b) => (b.onclick = () => {
    const l = lecons[+b.dataset.n];
    lancerLecon({
      titre: d.titre,
      exercices: leconVocab(l.mots),
      onQuitter: () => ouvrir("deck", id),
      onFin: (r) => {
        const cle = `${d.id}-${l.n}`;
        const deja = etat.decks[cle];
        etat.decks[cle] = { etoiles: Math.max(r.etoiles, deja?.etoiles || 0), date: jour() };
        ajouterCartes(l.mots.map((w) => w.id));
        const gain = deja ? 5 : 15 + (r.etoiles === 3 ? 5 : 0);
        gagnerXP(gain);
        ecranFin({ titre: "Leçon terminée !", etoiles: r.etoiles, precision: r.precision, gain,
          messages: [`🧠 ${l.mots.length} mots ajoutés à tes révisions`], onContinuer: () => ouvrir("deck", id) });
      },
    });
  }));
};
