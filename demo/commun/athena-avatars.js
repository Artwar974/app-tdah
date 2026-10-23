/*
 * ATHENA · avatars de profil : 12 animaux, 7 couleurs, deux finitions (une par direction artistique).
 *
 * Module autonome, sans dépendance. Les pictogrammes viennent de Game-icons.net (CC BY 3.0) : le crédit par auteur
 * est dans AthenaAvatars.CREDITS et doit s'afficher dans Carnet › Crédits et licences (voir assets/kits/LICENCES-avatars.md).
 *
 *   AthenaAvatars.LISTE            // [{ id, nom, auteur, … }]
 *   AthenaAvatars.COULEURS         // [{ id, nom, fond, fg }]
 *   AthenaAvatars.DEFAUT           // { id: 'renard', couleur: 'ocre' }
 *   AthenaAvatars.normaliser(a)    // → un avatar valide (reprend le défaut si l'id ou la couleur est inconnu : sauvegarde ancienne ou abîmée)
 *   AthenaAvatars.svg(a, { taille: 48, da: 'r2' | 'origine', lumiere: 'rgb(255 200 140)', titre: true })   // → chaîne <svg> prête à insérer
 *   AthenaAvatars.monter(conteneur, { valeur, da, enfant, onChange, lumiere })   // sélecteur complet → { valeur(), definir(a), detruire() }
 *   AthenaAvatars.CREDITS          // texte de crédit à afficher
 *
 * Mise en lumière : l'option `lumiere` (couleur CSS, par exemple AthenaCampLumiere.teinteEn(x, y)) teinte le reflet du médaillon
 * pour qu'il prenne la couleur du moment (chaud au coucher, bleuté la nuit). Sans elle, le reflet est neutre.
 * La sauvegarde ne garde que { id, couleur } : le rendu ne dépend jamais d'un fichier image.
 */
(function (global) {
  'use strict';

  var LISTE = [
    { id: 'renard', nom: 'Renard', auteur: 'Caro Asercion', gi: 'fox', k: 0.709, cx: 256, cy: 256,
      d: 'm214.5 23.24l-1 8.1c-14 61.5 21 88.66 21 88.66l11-13s-24-19.76-18-63.56c41 11.6 58 36.6 64 48.8c-44 15.76-56 57.26-80 87.96l21-3.9l-2 31.3s44-8.7 69 17.7c5-8.6 8-18.9 6-29.2l-3-28.2c-3-1.1-7-3-11-5.4c-12-7.3-25-19.1-25-19.1c-2-1.9-2-5.2-1-7.8c2-2.5 5-3.7 7-2.7c0 0 11 3.5 21 6.7c11 3.9 20 14.3 21 26.6c1 8.4 3 18.9 4 28.3c2 15.4-3 30.8-12 42.7l7 18.3h38l7-18.3c-9-11.9-14-27.3-12-42.7c1-9.4 3-19.9 4-28.3c1-12.3 10-22.7 21-26.6c10-3.2 21-6.7 21-6.7c2-1 5 .2 7 2.7c1 2.6 1 5.9-1 7.8c0 0-13 11.8-25 19.1c-4 2.4-8 4.3-11 5.4l-3 28.2c-2 10.3 1 20.6 6 29.2c25-26.4 69-17.7 69-17.7l-2-31.3l21 3.9c-24-30.7-36-72.2-80-87.96c6-12.2 23-37.2 64-48.8c6 43.8-18 63.56-18 63.56l11 13s35-27.16 21-88.66l-1-8.1c-43.3 7.32-85.9 35.37-110 62.9c-5.5-.13-10.5-.52-16 0c-42.8-34.75-61.3-56.12-110-62.9m24.7 205.26c38.2 53.2-87.7 46.6-153.61 119.5c-26.11 28-32.53 56.3-25.95 80.3c12.23 44 71.86 73 144.06 55c49.8-13 96-32 134.8-40c35.1-8 63.8-5 82.3 24l15.3-5c-2.9-38-14.4-68.8-36.5-87.5c-16.8-14.2-39.9-22-70.9-21.1c-29.3.8-65.9 9.3-111.2 27.3c-27 9.5-76.5 27.7-102.4 12.6c-9.1-5.6-11.9-15-11.2-24.3c34.4 52 124.1-27 198.5-35.7c0 0 6.6-88.3-63.2-105.1m188.6 0c-53.1 12.4-64.1 54.1-65.2 105.1c26.5-.2 49.9 23.7 49.9 23.7s-27-98.6 15.3-128.8m-100.3 1.3h10c3 0 6 2.8 6 6.3c0 3.4-3 6.2-6 6.2h-10c-3 0-6-2.8-6-6.2c0-3.5 3-6.3 6-6.3m61.4 157.7c13.7 11.6 22.2 28.8 26.8 49.8c-15.8-12-35-16-57.1-14c-24.1 2-51.9 10-82.3 20l26.1-25c-28.3 14-53.1 17-75.4 12l80.9-40.2l-61.2 11.2c23.8-20.2 95.2-52.2 142.2-13.8' },
    { id: 'cerf', nom: 'Cerf', auteur: 'Caro Asercion', gi: 'deer', k: 0.7, cx: 256, cy: 256,
      d: 'm139.3 20.25l-16.1 4.5c9.4 33.5 22.3 51.1 37 60.3c14.9 9.4 32.1 10.2 50.9 8.5c25-2.3 53.2-9.6 82 1.1c7.8 3.5 16 7.95 24.7 13.85c4.6-1.4 8.6-3.2 12.6-4.5c0 0 3.2-10.25-2-23.35c-4.5-11.5-15.7-26-44-36.2l-5.6 15.6c17.4 6.4 26.8 14.3 31.6 21.8c.7 1.1 1.2 2.1 1.7 3.1c-3.8-2-7.7-3.8-11.5-5.2c-28.1-13-50.6-13.8-68.6-15.8c-9.6-1-17.7-2.2-24.4-7c-6.7-4.9-11.7-13.4-16-28.2l-16 4.7c5.7 19.6 13.3 30.4 22.2 36.9c4 2.9 8.3 5 12.9 6.5c-15.8.85-30.7.67-41.7-5.9c-12.2-7.7-21.9-22.9-29.7-50.7m89.5 3.6c-.9 11.2 1.1 20.3 4.4 27.7c7.7.96 14.4 1.1 21.4 2.3c-5.4-6-10.2-15.2-9.2-28.8zm120.3 13.5l-10.9 12.5c8.2 7.2 10.5 15.8 10.5 23.1c-4.4-3.92-8.4-6.53-13.1-8.9c7.2 8.42 8.2 23.36 8.7 31.4l15.5 1.7s17.6-35.2-10.7-59.8m-80.7 69.35c-17.5 2-26.8-2.6-32.4 13.8c0 0 18.8 27.9 68.9 27.2c-2.8 11.4-1.5 19.8-1.5 29.9c0 33.6-27 62.9-86.5 62.9c-30.2 0-66.9 5.4-94.9 20.5c-19.9 10.7-35.47 26.2-42.36 47.7l7.81 10.9l14.95.2v61.7l-18.24 28.3l5.24 82h17.3l1.5-66c8.6-5 28.3-18 45.1-38c22.8-26.9 40.3-66 19.7-114.4l15.4-6.5c16.9 39.7 11 74.1-3.8 101.8c28.3-.9 52.6-2.7 73.2-6.1l-4.7-56.3l16.6-1.4l15.8 186.9h17.2l2.9-121.7c13.7-5.8 44.9-27.1 59.5-101.1c1.8-9 2.8-16.6 3.3-23.1c2.3-16.5 3.6-35.1 4-56.3l-24.5-7.7h75.3l7.3-16.5c-7.1.3-15.6-3.4-15.6-3.4l1.7-8h15.8l-85.5-44.3c-9.5 3.6-19.5 8.3-26.5 14c-5.6-4-25-16.5-52-17m95.5 226.6c-9.7 18.1-20.1 31.6-29.1 41.2l47.1 20.8l-20.9 47.5l15 7l33.4-64.8l-44.3-37.4c-.4-2.3-.9-6.8-1.2-14.3m-153.8 50.8c-11.3.7-23.3 1.2-36.1 1.4c-8.7 11.5-18.7 22.6-29.1 31.2l8.7 75h17.1v-65c7.3-6 24.9-21.3 39.4-42.6' },
    { id: 'dauphin', nom: 'Dauphin', auteur: 'Delapouite', gi: 'dolphin', k: 0.693, cx: 256, cy: 256.8,
      d: 'M123.22 47.23c29.498 15.152 55.025 36.05 55.53 67.366c-93.62 83.867-83.862 179.356-97.002 270.34c-67.68 55.552-67.57 90.948-60.9 101.227c3.94.743 29.11-25.94 48.326-30.397c14.23-4.094 12.284-15.99 16.273-25.275c2.438 14.55 7.17 22.612 17.133 25.485c12.874 3.36 44.932 28.15 51.53 25.504c1.374-20.382-26.01-63.854-48.028-90.087c41.012-63.28 81.365-136.458 211.162-207.77c-3.21-3.706-6.216-6.45-8.8-7.986l9.198-15.472c11.617 6.907 20.522 19.56 29.248 35.033c5.94 10.532 11.528 22.644 16.96 35.117c15.682-32.87 22.983-66.406 16.402-90.254l17.35-4.786a87 87 0 0 1 1.927 8.83c33.29-4.253 55.718-13.083 85.11-29.322c3.744-2.068 19.054-13.012-.117-16.03c12.62-9.017 7.54-12.063 1.973-15.152c-6.486-3.6-20.302-8.948-35.758-8.556c-12.124-27.863-39.63-47.772-82.225-47.696c-28.532.052-63.842 9.086-105.828 30.688C217.895 27.64 164.92 20.468 123.22 47.23m286.942 28.74a9 9 0 1 1 0 18a9 9 0 0 1 0-18' },
    { id: 'aigle', nom: 'Aigle', auteur: 'Delapouite', gi: 'eagle-head', k: 0.701, cx: 256, cy: 256,
      d: 'M242.9 20.46c6.7 19.75 19.7 41.39 4 50.44c-38.6 22.04-81.4 41.5-106.2 90.7C103.3 235.7 91.69 412 29.81 451c48.6 3.8 89.69-16.3 108.89-44.2c7.1 34.3 32.6 67 63 84.7c-5.2-29-1.8-59.4 19-92.5c16.5 22.9 31.1 59.3 73.8 75.3c-16.4-27.5-13.7-52.8-10.7-84.2c8.8 26.9 38.5 50 72.9 58.9c-16.8-18.6-23.9-45.5-21-66c14.6 24.9 43.4 38.4 67.1 39.7c-153.3-179.6-48.7-291.6 79.4-194.4c-.5-49.7-31.4-66.7-67.2-95.7c-.9-15.4-9.6-29.3-17.5-43.36c-53.7-9.99-121.5-42.01-154.6-68.78m81.2 74.88c26.1 10.86 46.2 22.56 56.4 35.46c-16.6-3.6-39.8-3.5-70-1.1c15-9.7 16.5-21.7 13.6-34.36' },
    { id: 'tortue', nom: 'Tortue', auteur: 'Lorc', gi: 'turtle', k: 0.694, cx: 258.4, cy: 255.5,
      d: 'M258.406 25.03c-13.73 0-44.75 28.13-44.75 62.814c0 31.578 6.432 55.835 16.5 70.937c-23.144 3.766-44.237 12.52-61.03 27.314a99 99 0 0 0-8.5 8.47c-38.335-36.232-115.217 13.032-137 39.28c-19.604 23.618 58.395 26.618 110.718 16.75c-1.837 9.754-2.813 20.262-2.813 31.53c0 39.603 11.68 76.216 31.157 104.282c-42.685 4.89-61.916 64.204-61.093 90.438c.912 29.105 77-17.718 105.5-49.375c8.82 4.862 18.197 8.497 28 10.75c4.822 14.255 10.526 28.394 23.312 41.655c13.732-13.89 18.762-27.77 23.28-41.656c9.815-2.253 19.203-5.883 28.033-10.75c28.498 31.656 104.587 78.48 105.5 49.374c.822-26.234-18.41-85.55-61.095-90.438c19.477-28.066 31.156-64.68 31.156-104.28c0-11.27-.974-21.778-2.81-31.532c52.322 9.868 130.32 6.868 110.717-16.75c-21.784-26.248-98.666-75.512-137-39.28a99 99 0 0 0-8.5-8.47c-16.86-14.855-38.058-23.604-61.312-27.344c10.232-15.31 16.78-39.817 16.78-70.906c0-34.683-31.018-62.813-44.75-62.813m0 150.25c20.22 0 38.787 3.424 54.563 10.532l-26.345 31.97h-56.438l-26.343-31.97c15.775-7.108 34.34-10.53 54.562-10.53zm-70.937 20.032l25.75 31.25l-29.97 44.032l-4.28 6.28l5.31 5.47l36.532 37.625l-23.312 28.436l-5.28 6.438l5.78 6l27.125 28l13.438-13l-21.344-22.03l21.53-26.22h39.313l21.53 26.22l-21.343 22.03l13.438 13l27.125-28l5.78-6l-5.28-6.438L296 319.97l36.563-37.626l5.25-5.438l-4.22-6.28l-29.718-44.376l25.5-30.938a84 84 0 0 1 5.97 4.782c19.106 16.832 31.25 42.762 31.25 82.03c0 78.538-49.7 140.063-108.19 140.063c-58.486 0-108.186-61.525-108.186-140.062c0-39.27 12.14-65.2 31.25-82.03c1.913-1.688 3.93-3.273 6-4.782zm41.593 41.157h59.156l25.655 38.25l-33.188 34.186h-44.562L203 274.78z' },
    { id: 'lapin', nom: 'Lapin', auteur: 'Delapouite', gi: 'rabbit-head', k: 0.721, cx: 256, cy: 256,
      d: 'M382.7 27.2c4.8 2.25 8.5 5.18 11.5 8.94c-27.3 19.88-43.5 52.15-53.1 84.86c-11.6 39.4-14.1 80.2-14.1 104.8h18c0-23.4 2.5-62.9 13.3-99.7c8.6-29.19 22.3-56.12 43.4-73.03c1.2 4.94 1.9 10.46 2.1 16.52c.6 22.68-5.6 52.11-14.4 81.61c-8.9 29.6-20.3 59.4-29.6 83.9c-3.8 10.2-14.7 50.7-11.4 54.7c15.9 21.8 26.6 48 26.6 76v3.7l2.6 2.7c14.3 14.2 15.9 25.5 11.7 37.6c-4.3 12.1-16.3 25.3-32.5 36.6c-32.3 22.8-80.8 38.4-100.8 38.4s-68.5-15.6-100.8-38.4c-16.2-11.3-28.2-24.5-32.5-36.6c-4.2-12.1-2.6-23.4 11.7-37.6l2.6-2.7v-3.7c0-28 10.7-54.2 26.6-76c3.3-4-7.6-44.5-11.4-54.7c-9.3-24.5-20.7-54.3-29.6-83.9c-8.8-29.5-15-58.89-14.4-81.59q.3-9.15 2.1-16.5c21.1 16.9 34.8 43.8 43.4 72.99c10.8 36.8 13.3 76.3 13.3 99.7h18c0-24.6-2.5-65.4-14.1-104.8c-9.6-32.7-25.8-64.99-53.1-84.89c3-3.7 6.7-6.7 11.5-8.9c3.6.9 13.2 6.1 23.4 16.9c11.2 11.9 23.7 29.4 34.5 50.1c21.7 41.39 37 95.79 27.9 145.99c12.4-3.9 26.7-5.9 40.9-5.9s28.5 2 40.9 5.9c-9.1-50.2 6.2-104.6 27.9-146c10.8-20.72 23.3-38.19 34.5-50.13c10.2-10.8 19.8-15.94 23.4-16.87M304 308.8c-13.7 0-25 11.3-25 25s11.3 25 25 25s25-11.3 25-25s-11.3-25-25-25m-96 0c-13.7 0-25 11.3-25 25s11.3 25 25 25s25-11.3 25-25s-11.3-25-25-25m96 18c4 0 7 3 7 7s-3 7-7 7s-7-3-7-7s3-7 7-7m-96 0c4 0 7 3 7 7s-3 7-7 7s-7-3-7-7s3-7 7-7m48 34c-8.6 0-17 1-24.4 3.5c-3.7 1.2-7.1 2.7-10.2 5.3c-3.2 2.5-6 6.7-6.4 11.6l-.4 6l32.4 16.2v27c-.3.2-2.2.7-5.4 0c-6.5-1.6-17.1-8-26.1-21.6l-15 10c11 16.6 24.4 26.2 36.9 29.1c6.3 1.5 12.3 3.4 18.6 3.4s12.3-1.9 18.6-3.4c12.5-2.9 25.9-12.5 36.9-29.1l-15-10c-9 13.6-19.6 20-26.1 21.6c-3.2.7-5.1.2-5.4 0v-27l32.4-16.2l-.4-6c-.4-4.9-3.2-9.1-6.4-11.6c-3.1-2.6-6.5-4.1-10.2-5.3c-7.4-2.5-15.8-3.5-24.4-3.5m0 18c5.3 0 10.3.7 14.6 1.7l-14.6 7.2l-14.6-7.2c4.3-1 9.3-1.7 14.6-1.7' },
    { id: 'chat', nom: 'Chat', auteur: 'Lorc', gi: 'cat', k: 0.696, cx: 257.3, cy: 263.9,
      d: 'm463.46 37.008l-30.694 50.738l-7.043-2.28c-27.146-8.797-71.525-7.15-97.6.11L321.22 87.5l-28.68-48.543c-33.63 69.254-32.264 117.56-14.79 148.574c18.71 33.208 57.378 49.09 99.117 48.574c48.743-.606 88.968-19.665 107.035-54.194c16.918-32.332 15.684-80.456-20.443-144.902zM323.935 137.594c18.45.1 29.36 15.338 31.462 36.644c-37.11 17.91-53.963 3.398-61.173-26.545c11.382-7.063 21.324-10.144 29.71-10.1zm109.26 0c8.385-.045 18.328 3.036 29.71 10.1c-7.21 29.942-24.064 44.454-61.174 26.544c2.104-21.306 13.014-36.545 31.463-36.644zm-293.553 50.96q-1.839-.014-3.66.018c-30.175.536-56.142 10.59-75.743 26.574c-43.444 35.43-57.27 100.752-12.824 166.192c20.293 33.995 44.432 54.24 70.797 64.187c32.85 12.395 66.655 8.823 99.94 4.114s65.854-10.63 96.896-8.42c31.04 2.212 62.09 10.18 90.505 41.165c19.374 21.125 46.887-1.627 23.82-24.156c-35.024-34.207-72.527-47.42-109.377-50.04s-72.2 4.698-104.207 9.228s-60.272 6.552-84.558-2.61c-14.39-5.43-28.308-14.802-41.55-31.142h351.744c13.673-52.293 14.867-106.368 1.873-142.072c-19.765 8.49-42.412 12.9-66.2 13.197h-.002c-29.85.37-59.458-6.925-82.907-22.823a426 426 0 0 0-14.292 9.685l-5.734 4.057l-5.49-4.382c-46.63-37.2-91.028-52.48-129.03-52.773z' },
    { id: 'lion', nom: 'Lion', auteur: 'Lorc', gi: 'lion', k: 0.708, cx: 253.2, cy: 249.3,
      d: 'M123.885 20.447c-10.348.467-21.337 3.146-32.194 5.366l62.492 65.628l-21.645.188c-29.376.187-75.695 6.154-103.555 22.303l31.756 51.576l-40.625 21.098v56.577l46.54 26.32l-46.54 40.076v32.268c28.217-1.233 60.63.636 89.135-8.907l31.902-10.658l-21.828 25.586c-18.76 22-29.782 55.133-50.736 87.713c31.91-2.394 63.352-7.65 96.8-25.81l16.026-8.683l-9.746 77.124c26.333-12.19 52.103-28.923 71.178-49.055c22.683-23.94 35.713-50.49 33.36-72.71l-.074-.75c-18.488-12.687-32.26-31.173-39.236-54.18c-8.414-27.753-5.867-62.33 6.643-101.145c-26.406-4.04-46.536-14.637-57.307-30.11c-12.33-17.716-14.222-39.26-7.738-57.018s22.29-32.165 43.437-33.4c20.558-1.195 44.48 10.033 69.972 36.102c11.368 4.11 21.73 8.034 31.14 11.94c2.434-21.395-1.46-38.033-10.408-52.9c-8.41-13.975-23.217-26.43-41.1-38.582l4.27 42.888l-16.425-10.985C222.37 43.57 168.973 18.49 123.885 20.597l.002-.225zm100.387 77.997c-.436.008-.866 0-1.29 0h-.002c-13.54.785-22.545 9.105-26.937 21.135c-4.393 12.03-3.243 27.353 5.51 39.93c8.755 12.576 25.128 23.158 53.548 24.784l12.595.69l-4.344 11.827c-14.837 40.46-16.242 73.928-8.577 99.212c7.66 25.267 24.04 42.795 47.305 52.56h.037l108.59 38.474c5.65-11.9 11.672-23.813 17.988-35.71a40.6 40.6 0 0 1-16.32 3.41c-22.52 0-40.78-18.262-40.78-40.782c0-22.518 18.26-40.78 40.78-40.78c20.66 0 37.697 15.373 40.373 35.3c10.666-18.062 21.885-36 33.48-53.683l-103.224-52.377l-4.746-5.732c-3.93-13.556-11.515-23.32-26.39-33.324c-14.876-10.002-37.034-19.57-67.784-30.623l-2.08-.767l-1.53-1.607c-23.283-24.532-42.7-32.278-56.202-32.024zm119.04 89.93c8.272 0 14.657 6.387 14.657 14.657c0 8.274-6.387 14.688-14.658 14.688c-8.27 0-14.687-6.414-14.687-14.687c0-8.27 6.416-14.655 14.687-14.655z' },
    { id: 'ecureuil', nom: 'Écureuil', auteur: 'Delapouite', gi: 'squirrel', k: 0.71, cx: 256, cy: 256,
      d: 'M206.135 23.568c-61.993.106-133.212 38.319-173.762 85.328c0 0 94.532-8.388 109.732 35.477c24.55 70.846-103.768 62.832-105.619 173.623c-1.394 83.471 89.36 169.758 176.1 169.812c4.214 1.405 181.953 0 181.953 0c19.783-.28 20.606-22.551-48.812-36.637c145.592-147.853-86.742-159.073-85.456-45.779c-17.956-18.803.577-99.816 97.692-95.832c32.91 23.48 51.817 27.373 88.56 19.284c6.982-1.537 12.05-25.665-5.462-27.064l-31.78-2.54c-28.106-25.677-34.818-36.477-6.67-57.463c68.87 18.058 77.047 12.076 77.016-13.33c-.03-24.855-9.527-90.633-65.832-93.815c-7.701-10.311 9.79-42.042-3.953-42.957c-19.014-1.266-50.482 28.417-46.266 43.787c-18.335 7.755-38.728 31.156-59.15 59.614c-69.316 25.43-119.49 142.639-120.15 170.632c-.579-182.435 153.242-180.594 140.216-244.77c-14.07-69.324-66.992-97.458-118.357-97.37M432.807 169.97c7.164 0 12.972 5.808 12.972 12.973c0 7.164-5.808 12.972-12.972 12.972c-7.165 0-12.973-5.808-12.973-12.972c0-7.165 5.808-12.973 12.973-12.973' },
    { id: 'baleine', nom: 'Baleine', auteur: 'Delapouite', gi: 'whale-tail', k: 0.699, cx: 257.5, cy: 265,
      d: 'M453.004 35.117c-65.314 46.61-189.755 41.018-213.559 125.426C184.41 101.41 98.625 83.031 21.771 63.209c6.532 139.103 71.38 147.437 192.44 194.547c23.71 25.786 29.786 49.93 19.254 82.705c46.403 5.1 71.504 15.468 106.754 27.742c-.708-71.67-25.14-108.928-75.518-175.035c11.058 4.233 44.979 37.02 56.578 58.607c109.419-42.421 147.64-112.074 131.725-216.658M180.178 353.9c-60.89-.24-114.034 19.49-158.426 74.221c167.075-48.84 292.003-13.21 471.893 7.895c-118.936-38.752-224.474-81.763-313.467-82.116m98.043 77.844c-99.28.255-206.34 18.738-256.866 63.139c168.002-26.61 356.801-28.408 470.8-4.967c1.102-35.337-101.418-58.46-213.934-58.172' },
    { id: 'panda', nom: 'Panda', auteur: 'Delapouite', gi: 'panda', k: 0.712, cx: 256, cy: 248.4,
      d: 'M104.75 16.813c-24.29.552-47.924 8.42-62.844 26.03C29.71 57.24 27.212 75.418 31.126 93.438c3.912 18.02 13.678 36.518 26.25 55.063l.124.156C41.142 180.15 32 216.558 32 256c0 64 32 128 96 128c32 48 32 96 128 96s96-48 128-96c64 0 96-48 96-128c0-39.442-9.142-75.85-25.5-107.344l.125-.156c12.57-18.545 22.337-37.042 26.25-55.063c3.913-18.02 1.414-36.197-10.78-50.593c-15.915-18.785-41.757-26.468-67.72-26.032c-25.963.437-52.602 8.894-71.563 25.094l-1.593 1.344C306.473 35.923 281.892 32 256 32s-50.474 3.923-73.22 11.25l-1.593-1.344c-18.96-16.2-45.6-24.657-71.562-25.093a122 122 0 0 0-4.875 0m.375 16c1.397-.034 2.808-.024 4.22 0c19.96.335 40.684 6.498 55.81 16.968C123.906 67.025 89.78 96 66.406 133.095c-9.75-15.32-16.81-30.108-19.624-43.063c-3.203-14.755-1.46-26.517 7.314-36.874c10.937-12.91 30.08-19.842 51.03-20.343zm297.53 0c22.574-.38 43.585 6.572 55.25 20.343c8.775 10.357 10.518 22.12 7.314 36.875c-2.814 12.956-9.874 27.743-19.626 43.064c-23.372-37.096-57.5-66.07-98.75-83.313c15.127-10.47 35.85-16.632 55.812-16.968zM176 144c16 0 48 16 48 64c0 64-48 96-80 96s-48-64-48-96s64-64 80-64m160 0c16 0 80 32 80 64s-16 96-48 96s-80-32-80-96c0-48 32-64 48-64m-143.53 80A16 16 0 0 0 176 240a16 16 0 0 0 32 0a16 16 0 0 0-15.53-16m128 0A16 16 0 0 0 304 240a16 16 0 0 0 32 0a16 16 0 0 0-15.53-16M256 340c12 0 24 4 48 12l-48 48l-48-48c24-8 36-12 48-12m-59.563 69.344C219.756 424.89 238.133 432 256 432s36.245-7.11 59.563-22.656l8.875 13.312C299.755 439.11 278.132 448 256 448s-43.755-8.89-68.438-25.344z' },
    { id: 'cygne', nom: 'Cygne', auteur: 'Lorc', gi: 'swan', k: 0.699, cx: 253.3, cy: 240.2,
      d: 'M372.67 44.934c-50.275.005-92.476 43.57-38.934 163.87c29.137 16.804 41.594 46.767 33.48 74.848c-9.168 31.735-42.353 59.517-96.597 68.084c-45.02 7.11-88.46 2.42-122.915-22.218c-14.895-10.65-27.867-24.905-38.502-43.088c-26.314-8.87-48.678-17.086-61.224-23.25c-.197 10.192 1.916 21.786 6.594 33.963l-35.842-4.432l52.14 39.779l-26.95 11.895l53.35 11.676c10.984 9.717 23.94 18.99 39.07 27.38l-.002.007c26.098 14.475 195.407 11.62 218.51.578c67.333-32.17 71.596-90.7 28.552-167.472c-57.378-102.34-31.747-134.085 3.034-133.07c.93 10.53 6.27 21.943 15.593 31.288c5.74 5.757 12.266 9.993 18.886 12.623c19.37 11.416 38.896 19.675 62.072 20.81c5.712.08 9.144-9.696 3.487-10.238c-11.602-2.262-21.402-8.37-29.352-15.912c11.712-12.976 7.85-36.605-8.994-53.49c-11.038-11.06-24.963-16.53-36.898-15.692c-12.41-5.107-25.747-7.938-38.562-7.936zm56.598 37.433c6.16 0 10.95 4.793 10.95 10.953c0 6.157-4.79 10.95-10.95 10.95s-10.954-4.793-10.954-10.95s4.795-10.953 10.954-10.953m-208.653 118.95c-6.108.034-12.128.27-18.18.607c-29.242 1.63-59.597 5.87-101.03 1.365c28.59 40.045 73.354 51.978 116.91 49.04c-32.74 15.03-75.678 8.755-108.41-10.848q.713 2.22 1.454 4.38c17.087 33.357 62.417 42.17 88.845 42.066c-16.554 11.997-42.21 12.406-65.994 2.386c7.334 9.737 15.51 17.67 24.366 24.002c29.323 20.968 67.166 25.59 109.127 18.96c49.298-7.785 74.954-31.945 81.56-54.81c6.607-22.867-3.598-45.977-34.556-58.134c-36.452-14.313-63.225-18.523-87.95-18.975q-3.089-.055-6.142-.04zM64.14 378.278c-29.424 5.99-46.933 13.47-46.933 21.588c0 19.668 102.56 35.612 229.072 35.612s229.072-15.944 229.072-35.612c0-8.098-17.424-15.562-46.72-21.545c12.117 3.613 18.923 7.643 18.923 11.895c0 15.515-90.098 28.092-201.24 28.092c-111.14 0-201.24-12.577-201.24-28.092c0-4.27 6.858-8.314 19.064-11.938z' }
  ];

  /* Sept fonds ; le motif est sombre (encre) sauf sur « nuit ». Contrastes motif / fond ≥ 4,5 : voir outils/avatars-test.html. */
  var COULEURS = [
    { id: 'ocre',   nom: 'Ocre',        fond: '#e3aa5c', fg: '#211612' },
    { id: 'terre',  nom: 'Terre cuite', fond: '#d98a62', fg: '#211612' },
    { id: 'rose',   nom: 'Rose',        fond: '#eaa6ad', fg: '#211612' },
    { id: 'lilas',  nom: 'Lilas',       fond: '#b9a6dc', fg: '#211612' },
    { id: 'ciel',   nom: 'Ciel',        fond: '#8fc4d8', fg: '#211612' },
    { id: 'menthe', nom: 'Menthe',      fond: '#a7d19f', fg: '#211612' },
    { id: 'nuit',   nom: 'Nuit',        fond: '#454779', fg: '#fff3dc' }
  ];
  var DEFAUT = { id: 'renard', couleur: 'ocre' };
  var CREDITS = 'Avatars : pictogrammes de Game-icons.net, par Lorc, Delapouite et Caro Asercion, licence CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/). Modifications : couleur, taille, recadrage.';
  var NS = 'http://www.w3.org/2000/svg';
  var compteur = 0;

  function parId(liste, id) { for (var i = 0; i < liste.length; i++) if (liste[i].id === id) return liste[i]; return null; }
  function normaliser(a) {
    var g = parId(LISTE, a && a.id) || parId(LISTE, DEFAUT.id), c = parId(COULEURS, a && a.couleur) || parId(COULEURS, DEFAUT.couleur);
    return { id: g.id, couleur: c.id };
  }
  function echapper(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Le médaillon. Deux finitions : « r2 » (Figures : aplat, filet d'encre épais, motif encre) ; « origine » (Veillée : filet or,
   * liseré prune, motif prune, reflet doux). Le viewBox est 512 pour tout : la taille ne change que width/height. */
  function svg(a, o) {
    o = o || {};
    a = normaliser(a);
    var g = parId(LISTE, a.id), c = parId(COULEURS, a.couleur), da = o.da === 'origine' ? 'origine' : 'r2', t = o.taille || 48;
    var uid = 'av' + (++compteur), nuit = c.id === 'nuit';
    var fg = da === 'origine' ? (nuit ? '#fff3dc' : '#49344f') : c.fg;
    var anneau = da === 'origine' ? '#d69a54' : (nuit ? '#fff3dc' : '#211612');
    var lum = o.lumiere || 'rgb(255 255 255)';
    var tr = 'translate(256 256) scale(' + g.k + ') translate(' + (-g.cx) + ' ' + (-g.cy) + ')';
    var s = '<svg xmlns="' + NS + '" viewBox="0 0 512 512" width="' + t + '" height="' + t + '" class="av av-' + da + '" data-avatar="' + g.id + '"' +
      (o.titre === false ? ' aria-hidden="true" focusable="false"' : ' role="img" aria-label="Avatar : ' + echapper(g.nom) + '"') + '>';
    s += '<defs><radialGradient id="' + uid + 'r" cx=".32" cy=".26" r=".85"><stop offset="0" stop-color="' + lum + '" stop-opacity="' + (da === 'origine' ? .34 : .20) + '"/><stop offset=".55" stop-color="' + lum + '" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="' + uid + 'c"><circle cx="256" cy="256" r="240"/></clipPath></defs>';
    s += '<circle cx="256" cy="256" r="240" fill="' + c.fond + '"/>';
    s += '<g clip-path="url(#' + uid + 'c)"><circle cx="256" cy="256" r="240" fill="url(#' + uid + 'r)"/>';
    s += '<g transform="' + tr + '" fill="' + fg + '"><path d="' + g.d + '"/></g></g>';
    if (da === 'origine') {
      s += '<circle cx="256" cy="256" r="236" fill="none" stroke="' + anneau + '" stroke-width="20"/><circle cx="256" cy="256" r="224" fill="none" stroke="#60445f" stroke-opacity=".5" stroke-width="5"/>';
    } else {
      s += '<circle cx="256" cy="256" r="236" fill="none" stroke="' + anneau + '" stroke-width="26"/>';
    }
    return s + '</svg>';
  }

  var CSS_ID = 'athena-avatars-css';
  var CSS = [
    '.av-sel{display:flex;flex-direction:column;align-items:center;gap:var(--av-gap,18px);width:100%;box-sizing:border-box;font-family:var(--da-f-texte,system-ui,sans-serif);color:var(--da-encre,#2b1d17)}',
    '.av-apercu{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.av-apercu .av-cadre{display:block;width:112px;height:112px;border-radius:50%;box-shadow:var(--o-2,0 8px 20px rgba(20,10,20,.28));transition:transform .24s cubic-bezier(.3,1.5,.5,1)}',
    '.av-apercu .av-cadre.av-saut{transform:scale(1.08)}',
    '.av-nom{font-family:var(--da-f-titre,Georgia,serif);font-size:var(--t-4,24px);line-height:1.15;color:var(--da-titre-c,#211612);margin:0;text-align:center}',
    '.av-grille{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;width:100%;max-width:340px;margin:0;padding:0;list-style:none}',
    '.av-grille>li{display:flex;justify-content:center}',
    '.av-choix{all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:100%;max-width:76px;aspect-ratio:1;border-radius:50%;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .16s ease}',
    '.av-choix svg{width:100%;height:100%;display:block;pointer-events:none}',
    '.av-choix:active{transform:scale(.94)}',
    '.av-choix[aria-checked="true"]{box-shadow:0 0 0 3px var(--da-papier,#fff8ed),0 0 0 6px var(--da-accent,#d69a54)}',
    '.av-choix:focus-visible,.av-teinte:focus-visible{outline:3px solid var(--da-fort,#60445f);outline-offset:3px}',
    '.av-teintes{display:flex;gap:6px;justify-content:center;flex-wrap:nowrap;margin:0;padding:0;list-style:none}',
    '.av-teinte{all:unset;box-sizing:border-box;width:44px;height:44px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}',
    '.av-teinte i{display:block;width:30px;height:30px;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(33,22,18,.55)}',
    '.av-teinte[data-couleur="nuit"] i{box-shadow:inset 0 0 0 2px rgba(255,243,220,.8)}',
    '.av-teinte[aria-checked="true"] i{box-shadow:inset 0 0 0 2px rgba(33,22,18,.55),0 0 0 3px var(--da-papier,#fff8ed),0 0 0 5px var(--da-accent,#d69a54)}',
    '.av-etiquette{font-size:var(--t-1,15px);color:var(--da-doux,#6a5060);margin:0}',
    '@media (prefers-reduced-motion:reduce){.av-apercu .av-cadre,.av-choix{transition:none}}'
  ].join('');
  function injecterCss() {
    if (document.getElementById(CSS_ID)) return;
    var st = document.createElement('style'); st.id = CSS_ID; st.textContent = CSS; document.head.appendChild(st);
  }

  function monter(conteneur, o) {
    o = o || {}; injecterCss();
    var valeur = normaliser(o.valeur || DEFAUT), da = o.da === 'origine' ? 'origine' : 'r2';
    var racine = document.createElement('div'); racine.className = 'av-sel'; racine.setAttribute('data-avatar-selecteur', '');
    racine.innerHTML =
      '<div class="av-apercu"><span class="av-cadre" data-apercu></span><p class="av-nom" data-nom aria-live="polite"></p></div>' +
      '<ul class="av-grille" role="radiogroup" aria-label="' + 'Ton avatar' + '"></ul>' +
      '<p class="av-etiquette" id="av-couleur-' + (++compteur) + '">Couleur</p>' +
      '<ul class="av-teintes" role="radiogroup" aria-labelledby="av-couleur-' + compteur + '"></ul>';
    var grille = racine.querySelector('.av-grille'), teintes = racine.querySelector('.av-teintes'), apercu = racine.querySelector('[data-apercu]'), nom = racine.querySelector('[data-nom]');
    function lumiere() { return typeof o.lumiere === 'function' ? o.lumiere() : o.lumiere; }
    LISTE.forEach(function (g) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'av-choix'; b.setAttribute('role', 'radio'); b.setAttribute('data-id', g.id); b.setAttribute('aria-label', g.nom);
      li.appendChild(b); grille.appendChild(li);
    });
    COULEURS.forEach(function (c) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'av-teinte'; b.setAttribute('role', 'radio'); b.setAttribute('data-couleur', c.id); b.setAttribute('aria-label', c.nom);
      b.innerHTML = '<i style="background:' + c.fond + '"></i>'; li.appendChild(b); teintes.appendChild(li);
    });
    function dessiner(saut) {
      var L = lumiere();
      apercu.innerHTML = svg(valeur, { taille: 112, da: da, lumiere: L, titre: false });
      nom.textContent = parId(LISTE, valeur.id).nom;
      if (saut) { apercu.classList.add('av-saut'); setTimeout(function () { apercu.classList.remove('av-saut'); }, 180); }
      Array.prototype.forEach.call(grille.children, function (li) {
        var b = li.firstChild, id = b.getAttribute('data-id'), on = id === valeur.id;
        b.innerHTML = svg({ id: id, couleur: valeur.couleur }, { taille: 76, da: da, lumiere: L, titre: false });
        b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      });
      Array.prototype.forEach.call(teintes.children, function (li) {
        var b = li.firstChild, on = b.getAttribute('data-couleur') === valeur.couleur;
        b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
      });
    }
    function changer(partiel) {
      var n = normaliser({ id: partiel.id || valeur.id, couleur: partiel.couleur || valeur.couleur });
      if (n.id === valeur.id && n.couleur === valeur.couleur) return;
      valeur = n; dessiner(true);
      if (typeof o.onChange === 'function') o.onChange({ id: n.id, couleur: n.couleur });
    }
    function clavier(e, groupe, attr, colonnes) {
      var bs = Array.prototype.map.call(groupe.children, function (li) { return li.firstChild; }), i = bs.indexOf(document.activeElement), d = 0;
      if (i < 0) return;
      if (e.key === 'ArrowRight') d = 1; else if (e.key === 'ArrowLeft') d = -1; else if (e.key === 'ArrowDown') d = colonnes; else if (e.key === 'ArrowUp') d = -colonnes;
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); var p = {}; p[attr === 'data-id' ? 'id' : 'couleur'] = bs[i].getAttribute(attr); changer(p); return; }
      else return;
      e.preventDefault();
      var j = Math.max(0, Math.min(bs.length - 1, i + d)); bs[j].focus();
      var q = {}; q[attr === 'data-id' ? 'id' : 'couleur'] = bs[j].getAttribute(attr); changer(q);
      Array.prototype.forEach.call(bs, function (b, k) { b.tabIndex = k === j ? 0 : -1; });
    }
    grille.addEventListener('click', function (e) { var b = e.target.closest('.av-choix'); if (b) changer({ id: b.getAttribute('data-id') }); });
    teintes.addEventListener('click', function (e) { var b = e.target.closest('.av-teinte'); if (b) changer({ couleur: b.getAttribute('data-couleur') }); });
    grille.addEventListener('keydown', function (e) { clavier(e, grille, 'data-id', 4); });
    teintes.addEventListener('keydown', function (e) { clavier(e, teintes, 'data-couleur', 1); });
    conteneur.appendChild(racine); dessiner(false);
    return {
      valeur: function () { return { id: valeur.id, couleur: valeur.couleur }; },
      definir: function (a) { valeur = normaliser(a); dessiner(false); },
      rafraichir: function (opts) { if (opts && opts.da) da = opts.da === 'origine' ? 'origine' : 'r2'; dessiner(false); },
      detruire: function () { if (racine.parentNode) racine.parentNode.removeChild(racine); }
    };
  }

  global.AthenaAvatars = { version: 1, LISTE: LISTE, COULEURS: COULEURS, DEFAUT: DEFAUT, CREDITS: CREDITS, normaliser: normaliser, svg: svg, monter: monter };
})(typeof window !== 'undefined' ? window : this);
