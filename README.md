# 🇬🇧 English Coach

Une application web pour **reprendre l'anglais sur des bases solides**, puis progresser avec un
parcours adapté à son niveau. Elle fonctionne sur téléphone et sur ordinateur, s'installe sur l'écran
d'accueil et marche même sans connexion.

## Le parcours

1. **🧱 Les Fondations** : 8 modules sur les verbes et les temps (to be, présent simple, do/does,
   présent en -ing, can/could, passé, verbes irréguliers, futur). Ils sont dans l'ordre où on les
   acquiert naturellement. Chaque module se déroule en 4 étapes :
   - **Découvrir** : un dialogue, avec l'audio et les formes étudiées surlignées ;
   - **Comprendre** : le cours en une minute, avec les pièges pour les francophones ;
   - **S'entraîner** : du plus facile au plus dur (reconnaître → compléter → transformer → écrire) ;
   - **Produire** : écrire quelques phrases sur soi, puis les comparer à un modèle.
2. **🎯 Le test de positionnement** : 24 questions (A1 → B2). Il évalue le niveau et recommande
   ce qu'il faut travailler en priorité.
3. **🚀 Le parcours personnalisé**, débloqué après le test :
   - **Les essentiels de l'anglais** : 8 thèmes, 96 mots et expressions parmi les plus utiles ;
   - **Anglais pro · Marketing & business** : 6 thèmes, 72 mots ;
   - **Grammaire** : 15 points du A1 au B2 ;
   - **Vie quotidienne UK / US** : *prochaine étape du projet*.

Et tout au long du parcours :

- **🔁 La révision espacée** : chaque forme, mot ou règle appris devient une carte. L'algorithme
  **FSRS** (le même qu'Anki) la fait revenir juste avant qu'on l'oublie.
- **🎰 La machine à conjuguer** : un tirage sujet + verbe + temps + forme, et il faut écrire la phrase.
- **⚡ Le défi chrono** : 60 secondes pour enchaîner un maximum de bonnes réponses.
- **📓 Le carnet d'erreurs** : les règles sur lesquelles on se trompe le plus, avec un lien vers le cours.

## Sur quoi repose la méthode

| Principe | Dans l'appli |
|---|---|
| Se tester et espacer les révisions : la méthode la mieux prouvée pour retenir | Révisions FSRS, réponses à écrire plutôt que seulement choisir |
| Un enseignement explicite de la grammaire aide (Norris & Ortega, 2000) | Une fiche courte par module, et une explication après chaque réponse |
| Il faut comprendre (input, Krashen) et produire (output, Swain) : les « 4 volets » de Nation | Des dialogues en contexte, la dictée, et des phrases à écrire soi-même |
| Certaines formes s'acquièrent tard (ex. le -s de *he works*) | Elles reviennent en révision pendant des semaines |

## Utiliser l'appli

### En ligne (GitHub Pages)

1. Sur GitHub : **Settings** → **Pages**
2. **Source** : *Deploy from a branch* → branche `main`, dossier `/ (root)` → **Save**
3. Au bout d'une ou deux minutes : `https://<ton-pseudo>.github.io/english-coach/`
4. Sur ton téléphone, ouvre le lien puis **Partager → Sur l'écran d'accueil**.

### En local

Le contenu est chargé depuis des fichiers JSON : il faut donc un petit serveur web, et non ouvrir
`index.html` en double-cliquant.

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Organisation des fichiers

```
index.html                 la page (vide : tout est construit par le JavaScript)
css/app.css                le style (thème clair et sombre)
js/
  main.js                  démarrage
  contenu.js               chargement du contenu + registre des cartes de révision
  progression.js           règles de déblocage et recommandations
  srs.js                   révision espacée (FSRS)
  lecon.js                 moteur de leçon (8 types d'exercices)
  exercices.js             fabrication des exercices à partir du contenu
  conjugaison.js           conjugaison automatique (machine à conjuguer)
  store.js                 sauvegarde, XP, série de jours, export / import
  voix.js                  prononciation (synthèse vocale du navigateur)
  nav.js, util.js          navigation, petits outils
  ecrans/                  un fichier par écran
contenu/                   TOUT le contenu pédagogique, modifiable sans toucher au code
  sommaire.json            la liste des fichiers de contenu
  fondations/f1-be.json …  les 8 modules des Fondations
  grammaire.json           les points de grammaire
  vocabulaire/*.json       les thèmes de vocabulaire
  test-positionnement.json
  verbes.json              les verbes de la machine à conjuguer
vendor/ts-fsrs.mjs         algorithme FSRS (licence MIT, voir vendor/LICENSE-ts-fsrs.txt)
sw.js, manifest.webmanifest  mode hors connexion et installation sur téléphone
outils/verifier-contenu.mjs  vérifie le contenu après une modification
```

## Ajouter du contenu

- **Un mot** : ajoute une ligne `["anglais", "français", "phrase d'exemple", "traduction"]` dans
  un thème de `contenu/vocabulaire/`. Un 5ᵉ élément facultatif sert de remarque (faux ami…).
- **Un thème de vocabulaire** : copie un bloc de `decks` en changeant son `id`.
- **Un nouveau fichier de vocabulaire** (ex. vie quotidienne) : crée-le sur le modèle de
  `essentiels.json`, puis ajoute son chemin dans `contenu/sommaire.json`.

Après chaque modification, lance la vérification (Node.js requis) :

```bash
node outils/verifier-contenu.mjs
```

## Ta progression

Elle est enregistrée dans le navigateur. Depuis **Profil → Exporter ma progression**, tu peux la
sauvegarder dans un fichier, puis la réimporter sur un autre appareil.

## Crédits

- Révision espacée : [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (MIT)
- Inspirations : [LibreLingo](https://github.com/LibreLingo/LibreLingo) (contenu séparé du code),
  [ConjuGO](https://github.com/phoenixlwpapix/conjugo) et
  [spanish-study](https://github.com/nachshon90/spanish-study) (entraînement à la conjugaison),
  [duolingo/halflife-regression](https://github.com/duolingo/halflife-regression) (modèle de mémoire)
