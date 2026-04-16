# Jungle Chase - Jeu 3D BabylonJS

Un jeu 3D de chasse/survie dans la jungle réalisé avec **Babylon.js**.

## Concept

Choisis ton animal et survis dans la jungle sauvage !

- **Mode Proie** : Tu es une gazelle ou un zèbre. Fuis les prédateurs, cache-toi dans les buissons, collecte des bonus !
- **Mode Prédateur** : Tu es un lion ou un tigre. Chasse tes proies avant la fin du temps !

## Lancer le jeu

Le jeu nécessite un serveur HTTP local (les modules ES6 et certains assets ne fonctionnent pas en `file://`).

### Option 1 : Python (le plus simple)
```bash
cd jungle-game
python -m http.server 8080
```
Puis ouvrir http://localhost:8080

### Option 2 : Node.js
```bash
npx http-server -p 8080
```

### Option 3 : Extension VS Code
Installer l'extension **Live Server** et cliquer "Go Live".

## Contrôles

| Touche | Action |
|--------|--------|
| Z/Q/S/D ou Flèches | Se déplacer |
| SHIFT | Sprinter (consomme l'endurance) |
| ESPACE | Interagir (se cacher) |
| Souris | Orienter la caméra |
| ECHAP | Pause |

## Ajouter des modèles 3D

Les animaux utilisent des formes géométriques par défaut. Pour ajouter de vrais modèles :

1. Télécharger des modèles `.glb` depuis [Sketchfab](https://sketchfab.com), [Poly Pizza](https://poly.pizza) ou [Mixamo](https://www.mixamo.com)
2. Les placer dans le dossier `assets/models/`
3. Modifier `js/entities.js` pour charger les modèles (voir les commentaires `// TODO: GLTF`)

## Ressources

- [Documentation BabylonJS](https://doc.babylonjs.com/)
- [Forum BabylonJS](https://forum.babylonjs.com/)
- [Chaîne YouTube BabylonJS](https://www.youtube.com/@BabylonJSEngine)
- [Free Game Assets](https://www.freegameassets.com/)
- [Mixamo (animations 3D)](https://www.mixamo.com/)
- [Skybox Generator AI](https://skybox.blockadelabs.com)
