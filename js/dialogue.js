// Fenêtres de confirmation et de message affichées dans la page
// (plus fiables que confirm() / alert(), qui sont bloqués dans certains contextes).
import { echapper } from "./util.js";

function fenetre(message, boutons) {
  return new Promise((resoudre) => {
    const fond = document.createElement("div");
    fond.className = "dialogue-fond";
    fond.innerHTML = `<div class="dialogue-boite" role="dialog" aria-modal="true">
        <p>${echapper(message)}</p>
        <div class="dialogue-boutons">${boutons.map((b, i) => `<button class="btn ${b.classe || ""}" data-i="${i}">${echapper(b.texte)}</button>`).join("")}</div>
      </div>`;
    const fermer = (valeur) => { fond.remove(); document.removeEventListener("keydown", clavier, true); resoudre(valeur); };
    const clavier = (ev) => { if (ev.key === "Escape") { ev.stopPropagation(); fermer(boutons[0].valeur); } };
    fond.querySelectorAll("button").forEach((b) => (b.onclick = () => fermer(boutons[+b.dataset.i].valeur)));
    fond.addEventListener("click", (ev) => { if (ev.target === fond) fermer(boutons[0].valeur); });
    document.addEventListener("keydown", clavier, true);
    document.body.appendChild(fond);
    fond.querySelector("button:last-child").focus();
  });
}

// Renvoie une promesse : true si la personne confirme
export const confirmer = (message, texteOk = "Confirmer", danger = false) =>
  fenetre(message, [{ texte: "Annuler", valeur: false }, { texte: texteOk, valeur: true, classe: danger ? "rouge" : "principal" }]);

export const informer = (message) => fenetre(message, [{ texte: "OK", valeur: true, classe: "principal" }]);
