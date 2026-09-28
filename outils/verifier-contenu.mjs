// Vérifie que les fichiers du dossier contenu/ sont bien formés, pour chaque langue.
// À lancer après avoir ajouté du contenu :   node outils/verifier-contenu.mjs
import fs from "fs";

const problemes = [];
const signaler = (ou, msg) => problemes.push(`${ou} : ${msg}`);
const langues = fs.readdirSync(new URL("../contenu/", import.meta.url));

for (const langue of langues) {
const lire = (p) => JSON.parse(fs.readFileSync(new URL(`../contenu/${langue}/${p}`, import.meta.url)));
const ids = new Set();
const idUnique = (id, ou) => { if (ids.has(id)) signaler(`${langue}/${ou}`, `identifiant en double « ${id} »`); ids.add(id); };

const s = lire("sommaire.json");

for (const f of s.fondations) {
  const m = lire(f);
  idUnique(m.id, f);
  ["titre", "dialogue", "fiche", "exercices", "production", "cartes"].forEach((k) => { if (!m[k]) signaler(f, `champ « ${k} » manquant`); });
  m.exercices.forEach((e, i) => {
    const ou = `${f} exercice ${i + 1}`;
    if (e.type === "choix" && !(e.bonne < e.options.length)) signaler(ou, "« bonne » ne correspond à aucune option");
    if (e.type === "erreur" && !e.texte.split(" ")[e.k]) signaler(ou, "« k » ne correspond à aucun mot");
    if (e.type === "saisie" && !e.reponses?.length) signaler(ou, "aucune réponse acceptée");
  });
  m.cartes.forEach((c) => { idUnique(c.id, f); if (!c.reponses?.length) signaler(f, `carte ${c.id} sans réponse`); });
}

for (const p of lire(s.grammaire).points) {
  idUnique(p.id, "grammaire.json");
  p.items.forEach((it, i) => {
    const ou = `grammaire.json ${p.id} exercice ${i + 1}`;
    if (it[0] === "q" && !(it[3] < it[2].length)) signaler(ou, "bonne réponse hors des choix");
    if (it[0] === "e" && !it[1].split(" ")[it[2]]) signaler(ou, "index du mot faux invalide");
  });
}

for (const f of s.vocabulaire) {
  for (const d of lire(f).decks) {
    idUnique(d.id, f);
    d.mots.forEach((w, i) => { if (w.length < 4) signaler(`${f} ${d.id}`, `mot ${i + 1} incomplet (il faut anglais, français, exemple, traduction)`); });
  }
}

for (const q of lire(s.test).questions) {
  if (!(q.bonne < q.options.length)) signaler(`${langue}/test`, `bonne réponse invalide : ${q.texte}`);
  if (!ids.has(q.lien)) signaler(`${langue}/test`, `lien inconnu « ${q.lien} » : ${q.texte}`);
}
}

if (problemes.length) {
  console.log(`❌ ${problemes.length} problème(s) :\n` + problemes.map((p) => "  - " + p).join("\n"));
  process.exit(1);
}
console.log("✅ Contenu valide");
