# Chooser Mobile

App iPhone gratuite et sans pub, façon "Chooser - Spin the Wheel", avec deux jeux :

- **Doigt** : chacun pose un doigt sur l'écran, 4 secondes plus tard un(e)
  perdant(e) est désigné(e) au hasard (humour noir garanti).
- **Roue** : roue de la fortune classique avec des options personnalisables,
  plusieurs roues nommées peuvent être sauvegardées.

## Démarrer

1. Installer les dépendances

   ```bash
   npm install
   ```

2. Lancer le serveur de développement

   ```bash
   npx expo start
   ```

   Si le téléphone et la machine ne sont pas sur le même réseau, utiliser
   `npx expo start --tunnel`.

3. Ouvrir l'app sur l'iPhone avec [Expo Go](https://expo.dev/go) en scannant
   le QR code affiché dans le terminal.

Le multitouch (jeu "Doigt") doit être testé sur un téléphone physique : il ne
fonctionne pas dans l'aperçu web.
