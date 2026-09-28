// Analyse d'un texte écrit par l'utilisateur.
// 1) Sur claude.ai : la page demande à Claude une correction détaillée, expliquée en français.
// 2) Ailleurs (GitHub Pages…) : correcteur libre LanguageTool (https://languagetool.org).
// 3) Sans connexion : aucune analyse, on garde le modèle et la liste de vérification.
import { C } from "./contenu.js";
import { L } from "./langue.js";

let claudeSample; // promesse mémorisée : la fonction d'appel à Claude, ou null
function fonctionClaude() {
  if (claudeSample === undefined) {
    claudeSample = window.claude?.use ? window.claude.use("sample").catch(() => null) : Promise.resolve(null);
  }
  return claudeSample;
}

// Liste des règles connues : Claude y rattache chaque erreur, pour alimenter le carnet d'erreurs
function reglesConnues() {
  return [
    ...C.fondations.map((m) => `${m.id} = ${m.titre}`),
    ...C.grammaire.map((p) => `${p.id} = ${p.titre}`),
  ].join("\n");
}

function consigneClaude({ texte, consigne, theme }) {
  return `Tu es un professeur ${L.de} bienveillant et précis. Ton élève est francophone et apprend ${L.le} depuis les bases.
Il a écrit un court texte ${L.en} pour répondre à cette consigne : « ${consigne} »
${L.consigneAnalyse}
${theme ? `Le point de grammaire travaillé est : ${theme}.` : ""}

Texte de l'élève (entre les balises) :
<texte>
${texte.slice(0, 3000)}
</texte>

Analyse ce texte et réponds UNIQUEMENT avec un objet JSON de cette forme :
{
  "note": 7,
  "niveau": "A2",
  "resume": "Une phrase en français qui résume la qualité du texte.",
  "points_forts": ["ce qui est réussi, en français, 1 à 3 éléments"],
  "corrections": [
    {"original": "extrait fautif copié exactement du texte", "correction": "la forme correcte", "explication": "pourquoi, en français, en une phrase simple", "regle": "f2"}
  ],
  "version_corrigee": "le texte entier corrigé, en gardant les idées et le style de l'élève",
  "conseil": "un conseil concret en français pour progresser"
}

Règles :
- "note" : entier de 0 à 10 ; "niveau" : A1, A2, B1, B2 ou C1 selon le texte.
- Corrige seulement les vraies erreurs (grammaire, conjugaison, vocabulaire, orthographe, tournure pas naturelle). Au plus 8 corrections, les plus importantes d'abord. Si tout est juste, "corrections" est une liste vide.
- "regle" : l'identifiant de la règle concernée dans la liste ci-dessous, ou null si aucune ne correspond.
- Si le texte n'est pas ${L.en} ou ne répond pas à la consigne, dis-le dans "resume" et mets une note de 3 au maximum.
- Sois encourageant mais honnête.

Règles possibles :
${reglesConnues()}`;
}

async function analyseClaude(sample, demande, signal) {
  const r = await sample.json(consigneClaude(demande), { signal });
  if (!r || typeof r !== "object") throw { code: "invalid_json" };
  const regles = new Set([...C.fondations.map((m) => m.id), ...C.grammaire.map((p) => p.id)]);
  return {
    source: "claude",
    note: Number.isFinite(+r.note) ? Math.max(0, Math.min(10, Math.round(+r.note))) : null,
    niveau: typeof r.niveau === "string" ? r.niveau : null,
    resume: String(r.resume || ""),
    pointsForts: Array.isArray(r.points_forts) ? r.points_forts.map(String).slice(0, 4) : [],
    corrections: (Array.isArray(r.corrections) ? r.corrections : []).slice(0, 8).map((c) => ({
      original: String(c.original || ""),
      correction: String(c.correction || ""),
      explication: String(c.explication || ""),
      regle: regles.has(c.regle) ? c.regle : null,
    })),
    versionCorrigee: String(r.version_corrigee || ""),
    conseil: String(r.conseil || ""),
  };
}

async function analyseLanguageTool(texte, signal) {
  const rep = await fetch("https://api.languagetool.org/v2/check", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ text: texte, language: L.languageTool, motherTongue: "fr" }),
    signal,
  });
  if (!rep.ok) throw new Error("LanguageTool indisponible");
  const { matches = [] } = await rep.json();
  const corrections = matches.slice(0, 10).map((m) => ({
    debut: m.offset,
    fin: m.offset + m.length,
    original: texte.slice(m.offset, m.offset + m.length),
    correction: m.replacements?.[0]?.value ?? "",
    explication: m.message,
    regle: null,
  }));
  // Version corrigée : on applique les premières suggestions, de la fin vers le début
  let corrige = texte;
  [...corrections].sort((a, b) => b.debut - a.debut).forEach((c) => {
    if (c.correction) corrige = corrige.slice(0, c.debut) + c.correction + corrige.slice(c.fin);
  });
  return {
    source: "languagetool",
    note: null,
    niveau: null,
    resume: corrections.length ? `${corrections.length} point${corrections.length > 1 ? "s" : ""} à vérifier.` : "Aucune faute détectée par le correcteur automatique.",
    pointsForts: [],
    corrections,
    versionCorrigee: corrections.length ? corrige : "",
    conseil: "",
  };
}

/* Analyse le texte avec le meilleur moyen disponible.
   Renvoie un résultat, ou { indisponible: true, raison } si aucune analyse n'est possible. */
export async function analyserTexte(demande, signal) {
  const sample = await fonctionClaude();
  if (sample) {
    try {
      return await analyseClaude(sample, demande, signal);
    } catch (e) {
      if (e?.code === "cancelled") throw e;
      // Refus, limite atteinte, réponse illisible… on tente le correcteur libre
      if (!["not_granted", "sampling_disabled", "not_declared", "capability_disabled", "capability_removed"].includes(e?.code)) {
        demande.erreurClaude = e?.code || "upstream_error";
      }
    }
  }
  try {
    return await analyseLanguageTool(demande.texte, signal);
  } catch (e) {
    if (e?.name === "AbortError") throw { code: "cancelled" };
    return { indisponible: true, raison: demande.erreurClaude === "rate_limited" ? "limite" : "hors-ligne" };
  }
}

/* ---------- Affichage du résultat ---------- */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function rendreAnalyse(r) {
  if (r.indisponible) {
    return `<div class="carte analyse"><b>📴 Analyse automatique indisponible</b>
      <p class="muet petit">${r.raison === "limite"
        ? "La limite d'utilisation de Claude est atteinte pour le moment. Réessaie plus tard, ou compare ton texte avec le modèle ci-dessous."
        : "Il faut une connexion internet pour analyser ton texte. Compare-le avec le modèle ci-dessous."}</p></div>`;
  }
  const titreDe = (id) => (C.modules[id] ? `${C.modules[id].ico} ${C.modules[id].titre}` : C.points[id] ? `${C.points[id].ico} ${C.points[id].titre}` : "");
  const couleur = r.note == null ? "" : r.note >= 8 ? "bien" : r.note >= 5 ? "moyen" : "faible";
  return `<div class="carte analyse">
      <div class="entete-analyse">
        ${r.note != null ? `<div class="note ${couleur}"><b>${r.note}</b><small>/ 10</small></div>` : ""}
        <div class="flex"><b>${r.source === "claude" ? "✨ Analyse de ton texte" : "🔎 Correction automatique"}</b>
          ${r.niveau ? `<span class="puce-niveau">Niveau ${esc(r.niveau)}</span>` : ""}
          <p>${esc(r.resume)}</p></div>
      </div>
      ${r.pointsForts.length ? `<div class="bloc-analyse"><h4>👍 Ce qui est réussi</h4><ul>${r.pointsForts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${r.corrections.length ? `<div class="bloc-analyse"><h4>✏️ À corriger (${r.corrections.length})</h4>
        ${r.corrections.map((c) => `<div class="correction">
          <div><s>${esc(c.original)}</s> → <b>${esc(c.correction || "?")}</b></div>
          ${c.explication ? `<div class="muet petit">${esc(c.explication)}</div>` : ""}
          ${c.regle && titreDe(c.regle) ? `<div class="regle">📓 ${esc(titreDe(c.regle))}</div>` : ""}
        </div>`).join("")}</div>`
      : `<div class="bloc-analyse"><h4>🎉 Aucune faute trouvée</h4></div>`}
      ${r.versionCorrigee ? `<div class="bloc-analyse"><div class="ligne"><h4>✅ Ton texte corrigé</h4><button class="haut-parleur petit" data-dire="${esc(r.versionCorrigee)}" aria-label="Écouter">🔊</button></div>
        <p class="en">${esc(r.versionCorrigee)}</p></div>` : ""}
      ${r.conseil ? `<div class="astuce">💡 ${esc(r.conseil)}</div>` : ""}
      ${r.source === "languagetool" ? `<p class="muet petit">Correction faite par le correcteur libre LanguageTool (explications en anglais). Sur la version claude.ai de l'appli, l'analyse est plus complète et expliquée en français.</p>` : ""}
    </div>`;
}
