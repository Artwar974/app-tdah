/*
 * athena-scene.js — le camp ATHENA dans une seule scène (PixiJS v8), décrite par un fichier JSON.
 *
 * 20/10 · la scène est LE moteur du monde du jeu dans le prototype (Prototype.dc.html, Camp-scene.html, atelier.html) : le camp, ses personnages,
 * sa lumière et ses particules sont dessinés ici ; l'interface (haut du camp, barre des quêtes, feuilles, cartes, Journal) reste en HTML par-dessus,
 * reliée par les événements de la scène. L'ancien moteur du camp (athena-decor.js, athena-objets-animes.js, athena-camp-lumiere.js) est aux Archives.
 * PixiJS demandé : 8.22.0 (https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js, chargé par les trois pages ; rien en dessous de 8.18, qui apporte
 * l'héritage du mode de fusion par les particules). API récentes utilisées : ParticleContainer et Particle (les particules du monde, une famille par
 * conteneur, dynamicProperties limitées), Ticker.maxFPS (reglages.cadence : 60, ou 30 en mode léger), Culler.shared et cullable (préparés pour la caméra,
 * reglages.cull), Texture avec cadre dans une planche, Mesh + Shader.from + UniformGroup (le fond, le mont), MeshPlane (les vagues), Graphics (les dessins
 * provisoires), un seul Text (le « z » du sommeil). Les API d'avant 8.6 restent telles quelles : rien n'a dû changer entre 8.6.6 et 8.22.0.
 * Mêmes commandes que l'ancien AthenaDecor.monter, plus de quoi faire vivre le camp :
 *
 *   const scene = await AthenaScene.monter(canvas, {
 *     scene: 'commun/athena-scene.json', // ou l'objet déjà chargé
 *     heure: () => 10.25,                // nombre ou fonction ; absent = heure locale
 *     vieAmbiante: true,                 // lucioles, oiseaux
 *     mouvementReduit: false,            // absent = réglage du système (prefers-reduced-motion)
 *     onPret() {}, onLumiere(etat) {}, onErreur(message) {}, resoudre(chemin) {}
 *   });
 *   scene.pause(); scene.reprendre(); scene.lumiere(); scene.detruire();   // comme AthenaDecor
 *   scene.emettre('sommet');                    // un événement du jeu : toucher, quete-validee ({ cle }), sommet, mont-palier ({ n }), mont-paliers ({ n }), retour, feu-rallume, soir…
 *                                               // (19/10) coffre-recoit (le minotaure va parfois voir le coffre), compagnon-arrive ({ compagnon }) : les autres vont à sa rencontre
 *   scene.camera({ x, y, z, cache });           // (19/10) le cadrage de base : x, y le point de la scène au centre, z le zoom (1 = vue large), cache : pixels masqués en bas par une feuille
 *   scene.geste('minotaure', 'etire');          // (19/10) la vie au repos sur commande : mer, etire, gratte, feu, tapote, banc, baille, aurevoir, signe
 *   options.onCamera(etat)                      // (19/10) à chaque mouvement de caméra : { x, y, z, dx, dy } ; la page y fait suivre ses calques HTML (translate(dx, dy) scale(z))
 *   scene.definir('feu', { jauge: 'braises' })  // (19/10) la jauge du feu : braises, stable, ardent — la lumière et la couleur seulement, le dessin ne grandit pas (08/10)
 *   scene.reglages.legere = true                // (19/10) « Animations légères » : moins de particules et de vie ambiante
 *   scene.reglages.falaiseGauche = 0            // (22/10) la falaise gauche du tableau d'origine (fond.falaiseGauche) : 1 = posée (défaut), 0 = cachée
 *   scene.perf                                  // (19/10) { moyenneMs, images } : le temps passé dans la boucle depuis la dernière lecture (outils/fps-test.html)
 *   scene.ecume                                 // (22/10) l'écume peinte effacée des fonds au chargement : { ms par moment, masqueMs, prets, brut } ; reglages.ecumePeinte = 1 relie les fonds bruts
 *   scene.on('toucher', e => …);                // écouter la scène (e.cible = id de l'élément touché)
 *   scene.ajouter({ id, type, … });             // ajouter un élément décrit comme dans le JSON
 *   scene.definir('tente', { niveau: 2 });      // changer un élément (niveau, position, visible…)
 *   scene.retirer(id);  scene.element(id);  scene.compagnon(id)
 *
 * Repère unique : 720 × 1280, x = centre, y = pied de l'élément. Cadrage « cover » comme le décor actuel.
 * Les briques : « fixe » (une image, avec du vent possible), « sprites » (une planche d'images),
 * « personnage » (une marionnette, voir athena-marionnette.js), « zone » (un endroit touchable invisible).
 * Le fond (ciel, nuages, mer, cascade, végétation, lumière) est un seul effet calculé par la carte graphique.
 */
(function (global) {
  'use strict';
  const W = 720, H = 1280;

  // ---------- le fond : un seul shader pour ciel, nuages, étoiles, mer, végétation et lumière du feu
  const VERT = `
in vec2 aPosition; in vec2 aUV; out vec2 vUV;
uniform mat3 uProjectionMatrix; uniform mat3 uWorldTransformMatrix; uniform mat3 uTransformMatrix;
void main(){ mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(aPosition, 1.0)).xy, 0.0, 1.0); vUV = aUV; }`;
  const FRAG = `
precision highp float;
in vec2 vUV;
uniform sampler2D uFondA; uniform sampler2D uFondB; uniform sampler2D uFondJour;
uniform sampler2D uCielA; uniform sampler2D uCielB; uniform sampler2D uNuages; uniform sampler2D uMatiere;
uniform sampler2D uSoleilTex; uniform sampler2D uLuneTex; uniform vec2 uAstres;
uniform sampler2D uVaguesTex; uniform vec4 uVG; uniform vec2 uVZone; uniform float uVaguesImg; uniform vec3 uEcumeCouleur; uniform float uVagues; uniform vec2 uHoule;
uniform sampler2D uMasques;
uniform float uMix; uniform float uTemps; uniform float uEau; uniform float uVent; uniform float uVitesseNuages; uniform float uReflets;
uniform float uEtoiles; uniform float uHorizon; uniform float uCouche; uniform float uCielHaut;
uniform vec3 uFeu; uniform vec3 uFeuCouleur; uniform vec3 uReflet;
uniform vec3 uNuageCouleur; uniform vec2 uNuage; uniform vec3 uSoleil; uniform vec3 uLune;
uniform vec3 uRafale; uniform float uBrume; uniform vec3 uBrumeCouleur; uniform float uPhase;
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float bruit(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
// une image de l'écume (3 images par case : rouge, vert, bleu)
float ecumeImg(float k, vec2 f) {
  float c = floor(k / 3.0), ch = k - c * 3.0;
  vec2 cell = vec2(mod(c, uVG.x), floor(c / uVG.x));
  vec2 t = (cell + clamp(f, vec2(0.5 / uVG.w), vec2(1.0 - 0.5 / uVG.w))) / uVG.xy;
  vec3 s = texture(uVaguesTex, t).rgb;
  return ch < 0.5 ? s.r : (ch < 1.5 ? s.g : s.b);
}
vec3 fond(vec2 uv){ return mix(texture(uFondA, uv).rgb, texture(uFondB, uv).rgb, uMix); }
void main(){
  vec2 uv = vUV; vec2 p = uv * vec2(${W}.0, ${H}.0);
  vec4 m = texture(uMasques, uv);
  // 22/10 · le premier plan (uCouche = 1) ne montre que les grands conifères du bas (alpha = m.g au-delà de y = 850) : ailleurs,
  // on sort tout de suite au lieu de recalculer la mer et le ciel pour rien (la moitié du coût du fond)
  if (uCouche > 0.5 && uCouche < 1.5 && (p.y < 850.0 || m.g < 0.002)) { gl_FragColor = vec4(0.0); return; }
  // la brume du matin : une couche à part, posée au-dessus du mont (uCouche = 2)
  if (uCouche > 1.5) {
    vec2 px1 = vec2(5.0 / ${W}.0, 0.0), py1 = vec2(0.0, 4.0 / ${H}.0);
    float eauDouce = (m.r * 2.0 + texture(uMasques, uv + px1).r + texture(uMasques, uv - px1).r + texture(uMasques, uv + py1).r + texture(uMasques, uv - py1).r) / 6.0;
    float cielBas = m.b * smoothstep(uHorizon - 70.0, uHorizon - 5.0, p.y);
    float zone = max(eauDouce * (1.0 - smoothstep(560.0, 760.0, p.y)), cielBas);
    float nb = bruit(vec2(p.x * 0.011 + uTemps * 0.018, p.y * 0.034)) * 0.6 + bruit(vec2(p.x * 0.028 - uTemps * 0.026, p.y * 0.075)) * 0.4;
    float a = uBrume * zone * smoothstep(0.22, 0.8, nb) * 0.6;
    gl_FragColor = vec4(uBrumeCouleur * a, a);
    return;
  }
  // une rafale qui traverse la scène de gauche à droite (x, force)
  float rafale = 1.0 + uRafale.y * exp(-pow((p.x - uRafale.x) / 150.0, 2.0));
  vec2 uvB = uv;
  // végétation : un souffle lent, plus marqué en haut des arbres
  if (m.g > 0.01) {
    float s = sin(uTemps*1.15 + p.x*0.031 + p.y*0.006)*0.65 + sin(uTemps*0.53 + p.x*0.011)*0.35 + (bruit(vec2(p.x*0.05, uTemps*0.6))-0.5)*0.5;
    uvB.x += s * m.g * 1.35 * uVent * rafale / ${W}.0;
  }
  // mer : réfraction douce, plus ample près du rivage, rien sur la terre
  // 22/10 · l'écume peinte au large (les longs traits blancs fixes du milieu de la baie, dans les quatre images du fond) n'est plus
  // traitée ici : les quatre fonds sont nettoyés une fois, au chargement, sur le CPU (masqueEauFerme et nettoyerFond, plus bas), et
  // uMasques est le masque d'eau fermé (les fines bandes claires exclues du masque sont de l'eau : elle y ondule). effets.ecumePeinte = 1
  // relie les fonds bruts. L'ancien bloc (8 échantillons autour de chaque pixel) ne changeait presque rien sur les traits et dilatait
  // les zones sombres de l'eau : le reflet du rocher de gauche paraissait doublé.
  float eau = m.r; float n = 0.0; float prof = clamp((p.y - uHorizon) / 420.0, 0.0, 1.0);
  if (eau > 0.01) {
    n = bruit(vec2(p.x*0.011 - uTemps*0.05, p.y*mix(0.1, 0.032, prof)));
    // deux ondes lentes qui se croisent sans se presser : une fine, et la houle, plus longue et plus lente
    float w = sin(p.y*mix(0.46, 0.15, prof) - uTemps*0.8 + n*3.2) * 0.65 + sin(p.y*mix(0.19, 0.065, prof) + p.x*0.006 - uTemps*0.45) * 0.35;
    float a = mix(0.4, 1.9, prof) * uEau;
    vec2 d = vec2(w*a / ${W}.0, w*a*0.22 / ${H}.0);
    if (texture(uMasques, uv + d).r > 0.5) uvB += d * eau;
  }
  vec3 col = fond(uvB);
  if (eau > 0.01) {
    float b2 = bruit(vec2(p.x*0.045 + uTemps*0.1, p.y*0.26 - uTemps*0.22));
    // 22/10 · les reflets : des éclats un peu plus larges (puissance 20 au lieu de 28) qui naissent et s'éteignent plus lentement
    // (fenêtre de bruit 0,5-0,86 au lieu de 0,58-0,82) : ils scintillaient trop vite (clignotement)
    float g = pow(max(0.0, sin(p.x*0.05 + n*6.0 + uTemps*0.28) * sin(p.y*mix(1.0,0.38,prof) - uTemps*0.55 + b2*2.5)), 20.0) * smoothstep(0.5, 0.86, b2);
    col += uReflet * g * eau * uReflets * mix(0.3, 0.8, prof);
    // vagues : l'écume de la vidéo actuelle, gardée seule (83 images en une planche), fondue d'une image à la suivante
    if (uVagues > 0.001 && p.y > uVZone.x && p.y < uVZone.y) {
      vec2 f = vec2(p.x / ${W}.0, (p.y - uVZone.x) / (uVZone.y - uVZone.x));
      // lecture lissée dans le temps (spline cubique sur 4 images) : l'écume glisse au lieu de sautiller d'une image à l'autre
      float k1 = floor(uVaguesImg), tt = uVaguesImg - k1, t2 = tt * tt, t3 = t2 * tt;
      float k0 = mod(k1 - 1.0 + uVG.z, uVG.z), k2 = mod(k1 + 1.0, uVG.z), k3 = mod(k1 + 2.0, uVG.z);
      float ec = ecumeImg(k0, f) * (1.0 - 3.0*tt + 3.0*t2 - t3) / 6.0 + ecumeImg(k1, f) * (4.0 - 6.0*t2 + 3.0*t3) / 6.0
               + ecumeImg(k2, f) * (1.0 + 3.0*tt + 3.0*t2 - 3.0*t3) / 6.0 + ecumeImg(k3, f) * t3 / 6.0;
      ec = smoothstep(0.2, 0.62, ec);
      // des séries de vagues : elles arrivent du large vers le rivage, puis la mer se calme un moment (« effets.houle » :
      // la durée d'une série, et combien l'écume baisse entre deux séries)
      float sv = fract((uTemps - (p.y - uVZone.x) * 0.011 + sin(p.x * 0.009) * 0.7) / max(uHoule.x, 1.0));
      float serie = smoothstep(0.0, 0.3, sv) * (1.0 - smoothstep(0.5, 0.88, sv));
      col = mix(col, uEcumeCouleur, ec * eau * uVagues * 0.9 * mix(1.0 - uHoule.y, 1.0, serie));
    }
    // le reflet du soleil et de la lune sur la mer : une colonne de scintillements sous l'astre, plus longue quand il est bas
    // 22/10 · la colonne de l'astre : un scintillement plus lent (le bruit défile à 0,14 et 0,32 au lieu de 0,2 et 0,5) et un peu plus doux (puissance 4)
    float scint = pow(bruit(vec2(p.x * 0.24 + uTemps * 0.14, p.y * 0.85 - uTemps * 0.32)), 4.0) * 3.6;
    // 22/10 · liste V2 (5.5) : la colonne part de l'horizon et s'éteint vite (plus rien au-delà de la moitié de la profondeur de la baie)
    float pres = pow(1.0 - smoothstep(0.0, 0.5, prof), 1.4);
    if (uSoleil.z > 0.001) {
      float vu = texture(uMasques, clamp(uSoleil.xy / vec2(${W}.0, ${H}.0), 0.0, 1.0)).b;
      float bas = 1.0 - clamp((uHorizon - uSoleil.y) / 280.0, 0.0, 1.0);
      float colonne = exp(-pow((p.x - uSoleil.x) / (9.0 + 40.0 * prof), 2.0));
      col += vec3(1.0, 0.86, 0.6) * colonne * scint * uSoleil.z * vu * (0.3 + 0.7 * bas) * pres * eau * 0.85;
    }
    if (uLune.z > 0.001) {
      float vu = texture(uMasques, clamp(uLune.xy / vec2(${W}.0, ${H}.0), 0.0, 1.0)).b;
      float eclaire = 0.5 - 0.5 * cos(6.2831853 * uPhase);
      float colonne = exp(-pow((p.x - uLune.x) / (7.0 + 30.0 * prof), 2.0));
      col += vec3(0.72, 0.8, 1.0) * colonne * scint * uLune.z * vu * eclaire * pres * eau * 0.7;
    }
  }
  // ciel : ciel sans nuages, soleil ou lune, puis les nuages qui dérivent (bande qui boucle, bords transparents)
  if (p.y < uHorizon + 1.0 && m.b > 0.0) {
    float y01 = clamp((p.y + uCielHaut) / (uHorizon + uCielHaut), 0.0, 1.0);   // 22/10 · le dégradé couvre aussi la bande de ciel au-dessus du tableau
    vec3 ciel = mix(texture(uCielA, vec2(uv.x, y01)).rgb, texture(uCielB, vec2(uv.x, y01)).rgb, uMix);
    // le soleil : disque doré, halo chaud, quelques rayons fins (même dessin que le décor actuel)
    if (uSoleil.z > 0.001) {
      vec2 d = p - uSoleil.xy; float r = length(d), R = uAstres.x;
      vec4 st = texture(uSoleilTex, clamp(d / (2.0 * R) + 0.5, 0.0, 1.0));
      vec3 coeur = mix(vec3(1.0, 0.996, 0.95), vec3(1.0, 0.74, 0.33), smoothstep(0.0, R, r));
      vec3 sc = mix(coeur, st.a > 0.01 ? st.rgb / st.a : coeur, 0.45);
      float disque = smoothstep(R, R - 1.6, r);
      float e = max(r - R, 0.0);
      float halo = exp(-e / (R * 1.2)) * 0.34 + exp(-e / (R * 4.6)) * 0.16;
      float a = atan(d.y, d.x);
      float rayons = pow(max(0.0, sin(a * 6.0 + uTemps * 0.04)), 160.0) * smoothstep(R * 4.5, R * 1.1, r) * 0.16;
      ciel = mix(ciel, sc, disque * uSoleil.z) + vec3(1.0, 0.68, 0.34) * (halo + rayons) * uSoleil.z * (1.0 - disque);
    }
    // la lune : le modèle peint, avec son halo
    if (uLune.z > 0.001) {
      vec2 d = (p - uLune.xy) / (uAstres.y * 2.6) + 0.5;
      if (d.x > 0.0 && d.x < 1.0 && d.y > 0.0 && d.y < 1.0) {
        vec4 lt = texture(uLuneTex, d);
        // la phase du jour : la partie dans l'ombre reste sombre (lumière cendrée), le halo baisse avec elle
        vec2 q = (p - uLune.xy) / uAstres.y; float rq = length(q), cph = cos(6.2831853 * uPhase), s2 = sqrt(max(0.0, 1.0 - q.y * q.y));
        float lit = uPhase < 0.5 ? smoothstep(cph * s2 - 0.07, cph * s2 + 0.07, q.x) : 1.0 - smoothstep(-cph * s2 - 0.07, -cph * s2 + 0.07, q.x);
        float eclaire = 0.5 - 0.5 * cph;
        if (rq < 1.0) lt = vec4(lt.rgb * mix(0.1, 1.0, lit), lt.a * mix(0.32, 1.0, lit)); else lt *= mix(0.3, 1.0, eclaire);
        ciel = ciel * (1.0 - lt.a * uLune.z) + lt.rgb * uLune.z;
      }
    }
    vec2 cu = vec2(fract(uv.x * 0.56 + uTemps * uVitesseNuages), y01);
    vec2 dn = vec2(bruit(vec2(cu.x * 14.0 + uTemps * 0.03, y01 * 5.0)) - 0.5, bruit(vec2(cu.x * 11.0, y01 * 4.0 - uTemps * 0.025)) - 0.5) * vec2(0.005, 0.009);
    vec2 cn0 = cu + dn, ex = vec2(2.0 / 1280.0, 0.0), ey = vec2(0.0, 2.0 / 360.0);
    vec4 nu = texture(uNuages, cn0) * 0.4 + (texture(uNuages, cn0 + ex) + texture(uNuages, cn0 - ex) + texture(uNuages, cn0 + ey) + texture(uNuages, cn0 - ey)) * 0.15;
    vec3 cn = nu.a > 0.001 ? nu.rgb / nu.a : vec3(1.0);
    float ln = dot(cn, vec3(0.3, 0.59, 0.11));
    float mat = texture(uMatiere, vec2(fract(cu.x * 1.78), clamp((y01 - 0.078) / 0.464, 0.0, 1.0))).r;
    vec3 teinteN = mix(ciel * 1.1 + 0.05, uNuageCouleur, uNuage.x * 0.85);
    vec3 cc = teinteN * (0.8 + 0.3 * ln) * mix(1.0, 0.8 + 0.4 * mat, 0.55);
    // leurs bords changent lentement de forme : un bruit qui évolue avance ou recule les bords doux (le cœur reste plein)
    float ev = bruit(vec2(cu.x * 7.0 + uTemps * 0.012, y01 * 3.5 - uTemps * 0.008)) * 0.6 + bruit(vec2(cu.x * 15.0 - uTemps * 0.019, y01 * 8.0 + uTemps * 0.01)) * 0.4;
    float forme = clamp(nu.a + (ev - 0.5) * 2.4 * nu.a * (1.0 - nu.a), 0.0, 1.0);
    float an = forme * uNuage.y * 0.72 * smoothstep(1.0, 0.55, y01);
    vec3 c2 = mix(ciel, cc, an);
    nu.a = an;
    if (uEtoiles > 0.01) {
      vec2 cell = floor(p / 7.0); float r = h21(cell);
      if (r > 0.985) { vec2 c = (cell + 0.5 + (vec2(h21(cell+3.1), h21(cell+7.7))-0.5)*0.6) * 7.0;
        float d = length(p - c); float tw = 0.55 + 0.45*sin(uTemps*(1.0 + r*3.0) + r*40.0);
        c2 += vec3(0.85, 0.9, 1.0) * smoothstep(1.4, 0.0, d) * tw * uEtoiles * (1.0 - nu.a) * (1.0 - p.y/uHorizon*0.6); }
    }
    col = mix(col, c2, m.b);
  }
  // la flaque de lumière du feu au sol (le soir et la nuit)
  if (uFeu.z > 0.001) {
    vec2 q = (p - uFeu.xy) / vec2(210.0, 120.0); float f = exp(-dot(q, q) * 1.6);
    float vac = 0.92 + 0.08*sin(uTemps*9.0) * sin(uTemps*5.3 + 1.0);
    vec3 jour = texture(uFondJour, uvB).rgb * uFeuCouleur;
    col = mix(col, jour, clamp(f * uFeu.z * vac, 0.0, 1.0) * (1.0 - eau));
  }
  float alpha = 1.0;
  if (uCouche > 0.5) alpha = m.g * step(850.0, p.y);   // le premier plan : seulement les grands conifères du bas
  gl_FragColor = vec4(col * alpha, alpha);
}`;

  // le mont : ses cyprès et ses arbustes bougent au vent, la base de chaque arbre reste fixe (masque mont_vent.png)
  const FRAG_MONT = `
precision highp float;
in vec2 vUV;
uniform sampler2D uMont; uniform sampler2D uVentMasque;
uniform float uTemps; uniform float uVent; uniform vec3 uRafale; uniform vec2 uOrigine; uniform vec2 uTaille;
uniform vec4 uColor;
void main(){
  vec4 vm = texture(uVentMasque, vUV);
  vec2 p = vUV * uTaille + uOrigine;
  float w = sin(uTemps * 1.25 + p.x * 0.045 + p.y * 0.012) * 0.6 + sin(uTemps * 2.3 + p.x * 0.13) * 0.25 + sin(uTemps * 0.6 + p.y * 0.02) * 0.15;
  float raf = 1.0 + uRafale.y * exp(-pow((p.x - uRafale.x) / 150.0, 2.0));
  float d = w * pow(vm.g, 1.4) * 1.5 * uVent * raf * vm.r;
  gl_FragColor = texture(uMont, vUV - vec2(d / uTaille.x, 0.0)) * uColor;
}`;

  // « a/b/../c » → « a/c » : les chemins passés à resoudre() sont toujours propres (utile pour window.__resources)
  const normaliser = c => { if (/^(data:|blob:|https?:|\/)/.test(c)) return c; const out = []; for (const p of c.split('/')) { if (p === '..' && out.length && out[out.length - 1] !== '..') out.pop(); else if (p !== '.') out.push(p); } return out.join('/'); };
  const lisse = t => t * t * t * (t * (t * 6 - 15) + 10);

  // ---------- 22/10 · liste V2 (5.4) : l'écume peinte au large, effacée des quatre fonds une fois, au chargement, sur le CPU
  // Les longs traits blancs fixes du milieu de la baie sont peints dans les quatre images fond/fond_<moment>.webp. Le bloc d'effacement
  // qu'avait le shader (8 échantillons à 26 px autour de chaque pixel) ne changeait presque rien sur les traits et dilatait les zones
  // sombres de l'eau (le reflet du rocher de gauche paraissait doublé). Ici, en deux temps, sur la bande de lignes qui contient de l'eau :
  //   1. masqueEauFerme : le masque d'eau « fermé », à partir du canal rouge de masques.png et du tableau du jour. Les blobs de terre
  //      isolés (sans lien avec le bord de la bande) clairs et froids sont de l'écume : ils deviennent de l'eau ; les sombres ou chauds
  //      (un rocher, du sable) restent de la terre. Une fermeture morphologique (dilatation puis érosion, carré de rayon 14) rend à
  //      l'eau les fines bandes claires et froides reliées à la terre (un ponton, une pointe de rocher, une langue de sable restent de
  //      la terre). « intérieur » = cette eau érodée de 4 px : rien ne change à moins de 4 px de la vraie terre (le liseré peint des
  //      rochers et des falaises reste) ; la bande de brume au-dessus de l'horizon + 40 non plus.
  //   2. nettoyerFond : pour chaque fond, la luminance et une référence locale (la moyenne de l'eau à 24 px), en deux moyennes : la
  //      première sur tout l'intérieur ; la deuxième sans les pixels nettement plus clairs que la première (+ 3 % ou 12 % de la
  //      référence), dilatés de 3 px, pour que les traits eux-mêmes ne tirent pas la référence vers le clair, sans les pixels nettement
  //      plus sombres (les reflets des rochers), pour ne pas assombrir l'eau autour d'eux, ni les pixels peu bleus (la roche). Un pixel
  //      plus clair que cette référence est fondu (smoothstep entre deux seuils qui suivent la référence : la nuit, le contraste des
  //      traits est faible) vers la couleur de l'eau voisine (la moyenne à 28 px des pixels gardés tels quels). Les zones sombres ne
  //      bougent pas, la roche non plus (le rocher de gauche est de l'eau dans masques.png : son bleu, bien sous celui de l'eau, le trahit).
  // Tout en typed arrays : flous boîte séparables à somme glissante, dilatations binaires à compte glissant, parcours de blobs à pile.
  // Coût linéaire : voir scene.ecume et le journal de Camp-scene.html (le masque, puis chaque fond, en ms).
  const ECUME = { rayon: 24, remplissage: 28, fermeture: 14, marge: 4, seuil1: .03, seuil1R: .12, s0: .012, s0R: .055, s1: .04, s1R: .15, bleuRoche: .08, bleu: .035 };
  // Un flou boîte (fenêtre 2r + 1, bords bornés : la moyenne des pixels de la fenêtre qui existent), de src vers dst, tmp de même taille.
  const flouBoite = (src, dst, tmp, w, h, r) => {
    const rw = Math.min(r, w - 1), xA = Math.min(r, w), xB = Math.max(xA, w - r - 1), inv = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) {
      const o = y * w; let s = 0, x = 0;
      for (let i = 0; i <= rw; i++) s += src[o + i];
      for (; x < xA; x++) { tmp[o + x] = s / (Math.min(w - 1, x + r) + 1); if (x + r + 1 < w) s += src[o + x + r + 1]; }   // bord gauche : fenêtre tronquée
      for (; x < xB; x++) { tmp[o + x] = s * inv; s += src[o + x + r + 1] - src[o + x - r]; }                            // fenêtre pleine
      for (; x < w; x++) { tmp[o + x] = s / (w - Math.max(0, x - r)); if (x - r >= 0) s -= src[o + x - r]; }              // bord droit
    }
    const col = new Float64Array(w), n = Math.min(r, h - 1); let lo = 0, hi = n;
    for (let y = 0; y <= n; y++) { const o = y * w; for (let x = 0; x < w; x++) col[x] += tmp[o + x]; }
    for (let y = 0; y < h; y++) {
      const o = y * w, k = 1 / (hi - lo + 1);
      for (let x = 0; x < w; x++) dst[o + x] = col[x] * k;
      const nhi = y + 1 + r, nlo = y + 1 - r, entre = nhi < h, sort = nlo > 0;
      if (entre && sort) { const o2 = nhi * w, o3 = (nlo - 1) * w; for (let x = 0; x < w; x++) col[x] += tmp[o2 + x] - tmp[o3 + x]; hi = nhi; lo = nlo; }
      else if (entre) { const o2 = nhi * w; for (let x = 0; x < w; x++) col[x] += tmp[o2 + x]; hi = nhi; }
      else if (sort) { const o3 = (nlo - 1) * w; for (let x = 0; x < w; x++) col[x] -= tmp[o3 + x]; lo = nlo; }
    }
  };
  // Une dilatation binaire (Uint8Array de 0/1, carré de rayon r) : 1 dès qu'un pixel de la fenêtre est à 1 ; compte glissant, coût linéaire.
  // L'érosion est la dilatation du complément (hors de la bande, rien n'érode : le bord de l'image n'est pas de la terre).
  const dilater = (src, dst, tmp, w, h, r) => {
    for (let y = 0; y < h; y++) {
      const o = y * w; let s = 0;
      for (let x = 0; x < r && x < w; x++) s += src[o + x];
      for (let x = 0; x < w; x++) { if (x + r < w) s += src[o + x + r]; tmp[o + x] = s > 0 ? 1 : 0; if (x >= r) s -= src[o + x - r]; }
    }
    const col = new Int32Array(w);
    for (let y = 0; y < r && y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) col[x] += tmp[o + x]; }
    for (let y = 0; y < h; y++) {
      const o = y * w;
      if (y + r < h) { const o2 = (y + r) * w; for (let x = 0; x < w; x++) col[x] += tmp[o2 + x]; }
      for (let x = 0; x < w; x++) dst[o + x] = col[x] > 0 ? 1 : 0;
      if (y >= r) { const o3 = (y - r) * w; for (let x = 0; x < w; x++) col[x] -= tmp[o3 + x]; }
    }
  };
  const eroder = (src, dst, tmp, tmp2, w, h, r) => { const n = w * h; for (let i = 0; i < n; i++) tmp2[i] = 1 - src[i]; dilater(tmp2, dst, tmp, w, h, r); for (let i = 0; i < n; i++) dst[i] = 1 - dst[i]; };
  const lisse01 = (a, b, x) => { const t = x <= a ? 0 : x >= b ? 1 : (x - a) / (b - a); return t * t * (3 - 2 * t); };
  // les tampons de travail (partagés par le masque et les quatre fonds, libérés quand les quatre sont prêts) : 7 Float32Array et 5 Uint8Array de n
  const tamponsDe = n => ({ A: new Float32Array(n), B: new Float32Array(n), C: new Float32Array(n), D: new Float32Array(n), E: new Float32Array(n), F: new Float32Array(n), tmp: new Float32Array(n), u1: new Uint8Array(n), u2: new Uint8Array(n), u3: new Uint8Array(n), u4: new Uint8Array(n), u5: new Uint8Array(n) });
  // 1. le masque d'eau fermé. mq, jour : les pixels RVBA (Uint8ClampedArray) de la bande, w × h ; yBande : la première ligne de la bande
  // dans le tableau ; horizon : la ligne d'horizon. Renvoie eauF, interieur, zone, rempli (Uint8Array de 0/1), bInt (Float32Array), tampons, blobs, ajoutes.
  function masqueEauFerme(mq, jour, w, h, yBande, horizon) {
    const n = w * h, T = tamponsDe(n), { A, B, C, E, tmp } = T, Lj = T.D, eau0 = new Uint8Array(n), roche = new Uint8Array(n), froid = T.u4, t1 = T.u1, t2 = T.u2, ferme = T.u3;
    for (let i = 0; i < n; i++) { eau0[i] = mq[i * 4] > 127 ? 1 : 0; Lj[i] = (jour[i * 4] * .3 + jour[i * 4 + 1] * .59 + jour[i * 4 + 2] * .11) / 255; froid[i] = jour[i * 4] - jour[i * 4 + 2] < 16 ? 1 : 0; }
    // la fermeture : dilatation puis érosion (rayon 14)
    dilater(eau0, t1, t2, w, h, ECUME.fermeture); eroder(t1, ferme, t2, t1, w, h, ECUME.fermeture);
    // la référence de l'eau (tableau du jour) : la moyenne locale (rayon 24) de la luminance et du bleu de l'eau du masque. Un pixel du masque
    // d'eau dont le bleu est bien sous celui de l'eau autour (− 8 %) est de la roche peinte dans l'eau (le rocher de gauche, que masques.png
    // compte comme de l'eau) : il n'est jamais touché et garde sa marge, comme la terre. L'écume, elle, est de l'eau blanchie : son bleu ne baisse pas.
    for (let i = 0; i < n; i++) { A[i] = eau0[i]; B[i] = Lj[i] * eau0[i]; E[i] = jour[i * 4 + 2] / 255 * eau0[i]; }
    flouBoite(A, C, tmp, w, h, ECUME.rayon); flouBoite(B, A, tmp, w, h, ECUME.rayon); flouBoite(E, B, tmp, w, h, ECUME.rayon);
    const refM = A; let roches = 0;
    for (let i = 0; i < n; i++) { const p = C[i] > 1e-4 ? 1 / C[i] : 0; refM[i] = A[i] * p; roche[i] = eau0[i] && jour[i * 4 + 2] / 255 - B[i] * p < -ECUME.bleuRoche ? 1 : 0; roches += roche[i]; }
    // les blobs de terre isolés : parcours (4-connexité, pile) de la terre depuis les bords de la bande ; ce qui n'est pas atteint est un blob
    const vu = t1, pile = new Int32Array(n), membres = new Int32Array(n); let np = 0, nb = 0, sL = 0, sR = 0, nF = 0;
    vu.fill(0);
    const parcourir = (garder) => {
      while (np) {
        const i = pile[--np], x = i % w; let j;
        if (garder) { membres[nb++] = i; sL += Lj[i]; sR += refM[i]; nF += froid[i]; }
        if (x > 0) { j = i - 1; if (!vu[j] && !eau0[j]) { vu[j] = 1; pile[np++] = j; } }
        if (x < w - 1) { j = i + 1; if (!vu[j] && !eau0[j]) { vu[j] = 1; pile[np++] = j; } }
        if (i >= w) { j = i - w; if (!vu[j] && !eau0[j]) { vu[j] = 1; pile[np++] = j; } }
        if (i + w < n) { j = i + w; if (!vu[j] && !eau0[j]) { vu[j] = 1; pile[np++] = j; } }
      }
    };
    const empiler = i => { if (!vu[i] && !eau0[i]) { vu[i] = 1; pile[np++] = i; } };
    for (let x = 0; x < w; x++) { empiler(x); empiler((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { empiler(y * w); empiler(y * w + w - 1); }
    parcourir(false);
    const rempli = new Uint8Array(n); let blobs = 0;
    for (let i0 = 0; i0 < n; i0++) {
      if (vu[i0] || eau0[i0]) continue;
      blobs++; nb = 0; sL = 0; sR = 0; nF = 0; vu[i0] = 1; pile[np++] = i0; parcourir(true);
      if (sL > sR + .03 * nb && nF > .7 * nb) for (let k = 0; k < nb; k++) rempli[membres[k]] = 1;   // clair et froid : de l'écume, c'est de l'eau ; sombre ou chaud : un rocher, du sable
    }
    // la fermeture : les fines bandes reliées à la terre deviennent de l'eau si elles sont claires et froides (un ponton, une pointe de rocher, du sable restent)
    for (let i = 0; i < n; i++) if (ferme[i] && !eau0[i] && froid[i] && Lj[i] > refM[i] - .02) rempli[i] = 1;
    const eauF = new Uint8Array(n); let ajoutes = 0;
    for (let i = 0; i < n; i++) { eauF[i] = eau0[i] | rempli[i]; ajoutes += rempli[i]; }
    // l'intérieur : l'eau fermée, sans la roche, érodée de 4 px ; la zone : l'intérieur sous l'horizon + 40 ; bInt : le poids local de l'intérieur (rayon 24)
    const interieur = new Uint8Array(n), zone = new Uint8Array(n), yMin = horizon + 40 - yBande;
    for (let i = 0; i < n; i++) t2[i] = eauF[i] && !roche[i] ? 1 : 0;
    eroder(t2, interieur, t1, ferme, w, h, ECUME.marge);
    for (let i = 0; i < n; i++) { zone[i] = interieur[i] && (i / w | 0) > yMin ? 1 : 0; A[i] = interieur[i]; }
    const bInt = new Float32Array(n); flouBoite(A, bInt, tmp, w, h, ECUME.rayon);
    return { eauF, interieur, zone, rempli, bInt, tampons: T, blobs, ajoutes, roches };
  }
  // La chauffe du moteur JavaScript : masqueEauFerme et nettoyerFond tournent d'abord six fois sur une petite bande synthétique (48 × 48 :
  // de l'eau, un blob de terre, trois traits), pour que leurs boucles soient compilées en code optimisé avant la vraie bande (720 × 494).
  // Mesuré avec Node 22 sur les vraies images : le premier appel à froid prenait près du double (masque 140 → 105 ms, fond 150 → 75 ms,
  // les 20 à 40 ms de la chauffe comprises, dont l'essentiel est la compilation, payée de toute façon au premier appel).
  function chaufferEcume() {
    const w = 48, h = 48, n = w * h, mq = new Uint8ClampedArray(n * 4), jour = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) {
      const x = i % w, y = i / w | 0, eau = y > 6 && y < 42 && !(x > 20 && x < 26 && y > 20 && y < 24), trait = eau && y % 12 < 2 && x > 8 && x < 40;
      mq[i * 4] = eau ? 255 : 0; jour[i * 4] = trait ? 230 : 60; jour[i * 4 + 1] = trait ? 235 : 110; jour[i * 4 + 2] = trait ? 240 : 180; jour[i * 4 + 3] = 255;
    }
    for (let k = 0; k < 6; k++) { const M = masqueEauFerme(mq, jour, w, h, 300, 290); nettoyerFond(new Uint8ClampedArray(jour), M, w, h); }
  }
  // 2. le nettoyage d'un fond : px, les pixels RVBA de la bande (modifiés sur place) ; M, le résultat de masqueEauFerme. Renvoie le nombre de pixels fondus.
  function nettoyerFond(px, M, w, h) {
    const n = w * h, { interieur, zone, bInt } = M;
    if (!M.tampons) M.tampons = tamponsDe(n);
    const { A: L, B, C, D, E, F, tmp, u1: cand, u2: excl, u3: typ, u4, u5 } = M.tampons, { rayon, remplissage, bleu } = ECUME;
    // la luminance, puis la référence 0 : la moyenne de l'eau de l'intérieur (rayon 24), en luminance (C) et en bleu (F). Un pixel dont le bleu
    // est sous celui de l'eau autour (− 3,5 %) n'est pas de l'eau blanchie (une roche, un reflet coloré) : ni fondu, ni pris dans les moyennes.
    for (let i = 0; i < n; i++) { const l = (px[i * 4] * .3 + px[i * 4 + 1] * .59 + px[i * 4 + 2] * .11) / 255; L[i] = l; B[i] = l * interieur[i]; D[i] = px[i * 4 + 2] / 255 * interieur[i]; }
    flouBoite(B, C, tmp, w, h, rayon); flouBoite(D, F, tmp, w, h, rayon);
    for (let i = 0; i < n; i++) { const p = bInt[i] > 1e-4 ? 1 / bInt[i] : 0; C[i] *= p; F[i] = px[i * 4 + 2] / 255 - F[i] * p > -bleu ? 1 : 0; }
    // la première passe : les pixels nettement plus clairs que la référence 0, dilatés de 3 px, sont exclus des moyennes qui suivent
    for (let i = 0; i < n; i++) cand[i] = zone[i] && L[i] - C[i] > Math.max(ECUME.seuil1, ECUME.seuil1R * C[i]) ? 1 : 0;
    dilater(cand, excl, u4, w, h, 3);
    // la référence 1 : la moyenne de l'eau typique (l'intérieur, hors exclus, hors pixels peu bleus, hors pixels nettement plus sombres que la
    // référence 0 : les reflets) ; là où elle n'a pas de pixels, la référence 0 reste
    for (let i = 0; i < n; i++) { const t = interieur[i] && !excl[i] && F[i] && L[i] > C[i] - .05 ? 1 : 0; typ[i] = t; B[i] = t; D[i] = L[i] * t; }
    flouBoite(B, E, tmp, w, h, rayon); flouBoite(D, B, tmp, w, h, rayon);
    for (let i = 0; i < n; i++) if (E[i] > 1e-3) C[i] = B[i] / E[i];
    // le fondu k : smoothstep entre deux seuils qui suivent la référence (s0 = max(0,012, 5,5 %), s1 = max(0,04, 15 %)), dans la zone seulement.
    // Un trait est un faisceau de fins filets clairs (1 à 3 px) séparés de creux sombres (l'ombre peinte sous l'écume) : le masque des
    // pixels fondus (k > 0,5) est fermé (dilaté de 3 px, érodé de 2 : les creux de 6 px au plus sont pris avec, le bord gagne 1 px), lissé
    // sur 3 × 3 pour un bord doux, et k est le plus grand des deux (le pixel clair lui-même reste fondu en plein, même au bord). Les pixels
    // gardés tels quels (typ : ni fondus, ni nettement sombres) donnent la couleur de remplissage.
    let fondus = 0;
    for (let i = 0; i < n; i++) {
      const r = C[i], d = L[i] - r; let k = 0;
      if (zone[i] && d > 0 && F[i]) k = lisse01(Math.max(ECUME.s0, ECUME.s0R * r), Math.max(ECUME.s1, ECUME.s1R * r), d);
      D[i] = k; cand[i] = k > .5 ? 1 : 0;
    }
    dilater(cand, excl, u4, w, h, 3); eroder(excl, cand, u4, u5, w, h, 2);
    for (let i = 0; i < n; i++) B[i] = cand[i] && zone[i] ? 1 : D[i];
    flouBoite(B, E, tmp, w, h, 1);
    for (let i = 0; i < n; i++) { const k = zone[i] ? Math.max(E[i], D[i]) : 0; E[i] = k; if (k > 0) fondus++; typ[i] = typ[i] && k <= 0 && L[i] > C[i] - .03 ? 1 : 0; D[i] = typ[i]; }
    // la couleur de remplissage : la moyenne (rayon 28) des pixels gardés ; B = son poids. Chaque canal est fondu vers elle.
    flouBoite(D, B, tmp, w, h, remplissage);
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < n; i++) D[i] = typ[i] ? px[i * 4 + c] : 0;
      flouBoite(D, C, tmp, w, h, remplissage);
      for (let i = 0; i < n; i++) { const k = E[i]; if (k > 0 && B[i] > 1e-3) { const v = px[i * 4 + c]; px[i * 4 + c] = Math.round(v + (C[i] / B[i] - v) * k); } }
    }
    return fondus;
  }
  const hex = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const melange = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const rvb = c => (Math.round(Math.max(0, Math.min(1, c[0])) * 255) << 16) + (Math.round(Math.max(0, Math.min(1, c[1])) * 255) << 8) + Math.round(Math.max(0, Math.min(1, c[2])) * 255);

  // ---------- (17/10) Les bâtiments provisoires, les chantiers et les emplacements : dessinés au canevas, en aplats, en
  // attendant les dessins définitifs (comme le bateau). DESSIN.plan(def) rend { c (le canevas), w, h, sol (la ligne du sol),
  // pied (sol / h), empreinte, ombre, portee, et les points animés en unités du dessin : cheminee, foyer, enclume, drapeau,
  // enseigne, lampes, marteau }. Une unité = 1 px de la scène à l'échelle 1 ; la lumière vient de la gauche, comme dans le décor.
  // def.type « batiment » : modele (comptoir, forge, ponton, kiosque, auberge), etat (a-venir, a-construire, chantier, construit),
  // niveau (1 à 4 : un détail de plus à chaque niveau). def.type « emplacement » : l'empreinte en pointillés d'une décoration
  // à acheter au Comptoir (largeur = celle de la décoration).
  const DESSIN = (() => {
    const R = 3;   // pixels de dessin par unité (net sur un téléphone de densité 3)
    const C = {
      bois: '#a87648', boisClair: '#c99a66', boisFonce: '#70492b', joint: 'rgba(90,70,48,.45)',
      pierre: '#d8c8aa', pierreClaire: '#ebdfc6', pierreFonce: '#ab977a',
      toile: '#f2e8d4', toileOmbre: '#d6c4a2', bleu: '#3f6aa6', bleuFonce: '#2d4f80', rouge: '#b8483a', terre: '#c26a3e', terreFonce: '#8f4426',
      or: '#f0c04c', orFonce: '#b7862b', corde: '#d9bd8f', fer: '#4c5159', ferClair: '#7b828c', ferFonce: '#33373d',
      vert: '#7d9a52', vertFonce: '#55703a', orange: '#f29a3a', parchemin: '#f2e2bd', encre: '#5a3a22', rose: '#e58aa6'
    };
    // la place de chaque bâtiment : largeur du dessin, empreinte au sol (rx, ry), hauteur de l'échafaudage
    const PLACE = { comptoir: { w: 112, rx: 48, ry: 15, H: 64 }, forge: { w: 96, rx: 40, ry: 14, H: 84 }, ponton: { w: 64, rx: 24, ry: 9, H: 62 },
      kiosque: { w: 141, rx: 60, ry: 22, H: 96 }, auberge: { w: 92, rx: 36, ry: 13, H: 78 }, coffre: { w: 46, rx: 19, ry: 7, H: 30 },   // 20/10 · le coffre du camp
      cabane: { w: 84, rx: 26, ry: 9, H: 50 } };   // 22/10 · la cabane du port, sur pilotis au bout du ponton
    function toile(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * R); c.height = Math.ceil(h * R); const g = c.getContext('2d'); g.scale(R, R); g.lineJoin = 'round'; g.lineCap = 'round'; return [c, g]; }
    const chemin = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    const rond = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    const ovale = (g, cx, cy, rx, ry) => { g.beginPath(); g.ellipse(cx, cy, Math.max(.1, rx), Math.max(.1, ry), 0, 0, Math.PI * 2); };
    const peindre = (g, c, t, e) => { g.fillStyle = c; g.fill(); if (t) { g.strokeStyle = t; g.lineWidth = e || .7; g.stroke(); } };
    const lin = (g, x0, y0, x1, y1, stops) => { const r = g.createLinearGradient(x0, y0, x1, y1); for (const [o, c] of stops) r.addColorStop(o, c); return r; };
    const ombreSol = (g, cx, cy, rx, ry, a = .28) => { const r = g.createRadialGradient(cx, cy, 0, cx, cy, rx); r.addColorStop(0, `rgba(60,40,22,${a})`); r.addColorStop(1, 'rgba(60,40,22,0)'); g.save(); g.translate(cx, cy); g.scale(1, ry / rx); g.translate(-cx, -cy); ovale(g, cx, cy, rx, rx); g.fillStyle = r; g.fill(); g.restore(); };

    // ---- petits morceaux
    function poteau(g, x, yb, yt, l = 3.2, c = C.bois) {
      g.fillStyle = C.boisFonce; g.fillRect(x - l / 2, yt, l, yb - yt);
      g.fillStyle = c; g.fillRect(x - l / 2, yt, l * .6, yb - yt);
      g.fillStyle = 'rgba(255,240,210,.22)'; g.fillRect(x - l / 2, yt, l * .22, yb - yt);
    }
    function planche(g, x0, y0, x1, y1, e = 2.6, c = C.boisClair) {
      chemin(g, [[x0, y0], [x1, y1], [x1, y1 + e], [x0, y0 + e]]); peindre(g, C.boisFonce);
      chemin(g, [[x0, y0], [x1, y1], [x1, y1 + e * .55], [x0, y0 + e * .55]]); peindre(g, c);
    }
    function piquet(g, x, y, h, l = 2.8) {
      ovale(g, x + .6, y, l * 1.1, l * .4); peindre(g, 'rgba(60,40,20,.25)');
      chemin(g, [[x - l / 2, y], [x - l / 2, y - h + 2.2], [x, y - h], [x + l / 2, y - h + 2.2], [x + l / 2, y]]); peindre(g, C.boisFonce);
      chemin(g, [[x - l / 2, y], [x - l / 2, y - h + 2.2], [x, y - h], [x + l * .1, y - h + .6], [x + l * .1, y]]); peindre(g, C.bois);
    }
    function corde(g, a, b, creux = 2.2) { g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + creux * 2, b[0], b[1]); g.strokeStyle = C.corde; g.lineWidth = .9; g.stroke(); }
    function pointilles(g, cx, cy, rx, ry, a = .75) {
      g.save(); ovale(g, cx, cy, rx, ry); g.fillStyle = `rgba(255,246,226,${a * .18})`; g.fill();
      g.setLineDash([4.2, 3.4]); g.lineWidth = 1.5; g.strokeStyle = `rgba(255,248,232,${a})`; g.stroke(); g.restore();
    }
    function materiaux(g, x, y, k = 1) {   // un tas de planches et quelques pierres : de quoi bâtir
      for (let i = 0; i < 4; i++) planche(g, x - 12 * k + i * .8 * k, y - 2.3 * k * i - 2 * k, x + 9 * k + i * 1.3 * k, y - 2.3 * k * i - 3.6 * k, 2.3 * k, i % 2 ? C.boisClair : C.bois);
      for (const [dx, dy, r] of [[14, -1, 3.2], [18.6, -.4, 2.4], [16, -4.4, 2.6]]) { ovale(g, x + dx * k, y + dy * k, r * k, r * .75 * k); peindre(g, C.pierre, C.joint, .5); }
    }
    function seau(g, x, y) {
      chemin(g, [[x - 3.4, y - 7], [x + 3.4, y - 7], [x + 2.7, y], [x - 2.7, y]]); peindre(g, lin(g, x - 3, 0, x + 3, 0, [[0, C.boisClair], [1, C.boisFonce]]));
      g.fillStyle = C.ferFonce; g.fillRect(x - 3.2, y - 5.6, 6.4, .8); g.fillRect(x - 2.9, y - 2, 5.8, .8);
      ovale(g, x, y - 7, 3.4, 1.1); peindre(g, '#5f7f99');
    }
    function echelle(g, x0, y0, x1, y1) {   // une échelle posée de (x0, y0) au sol jusqu'à (x1, y1)
      const n = 5, dx = 3.6;
      g.strokeStyle = C.boisFonce; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.moveTo(x0 + dx, y0); g.lineTo(x1 + dx, y1); g.stroke();
      g.strokeStyle = C.bois; g.lineWidth = .9;
      for (let i = 1; i < n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y); g.stroke(); }
    }
    function amphore(g, x, y, s = 1, c = C.terre) {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.beginPath(); g.moveTo(-1.6, -12); g.lineTo(1.6, -12); g.quadraticCurveTo(1.4, -9.5, 3.6, -7.5); g.quadraticCurveTo(5.2, -3, 1.4, 0); g.lineTo(-1.4, 0); g.quadraticCurveTo(-5.2, -3, -3.6, -7.5); g.quadraticCurveTo(-1.4, -9.5, -1.6, -12); g.closePath();
      peindre(g, lin(g, -4, 0, 4, 0, [[0, '#e0915e'], [.55, c], [1, C.terreFonce]]));
      g.fillStyle = C.encre; g.globalAlpha = .55; g.fillRect(-3.4, -6.2, 6.8, .8); g.globalAlpha = 1;
      g.restore();
    }
    function socle(g, cx, cy, rx, ry, h) {   // un muret de pierres en anneau (face avant, joints, dessus)
      g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); g.lineTo(cx - rx, cy - h); g.ellipse(cx, cy - h, rx, ry, 0, Math.PI, 0, true); g.closePath();
      peindre(g, lin(g, cx - rx, 0, cx + rx, 0, [[0, C.pierreClaire], [.55, C.pierre], [1, C.pierreFonce]]));
      g.save(); g.clip(); g.strokeStyle = C.joint; g.lineWidth = .55;
      const rangs = Math.max(1, Math.round(h / 4.5));
      for (let k = 1; k < rangs; k++) { g.beginPath(); g.ellipse(cx, cy - h * k / rangs, rx, ry, 0, 0, Math.PI); g.stroke(); }
      for (let k = 0; k < rangs; k++) for (let i = 0; i <= 10; i++) { const a = (i + (k % 2) * .5) / 10 * Math.PI, x = cx + Math.cos(a) * rx, y0 = cy - h * k / rangs + Math.sin(a) * ry; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 - h / rangs); g.stroke(); }
      g.restore();
      ovale(g, cx, cy - h, rx, ry); peindre(g, C.pierreClaire, C.joint, .5);
    }
    // les dessins gravés des panneaux
    function picto(g, nom, x, y, s) {
      g.save(); g.translate(x, y); g.scale(s / 20, s / 20); g.fillStyle = g.strokeStyle = C.encre; g.lineWidth = 2.2;
      if (nom === 'ponton') {   // une ancre
        g.beginPath(); g.arc(0, -7, 2.3, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.moveTo(0, -4.7); g.lineTo(0, 8); g.moveTo(-5, -2); g.lineTo(5, -2); g.stroke();
        g.beginPath(); g.moveTo(-8, 2.5); g.quadraticCurveTo(-7, 8.5, 0, 8.5); g.quadraticCurveTo(7, 8.5, 8, 2.5); g.stroke();
      } else if (nom === 'forge') {   // une enclume
        chemin(g, [[-9.5, -5], [6, -5], [9.5, -7], [9, -3], [4, -1.5], [3, 2], [5.5, 6.5], [-5.5, 6.5], [-3, 2], [-3, -1.5], [-9.5, -1.5]]); g.fill();
      } else if (nom === 'kiosque') {   // un dôme sur trois colonnes
        g.beginPath(); g.moveTo(-8, -1.5); g.quadraticCurveTo(-8, -9.5, 0, -9.5); g.quadraticCurveTo(8, -9.5, 8, -1.5); g.closePath(); g.fill();
        g.fillRect(-9.5, -1.6, 19, 2.4); for (const cx of [-6.5, 0, 6.5]) g.fillRect(cx - 1, 1, 2, 6.5); g.fillRect(-10, 7.4, 20, 2.2);
      } else if (nom === 'comptoir') {   // une pièce
        g.beginPath(); g.arc(0, 0, 8, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(0, 0, 3.6, 0, Math.PI * 2); g.fill();
      } else { chemin(g, [[-9, 7.5], [0, -8], [9, 7.5]]); g.fill(); }   // la tente
      g.restore();
    }
    function cadenas(g, x, y, s) {
      g.save(); g.translate(x, y); g.scale(s / 10, s / 10);
      g.beginPath(); g.arc(0, -3.3, 2.9, Math.PI, 0); g.lineWidth = 1.5; g.strokeStyle = C.ferFonce; g.stroke();
      rond(g, -4.2, -3.3, 8.4, 6.8, 1.4); peindre(g, lin(g, 0, -3, 0, 4, [[0, '#f7d572'], [1, C.orFonce]]), C.orFonce, .6);
      ovale(g, 0, -.5, 1, 1); g.fillStyle = C.encre; g.fill(); g.fillRect(-.45, -.3, .9, 2.2);
      g.restore();
    }
    function panneau(g, x, sol, nom, verrou) {   // un panneau planté, avec un dessin gravé (et un cadenas : ça arrivera plus tard)
      ombreSol(g, x + 2, sol, 9, 3, .3);
      poteau(g, x, sol, sol - 30, 3.4);
      const bw = 30, bh = 20, by = sol - 38;
      rond(g, x - bw / 2, by, bw, bh, 2.5); peindre(g, C.boisFonce);
      rond(g, x - bw / 2, by, bw, bh - 1.6, 2.5); peindre(g, lin(g, 0, by, 0, by + bh, [[0, C.boisClair], [1, C.bois]]));
      g.strokeStyle = 'rgba(90,58,34,.3)'; g.lineWidth = .6; for (const yy of [by + 6.5, by + 12.5]) { g.beginPath(); g.moveTo(x - bw / 2 + 1.5, yy); g.lineTo(x + bw / 2 - 1.5, yy); g.stroke(); }
      for (const cx of [x - bw / 2 + 2.6, x + bw / 2 - 2.6]) { ovale(g, cx, by + 2.6, .7, .7); peindre(g, C.ferFonce); }
      picto(g, nom, x - (verrou ? 2 : 0), by + bh / 2 - .8, 13);
      if (verrou) cadenas(g, x + bw / 2 - 3, by + bh - 2, 10);
      return [x, by - 2];
    }

    // ---- les états communs à tous les bâtiments
    function piquets(g, P) {   // à construire : des piquets et une corde autour de l'empreinte, et de quoi bâtir
      const { cx, cy, rx, ry } = P, n = 6, H = 12, pts = [];
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + Math.PI / 6; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, Math.sin(a)]); }
      pointilles(g, cx, cy, rx, ry, .55);
      for (const [x, y, s] of pts) if (s < 0) piquet(g, x, y, H);
      materiaux(g, cx - rx * .12, cy + ry * .3, Math.min(1.25, rx / 38));
      for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; corde(g, [a[0], a[1] - H + 3], [b[0], b[1] - H + 3]); }
      for (const [x, y, s] of pts) if (s >= 0) piquet(g, x, y, H);
      const f = pts[0]; g.beginPath(); g.moveTo(f[0], f[1] - H); g.lineTo(f[0] + 7.5, f[1] - H + 2.3); g.lineTo(f[0], f[1] - H + 4.6); g.closePath(); g.fillStyle = C.rouge; g.fill();
    }
    function charpente(g, P, H, nom) {   // ce qui est déjà monté, derrière l'échafaudage
      const { cx, cy, rx, ry } = P;
      if (nom === 'forge') { socle(g, cx - rx * .15, cy, rx * .55, ry * .6, H * .3); return; }
      if (nom === 'kiosque') { socle(g, cx, cy + ry * .1, rx * .82, ry * .78, 5); for (const a of [.15, .5, .85]) { const x = cx - rx * .7 + rx * 1.4 * a; poteau(g, x, cy + ry * .35 - 5, cy - H * .45, 5, C.pierreClaire); } return; }
      // une charpente de bois clair : deux poteaux et une poutre
      const x0 = cx - rx * .5, x1 = cx + rx * .5, yb = cy, yt = cy - H * .7;
      poteau(g, x0, yb, yt, 2.6, C.boisClair); poteau(g, x1, yb, yt, 2.6, C.boisClair);
      planche(g, x0 - 3, yt, x1 + 3, yt, 2.4, C.boisClair);
      if (nom === 'auberge') { g.strokeStyle = C.boisClair; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, yt); g.lineTo(cx, yt - H * .22); g.lineTo(x1, yt); g.stroke(); }
    }
    function chantier(g, P, nom) {   // en chantier : un échafaudage, une bâche, une échelle, des planches
      const { cx, cy, rx, ry } = P, H = PLACE[nom].H;
      const yB = cy - ry * .55, yF = cy + ry * .6, xBG = cx - rx * .7, xBD = cx + rx * .7, xFG = cx - rx * .9, xFD = cx + rx * .9, hF = H - 6, mi = hF * .5;
      ombreSol(g, cx + 3, cy + 2, rx * 1.05, ry * 1.1, .26);
      charpente(g, P, H, nom);
      poteau(g, xBG, yB, yB - H, 2.6); poteau(g, xBD, yB, yB - H, 2.6);
      planche(g, xBG, yB - H + 2, xBD, yB - H + 2, 2);
      chemin(g, [[xFG, yF - mi], [xFD, yF - mi], [xBD, yB - H * .52], [xBG, yB - H * .52]]); peindre(g, C.bois);
      g.strokeStyle = 'rgba(70,45,25,.4)'; g.lineWidth = .5;
      for (let i = 1; i < 6; i++) { const t = i / 6; g.beginPath(); g.moveTo(xFG + (xFD - xFG) * t, yF - mi); g.lineTo(xBG + (xBD - xBG) * t, yB - H * .52); g.stroke(); }
      // la bâche, accrochée en haut à droite
      g.beginPath(); g.moveTo(xFD, yF - hF + 2); g.quadraticCurveTo(xFD + 5, yF - hF * .55, xFD + 2.5, yF - 4); g.lineTo(xBD + 2.5, yB - 5); g.quadraticCurveTo(xBD + 4.5, yB - H * .6, xBD, yB - H + 3); g.closePath();
      peindre(g, lin(g, xBD, 0, xFD + 5, 0, [[0, C.toileOmbre], [1, C.toile]]));
      g.strokeStyle = 'rgba(150,120,90,.45)'; g.lineWidth = .6; for (const t of [.35, .65]) { g.beginPath(); g.moveTo(xFD + (xBD - xFD) * t, yF - hF + 2 + (yB - H - yF + hF) * t); g.lineTo(xFD + 2 + (xBD - xFD) * t, yF - 6 + (yB - yF) * t); g.stroke(); }
      planche(g, xFG, yF - mi, xFD, yF - mi, 2.4);
      poteau(g, xFG, yF, yF - hF, 3); poteau(g, xFD, yF, yF - hF, 3);
      g.strokeStyle = C.boisFonce; g.lineWidth = 1.2; g.beginPath(); g.moveTo(xFG, yF - 2); g.lineTo(xFD, yF - mi + 2.5); g.moveTo(xFD, yF - 2); g.lineTo(xFG, yF - mi + 2.5); g.stroke();
      planche(g, xFG - 2, yF - hF + 1, xFD + 2, yF - hF + 1, 2.3);
      planche(g, xFG, yF - hF + 1.5, xBG, yB - H + 2.5, 1.6); planche(g, xFD, yF - hF + 1.5, xBD, yB - H + 2.5, 1.6);
      echelle(g, xFG - 7, yF + 1, xFG + 1.5, yF - mi - 3);
      materiaux(g, cx + rx * .42, yF + 4, .85);
      seau(g, cx - rx * .45, yF + 3);
      return { marteau: [cx + rx * .2, yF - hF + 1] };
    }

    // ---- les bâtiments construits (dessins provisoires)
    // 20/10 · le coffre du camp (l'inventaire) : un coffre de bois cerclé de fer, le couvercle bombé, une serrure ; dessiné par le code en attendant son dessin
    function coffre(g, P, n) {
      const sol = P.sol, cx = P.cx, w = 34, h = 19, x0 = cx - w / 2, y0 = sol - h - 1;
      ombreSol(g, cx, sol - 1, w * .6, 5, .3);
      rond(g, x0, y0 + 6, w, h - 5, 2); peindre(g, lin(g, 0, y0 + 6, 0, sol, [[0, C.boisClair], [1, C.bois]]));   // le corps
      g.strokeStyle = 'rgba(90,58,34,.35)'; g.lineWidth = .7; for (const yy of [y0 + 10.5, y0 + 15]) { g.beginPath(); g.moveTo(x0 + 1.5, yy); g.lineTo(x0 + w - 1.5, yy); g.stroke(); }
      g.beginPath(); g.moveTo(x0, y0 + 6); g.quadraticCurveTo(cx, y0 - 5, x0 + w, y0 + 6); g.closePath(); peindre(g, lin(g, 0, y0 - 2, 0, y0 + 6, [[0, C.boisClair], [1, C.boisFonce]]));   // le couvercle bombé
      g.strokeStyle = C.boisFonce; g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0 + 6); g.lineTo(x0 + w, y0 + 6); g.stroke();
      for (const bx of [x0 + 6, x0 + w - 6]) { g.fillStyle = C.ferFonce; g.fillRect(bx - 1.3, y0 + 1.5, 2.6, h - 1); }   // les cercles de fer
      g.fillStyle = C.ferFonce; rond(g, cx - 2.6, y0 + 4, 5.2, 6, 1.2); g.fill(); g.fillStyle = C.orange; ovale(g, cx, y0 + 7.4, 1, 1); g.fill();   // la serrure
      return {};
    }
    function comptoir(g, P, n) {
      const sol = P.sol, y0 = sol - 33, ar = 6;   // le comptoir : face avant de 33 de haut, profondeur 6
      ombreSol(g, 58, sol - 3, 52, 9, .32);
      // poteaux du fond
      poteau(g, 26, y0 - ar, 20, 3); poteau(g, 98, y0 - ar, 20, 3);
      // le comptoir : dessus, côté, face avant en planches, bande bleue
      chemin(g, [[18, y0], [94, y0], [100, y0 - ar], [24, y0 - ar]]); peindre(g, C.boisClair);
      chemin(g, [[94, y0], [100, y0 - ar], [100, sol - ar], [94, sol]]); peindre(g, C.boisFonce);
      g.fillStyle = lin(g, 18, 0, 94, 0, [[0, '#b98652'], [1, C.bois]]); g.fillRect(18, y0, 76, 33);
      g.strokeStyle = 'rgba(80,50,28,.4)'; g.lineWidth = .6; for (let x = 25.6; x < 94; x += 7.6) { g.beginPath(); g.moveTo(x, y0 + 6); g.lineTo(x, sol); g.stroke(); }
      g.fillStyle = C.bleu; g.fillRect(18, y0 + 2, 76, 4); g.fillStyle = C.toile; for (let x = 20; x < 92; x += 6) g.fillRect(x, y0 + 3.4, 3, 1.2);
      // la marchandise : amphores, un panier d'oranges, des pièces, un rouleau de tissu
      amphore(g, 31, y0 - 2, .9); amphore(g, 39, y0 - 3, .75, '#b9603a');
      ovale(g, 56, y0 - 3.5, 7, 2.6); peindre(g, '#9a6a3a'); for (const [dx, dy] of [[-3.5, -4.4], [0, -5.4], [3.5, -4.4], [-1.8, -6.8], [1.8, -6.8]]) { ovale(g, 56 + dx, y0 + dy, 2.1, 2.1); peindre(g, C.orange, '#c76f1f', .4); }
      for (let i = 0; i < 3; i++) { ovale(g, 78, y0 - 2.5 - i * 1.6, 3.2, 1.2); peindre(g, C.or, C.orFonce, .5); }
      for (let i = 0; i < 2; i++) { ovale(g, 85, y0 - 2.2 - i * 1.5, 2.6, 1); peindre(g, C.or, C.orFonce, .5); }
      g.save(); g.translate(68, y0 - 4); g.rotate(-.12); rond(g, -4, -2.6, 9, 5.2, 2.6); peindre(g, C.bleu, C.bleuFonce, .5); g.restore();
      // poteaux de devant et l'auvent rayé, festonné
      poteau(g, 14, sol, 30, 3.4); poteau(g, 98, sol - 1, 30, 3.4);
      const av = [[6, 36], [106, 36], [100, 13], [20, 13]], nb = 8;
      for (let i = 0; i < nb; i++) {
        const t0 = i / nb, t1 = (i + 1) / nb, fx = t => av[0][0] + (av[1][0] - av[0][0]) * t, bx = t => av[3][0] + (av[2][0] - av[3][0]) * t;
        chemin(g, [[fx(t0), 36], [fx(t1), 36], [bx(t1), 13], [bx(t0), 13]]); peindre(g, i % 2 ? C.bleu : C.toile);
      }
      chemin(g, av); g.fillStyle = lin(g, 0, 13, 0, 36, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(0,0,0,.08)']]); g.fill();
      for (let i = 0; i < 10; i++) { const x = 6 + i * 10; g.beginPath(); g.moveTo(x, 36); g.arc(x + 5, 36, 5, Math.PI, 0, true); g.closePath(); peindre(g, i % 2 ? C.bleu : C.toile); }
      g.strokeStyle = 'rgba(60,40,25,.35)'; g.lineWidth = .6; g.beginPath(); g.moveTo(6, 36); g.lineTo(106, 36); g.stroke();
      // des caisses devant, à gauche
      rond(g, 2, sol - 12, 13, 12, 1); peindre(g, C.bois, C.boisFonce, .7); g.strokeStyle = C.boisFonce; g.lineWidth = .7; g.beginPath(); g.moveTo(2, sol - 6); g.lineTo(15, sol - 6); g.stroke();
      for (const [dx, c] of [[5, '#d9483b'], [8.5, '#e8b13c'], [12, '#d9483b']]) { ovale(g, dx, sol - 13, 2, 2); peindre(g, c); }
      const r = { enseigne: { p: [91, 40] }, lampes: [] };
      if (n >= 2) { chemin(g, [[103, sol], [111, sol], [110, sol - 8], [104, sol - 8]]); peindre(g, C.terre, C.terreFonce, .5); for (const [dx, dy, c] of [[106, -12, C.vert], [109, -11, C.vertFonce], [107.5, -15, C.vert], [105, -14.5, C.rose], [109.5, -14, C.rose]]) { ovale(g, dx, sol + dy, 2.4, 2.4); peindre(g, c); } }
      if (n >= 3) { g.strokeStyle = C.ferFonce; g.lineWidth = .7; g.beginPath(); g.moveTo(14, 36); g.lineTo(14, 41); g.stroke(); rond(g, 11.5, 41, 5, 7, 1.6); peindre(g, '#ffd27a', C.ferFonce, .8); r.lampes.push([14, 44.5]); }
      if (n >= 4) { for (let i = 0; i < 9; i++) { const x = 10 + i * 11; chemin(g, [[x, 38.5], [x + 6, 38.5], [x + 3, 44]]); peindre(g, [C.rouge, C.or, C.bleu][i % 3]); } }
      return r;
    }
    function forge(g, P, n) {
      const sol = P.sol, x0 = 12, x1 = 60, yT = sol - 32, dx = 11, dy = -8;
      ombreSol(g, 50, sol - 3, 46, 9, .32);
      // la cheminée, derrière le foyer : trapue, en pierre
      const cb = yT + dy + 3, ct = yT - 38, che = [[25, cb], [51, cb], [46, ct], [31, ct]];
      chemin(g, che); peindre(g, lin(g, 25, 0, 51, 0, [[0, C.pierreClaire], [.6, C.pierre], [1, C.pierreFonce]]));
      g.save(); chemin(g, che); g.clip(); g.strokeStyle = C.joint; g.lineWidth = .55;
      for (let y = cb, k = 0; y > ct; y -= 5.2, k++) { g.beginPath(); g.moveTo(20, y); g.lineTo(56, y); g.stroke(); for (let x = 22 + (k % 2) * 4; x < 56; x += 8) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 5.2); g.stroke(); } }
      g.restore();
      rond(g, 28, ct - 6, 21, 6.5, 1.5); peindre(g, C.pierreFonce, C.joint, .5); rond(g, 28, ct - 6, 21, 3, 1.5); peindre(g, C.pierreClaire);
      ovale(g, 38.5, ct - 4.8, 7, 1.5); peindre(g, '#3a2a20');
      // le foyer : un bloc de pierre (dessus, côté droit, face avant) et sa bouche qui rougeoie
      chemin(g, [[x0, yT], [x1, yT], [x1 + dx, yT + dy], [x0 + dx, yT + dy]]); peindre(g, C.pierreClaire, C.joint, .5);
      chemin(g, [[x1, yT], [x1 + dx, yT + dy], [x1 + dx, sol + dy], [x1, sol]]); peindre(g, C.pierreFonce);
      g.fillStyle = lin(g, x0, 0, x1, 0, [[0, C.pierreClaire], [1, C.pierre]]); g.fillRect(x0, yT, x1 - x0, sol - yT);
      g.save(); g.beginPath(); g.rect(x0, yT, x1 - x0 + dx, sol - yT); g.clip(); g.strokeStyle = C.joint; g.lineWidth = .55;
      for (let y = yT + 6.8, k = 0; y < sol; y += 6.8, k++) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
      for (let k = 0; k < 5; k++) for (let x = x0 + 4 + (k % 2) * 5; x < x1; x += 10) { g.beginPath(); g.moveTo(x, yT + k * 6.8); g.lineTo(x, yT + (k + 1) * 6.8); g.stroke(); }
      g.restore();
      const bx = 24, bw = 24, bt = sol - 23;
      g.beginPath(); g.moveTo(bx, sol - 2); g.lineTo(bx, bt + bw / 2); g.arc(bx + bw / 2, bt + bw / 2, bw / 2, Math.PI, 0); g.lineTo(bx + bw, sol - 2); g.closePath(); peindre(g, '#2a1a12', C.pierreFonce, 1.2);
      const r0 = g.createRadialGradient(bx + bw / 2, sol - 5, 1, bx + bw / 2, sol - 5, 13); r0.addColorStop(0, '#ffd27a'); r0.addColorStop(.35, '#ff8a30'); r0.addColorStop(1, 'rgba(160,40,10,0)');
      g.save(); g.clip(); g.fillStyle = r0; g.fillRect(bx, bt, bw, sol - bt); g.restore();
      for (const [dx2, c] of [[-6, '#ff7a2a'], [-1.5, '#ffb347'], [3.5, '#ff8f3a'], [7, '#e5602a']]) { ovale(g, bx + bw / 2 + dx2, sol - 4, 2.6, 1.6); peindre(g, c); }
      // des pinces appuyées contre le foyer, un seau
      g.strokeStyle = C.ferFonce; g.lineWidth = 1; g.beginPath(); g.moveTo(15, sol - 1); g.lineTo(19.5, yT + 4); g.moveTo(17, sol - 1); g.lineTo(20.5, yT + 4.5); g.stroke();
      seau(g, 6, sol);
      // l'enclume sur sa souche
      ovale(g, 83, sol - 1, 8, 2.4); peindre(g, 'rgba(60,40,20,.28)');
      g.fillStyle = lin(g, 75, 0, 91, 0, [[0, C.boisClair], [1, C.boisFonce]]); g.fillRect(76, sol - 13, 14, 12.5); ovale(g, 83, sol - 13, 7, 2.2); peindre(g, '#d8b083', C.boisFonce, .5);
      chemin(g, [[72, sol - 21], [88, sol - 21], [95, sol - 23.5], [91, sol - 18.5], [87, sol - 17.5], [86, sol - 15], [88.5, sol - 13], [77.5, sol - 13], [80, sol - 15], [79, sol - 17.5], [72, sol - 18]]);
      peindre(g, lin(g, 0, sol - 23, 0, sol - 13, [[0, C.ferClair], [.35, C.fer], [1, C.ferFonce]]));
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(73, sol - 21, 14, .8);
      const r = { cheminee: [38.5, ct - 6], foyer: [bx + bw / 2, sol - 7], enclume: [83, sol - 22], lampes: [] };
      if (n >= 2) { g.fillStyle = C.boisFonce; g.fillRect(25, yT - 13, 10, 1.2); for (const x of [27, 30.5, 33.5]) { g.fillStyle = C.ferFonce; g.fillRect(x - .4, yT - 12, .8, 6); g.fillRect(x - 1.3, yT - 6.5, 2.6, 2); } }
      if (n >= 3) { g.fillStyle = C.rouge; chemin(g, [[46, ct + 4], [55, ct + 5.5], [55, ct + 15], [50.5, ct + 12.5], [46, ct + 15]]); g.fill(); picto(g, 'forge', 50.5, ct + 9.5, 6.5); }
      if (n >= 4) { g.strokeStyle = C.or; g.lineWidth = 1.4; g.beginPath(); g.arc(38.5, yT + 7, 3.4, .25 * Math.PI, .75 * Math.PI, true); g.stroke(); r.lampes.push([66, yT - 2]); g.strokeStyle = C.ferFonce; g.lineWidth = .7; g.beginPath(); g.moveTo(66, yT + dy + 2); g.lineTo(66, yT - 4); g.stroke(); rond(g, 63.8, yT - 4, 4.4, 6, 1.4); peindre(g, '#ffd27a', C.ferFonce, .7); }
      return r;
    }
    function ponton(g, P, n) {
      const sol = P.sol;
      ombreSol(g, 34, sol - 2, 28, 6, .3);
      // un rouleau de corde, une caisse
      ovale(g, 8, sol - 2.2, 6.5, 2.6); peindre(g, '#c9a676', '#8a6a42', .6); ovale(g, 8, sol - 3.4, 3.6, 1.3); peindre(g, '#8a6a42');
      rond(g, 51, sol - 11, 12, 10.5, 1); peindre(g, C.bois, C.boisFonce, .7); g.strokeStyle = C.boisFonce; g.lineWidth = .6; g.beginPath(); g.moveTo(51, sol - 6); g.lineTo(63, sol - 6); g.moveTo(51, sol - 11); g.lineTo(63, sol - .5); g.stroke();
      // deux poteaux, le mât du fanion, le tableau des expéditions avec sa carte
      poteau(g, 13, sol, 33, 3.4); poteau(g, 47, sol - 1, 33, 3.4); poteau(g, 47.5, 40, 6, 1.8, C.boisClair);
      for (const x of [13, 47]) { chemin(g, [[x - 1.9, 33], [x, 30], [x + 1.9, 33]]); peindre(g, C.boisFonce); }
      rond(g, 5, 36, 50, 29, 2); peindre(g, C.boisFonce); rond(g, 6.5, 37.5, 47, 26, 1.6); peindre(g, lin(g, 0, 37, 0, 64, [[0, C.boisClair], [1, C.bois]]));
      g.save(); g.translate(20, 50); g.rotate(-.05); rond(g, -11, -9.5, 22, 19, .8); peindre(g, C.parchemin, '#c9b48a', .5);
      ovale(g, 4.5, -2.5, 4.2, 3); peindre(g, '#cfe0a8'); g.setLineDash([1.4, 1.4]); g.strokeStyle = C.rouge; g.lineWidth = .8; g.beginPath(); g.moveTo(-8, 6); g.quadraticCurveTo(-2, 1, 4.5, -2.5); g.stroke(); g.setLineDash([]);
      g.strokeStyle = C.rouge; g.lineWidth = 1; g.beginPath(); g.moveTo(3, -4); g.lineTo(6, -1); g.moveTo(6, -4); g.lineTo(3, -1); g.stroke(); g.restore();
      ovale(g, 20, 41, .9, .9); peindre(g, C.rouge);
      picto(g, 'ponton', 42, 50.5, 13);
      const r = { drapeau: [47.5, 7.5], lampes: [] };
      if (n >= 2) { g.strokeStyle = C.ferFonce; g.lineWidth = .7; g.beginPath(); g.moveTo(13, 30); g.lineTo(13, 25); g.stroke(); rond(g, 10.8, 25, 4.4, 6, 1.4); peindre(g, '#ffd27a', C.ferFonce, .7); r.lampes.push([13, 28]); }
      if (n >= 3) { g.save(); g.translate(31, 46); g.rotate(.08); rond(g, -4, -5, 8, 9, .6); peindre(g, '#fbf3df', '#c9b48a', .4); g.fillStyle = 'rgba(90,58,34,.6)'; for (let i = 0; i < 3; i++) g.fillRect(-2.6, -3 + i * 2.4, 5.2, .7); g.restore(); }
      if (n >= 4) { g.strokeStyle = C.ferFonce; g.lineWidth = .8; g.beginPath(); g.moveTo(47, 34); g.lineTo(52, 34); g.stroke(); g.beginPath(); g.moveTo(51, 34); g.quadraticCurveTo(48.5, 35, 48.6, 39.5); g.lineTo(53.4, 39.5); g.quadraticCurveTo(53.5, 35, 51, 34); peindre(g, C.or, C.orFonce, .6); }
      return r;
    }

    // 22/10 · la cabane du port : une petite cabane sur pilotis dans l'eau, au bout du ponton (une sorte de port). Une passerelle de
    // planches depuis le ponton (à gauche), un petit quai, la cabane en bois clair sous un toit de tuiles de terre cuite, un auvent de
    // toile, une lanterne au coin (sa lueur s'allume la nuit, par « lampes »), un tonneau, une bitte d'amarrage avec sa corde. Sous la
    // ligne d'eau (sol), le reflet des pilotis.
    function cabane(g, P) {
      const sol = P.sol;
      // le reflet des pilotis et du quai dans l'eau, sous la ligne d'eau
      g.save(); g.globalAlpha = .2;
      for (const x of [14, 24, 36, 50, 64, 76]) { g.fillStyle = '#2a2520'; g.fillRect(x - 1.4, sol, 2.8, 9 - (x > 30 ? 0 : 2)); }
      g.fillStyle = '#3a3028'; g.fillRect(30, sol, 50, 3.2); g.fillRect(0, sol, 30, 2.4);
      g.restore();
      // les pilotis : du quai à l'eau, un peu de clapot clair au pied
      for (const [x, yt] of [[14, sol - 7], [24, sol - 8], [36, sol - 10], [50, sol - 10], [64, sol - 10], [76, sol - 10]]) { poteau(g, x, sol + 1.5, yt, 2.8); ovale(g, x, sol + 1.2, 3.2, 1); peindre(g, 'rgba(255,250,240,.35)'); }
      // la passerelle depuis le ponton (à gauche, un peu plus haute côté ponton) et le quai
      chemin(g, [[0, sol - 9], [30, sol - 10.5], [30, sol - 7.5], [0, sol - 6]]); peindre(g, C.boisFonce);
      chemin(g, [[0, sol - 9], [30, sol - 10.5], [30, sol - 9.2], [0, sol - 7.7]]); peindre(g, C.bois);
      g.strokeStyle = 'rgba(70,45,25,.45)'; g.lineWidth = .5; for (let i = 1; i < 6; i++) { const x = i * 5; g.beginPath(); g.moveTo(x, sol - 9 + x * -.05); g.lineTo(x, sol - 7.6 + x * -.05); g.stroke(); }
      rond(g, 28, sol - 13, 54, 5.5, .8); peindre(g, C.boisFonce);
      chemin(g, [[28, sol - 13], [82, sol - 13], [82, sol - 10.8], [28, sol - 10.8]]); peindre(g, lin(g, 28, 0, 82, 0, [[0, C.boisClair], [1, C.bois]]));
      g.strokeStyle = 'rgba(70,45,25,.4)'; g.lineWidth = .5; for (let i = 0; i < 9; i++) { const x = 31 + i * 6; g.beginPath(); g.moveTo(x, sol - 13); g.lineTo(x, sol - 10.8); g.stroke(); }
      // la cabane : murs de planches claires, porte, hublot
      chemin(g, [[38, sol - 13], [72, sol - 13], [72, sol - 36], [38, sol - 36]]); peindre(g, lin(g, 38, 0, 72, 0, [[0, C.boisClair], [.6, C.bois], [1, C.boisFonce]]));
      g.strokeStyle = 'rgba(80,50,28,.35)'; g.lineWidth = .5; for (let i = 1; i < 7; i++) { const x = 38 + i * 4.85; g.beginPath(); g.moveTo(x, sol - 36); g.lineTo(x, sol - 13); g.stroke(); }
      chemin(g, [[50, sol - 13], [50, sol - 27], [52, sol - 30], [56, sol - 30], [58, sol - 27], [58, sol - 13]]); peindre(g, '#3a2718');
      ovale(g, 65.5, sol - 27, 2.6, 2.6); peindre(g, '#7fa7c9', C.ferFonce, .7);
      // le toit : tuiles de terre cuite, pignon vers nous, un débord qui ombre le mur
      chemin(g, [[35, sol - 34], [54.5, sol - 48], [75, sol - 34], [75, sol - 31.5], [35, sol - 31.5]]); peindre(g, 'rgba(60,35,20,.35)');
      chemin(g, [[33.5, sol - 35], [54.5, sol - 49.5], [76, sol - 35], [78, sol - 33.5], [54.5, sol - 51], [31.5, sol - 33.5]]); peindre(g, lin(g, 33, 0, 78, 0, [[0, '#d98a5a'], [.5, C.terre], [1, C.terreFonce]]), C.terreFonce, .6);
      g.strokeStyle = 'rgba(120,55,25,.5)'; g.lineWidth = .6; for (let i = 1; i < 4; i++) { const t = i / 4; g.beginPath(); g.moveTo(33.5 + (54.5 - 33.5) * t, sol - 35 - 14.5 * t); g.lineTo(33.5 + (54.5 - 33.5) * t + 3.5, sol - 35 - 14.5 * t + 2.4); g.moveTo(76 - (76 - 54.5) * t, sol - 35 - 14.5 * t); g.lineTo(76 - (76 - 54.5) * t - 3.5, sol - 35 - 14.5 * t + 2.4); g.stroke(); }
      // l'auvent de toile au-dessus de la porte, et la lanterne au coin gauche
      chemin(g, [[44, sol - 32], [66, sol - 32], [68, sol - 28.5], [42, sol - 28.5]]); peindre(g, C.toile, C.toileOmbre, .5);
      g.strokeStyle = C.boisFonce; g.lineWidth = .8; g.beginPath(); g.moveTo(43, sol - 28.5); g.lineTo(43, sol - 24); g.moveTo(67, sol - 28.5); g.lineTo(67, sol - 24); g.stroke();
      g.strokeStyle = C.ferFonce; g.lineWidth = .7; g.beginPath(); g.moveTo(38, sol - 30); g.lineTo(33.5, sol - 30); g.lineTo(33.5, sol - 28); g.stroke();
      rond(g, 31.4, sol - 28, 4.2, 5.6, 1.3); peindre(g, '#ffd27a', C.ferFonce, .7); g.fillStyle = C.ferFonce; g.fillRect(31.8, sol - 22.6, 3.4, .8);
      // un tonneau sur le quai, une bitte d'amarrage avec sa corde, un rouleau de filet
      chemin(g, [[74, sol - 13], [73.2, sol - 20], [78.8, sol - 20], [78, sol - 13]]); peindre(g, lin(g, 73, 0, 79, 0, [[0, C.boisClair], [1, C.boisFonce]]));
      g.fillStyle = C.ferFonce; g.fillRect(73.3, sol - 18.3, 5.4, .7); g.fillRect(73.5, sol - 15, 5, .7);
      piquet(g, 8, sol - 7.6, 6, 2.6); corde(g, [8, sol - 12.5], [24, sol - 11.4], 1.6);
      ovale(g, 32.5, sol - 14, 4, 1.8); peindre(g, C.corde, '#8a6a42', .5);
      return { lampes: [[31.4, sol - 25.5]] };
    }

    function plan(d) {
      if (d.type === 'emplacement') {
        const w = d.largeur || 60, rx = w * .44, ry = rx * .38, h = ry * 2 + 4, [c, g] = toile(w, h), cx = w / 2, cy = h - ry - 2;
        pointilles(g, cx, cy, rx, ry, .82);
        g.strokeStyle = 'rgba(255,248,232,.9)'; g.lineWidth = 1.7; const k = Math.min(5, rx * .3); g.beginPath(); g.moveTo(cx - k, cy); g.lineTo(cx + k, cy); g.moveTo(cx, cy - k * .55); g.lineTo(cx, cy + k * .55); g.stroke();
        return { c, w, h, sol: h - 2, pied: (h - 2) / h, empreinte: false, ombre: { l: .01, a: 0 }, portee: false, zone: [cx, cy, rx, ry] };
      }
      const nom = PLACE[d.modele] ? d.modele : 'comptoir', Pl = PLACE[nom], etat = d.etat || 'construit', n = Math.max(1, Math.min(4, d.niveau || 1));
      const w = Pl.w, rx = Pl.rx, ry = Pl.ry;
      const haut = Math.ceil({ 'a-venir': Math.max(46, ry * 2 + 8), 'a-construire': Math.max(34, ry * 2 + 17), chantier: Pl.H + ry * 1.6 + 10, construit: { comptoir: 106, forge: 100, ponton: 96, coffre: 34, cabane: 66 }[nom] || 40 }[etat] || 60);
      // 22/10 · la cabane du port a les pieds dans l'eau : 12 unités sous la ligne d'eau pour le reflet des pilotis
      const sol = haut - (nom === 'cabane' && etat === 'construit' ? 12 : 3), h = haut, [c, g] = toile(w, h), cx = w / 2, cy = sol - ry, P = { cx, cy, rx, ry, sol };
      let r = {}, empreinte = { ellipse: [.5, cy / h, rx / w, ry / rx] }, ombre = { l: .9, h: .26, a: .38 }, portee = true;
      if (etat === 'a-venir') {
        pointilles(g, cx, cy, rx, ry, .38);
        r.panneau = panneau(g, cx, sol, nom, true);
        empreinte = { ellipse: [cx / w, (sol - 1) / h, 6 / w, .5] }; ombre = { l: .01, a: 0 }; portee = false;
      } else if (etat === 'a-construire') { piquets(g, P); ombre = { l: .01, a: 0 }; portee = false; }
      else if (etat === 'chantier') { r = chantier(g, P, nom); ombre = { l: .01, a: 0 }; }
      else if (nom === 'comptoir') r = comptoir(g, P, n);
      else if (nom === 'forge') r = forge(g, P, n);
      else if (nom === 'ponton') r = ponton(g, P, n);
      else if (nom === 'coffre') r = coffre(g, P, n);   // 20/10
      else if (nom === 'cabane') { r = cabane(g, P); portee = false; ombre = { l: .01, a: 0 }; empreinte = false; }   // 22/10 · dans l'eau : ni ombre au sol ni ombre portée (son reflet est dessiné), on n'y marche pas
      else { portee = false; ombre = { l: .01, a: 0 }; empreinte = false; }   // le kiosque et l'auberge construits ont leur propre dessin
      return Object.assign({ c, w, h, sol, pied: sol / h, empreinte, ombre, portee, etat, modele: nom, zone: [cx, cy, rx, ry] }, r);
    }
    // l'enseigne du Comptoir : une petite planche suspendue, avec une pièce peinte (elle se balance au vent)
    function enseigne() {
      const [c, g] = toile(13, 16);
      g.strokeStyle = C.ferFonce; g.lineWidth = .6; g.beginPath(); g.moveTo(3, 0); g.lineTo(3, 4); g.moveTo(10, 0); g.lineTo(10, 4); g.stroke();
      rond(g, .8, 4, 11.4, 11, 1.6); peindre(g, C.boisFonce); rond(g, .8, 4, 11.4, 10, 1.6); peindre(g, C.boisClair);
      ovale(g, 6.5, 9.2, 3.4, 3.4); peindre(g, C.or, C.orFonce, .6); ovale(g, 6.5, 9.2, 1.5, 1.5); peindre(g, C.orFonce);
      return { c, w: 13, h: 16 };
    }
    // un lampion du Hameau (papier clair, teinté par la scène) et une étiquette de prénom
    function lampion() {
      const [c, g] = toile(6, 9);
      g.fillStyle = '#3a3a3a'; g.fillRect(2.5, 0, 1, 1.4);
      rond(g, .6, 1.2, 4.8, 6.6, 2.2); peindre(g, '#fff4e0', 'rgba(120,90,60,.5)', .4);
      g.strokeStyle = 'rgba(140,100,60,.35)'; g.lineWidth = .35; for (const y of [3.4, 5.6]) { g.beginPath(); g.moveTo(.9, y); g.lineTo(5.1, y); g.stroke(); }
      return { c, w: 6, h: 9 };
    }
    function etiquette(texte, police) {
      const f = 15, [m] = toile(1, 1), mg = m.getContext('2d'); mg.font = `600 ${f * R}px ${police}`;
      const tw = mg.measureText(texte).width / R, w = Math.ceil(tw + 18), h = 26, [c, g] = toile(w, h + 6);
      rond(g, 1, 1, w - 2, h - 2, 12); peindre(g, 'rgba(255,250,240,.94)', 'rgba(90,60,40,.35)', 1);
      chemin(g, [[w / 2 - 5, h - 1.5], [w / 2 + 5, h - 1.5], [w / 2, h + 4]]); peindre(g, 'rgba(255,250,240,.94)');
      g.font = `600 ${f}px ${police}`; g.fillStyle = '#4a2e22'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(texte, w / 2, h / 2 + .5);
      return { c, w, h: h + 6 };
    }
    return { R, PLACE, plan, enseigne, lampion, etiquette };
  })();

  async function monter(canvas, options = {}) {
    const PIXI = global.PIXI;
    if (!PIXI) throw new Error('PixiJS (commun/pixi.min.js) doit être chargé avant athena-scene.js.');
    const erreur = m => { try { options.onErreur && options.onErreur(m); } catch (e) { } console.error('[AthenaScene]', m); };
    const resoudreBrut = options.resoudre || (u => u);
    let S = options.scene || 'commun/athena-scene.json';
    let baseScene = '';
    if (typeof S === 'string') { baseScene = S.slice(0, S.lastIndexOf('/') + 1); S = await (await fetch(resoudreBrut(normaliser(S)))).json(); }
    const base = options.base || (baseScene + (S.base || ''));
    const url = c => resoudreBrut(normaliser(base + c));
    const reduitSysteme = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    const reduit = () => options.mouvementReduit != null ? !!options.mouvementReduit : reduitSysteme.matches;

    const app = new PIXI.Application();
    const hote = canvas.parentElement;
    await app.init({ canvas, backgroundAlpha: 0, antialias: false, resolution: Math.min(2, global.devicePixelRatio || 1), autoDensity: true, width: hote.clientWidth || 390, height: hote.clientHeight || 844, preference: 'webgl' });
    canvas.style.opacity = '0'; canvas.style.transition = canvas.style.transition || 'opacity .6s ease';
    // 20/10 · la cadence : 60 images par seconde au plus (jamais 120 sur les téléphones qui le peuvent) ; reglages.cadence = 30 (ou le mode léger) la baisse à 30
    let cadence = 60; app.ticker.maxFPS = 60;
    const monde = new PIXI.Container(); app.stage.addChild(monde);
    // 19/10 · la caméra : (x, y) le point de la scène au centre de l'écran, z le zoom (1 = le cadrage « cover » d'avant, la vue large).
    // Le jeu donne un cadrage de base (vue rapprochée, décalage quand une feuille s'ouvre) ; la scène y ajoute ses petits mouvements
    // (vers le Mont au Sommet, le suivi du bateau au départ). Tout glisse en douceur (ressort amorti) ; en mouvement réduit rien ne
    // bouge : le cadrage de base s'applique d'un coup, les petits mouvements n'existent pas.
    const cam = { x: W / 2, y: H / 2, z: 1, vx: 0, vy: 0, vz: 0 }, camBase = { x: W / 2, y: H / 2, z: 1, cache: 0, auto: true }, camAccent = { x: 0, y: 0 };
    const camEcran = { x: W / 2, y: H / 2, z: 1, dx: 0, dy: 0 };
    let camMont = null, camSuivi = null, camDernier = '';
    const CAM_RAIDEUR = 8;   // ressort critique : il s'installe en 0,6 s environ, sans dépassement
    // 22/10 · zMin : le zoom qui montre toute la largeur du tableau (< 1 sur un écran plus étroit que lui, 1 sinon) ; cielExt(z) : la hauteur de ciel
    // au-dessus du tableau qu'il faut alors pour remplir l'écran (CIEL_EXT au plus) ; z = 0 ou 'auto' dans camera() = zMin, recalculé au redimensionnement
    const CIEL_EXT = 420;
    const zMin = () => { const w = app.screen.width, h = app.screen.height, e0 = Math.max(w / W, h / H); return Math.min(1, (w / W) / e0); };
    const cielExt = z => { const w = app.screen.width, h = app.screen.height, e0 = Math.max(w / W, h / H); return Math.max(0, Math.min(CIEL_EXT, h / (e0 * z) - H)); };
    const bornerCam = c => {
      const w = app.screen.width, h = app.screen.height, e0 = Math.max(w / W, h / H); if (!(c.z >= zMin())) c.z = zMin(); const dw = w / (2 * e0 * c.z), dh = h / (2 * e0 * c.z), ext = cielExt(c.z);
      c.x = Math.max(dw, Math.min(W - dw, c.x)); c.y = Math.max(dh - ext, Math.min(H - dh + (camBase.cache || 0) / (e0 * c.z), c.y)); return c;
    };
    const placerMonde = () => {
      const w = app.screen.width, h = app.screen.height, e0 = Math.max(w / W, h / H), p0x = (w - W * e0) / 2, p0y = (h - H * e0) / 2;
      const ez = e0 * cam.z, px = w / 2 - cam.x * ez, py = h / 2 - cam.y * ez;
      monde.scale.set(ez); monde.position.set(px, py);
      camEcran.x = cam.x; camEcran.y = cam.y; camEcran.z = cam.z; camEcran.dx = px - p0x * cam.z; camEcran.dy = py - p0y * cam.z; camEcran.zMin = zMin(); camEcran.ciel = cielExt(cam.z);
    };
    const signalerCamera = () => { const s = camEcran.z.toFixed(4) + ',' + camEcran.dx.toFixed(2) + ',' + camEcran.dy.toFixed(2); if (s === camDernier) return; camDernier = s; try { options.onCamera && options.onCamera(camEcran); } catch (err) { console.error(err); } };
    const camCible = () => bornerCam({ x: camBase.x + camAccent.x, y: camBase.y + camAccent.y, z: camBase.auto ? zMin() : camBase.z });
    const camPoser = () => { const c = camCible(); cam.x = c.x; cam.y = c.y; cam.z = c.z; cam.vx = cam.vy = cam.vz = 0; placerMonde(); signalerCamera(); };
    const majCamera = dt => {
      if (reduit()) { camAccent.x = camAccent.y = 0; camMont = null; camSuivi = null; const c = camCible(); if (c.x !== cam.x || c.y !== cam.y || c.z !== cam.z) camPoser(); return; }
      // le Sommet : un léger mouvement vers le Mont, puis retour
      if (camMont) { camMont.t += dt; const u = camMont.t / camMont.duree, k = u >= 1 ? 0 : Math.sin(Math.min(1, u / .3) * Math.PI / 2) * (1 - Math.max(0, (u - .62) / .38)); camAccent.x = camMont.dx * k; camAccent.y = camMont.dy * k; if (u >= 1) camMont = null; }
      // le départ en expédition : la caméra suit un peu le bateau qui s'éloigne, puis revient
      // 22/10 · le suivi s'efface avec le bateau (son alpha baisse sur le dernier dixième de la route) : la vue revient en douceur, sans ressaut quand il disparaît
      else if (camSuivi) { const b = camSuivi.b, et = b.cerveau ? b.cerveau.etat : 'large'; if (et === 'aller') camSuivi.vu = true; if (b.detruit || et === 'large' || (camSuivi.vu && et !== 'aller')) { camSuivi = null; camAccent.x = camAccent.y = 0; } else if (et === 'aller') { const f = b.visuel ? Math.max(0, Math.min(1, b.visuel.alpha)) : 1; camAccent.x = Math.max(-70, Math.min(70, (b.x - camSuivi.x0) * .3)) * f; camAccent.y = Math.max(-70, Math.min(70, (b.y - camSuivi.y0) * .3)) * f; } }
      const c = camCible(), w = CAM_RAIDEUR; let bouge = false;
      for (const [p, vp] of [['x', 'vx'], ['y', 'vy'], ['z', 'vz']]) {
        const d = c[p] - cam[p], eps = p === 'z' ? 1e-4 : .02;
        if (Math.abs(d) < eps && Math.abs(cam[vp]) < eps * 20) { if (d) { cam[p] = c[p]; bouge = true; } cam[vp] = 0; continue; }
        cam[vp] += (w * w * d - 2 * w * cam[vp]) * dt; cam[p] += cam[vp] * dt; bouge = true;
      }
      if (bouge) { placerMonde(); signalerCamera(); }
    };
    // 22/10 · au montage (et en mouvement réduit) le cadrage se pose d'un coup ; ensuite, quand la boîte change de taille (barre d'adresse
    // du navigateur, clavier, rotation), la vue ne saute plus : elle est seulement ramenée dans les bornes, et le ressort fait le reste
    let cadre0 = false;
    const cadrer = () => {
      app.renderer.resize(hote.clientWidth || 390, hote.clientHeight || 844);
      if (!cadre0 || reduit()) { cadre0 = true; camPoser(); } else { bornerCam(cam); placerMonde(); signalerCamera(); }
    };
    cadrer();
    const ro = new ResizeObserver(cadrer); ro.observe(hote);

    // ---------- chargement
    const tex = {};
    const charger = c => tex[c] || (tex[c] = PIXI.Assets.load(url(c)));
    const F = S.fond;
    await Promise.all([F.masques, F.ventMont, F.nuages, F.matiereNuages, F.soleil, F.lune, F.vagues.planche, ...F.moments.flatMap(m => [m.fond, m.ciel, m.cascade, m.mont, m.montEau]), S.atlas, ...Object.values(S.planches).map(p => p.fichier)].filter(Boolean).map(charger));
    const T = async c => await charger(c);
    const cascadeDef = await (await fetch(url(F.cascade))).json();
    // les petites vies (mouettes, papillons, voilier) et le bateau dessiné : leurs images sont décrites dans vie.json
    const VIE = S.vie ? await (await fetch(url(S.vie))).json() : {};
    const imagesVie = {};
    async function plancheVie(cle) {
      if (imagesVie[cle]) return imagesVie[cle];
      const m = VIE[cle], t = await T(m.fichier), imgs = [];
      for (let i = 0; i < (m.images || 1); i++) imgs.push(m.images ? new PIXI.Texture({ source: t.source, frame: new PIXI.Rectangle(i * m.w, 0, m.w, m.h) }) : t);
      return (imagesVie[cle] = imgs);
    }
    const SPECIAUX = new Set(['bateau', 'voilier', 'mouettes', 'papillons', 'guirlande']);
    const vaguesDef = await (await fetch(url(F.vagues.description))).json();

    // 22/10 · l'écume peinte (liste V2, 5.4) : le masque d'eau fermé, puis les fonds nettoyés (masqueEauFerme et nettoyerFond, en tête du fichier).
    // Le masque se calcule ici, avant les shaders (uMasques le reçoit) ; les fonds des deux moments du départ sont nettoyés avant la première
    // image (relierFonds, à l'appel de la lumière), les deux autres en différé après onPret, ou à la demande si leur moment arrive avant.
    // effets.ecumePeinte : 0 = fonds nettoyés (défaut), 1 = fonds bruts ; réglable en direct (reglages.ecumePeinte). scene.ecume : l'état et les temps.
    const ecume = { masque: null, masqueTex: null, masqueCanvas: null, bande: null, propres: {}, bruts: {}, enCours: {}, ms: {}, masqueMs: 0, chauffeMs: 0, prets: [], erreur: null };
    const toileDe = t => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(t.source.resource, 0, 0, W, H); return { cv, g }; };
    const momentDe = chemin => { const m = F.moments.find(x => x.fond === chemin); return m ? m.id : chemin; };
    async function preparerEcume() {
      if (ecume.masque || ecume.erreur) return;
      try {
        const tc = performance.now(); chaufferEcume(); ecume.chauffeMs = +(performance.now() - tc).toFixed(1);
        const t0 = performance.now();
        const { cv, g } = toileDe(await T(F.masques)), jour = toileDe(await T(F.moments.find(m => m.id === 'jour').fond));
        // la bande : les lignes du tableau qui contiennent de l'eau (canal rouge), plus 56 px de marge (deux rayons de flou)
        const tout = g.getImageData(0, 0, W, H).data;
        let y0 = H, y1 = -1;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (tout[(y * W + x) * 4] > 127) { if (y < y0) y0 = y; y1 = y; break; }
        if (y1 < 0) throw new Error('pas d’eau dans le masque');
        y0 = Math.max(0, y0 - 56); y1 = Math.min(H, y1 + 57);
        const h = y1 - y0, im = g.getImageData(0, y0, W, h);
        const M = masqueEauFerme(im.data, jour.g.getImageData(0, y0, W, h).data, W, h, y0, F.horizon);
        // le masque pour le shader : le canal rouge reçoit l'eau ajoutée ; les autres canaux et les bords doux ne changent pas
        for (let i = 0; i < W * h; i++) if (M.rempli[i]) im.data[i * 4] = 255;
        g.putImageData(im, 0, y0);
        ecume.masque = M; ecume.bande = { y0, h }; ecume.masqueCanvas = cv; ecume.masqueTex = PIXI.Texture.from(cv); ecume.masqueMs = +(performance.now() - t0).toFixed(1);
      } catch (err) { ecume.erreur = err.message || String(err); erreur('Écume peinte : ' + ecume.erreur + ' (les fonds restent bruts)'); }
    }
    // le fond nettoyé d'un moment (en cache ; calculé à la demande s'il ne l'est pas encore), ou le fond brut si le nettoyage est impossible
    function nettoyerMoment(chemin) {
      if (ecume.propres[chemin]) return Promise.resolve(ecume.propres[chemin]);
      if (ecume.bruts[chemin]) return Promise.resolve(ecume.bruts[chemin]);   // 23/10 · le nettoyage de ce fond a échoué une fois : il reste brut
      if (ecume.enCours[chemin]) return ecume.enCours[chemin];
      return (ecume.enCours[chemin] = (async () => {
        const t = await T(chemin); await preparerEcume();
        if (!ecume.masque || detruit) { delete ecume.enCours[chemin]; return t; }
        try {
        const t0 = performance.now(), { y0, h } = ecume.bande, { cv, g } = toileDe(t), im = g.getImageData(0, y0, W, h);
        const fondus = nettoyerFond(im.data, ecume.masque, W, h); g.putImageData(im, 0, y0);
        const tp = PIXI.Texture.from(cv); ecume.propres[chemin] = tp; delete ecume.enCours[chemin];
        const id = momentDe(chemin), ms = +(performance.now() - t0).toFixed(1); ecume.ms[id] = ms; ecume.prets.push(id);
        if (ecume.prets.length >= F.moments.length) { const M = ecume.masque; M.tampons = M.bInt = M.eauF = M.interieur = M.zone = M.rempli = null; }   // une quinzaine de Mo qui ne servent plus (les quatre fonds sont en cache)
        emettre('fond-propre', { moment: id, ms, fondus });
        return tp;
        } catch (err) {   // 23/10 · toile refusée (mémoire), lecture impossible… : ce fond reste brut, le camp continue
          delete ecume.enCours[chemin]; ecume.bruts[chemin] = t; erreur('Écume peinte (' + momentDe(chemin) + ') : ' + ((err && err.message) || err) + ' (ce fond reste brut)'); return t;
        }
      })());
    }
    await preparerEcume();

    // ---------- couches
    const couches = {};
    for (const n of ['fond', 'large', 'cascade', 'sol', 'ombres', 'objets', 'lueurs', 'premierPlan', 'vie', 'voile']) { couches[n] = new PIXI.Container(); monde.addChild(couches[n]); }   // 20/10 · voile : le soir tamisé
    const SOIR = (S.ambiance && S.ambiance.soir) || null, voileSoir = SOIR ? (() => { const m = new PIXI.Sprite(PIXI.Texture.WHITE); m.y = -CIEL_EXT; m.width = W; m.height = H + CIEL_EXT; m.blendMode = 'multiply'; m.tint = rvb(SOIR.voile); m.alpha = 0; const a = new PIXI.Sprite(PIXI.Texture.WHITE); a.width = W; a.height = H; a.blendMode = 'add'; a.tint = rvb(SOIR.chaleur); a.alpha = 0; couches.voile.addChild(m); couches.voile.addChild(a); return { m, a }; })() : null;
    couches.objets.sortableChildren = true;

    // 22/10 · le maillage du fond monte de CIEL_EXT au-dessus du tableau (uv.y < 0) : sur un écran plus étroit que le tableau, la vue recule (zMin < 1)
    // pour montrer toute sa largeur, et la bande du haut est du ciel (le masque et le fond sont bordés : leur première ligne est du ciel)
    const geo = () => new PIXI.Geometry({ attributes: { aPosition: [0, -CIEL_EXT, W, -CIEL_EXT, W, H, 0, H], aUV: [0, -CIEL_EXT / H, 1, -CIEL_EXT / H, 1, 1, 0, 1] }, indexBuffer: [0, 1, 2, 0, 2, 3] });
    const m0 = F.moments[0];
    const uni = () => new PIXI.UniformGroup({
      uMix: { value: 0, type: 'f32' }, uTemps: { value: 0, type: 'f32' }, uEau: { value: F.effets.eau, type: 'f32' }, uVent: { value: F.effets.vent, type: 'f32' },
      uVitesseNuages: { value: F.effets.nuages, type: 'f32' }, uReflets: { value: F.effets.reflets, type: 'f32' }, uEtoiles: { value: 0, type: 'f32' },
      uHorizon: { value: F.horizon, type: 'f32' }, uCouche: { value: 0, type: 'f32' }, uCielHaut: { value: 0, type: 'f32' },
      uFeu: { value: new Float32Array([0, 0, 0]), type: 'vec3<f32>' }, uFeuCouleur: { value: new Float32Array([1, .8, .6]), type: 'vec3<f32>' },
      uReflet: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
      uNuageCouleur: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' }, uNuage: { value: new Float32Array([.4, 1]), type: 'vec2<f32>' },
      uSoleil: { value: new Float32Array([0, 0, 0]), type: 'vec3<f32>' }, uLune: { value: new Float32Array([0, 0, 0]), type: 'vec3<f32>' }, uAstres: { value: new Float32Array([16, 19]), type: 'vec2<f32>' }, uEcumeCouleur: { value: new Float32Array([.95, .97, 1]), type: 'vec3<f32>' }, uVaguesImg: { value: 0, type: 'f32' },
      uVG: { value: new Float32Array([vaguesDef.colonnes, vaguesDef.rangees, vaguesDef.images, vaguesDef.w]), type: 'vec4<f32>' }, uVZone: { value: new Float32Array([vaguesDef.y0, vaguesDef.y1]), type: 'vec2<f32>' }, uVagues: { value: F.effets.vagues == null ? 1 : F.effets.vagues, type: 'f32' }, uHoule: { value: new Float32Array(F.effets.houle || [16, 0]), type: 'vec2<f32>' },
      uRafale: { value: new Float32Array([-999, 0, 0]), type: 'vec3<f32>' }, uBrume: { value: 0, type: 'f32' }, uBrumeCouleur: { value: new Float32Array([.95, .92, .9]), type: 'vec3<f32>' }, uPhase: { value: .5, type: 'f32' }
    });
    const texFond = async () => {
      const t = await T(m0.fond);
      return { uFondA: t.source, uFondB: t.source, uFondJour: (await T(F.moments.find(m => m.id === 'jour').fond)).source, uCielA: (await T(m0.ciel)).source, uCielB: (await T(m0.ciel)).source, uNuages: (await T(F.nuages)).source, uMatiere: (await T(F.matiereNuages)).source, uSoleilTex: (await T(F.soleil)).source, uLuneTex: (await T(F.lune)).source, uVaguesTex: (await T(F.vagues.planche)).source, uMasques: (ecume.masqueTex || await T(F.masques)).source };   // 22/10 · le masque d'eau fermé
    };
    const shaders = [];
    for (const couche of ['fond', 'premierPlan', 'sol']) {
      const u = uni(); u.uniforms.uCouche = { fond: 0, premierPlan: 1, sol: 2 }[couche];
      const shader = PIXI.Shader.from({ gl: { vertex: VERT, fragment: FRAG }, resources: Object.assign(await texFond(), { u }) });
      const mesh = new PIXI.Mesh({ geometry: geo(), shader });
      couches[couche].addChildAt(mesh, 0); shaders.push(shader);
    }
    // 22/10 · la falaise gauche du tableau d'origine (liste V2, 5.2) : day-hd a un rocher, deux cyprès et un pin à gauche de la baie, les fonds de la
    // scène n'y ont que de la mer. Les découpes (outils/decouper-falaise-gauche.py, fond.falaiseGauche : une par moment, origine x, y) sont posées en
    // deux sprites dans couches.fond, au-dessus du maillage du fond : A montre le moment en cours, B le suivant, fondu avec la lumière (comme les
    // groupes des cascades). L'île au pin et les buissons du premier plan sont déjà hors de la découpe (le masque d'eau) : ils restent devant.
    // Le voile du soir et la brume du matin se posent dessus comme sur le reste. effets.falaiseGauche (1 par défaut, 0 = cachée) se lit en direct.
    const FG = F.falaiseGauche && F.falaiseGauche.images ? F.falaiseGauche : null;
    // 23/10 · une découpe qui manque (un fichier absent des fichiers publiés, par exemple) ne fait pas tomber le camp : la falaise n'est pas posée
    const falaiseG = FG ? await (async () => { try {
      const t = {}; await Promise.all(Object.entries(FG.images).map(async ([id, c]) => { t[id] = await T(c); }));
      const a = new PIXI.Sprite(t[m0.id] || PIXI.Texture.EMPTY), b = new PIXI.Sprite(PIXI.Texture.EMPTY);
      for (const s2 of [a, b]) { s2.position.set(FG.x || 0, FG.y || 0); couches.fond.addChild(s2); }
      b.visible = false;
      return { t, a, b, k: -1 };
    } catch (err) { erreur('Falaise gauche : ' + ((err && err.message) || err) + ' (le camp reste sans elle)'); return null; } })() : null;
    // 23/10 · la zone de la falaise gauche (sa boîte, 8 à 16 px de marge) : le masque d'eau y dit « eau » (la découpe est faite là où les fonds
    // ont de la mer), les poissons et les dauphins n'y sautent pas tant qu'elle est posée
    const surFalaiseG = (x, y) => !!(falaiseG && falaiseG.k > .001 && x < (FG.x || 0) + falaiseG.a.texture.width + 16 && y > (FG.y || 0) - 8 && y < (FG.y || 0) + falaiseG.a.texture.height + 8);
    const kFalaise = () => F.effets.falaiseGauche == null ? 1 : Math.max(0, Math.min(1, +F.effets.falaiseGauche || 0));
    const majFalaise = () => {
      if (!falaiseG || !lum) return;
      const k = kFalaise(), ta = falaiseG.t[lum.a.id] || falaiseG.t[lum.b.id] || PIXI.Texture.EMPTY, tb = falaiseG.t[lum.b.id] || ta;
      const enB = lum.b.id !== lum.a.id && lum.t > .001 && tb !== ta;
      if (falaiseG.a.texture !== ta) falaiseG.a.texture = ta;
      if (falaiseG.b.texture !== tb) falaiseG.b.texture = tb;
      falaiseG.a.visible = k > .001; falaiseG.a.alpha = k;
      falaiseG.b.visible = enB && k > .001; falaiseG.b.alpha = k * lum.t;
      falaiseG.k = k;
    };

    // le mont et sa cascade, composés comme le décor actuel : le mont sans cascade (opaque), le lit de la cascade,
    // puis les 5 images d'eau fondues entre elles. Un groupe par moment, fondu au suivant.
    const cascades = {}, montsVent = [];
    let boiteMont = null;   // 22/10 · [x, y, largeur, hauteur] de la boîte du mont dans le tableau, pour le masque de la falaise droite
    couches.cascade.sortableChildren = true;
    for (const m of F.moments) {
      const d = cascadeDef[m.id], mt = cascadeDef._mont, t = await T(m.cascade), imgs = [];
      for (let i = 0; i < d.images; i++) imgs.push(new PIXI.Texture({ source: t.source, frame: new PIXI.Rectangle(i * d.w, 0, d.w, d.h) }));
      const groupe = new PIXI.Container(); groupe.position.set(mt.x, mt.y); groupe.visible = false;
      const tm = await T(m.mont), tw = tm.width, th = tm.height;
      if (!boiteMont) boiteMont = [mt.x, mt.y, tw, th];
      const mu = new PIXI.UniformGroup({ uTemps: { value: 0, type: 'f32' }, uVent: { value: F.effets.vent, type: 'f32' }, uRafale: { value: new Float32Array([-999, 0, 0]), type: 'vec3<f32>' }, uOrigine: { value: new Float32Array([mt.x, mt.y]), type: 'vec2<f32>' }, uTaille: { value: new Float32Array([tw, th]), type: 'vec2<f32>' } });
      const ventMont = F.ventMont ? (await T(F.ventMont)).source : tm.source;
      const montMesh = new PIXI.Mesh({ geometry: new PIXI.Geometry({ attributes: { aPosition: [0, 0, tw, 0, tw, th, 0, th], aUV: [0, 0, 1, 0, 1, 1, 0, 1] }, indexBuffer: [0, 1, 2, 0, 2, 3] }), shader: PIXI.Shader.from({ gl: { vertex: VERT, fragment: FRAG_MONT }, resources: { uMont: tm.source, uVentMasque: ventMont, u: mu } }) });
      if (!F.ventMont) mu.uniforms.uVent = 0;
      montsVent.push(mu);
      groupe.addChild(montMesh, new PIXI.Sprite(await T(m.montEau)));
      const a = new PIXI.Sprite(imgs[0]), b = new PIXI.Sprite(imgs[1]);
      for (const s2 of [a, b]) { s2.position.set(d.x - mt.x, d.y - mt.y); groupe.addChild(s2); }
      couches.cascade.addChild(groupe);
      cascades[m.id] = { imgs, a, b, groupe };
    }
    // 22/10 · la falaise droite devant la montagne (liste V2, 5.1) : dans le tableau, la falaise de droite (x ≥ 600, y ≥ 440 : son bloc, son herbe,
    // ses buissons, l'arbre et le cyprès) passe devant le bas du flanc droit de la montagne ; mont_eau_<moment>, un autre rendu de la montagne,
    // descend jusqu'à y ≈ 482 et la recouvrait. Un seul masque stencil sur toute la couche (les quatre groupes de moments, leur fondu alpha et
    // leur zIndex compris), en coordonnées du monde : la boîte du mont moins la zone de la falaise (cascade.json, _mont.falaiseDroite, relevée sur
    // fond_jour.webp). Cette zone touche le bord droit et le bas de la boîte : un seul polygone simple, sans trou. Le mont, le lit de la cascade
    // et les images d'eau passent donc derrière le sommet de la falaise, comme dans le tableau. Rien ne dépend d'une animation (mouvement réduit : pareil).
    const falaise = cascadeDef._mont.falaiseDroite;
    if (boiteMont && Array.isArray(falaise) && falaise.length > 2) {
      const [bx, by, bw, bh] = boiteMont, pts = [bx, by, bx + bw, by];
      // le contour de la falaise à l'envers (du bord droit vers le bas du bord gauche) ; son coin bas droit est celui de la boîte : déjà sur le bord
      for (let i = falaise.length - 1; i >= 0; i--) if (!(falaise[i][0] >= bx + bw && falaise[i][1] >= by + bh)) pts.push(falaise[i][0], falaise[i][1]);
      pts.push(bx, by + bh);
      const masqueMont = new PIXI.Graphics().poly(pts, true).fill(0xffffff);
      monde.addChild(masqueMont);   // dans l'arbre (sa transformation suit la caméra), jamais dessiné : PixiJS le sort du rendu dès qu'il sert de masque
      couches.cascade.mask = masqueMont;
    }

    // ---------- textures utilitaires (dégradés pour lueurs et ombres)
    const degrade = (taille, stops) => {
      const c = document.createElement('canvas'); c.width = c.height = taille; const g = c.getContext('2d');
      const r = g.createRadialGradient(taille / 2, taille / 2, 0, taille / 2, taille / 2, taille / 2);
      for (const [o, col] of stops) r.addColorStop(o, col);
      g.fillStyle = r; g.fillRect(0, 0, taille, taille); return PIXI.Texture.from(c);
    };
    const texLueur = degrade(128, [[0, 'rgba(255,255,255,1)'], [.35, 'rgba(255,255,255,.45)'], [1, 'rgba(255,255,255,0)']]);
    const texOmbre = degrade(64, [[0, 'rgba(0,0,0,.5)'], [.5, 'rgba(0,0,0,.3)'], [.8, 'rgba(0,0,0,.1)'], [1, 'rgba(0,0,0,0)']]);
    const texFumee = degrade(64, [[0, 'rgba(255,255,255,.6)'], [.45, 'rgba(255,255,255,.28)'], [1, 'rgba(255,255,255,0)']]);
    const texPoint = degrade(16, [[0, 'rgba(255,255,255,1)'], [.4, 'rgba(255,255,255,.6)'], [1, 'rgba(255,255,255,0)']]);

    // ---------- ombres : « ombre » dans le JSON = 0 (aucune), un nombre (opacité) ou { l, h, a, dx }
    const ombreDe = d => Object.assign({ l: .78, h: .22, a: .5, dx: .05 }, typeof d.ombre === 'number' ? { a: d.ombre } : (d.ombre || {}));

    // ---------- profondeur : plus petit au fond
    const [py0, py1, pe0, pe1] = S.profondeur;
    // « profondeurFond » [y, échelle] : au-delà du haut de la clairière (la petite plage, le ponton), on rapetisse plus vite
    const [pyF, peF] = S.profondeurFond || [py0, pe0];
    const echelleA = y => y < py0 && pyF < py0 ? peF + (pe0 - peF) * Math.max(0, (y - pyF) / (py0 - pyF)) : pe0 + (pe1 - pe0) * Math.max(0, Math.min(1, (y - py0) / (py1 - py0)));

    // ---------- éléments
    const elements = new Map();
    // les éléments en tableau (et les compagnons à part), refaits quand on en ajoute ou en retire : les boucles de chaque image
    // ne créent ni itérateur ni tableau (moins de ramasse-miettes, moins d'à-coups)
    let elts = [], persos = [];
    const relister = () => { elts = [...elements.values()]; persos = elts.filter(o => o.def.type === 'personnage'); };
    const ecouteurs = {};
    const marionnettes = {};
    let lum = null;   // l'état de lumière courant
    let temps = 0, tempsEffets = 0, enPause = false, detruit = false;

    async function creerVisuel(d) {
      if (d.type === 'fixe') {
        let t;
        if (d.images) t = await T(d.images[(d.niveau || 1) - 1]);
        else if (d.image) t = await T(d.image);
        else if (d.atlas) { const a = await T(S.atlas); t = new PIXI.Texture({ source: a.source, frame: new PIXI.Rectangle(...d.atlas) }); }
        if (d.vent) {
          const plan = new PIXI.MeshPlane({ texture: t, verticesX: 4, verticesY: 6 });
          plan.pivot.set(t.width / 2, t.height * (d.pied || 1));
          plan.base = Float32Array.from(plan.geometry.getAttribute('aPosition').buffer.data);
          return plan;
        }
        const s = new PIXI.Sprite(t); s.anchor.set(.5, d.pied || 1); return s;
      }
      if (d.type === 'sprites') {
        const p = S.planches[d.planche], t = await T(p.fichier), imgs = [];
        for (let i = 0; i < p.images; i++) imgs.push(new PIXI.Texture({ source: t.source, frame: new PIXI.Rectangle((i % p.colonnes) * p.w, Math.floor(i / p.colonnes) * p.h, p.w, p.h) }));
        const s = new PIXI.Sprite(imgs[0]); s.anchor.set(.5, d.pied || 1); s.images = imgs; s.ms = d.ms || p.ms; s.decalage = Math.random() * 10;
        return s;
      }
      if (d.type === 'personnage') {
        if (!marionnettes[d.marionnette]) marionnettes[d.marionnette] = await global.AthenaMarionnette.charger(PIXI, normaliser(base + S.marionnettes[d.marionnette]), { resoudre: c => resoudreBrut(normaliser(c)) });
        const p = marionnettes[d.marionnette].creer();
        p.renderer = app.renderer;   // pour le fondu du demi-tour
        p.perspective = PERSP_PAS;   // la longueur des pas vers nous ou vers le fond
        p.surPas = (dx, dy) => poussierePas(p.racine.position.x + dx, p.racine.position.y + dy, p.hauteurVisible() / 100);   // un peu de sable à chaque pas
        p.racine.marionnette = p;
        if (d.teinte) p.racine.teinteFixe = hex(d.teinte);
        return p.racine;
      }
      if (d.type === 'bateau') return creerBateau(d);
      if (d.type === 'voilier') {
        const c = new PIXI.Container(), t = (await plancheVie(d.modele || 'voilier'))[0];
        const s2 = new PIXI.Sprite(t); s2.anchor.set(.5, .92); const r = new PIXI.Sprite(t); r.anchor.set(.5, .92); r.scale.y = -1; r.alpha = .2; r.position.y = 2;
        c.addChild(r, s2); c.visible = false; return c;
      }
      if (d.type === 'batiment' || d.type === 'emplacement') return creerPlan(d);
      if (d.type === 'guirlande') { if (d.x == null) d.x = 0; if (d.y == null) d.y = 0; return new PIXI.Container(); }
      if (d.type === 'mouettes' || d.type === 'papillons') return new PIXI.Container();
      if (d.type === 'zone') { const g = new PIXI.Graphics().rect(-d.largeur / 2, -d.hauteur, d.largeur, d.hauteur).fill({ color: 0, alpha: .001 }); return g; }
      throw new Error('Type inconnu : ' + d.type);
    }

    // Le bateau d'expédition : provisoire, dessiné ici en aplats comme le décor lointain.
    // Avec « image » dans le JSON, le dessin définitif le remplace (proue à gauche, ligne de flottaison en bas).
    async function creerBateau(d) {
      const c = new PIXI.Container(), corps = new PIXI.Container(), reflet = new PIXI.Container();
      const dessiner = (g, voile) => {
        // coque arrondie, bordage clair, mât, vergue, flamme rouge ; la voile est à part pour se plier
        g.moveTo(-31, -11).quadraticCurveTo(-24, 4, 0, 4).quadraticCurveTo(22, 4, 29, -12).lineTo(-31, -11).fill(0x6b4a30);
        g.moveTo(-31, -11).lineTo(29, -12).lineTo(27.5, -9).quadraticCurveTo(0, -7, -28.5, -8).lineTo(-31, -11).fill(0x9c6e44);
        g.rect(-1.1, -52, 2.4, 42).fill(0x4a3220);
        g.rect(-17, -48.5, 34, 2).fill(0x4a3220);
        g.poly([1.2, -52, 11, -49.5, 1.2, -47]).fill(0xb23a2a);
        voile.moveTo(-16, 0).lineTo(16, 0).quadraticCurveTo(19, 16, 17, 31).quadraticCurveTo(0, 27, -15, 31).quadraticCurveTo(-17, 16, -16, 0).fill(0xefe5cf);
        voile.moveTo(4, 0).lineTo(16, 0).quadraticCurveTo(19, 16, 17, 31).quadraticCurveTo(10, 29, 5, 29).lineTo(4, 0).fill(0xdfd2b8);
        voile.rect(-16.5, 12, 34, 5).fill(0x3e5f9c);
        voile.position.set(0, -47);
      };
      const B = d.modele && VIE[d.modele];
      // chaque vue a son reflet : une copie retournée, très transparente
      const vue = async (remplir) => { const g = new PIXI.Container(), r = new PIXI.Container(); await remplir(g); await remplir(r); r.scale.y = -1; r.position.y = 2; return { g, r }; };
      let repos = null, arriere = null;
      if (B) {
        // 1. en route, vu de côté : la voile (derrière le mât) puis la coque avec son mât
        const enRoute = await vue(async cible => {
          const voile = new PIXI.Sprite(await T(B.voile)); voile.position.set(B.voilePos[0], B.voilePos[1]); voile.skew.y = B.voileBiais;
          const coque = new PIXI.Sprite(await T(B.coque)); coque.position.set(-B.ancre[0], -B.ancre[1]);
          cible.addChild(voile, coque); cible.voile = voile;
        });
        corps.addChild(...enRoute.g.children); corps.voile = enRoute.g.voile; reflet.addChild(...enRoute.r.children); reflet.voile = enRoute.r.voile;
        // 2. amarré : voile roulée sur la vergue
        if (B.enroule) repos = await vue(async cible => { const sp = new PIXI.Sprite(await T(B.enroule.fichier)); sp.position.set(-B.enroule.ancre[0], -B.enroule.ancre[1]); cible.addChild(sp); });
        // amarré contre un ponton : un reflet plus court, ou aucun (0), pour qu'il ne déborde pas sur les planches (« refletAmarre », 1 = entier)
        if (repos && d.refletAmarre != null) { if (d.refletAmarre > 0) repos.r.scale.y = -d.refletAmarre; else repos.r.renderable = false; }
        // 3. vu de dos, quand il s'éloigne : coque, vergue, voile vue de derrière, flamme
        if (B.arriere) arriere = await vue(async cible => {
          const A2 = B.arriere, [mx, my] = A2.mat;
          const coque = new PIXI.Sprite(await T(A2.fichier)); coque.position.set(-A2.ancre[0], -A2.ancre[1]);
          const voile = new PIXI.Sprite(await T(B.voile)); voile.anchor.set(.5, 0); voile.position.set(mx, my + 10); voile.scale.set(-.92, .78);
          const vergue = new PIXI.Graphics().roundRect(mx - 44, my + 7, 88, 3.4, 1.7).fill(0x7d6b58);
          const flamme = new PIXI.Graphics().poly([mx, my, mx - 15, my + 3, mx - 9, my + 5, mx, my + 8]).fill(0xb8483a);
          cible.addChild(coque, voile, vergue, flamme); cible.scale.x = -1;   // dessiné proue en haut à droite : retourné pour aller vers la gauche
        });
      }
      else {
        const g = new PIXI.Graphics(), voile = new PIXI.Graphics(); dessiner(g, voile); corps.addChild(g, voile); corps.voile = voile;
        const g2 = new PIXI.Graphics(), v2 = new PIXI.Graphics(); dessiner(g2, v2); reflet.addChild(g2, v2); reflet.voile = v2;
      }
      reflet.scale.y = -1; reflet.alpha = .22; reflet.position.y = 2;
      const lanterne = new PIXI.Sprite(texLueur); lanterne.anchor.set(.5); lanterne.blendMode = 'add'; lanterne.tint = 0xffc070; lanterne.scale.set(B ? .9 : .32); lanterne.position.set(B ? B.mat[0] : 0, B ? B.mat[1] + 8 : -41);
      c.addChild(reflet); if (repos) c.addChild(repos.r); if (arriere) c.addChild(arriere.r);
      c.addChild(corps); if (repos) c.addChild(repos.g); if (arriere) c.addChild(arriere.g);
      // la lanterne du mât brille par-dessus la nuit : elle est posée à part (sinon la teinte de la nuit du bateau l'éteindrait)
      couches.lueurs.addChild(lanterne); lanterne.visible = false; c.lanterneLocal = [lanterne.position.x, lanterne.position.y]; c.lanterneEchelle = lanterne.scale.x;
      c.corps = corps; c.reflet = reflet; c.lanterne = lanterne; c.repos = repos; c.arriere = arriere;
      return c;
    }

    function poser(e) {
      const d = e.def, v = e.visuel;
      let x = d.x, y = d.y, largeur = d.largeur;
      if (d.niveaux) { const n = d.niveaux[(d.niveau || 1) - 1]; x = n.x; y = n.y; largeur = n.largeur; }
      const ech = d.profondeur === false ? 1 : echelleA(y);
      v.position.set(x, y);
      if (d.type === 'personnage') { v.marionnette.profondeur(ech * (d.taille || 1)); }
      else if (SPECIAUX.has(d.type)) { /* placé par son comportement */ }
      else if (d.type !== 'zone') {
        const tw = v.texture ? v.texture.width : 1, k = largeur * ech / tw;
        v.scale.set(k * (d.miroir ? -1 : 1), k);
        e.sx0 = v.scale.x; e.sy0 = v.scale.y;   // la taille de repos (les petites animations y reviennent toujours)
      }
      v.zIndex = d.type === 'personnage' ? profondeurPerso(e, x, y) : y + (d.devant || 0) - (auSol(d) ? 3000 : 0);
      if (e.ombre) {
        // ombre de contact : une ellipse douce, un peu décalée vers la droite comme les ombres peintes du décor
        const o = ombreDe(d), lw = largeur * ech * o.l;
        e.ombre.position.set(x + largeur * ech * o.dx, y - lw * o.h * .35); e.ombre.scale.set(lw / 64, lw * o.h / 64);
      }
      e.x = x; e.y = y; e.ech = ech; e.largeurAff = (largeur || 0) * ech;
      if (d.type !== 'personnage') grilleSale();
    }

    // ---------- les lueurs : lanternes, flambeaux, intérieur de la tente, statue. Elles s'allument une à une le soir et vacillent.
    // « lueurs » : [{ fx, fy (position dans l'image, en fraction), r (rayon), c (couleur), i (intensité), sy (pied de la flaque au sol, en fraction), sol: false }]
    let nLueurs = 0;
    function creerLueurs(e) {
      for (const l of e.lueurs || []) { l.g.destroy(); if (l.f) l.f.destroy(); }
      const d = e.def, liste = (d.lueursNiveaux && d.lueursNiveaux[(d.niveau || 1) - 1]) || d.lueurs || [];
      e.lueurs = liste.map(L => {
        const g = new PIXI.Sprite(texLueur); g.anchor.set(.5); g.blendMode = 'add'; g.tint = rvb(L.c || [1, .74, .42]); couches.objets.addChild(g);   // rangée juste devant son objet : un compagnon devant la cache
        let f = null; if (L.sol !== false) { f = new PIXI.Sprite(texLueur); f.anchor.set(.5); f.blendMode = 'add'; f.tint = g.tint; couches.sol.addChild(f); }
        return { L, g, f, ph: Math.random() * 10, ph2: Math.random() * 10, seuil: (nLueurs++ % 9) * .075 };
      });
    }
    function majLueurs(e, lampes, fige) {
      const v = e.visuel, w = Math.abs(v.width), h = Math.abs(v.height), pied = e.def.pied || 1, gauche = e.x - w / 2, haut = e.y - h * pied;
      for (const l of e.lueurs) {
        const on = Math.max(0, Math.min(1, (lampes - l.seuil) / .25)) * (v.visible ? 1 : 0);
        const fl = fige ? 1 : .86 + .14 * Math.sin(temps * 7.3 + l.ph) * Math.sin(temps * 3.1 + l.ph2) + .05 * Math.sin(temps * 17 + l.ph);
        const x = gauche + l.L.fx * w, y = haut + l.L.fy * h, r = l.L.r * (e.ech || 1), i = l.L.i == null ? 1 : l.L.i;
        l.g.position.set(x, y); l.g.scale.set(r * 2.3 / 128); l.g.alpha = on * .8 * fl * i; l.g.zIndex = v.zIndex + .05;
        if (l.f) { l.f.position.set(x, l.L.sy != null ? haut + l.L.sy * h : e.y - 2); l.f.scale.set(r * 3.4 / 128, r * 1.15 / 128); l.f.alpha = on * .34 * fl * i; }
      }
    }

    // ---------- l'eau d'un objet (la fontaine) : ronds dans l'eau, reflets qui scintillent, nappe de lumière qui dérive,
    // filets d'eau qui coulent et gouttes qui rebondissent. « eau » dans le JSON : { surfaces: [[cx, cy, rx, ry], …],
    // filets: [[x0, y0, x1, y1], …] }, en fraction de l'image. Les effets restent dans les pixels d'eau du dessin.
    const texRond = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const r = g.createRadialGradient(32, 32, 17, 32, 32, 31); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.5, 'rgba(255,255,255,.95)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.beginPath(); g.arc(32, 32, 31, 0, Math.PI * 2); g.fill(); return PIXI.Texture.from(c);
    })();
    const texTrait = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 16; const g = c.getContext('2d'), r = g.createLinearGradient(0, 0, 4, 0); r.addColorStop(0, 'rgba(255,255,255,0)'); r.addColorStop(.5, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 4, 16); return PIXI.Texture.from(c); })();
    function creerEau(e) {
      if (e.eau) { e.eau.c.destroy({ children: true }); e.eau = null; }
      const d = e.def, v = e.visuel, tex = v.texture; if (!tex || !d.eau) return;
      const W2 = tex.width, H2 = tex.height, surf = (d.eau.surfaces || []).map(([cx, cy, rx, ry]) => ({ cx: cx * W2, cy: cy * H2, rx: rx * W2, ry: ry * H2 }));
      const filets = (d.eau.filets || []).map(([x0, y0, x1, y1], i) => ({ x0: x0 * W2, y0: y0 * H2, x1: x1 * W2, y1: y1 * H2, ph: i * .37, t: Math.random() * .3 }));
      const c = new PIXI.Container(), fx = new PIXI.Container(), libre = new PIXI.Container(); couches.objets.addChild(c);
      // le masque : les pixels bleus du dessin, dans les surfaces décrites (bords adoucis)
      const A2 = alphaDe(tex);
      if (A2) {
        const c1 = document.createElement('canvas'); c1.width = W2; c1.height = H2; const g1 = c1.getContext('2d'), img = g1.createImageData(W2, H2);
        for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
          const i = (y * W2 + x) * 4, r = A2.a[i], gg = A2.a[i + 1], b = A2.a[i + 2], a = A2.a[i + 3];
          if (a < 200 || b < 110 || b < r - 4) continue;
          if (!surf.some(q => ((x - q.cx) / (q.rx * 1.08)) ** 2 + ((y - q.cy) / (q.ry * 1.08)) ** 2 <= 1)) continue;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = 255;
        }
        g1.putImageData(img, 0, 0);
        const c2 = document.createElement('canvas'); c2.width = W2; c2.height = H2; const g2 = c2.getContext('2d'); g2.filter = 'blur(0.7px)'; g2.drawImage(c1, 0, 0);
        const masque = new PIXI.Sprite(PIXI.Texture.from(c2)); c.addChild(masque); fx.mask = masque;
      }
      c.addChild(fx, libre);
      // une nappe de lumière par surface, qui dérive lentement
      const nappes = surf.map((q, i) => { const s2 = new PIXI.Sprite(texLueur); s2.anchor.set(.5); s2.blendMode = 'add'; fx.addChild(s2); return { s: s2, q, ph: i * 2.1 + Math.random() }; });
      const ronds = [], eclats = [], gouttes = [];
      for (let i = 0; i < 12; i++) { const s2 = new PIXI.Sprite(texRond); s2.anchor.set(.5); s2.visible = false; fx.addChild(s2); ronds.push({ s: s2, t: 1, vie: 1 }); }
      for (let i = 0; i < 6; i++) { const s2 = new PIXI.Sprite(texPoint); s2.anchor.set(.5); s2.blendMode = 'add'; fx.addChild(s2); eclats.push({ s: s2, t: Math.random() * 1.5, vie: .8 + Math.random() * .9, x: 0, y: 0 }); }
      for (let i = 0; i < 14; i++) { const s2 = new PIXI.Sprite(texPoint); s2.anchor.set(.5); s2.visible = false; libre.addChild(s2); gouttes.push({ s: s2, t: 1, vie: 1, x: 0, y: 0, vx: 0, vy: 0 }); }
      // les reflets qui descendent les filets : trois traits par filet (des sprites : rien à redessiner à chaque image)
      for (const f of filets) { f.traits = []; for (let k = 0; k < 3; k++) { const s2 = new PIXI.Sprite(texTrait); s2.anchor.set(.5, 0); s2.blendMode = 'add'; libre.addChild(s2); f.traits.push(s2); } f.angle = Math.atan2(f.y1 - f.y0, f.x1 - f.x0) - Math.PI / 2; f.long = Math.hypot(f.x1 - f.x0, f.y1 - f.y0); }
      e.eau = { c, surf, filets, nappes, ronds, eclats, gouttes, t: 0, prochainRond: .5, prochainCentre: .3 };
    }
    // un point au hasard dans une surface (plus souvent dans la grande)
    const pointEau = surf => { const q = surf.length > 1 && Math.random() < .25 ? surf[0] : surf[surf.length - 1], a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * .85; return [q.cx + Math.cos(a) * q.rx * r, q.cy + Math.sin(a) * q.ry * r, q]; };
    const surfaceDe = (surf, x, y) => surf.reduce((m, q) => { const dd = ((x - q.cx) / q.rx) ** 2 + ((y - q.cy) / q.ry) ** 2; return dd < m[0] ? [dd, q] : m; }, [Infinity, surf[0]])[1];
    function rondEau(E, x, y, taille, force) {
      const r = E.ronds.find(o => o.t >= o.vie); if (!r) return;
      const q = surfaceDe(E.surf, x, y); r.x = x; r.y = y; r.taille = taille; r.aspect = q.ry / q.rx; r.force = force; r.t = 0; r.vie = .8 + taille * .03; r.s.visible = true;
    }
    function majEau(e, dt, fige) {
      const E = e.eau, v = e.visuel, tex = v.texture;
      E.c.visible = v.visible && !fige && v.alpha > .05; if (!E.c.visible) return;
      // à la place de l'image de l'objet, à sa taille (il suit aussi ses petits sauts)
      const ax = v.anchor ? v.anchor.x * tex.width : v.pivot.x, ay = v.anchor ? v.anchor.y * tex.height : v.pivot.y;
      E.c.position.set(v.position.x - ax * v.scale.x, v.position.y - ay * v.scale.y);
      E.c.scale.set(v.scale.x, v.scale.y); E.c.zIndex = v.zIndex + .03; E.c.tint = v.tint;
      E.t += dt;
      const jour = lum ? Math.max(.25, 1 - lum.feu * .75) : 1;
      // la nappe de lumière : un reflet doux du ciel qui glisse sur l'eau
      for (const n of E.nappes) {
        const q = n.q; n.s.position.set(q.cx + q.rx * .45 * Math.sin(E.t * .21 + n.ph), q.cy + q.ry * .3 * Math.cos(E.t * .17 + n.ph * 1.3));
        n.s.scale.set(q.rx * .9 / 64, q.ry * .7 / 64); n.s.alpha = .22 * jour * (.75 + .25 * Math.sin(E.t * .6 + n.ph));
      }
      // les ronds : là où tombent les filets, sous la vasque du haut, et de temps en temps ailleurs
      for (const f of E.filets) { f.t -= dt; if (f.t <= 0) { f.t = .26 + Math.random() * .16; rondEau(E, f.x1 + (Math.random() - .5) * 3, f.y1 + (Math.random() - .5) * 1.5, 11 + Math.random() * 6, .55); } }
      E.prochainCentre -= dt; if (E.prochainCentre <= 0 && E.surf.length > 1) { E.prochainCentre = .7 + Math.random() * .5; const q = E.surf[0]; rondEau(E, q.cx + (Math.random() - .5) * q.rx * .6, q.cy + (Math.random() - .5) * q.ry * .5, 8 + Math.random() * 4, .45); }
      E.prochainRond -= dt; if (E.prochainRond <= 0) { E.prochainRond = 1 + Math.random() * 1.4; const [x, y] = pointEau(E.surf); rondEau(E, x, y, 18 + Math.random() * 8, .35); }
      for (const r of E.ronds) {
        if (r.t >= r.vie) { r.s.visible = false; continue; }
        r.t += dt; const u = Math.min(1, r.t / r.vie), k = 1 - (1 - u) * (1 - u);
        const rr = r.taille * (.2 + .8 * k); r.s.position.set(r.x, r.y); r.s.scale.set(rr / 31, rr * r.aspect / 31);
        r.s.alpha = r.force * jour * Math.pow(1 - u, 1.4);
      }
      // les éclats de soleil : ils scintillent et changent de place
      for (const o of E.eclats) {
        o.t += dt; if (o.t >= o.vie) { o.t = 0; o.vie = .6 + Math.random() * 1.1; [o.x, o.y] = pointEau(E.surf); o.k = .28 + Math.random() * .2; }
        const b = Math.sin(Math.PI * o.t / o.vie); o.s.position.set(o.x, o.y); o.s.scale.set((o.k || .35) * 1.6, o.k || .35); o.s.alpha = b * b * .85 * jour * jour;
      }
      // les filets d'eau : des reflets qui descendent le long du filet, et des gouttes qui rebondissent en bas
      for (const f of E.filets) {
        const dx = f.x1 - f.x0, dy = f.y1 - f.y0;
        for (let k = 0; k < 3; k++) {
          const p0 = (E.t * 1.7 + k / 3 + f.ph) % 1, lg = Math.min(.2, 1 - p0) * f.long, s2 = f.traits[k];
          s2.position.set(f.x0 + dx * p0, f.y0 + dy * p0); s2.rotation = f.angle; s2.scale.set(1.6 / 4, lg / 16);
          s2.alpha = .7 * jour * Math.sin(Math.PI * p0);
        }
        if (Math.random() < dt * 7) { const o = E.gouttes.find(q => q.t >= q.vie); if (o) { o.t = 0; o.vie = .3 + Math.random() * .15; o.x = f.x1; o.y = f.y1; o.vx = (Math.random() - .5) * 26; o.vy = -18 - Math.random() * 16; o.s.visible = true; o.s.scale.set(.15 + Math.random() * .08); } }
      }
      for (const o of E.gouttes) {
        if (o.t >= o.vie) { o.s.visible = false; continue; }
        o.t += dt; o.vy += 150 * dt; o.x += o.vx * dt; o.y += o.vy * dt;
        o.s.position.set(o.x, o.y); o.s.alpha = .8 * jour * (1 - o.t / o.vie);
      }
    }

    // ---------- ombres portées : chaque objet projette sa silhouette au sol, à l'opposé du soleil (longue au lever et au
    // coucher, courte à midi, qui tourne avec l'heure) ; la nuit, à l'opposé du feu quand il en est proche. Les compagnons
    // projettent une ombre allongée dans le même sens. La silhouette est floutée une fois pour toutes (réduction puis
    // agrandissement : sans filtre, donc partout pareil). « portee »: false dans le JSON pour qu'un objet n'en ait pas ;
    // « effets.portees » règle leur force (1 par défaut, 0 pour les retirer).
    const silhouettes = new Map(), matricePortee = new PIXI.Matrix();
    const cleSil = tex => tex.source.uid + ':' + tex.frame.x + ',' + tex.frame.y + ',' + tex.frame.width + ',' + tex.frame.height;
    function silhouetteDe(tex) {
      const src = tex.source, f = tex.frame, cle = cleSil(tex);
      if (silhouettes.has(cle)) return silhouettes.get(cle);
      let r = null;
      try {
        const pad = 8, w = Math.ceil(f.width) + pad * 2, h = Math.ceil(f.height) + pad * 2, k = 5;
        const c1 = document.createElement('canvas'); c1.width = w; c1.height = h; const g1 = c1.getContext('2d');
        g1.drawImage(src.resource, f.x, f.y, f.width, f.height, pad, pad, f.width, f.height);
        g1.globalCompositeOperation = 'source-in'; g1.fillStyle = '#fff'; g1.fillRect(0, 0, w, h);
        const c2 = document.createElement('canvas'); c2.width = Math.max(1, Math.round(w / k)); c2.height = Math.max(1, Math.round(h / k));
        const g2 = c2.getContext('2d'); g2.imageSmoothingEnabled = true; g2.imageSmoothingQuality = 'high'; g2.drawImage(c1, 0, 0, c2.width, c2.height);
        const c3 = document.createElement('canvas'); c3.width = w; c3.height = h; const g3 = c3.getContext('2d'); g3.imageSmoothingEnabled = true; g3.imageSmoothingQuality = 'high'; g3.drawImage(c2, 0, 0, w, h);
        r = { tex: PIXI.Texture.from(c3), pad, w, h };
      } catch (err) { r = null; }
      silhouettes.set(cle, r); return r;
    }
    const aPortee = d => d.portee !== false && d.ombre !== 0 && d.ombre !== false && !SPECIAUX.has(d.type) && d.type !== 'zone' && !auSol(d);
    function creerPortee(e) {
      const s2 = new PIXI.Sprite(e.def.type === 'personnage' ? texOmbre : PIXI.Texture.EMPTY);
      s2.blendMode = e.def.type === 'personnage' ? 'normal' : 'multiply'; s2.visible = false; couches.ombres.addChildAt(s2, 0); e.portee = s2;
    }
    const couleurPortee = { cle: '', c: 0 };
    function majPortees() {
      const force = F.effets.portees == null ? 1 : F.effets.portees; if (!lum) return;
      const h = lum.heure, t = (h - F.astres.leverSoleil) / (F.astres.coucherSoleil - F.astres.leverSoleil);
      // le soleil se lève à gauche et se couche à droite, derrière la scène : l'ombre va à droite le matin, vers nous à midi,
      // à gauche le soir ; elle s'efface quand le soleil est au ras de l'horizon
      const soleil = t > 0 && t < 1 ? lisseP(0, .07, t) * (1 - lisseP(.93, 1, t)) * Math.max(0, 1 - lum.feu * 1.6) : 0;
      const th = Math.PI * Math.max(0, Math.min(1, t)), longS = .45 + 1.3 * Math.pow(1 - Math.sin(th), 1.4);
      let gxS = Math.cos(th), gyS = Math.max(.38, Math.sin(th)); const nS = Math.hypot(gxS, gyS); gxS /= nS; gyS /= nS;
      const feu = feux().reduce((m, f) => (!m || f.def.lumiere.rayon > m.def.lumiere.rayon ? f : m), null);
      let budgetSil = 1;
      const cc = lum.a.id + lum.b.id + lum.t; if (cc !== couleurPortee.cle) { couleurPortee.cle = cc; couleurPortee.c = rvb(melange(hex(lum.a.ombre || '#445468'), hex(lum.b.ombre || '#445468'), lum.t)); }
      const couleur = couleurPortee.c;
      const L0 = elts;
      for (let ie = 0; ie < L0.length; ie++) {
        const e = L0[ie], s2 = e.portee; if (!s2 || e.detruit) continue; const v = e.visuel;
        if (!v.visible || v.alpha < .05 || !force) { s2.visible = false; continue; }
        if (v.plan && !v.plan.portee) { s2.visible = false; continue; }   // piquets, panneau, empreinte : pas d'ombre portée
        let gx = gxS, gy = gyS, L = longS, a = .3 * soleil;
        // la nuit, près du feu : l'ombre part à l'opposé des flammes, d'autant plus longue qu'il en est loin
        if (feu && feu !== e && lum.feu > .05) {
          const dx = e.x - feu.x, dy = (e.y - feu.y) * 2.2, dd = Math.hypot(dx, dy), r = feu.def.lumiere.rayon * 1.1;
          if (dd > 4 && dd < r) {
            const aF = .42 * lum.feu * Math.pow(1 - dd / r, .7) * (feu.boost || 1);
            // 19/10 · entre l'ombre du soleil et celle du feu, un mélange continu (direction par l'angle le plus court, longueur, force) :
            // au crépuscule, l'ombre tourne doucement vers l'opposé du feu au lieu de basculer d'un coup (un saut de couleur vers 19 h 30)
            const w = aF + a > 1e-4 ? aF / (aF + a) : 1, aS = Math.atan2(gyS, gxS), aFe = Math.atan2(dy / dd, dx / dd); let dA = aFe - aS; dA = Math.atan2(Math.sin(dA), Math.cos(dA));
            const ang = aS + dA * w; gx = Math.cos(ang); gy = Math.sin(ang); L = longS + (.45 + 1.1 * dd / r - longS) * w; a = Math.max(a, aF);
          }
        }
        a *= force * v.alpha; if (a < .01) { s2.visible = false; continue; }
        s2.visible = true;
        if (e.def.type === 'personnage') {
          // un compagnon : une ombre douce allongée, partant de ses pieds
          const hv = v.marionnette.hauteurVisible(), lg = hv * L * .55, ang = Math.atan2(gy / 2.2, gx), ux = Math.cos(ang), uy = Math.sin(ang);
          s2.anchor.set(.5); s2.rotation = ang; s2.scale.set(lg / 64 * 1.15, hv * .2 / 64);
          s2.position.set(e.x + ux * lg * .5, e.y + uy * lg * .5); s2.alpha = Math.min(1, a * 2.6); s2.tint = couleur;   // (le dégradé de l'ombre est déjà à moitié transparent)
          continue;
        }
        // un objet : sa silhouette, couchée au sol dans la direction de l'ombre (la hauteur devient la longueur)
        // une planche animée (fanion, carillon…) : la silhouette de sa première image suffit
        const tex = v.images ? v.images[0] : v.texture; if (!tex) { s2.visible = false; continue; }
        // au plus une silhouette nouvelle par image (pas d'à-coup au chargement ni quand la tente change de niveau)
        let sil = tex.__silhouette;
        if (sil === undefined) {
          if (!silhouettes.has(cleSil(tex)) && budgetSil-- <= 0) { s2.visible = false; continue; }
          sil = tex.__silhouette = silhouetteDe(tex);
        }
        if (!sil) { s2.visible = false; continue; }
        if (s2.texture !== sil.tex) { s2.texture = sil.tex; }
        const ax = v.anchor ? v.anchor.x : v.pivot.x / tex.width, ay = v.anchor ? v.anchor.y : v.pivot.y / tex.height;   // sprite ou plan déformé par le vent
        s2.anchor.set((sil.pad + ax * tex.width) / sil.w, (sil.pad + ay * tex.height) / sil.h);
        const sx = v.scale.x, sy = Math.abs(v.scale.y), k = e.def.porteeLongueur || 1;
        // l'ombre part du milieu de l'empreinte au sol (sous l'objet), pas du bas de l'image : elle ne flotte pas devant lui
        const emp = empreinteDe(e); let recul = Math.abs(v.height) * .05;
        if (emp && emp.length) { let mn = Infinity, mx = -Infinity; for (let ip = 0; ip < emp.length; ip++) { const py = emp[ip][1]; if (py < mn) mn = py; if (py > mx) mx = py; } recul = Math.max(0, e.y - (mn + mx) / 2); }
        matricePortee.set(sx, 0, -sy * L * k * gx, -sy * L * k * gy / 2.2, v.position.x, v.position.y - recul);
        s2.setFromMatrix(matricePortee);
        s2.tint = couleur; s2.alpha = Math.min(1, a * 1.8);
      }
    }

    async function ajouter(d) {
      if (elements.has(d.id)) retirer(d.id);
      const visuel = await creerVisuel(d);
      if (!SPECIAUX.has(d.type)) visuel.cullable = true;   // 20/10 · préparé pour la caméra de la grande passe : sans effet tant que tout le camp est visible (reglages.cull)
      const e = { id: d.id, def: d, visuel, reactions: d.reactions || {}, effets: [] };
      if (d.type !== 'personnage' && !SPECIAUX.has(d.type) && d.ombre !== 0 && d.ombre !== false && !auSol(d)) { e.ombre = new PIXI.Sprite(texOmbre); e.ombre.anchor.set(.5); couches.ombres.addChild(e.ombre); }
      if (d.lueurs || d.lueursNiveaux) creerLueurs(e);
      if (d.eau) creerEau(e);
      if (aPortee(d)) creerPortee(e);
      // le halo d'une lumière : le grand halo du feu flotte au-dessus de tout, celui d'une lanterne est rangé avec elle
      if (d.lumiere && !d.lueurs && !d.lueursNiveaux) { e.lueur = new PIXI.Sprite(texLueur); e.lueur.anchor.set(.5); e.lueur.blendMode = 'add'; (d.lumiere.rayon < 200 ? couches.objets : couches.lueurs).addChild(e.lueur); }
      (auSol(d) ? couches.sol : { bateau: couches.sol, voilier: couches.large, mouettes: couches.sol, papillons: couches.vie }[d.type] || couches.objets).addChild(visuel);
      elements.set(d.id, e); relister();
      poser(e); grilleSale();
      if (d.type === 'personnage') {
        const occ = [...elements.values()].filter(o => o !== e && o.def.type === 'personnage').map(o => [o.x, o.y]);
        const [sx, sy] = caseLibreProche(e.x, e.y, grilleAvec(occ)); e.x = d.x = sx; e.y = d.y = sy; poser(e);
        e.cerveau = cerveau(e);
      }
      if (d.type === 'bateau') e.cerveau = navire(e);
      if (d.type === 'voilier') e.cerveau = passage(e);
      if (d.type === 'mouettes') e.cerveau = await mouettes(e);
      if (d.type === 'papillons') e.cerveau = await papillons(e);
      if (d.type === 'guirlande') e.cerveau = guirlande(e);
      if (visuel.plan) extrasPlan(e);
      // (17/10) un compagnon peut porter une étiquette (le prénom d'un proche qui passe) et arriver par le ponton
      if (d.type === 'personnage' && d.etiquette) { await policePrete(); const t = DESSIN.etiquette(String(d.etiquette), POLICE); e.etiq = new PIXI.Sprite(PIXI.Texture.from(t.c)); e.etiq.anchor.set(.5, 1); e.etiq.scale.set(1 / DESSIN.R); couches.vie.addChild(e.etiq); }
      if (d.type === 'personnage' && d.arrivee) {
        const c = Array.isArray(d.arrivee) ? d.arrivee : P[d.arrivee] || P[S.lieux.feu]; e.visuel.alpha = 0; animer(1, k => { e.visuel.alpha = k; });
        // 19/10 · les autres compagnons vont à sa rencontre (« compagnon-arrive »)
        setTimeout(() => { if (!e.detruit && e.cerveau) { e.cerveau.allerVers(c[0], c[1]); emettre('compagnon-arrive', { compagnon: e.id, x: c[0], y: c[1] }); } }, 400);
      }
      // 19/10 · un objet qui vient d'être acheté : il arrive (après le vol depuis le Comptoir, « entree » en ms) en sortant du sol avec un petit rebond et de la poussière
      if (d.entree != null && d.entree !== false && !SPECIAUX.has(d.type) && d.type !== 'personnage' && !visuel.plan && !reduit()) {
        const sx0 = visuel.scale.x, sy0 = visuel.scale.y, delai = typeof d.entree === 'number' ? d.entree : 0; visuel.alpha = 0;
        setTimeout(() => { if (e.detruit || detruit) return; visuel.alpha = 1; animer(.6, k => { const u = Math.min(1, k / .7), m = 1 - Math.pow(1 - u, 3), s = .25 + .75 * m + (k > .5 ? .08 * Math.sin((k - .5) / .5 * Math.PI) : 0); visuel.scale.set(sx0 * s, sy0 * s); }, () => { visuel.scale.set(sx0, sy0); poussiere(e.x, e.y - 2, 12, (e.largeurAff || 40) * .45); }); }, delai);
      }
      if (lum) teinter(e);
      return e;
    }
    function retirer(id) {
      const e = elements.get(id); if (!e) return;
      const tPlan = e.visuel.plan ? e.visuel.texture : null;
      e.detruit = true; e.visuel.destroy({ children: true }); if (e.ombre) e.ombre.destroy(); if (e.lueur) e.lueur.destroy();
      if (tPlan) tPlan.destroy(true);
      for (const o of e.extras || []) o.destroy(o.propre ? { texture: true, textureSource: true } : undefined);
      if (e.etiq) e.etiq.destroy({ texture: true, textureSource: true });
      for (const l of e.lueurs || []) { l.g.destroy(); if (l.f) l.f.destroy(); }
      if (e.eau) { e.eau.c.destroy({ children: true }); e.eau = null; }
      if (e.portee) { e.portee.destroy(); e.portee = null; }
      if (e.nettoyer) e.nettoyer();
      elements.delete(id); relister(); grilleSale();
    }
    async function definir(id, props) {
      const e = elements.get(id); if (!e) return;
      if (e.visuel.plan && ['etat', 'niveau', 'modele', 'largeur'].some(k => k in props && props[k] !== e.def[k])) {
        const avant = e.def.etat; Object.assign(e.def, props); redessiner(e, avant);
        if (props.visible != null) e.visuel.visible = props.visible;
        return;
      }
      const ancien = e.def.niveau;
      Object.assign(e.def, props);
      // 19/10 · la jauge du feu (braises, stable, ardent) : sa teinte et sa lumière changent, pas sa taille
      if ('jauge' in props) { e.teinteMise = null; if (lum) teinter(e); }
      // 19/10 · la couleur de la saison : lampions et fanion se teintent par le code (multipliée à la lumière du moment)
      if (props.couleur != null && !e.visuel.plan) { e.visuel.teinteFixe = props.couleur ? hex(props.couleur) : null; e.teinteMise = null; }
      if (props.niveau && props.niveau !== ancien && e.def.images) {
        const t = await T(e.def.images[props.niveau - 1]);
        // transition : l'ancien s'efface, le nouveau pousse avec un petit rebond et de la poussière
        const vieux = new PIXI.Sprite(e.visuel.texture); vieux.anchor.copyFrom(e.visuel.anchor); vieux.position.copyFrom(e.visuel.position); vieux.scale.copyFrom(e.visuel.scale); vieux.zIndex = e.visuel.zIndex - .1; vieux.tint = e.visuel.tint;
        couches.objets.addChild(vieux);
        e.visuel.texture = t; poser(e);
        animer(1.1, k => { vieux.alpha = 1 - k; e.visuel.scale.y = e.visuel.scale.x * (k < .5 ? .6 + .9 * lisse(k * 2) * .5 + .05 : 1 + .08 * Math.sin((k - .5) * 2 * Math.PI) * (1 - k)); }, () => { vieux.destroy(); poser(e); });
        poussiere(e.x, e.y, 26, e.def.niveaux[props.niveau - 1].largeur * .5);
        if (e.def.lueursNiveaux) creerLueurs(e);
      } else poser(e);
      if (props.visible != null) e.visuel.visible = props.visible;
    }

    // ---------- (17/10) bâtiments, chantiers et emplacements (dessinés par DESSIN), lampions du Hameau, visiteurs
    // Un « emplacement » (ou un objet « auSol » : tapis, mosaïque) est posé à plat dans la couche du sol : on marche dessus.
    const auSol = d => !!(d.auSol || d.type === 'emplacement');
    const POLICE = 'Lexend, "Trebuchet MS", system-ui, sans-serif';
    let policeOk = null;
    const policePrete = () => policeOk || (policeOk = global.document && document.fonts && document.fonts.load ? Promise.race([document.fonts.load('600 45px Lexend').catch(() => null), new Promise(ok => setTimeout(ok, 1500))]) : Promise.resolve());
    function appliquerPlan(d, r) { d.pied = r.pied; d.ombre = r.ombre; if (!d.empreinteFixe) d.empreinte = r.empreinte; if (d.largeur == null) d.largeur = r.w; }
    function creerPlan(d) {
      const r = DESSIN.plan(d), s = new PIXI.Sprite(PIXI.Texture.from(r.c)); s.anchor.set(.5, r.pied); s.plan = r; appliquerPlan(d, r);
      return s;
    }
    // les petites choses qui vivent sur un bâtiment : la lueur du foyer, les lanternes, le fanion, l'enseigne qui se balance
    function extrasPlan(e) {
      for (const o of e.extras || []) o.destroy(o.propre ? { texture: true, textureSource: true } : undefined);
      e.extras = []; e.xFoyer = e.xDrapeau = e.xEnseigne = null; e.xLampes = [];
      const r = e.visuel.plan, ajoute = o => { couches.objets.addChild(o); e.extras.push(o); return o; };
      const lueur = teinte => { const g = new PIXI.Sprite(texLueur); g.anchor.set(.5); g.blendMode = 'add'; g.tint = teinte; g.visible = false; return ajoute(g); };
      if (r.foyer) e.xFoyer = lueur(0xff8a3a);
      for (let i = 0; i < (r.lampes || []).length; i++) e.xLampes.push(lueur(0xffc070));
      if (r.drapeau) e.xDrapeau = ajoute(new PIXI.Graphics());
      if (r.enseigne) { const en = DESSIN.enseigne(), s = new PIXI.Sprite(PIXI.Texture.from(en.c)); s.anchor.set(.5, 0); s.propre = true; e.xEnseigne = ajoute(s); }
    }
    function redessiner(e, avant) {
      const d = e.def, v = e.visuel, t0 = v.texture, r = DESSIN.plan(d);
      v.texture = PIXI.Texture.from(r.c); v.anchor.set(.5, r.pied); v.plan = r; appliquerPlan(d, r);
      extrasPlan(e); poser(e); e.teinteMise = null; if (lum) teinter(e);
      if (e.portee) e.portee.visible = false;
      t0.destroy(true);
      // un nouvel état : un peu de poussière, le dessin pousse avec un petit rebond ; construit : des étincelles
      if (avant !== d.etat && !reduit()) {
        const sx = v.scale.x, sy = v.scale.y, lF = e.largeurAff || 60;
        if (d.etat === 'construit' && avant === 'chantier') {
          // 19/10 · la fête de fin de chantier : le bâtiment sort du sol (masqué sous la ligne du sol), un nuage de poussière, puis des étincelles
          const hF = Math.abs(v.height) || 80, y0 = v.position.y, m = new PIXI.Graphics().rect(e.x - lF * 1.2, e.y - hF * 2.4, lF * 2.4, hF * 2.4).fill(0xffffff);
          m.zIndex = v.zIndex; couches.objets.addChild(m); v.mask = m; e.monte = true; v.position.y = y0 + hF * .95;
          poussiere(e.x, e.y - 3, 36, lF * .5);
          animer(.9, k => { const u = 1 - Math.pow(1 - k, 3); v.position.y = y0 + hF * .95 * (1 - u); }, () => { v.position.y = y0; v.mask = null; m.destroy(); e.monte = false; poussiere(e.x, e.y - 3, 18, lF * .45); });
          for (let i = 0; i < 3; i++) setTimeout(() => { if (!detruit && !e.detruit) etincelles(e.x, e.y - lF * .45, 14, 0xffd27a, v.zIndex); }, 700 + i * 280);
        } else {
          poussiere(e.x, e.y - 3, 26, lF * .42);
          animer(.9, k => { v.scale.y = sy * (k < .45 ? .6 + .4 * lisse(k / .45) * 1.06 : 1 + .05 * Math.sin((k - .45) / .55 * Math.PI) * (1 - k)); }, () => v.scale.set(sx, sy));
          if (d.etat === 'construit') for (let i = 0; i < 3; i++) setTimeout(() => { if (!detruit && !e.detruit) etincelles(e.x, e.y - lF * .45, 14, 0xffd27a, v.zIndex); }, i * 280);
        }
      }
    }
    // de petites étincelles qui sautent d'une enclume ou d'un marteau
    function eclats(x, y, n, z) {
      for (let i = 0; i < n; i++) {
        const k = .16 + Math.random() * .12; particule(famille('objets', z + .3, 'add', texPoint), texPoint, { x, y, scaleX: k, scaleY: k, tint: Math.random() < .5 ? 0xffd27a : 0xff9a3c }, { vx: (Math.random() - .5) * 70, vy: -30 - Math.random() * 60, g: 220, vie: .3 + Math.random() * .3, t: 0 });
      }
    }
    // 19/10 · des copeaux de bois qui volent à chaque coup de marteau d'un chantier (petits rectangles clairs qui tournent et retombent)
    const texCopeau = (() => { const c = document.createElement('canvas'); c.width = 10; c.height = 4; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(0, 0, 10, 4, 2); g.fill(); return PIXI.Texture.from(c); })();
    function copeaux(x, y, n, z) {
      for (let i = 0; i < n; i++) {
        const rot = (Math.random() - .5) * 14, k = .5 + Math.random() * .4;
        particule(famille('objets', z + .3, 'normal', texCopeau, 'r'), texCopeau, { x, y, scaleX: k, scaleY: k, rotation: Math.random() * 6.28, tint: Math.random() < .5 ? 0xe8c98a : 0xd1a86c }, { vx: (Math.random() - .5) * 90, vy: -60 - Math.random() * 70, g: 320, vie: .5 + Math.random() * .35, t: 0, maj: (q, r) => { const o = q.p || q.s; o.rotation += rot * .016; o.alpha = 1 - r * r; } });
      }
    }
    // la fumée d'une cheminée (chaque bâtiment a son rythme)
    function fumerCheminee(e, dt, nuitV, x, y, u) {
      e.tFumee = (e.tFumee || 0) - dt; if (e.tFumee > 0) return;
      e.tFumee = .5 + Math.random() * .25;
      const vie = 4 + Math.random() * 1.5, a = .4 - nuitV * .12, gris = rvb(melange([.8, .78, .76], [.42, .44, .5], nuitV));
      particule(famille('objets', e.visuel.zIndex + .2, 'normal', texFumee, 'v'), texFumee, { x: x + (Math.random() - .5) * 3 * u, y, scaleX: .16 * u, scaleY: .16 * u, tint: gris, alpha: 0 }, { vx: 3 + Math.random() * 3, vy: -16 - Math.random() * 6, g: 0, vie, t: 0, vent: true,
        maj: (q, r) => { echelleP(q, (.16 + .85 * r) * u); const o = q.p || q.s; o.alpha = a * Math.min(1, r / .12) * Math.pow(1 - r, 1.3); o.tint = gris; } });
    }
    const ptTmp = [0, 0];
    function majPlan(e, dt, fige) {
      const v = e.visuel, r = v.plan, d = e.def, vis = v.visible && v.alpha > .05 && !e.monte, u = (e.largeurAff || r.w) / r.w, mi = d.miroir ? -1 : 1;
      const P = (p, out) => { out[0] = e.x + (p[0] - r.w / 2) * u * mi; out[1] = e.y - (r.sol - p[1]) * u; return out; };
      const nuitV = lum ? lum.feu : 0, lampes = Math.max(0, Math.min(1, (nuitV - .2) / .6)), q = ptTmp;
      const vac = fige ? 1 : .82 + .18 * Math.sin(temps * 7.3 + e.x) * Math.sin(temps * 3.1 + 1);
      if (e.xFoyer) { P(r.foyer, q); const g = e.xFoyer; g.visible = vis; g.position.set(q[0], q[1]); g.scale.set(.44 * u, .3 * u); g.alpha = (.32 + .58 * lampes) * vac; g.zIndex = v.zIndex + .05; }
      for (let i = 0; i < e.xLampes.length; i++) { P(r.lampes[i], q); const g = e.xLampes[i]; g.visible = vis && lampes > .02; g.position.set(q[0], q[1]); g.scale.set(.32 * u); g.alpha = lampes * .9 * vac; g.zIndex = v.zIndex + .05; }
      if (e.xEnseigne) {
        P(r.enseigne.p, q); const s = e.xEnseigne; s.visible = vis; s.position.set(q[0], q[1]); s.scale.set(u / DESSIN.R * mi, u / DESSIN.R);
        s.rotation = fige ? 0 : (.07 * Math.sin(tempsEffets * 1.7 + e.x * .01) + .04 * Math.sin(tempsEffets * 2.9)) * ventA(e.x); s.tint = v.tint; s.zIndex = v.zIndex + .02;
      }
      if (e.xDrapeau) {
        // le fanion du Ponton : un triangle bleu à bande claire, qui ondule au vent
        const g = e.xDrapeau; g.clear(); g.visible = vis;
        if (vis) {
          P(r.drapeau, q); const L = 15 * u, H0 = 6.5 * u, n = 6, t = fige ? 0 : tempsEffets, f = ventA(e.x), pts = [];
          for (let i = 0; i <= n; i++) { const k = i / n; pts.push([q[0] + k * L * mi, q[1] + Math.sin(t * 5.5 - k * 4) * 1.7 * u * k * f]); }
          const bande = (h0, h1, couleur) => {   // de h0 à h1 (fractions de la hauteur au mât), jusqu'à la pointe
            g.moveTo(pts[0][0], pts[0][1] + H0 * h0); for (let i = 1; i <= n; i++) g.lineTo(pts[i][0], pts[i][1] + H0 * h0 * (1 - i / n));
            for (let i = n; i >= 0; i--) g.lineTo(pts[i][0], pts[i][1] + H0 * h1 * (1 - i / n)); g.closePath(); g.fill({ color: couleur });
          };
          bande(0, 1, e.def.couleur ? parseInt(String(e.def.couleur).slice(1), 16) : 0x3f6aa6); bande(.4, .6, 0xf2e8d4);   // 19/10 : le fanion du Ponton prend la couleur de la saison (definir(id, { couleur }))
          g.tint = v.tint; g.zIndex = v.zIndex + .01;
        }
      }
      if (!vis || fige || options.vieAmbiante === false) return;
      if (r.cheminee) { P(r.cheminee, q); fumerCheminee(e, dt, nuitV, q[0], q[1], u); }
      if (r.enclume) {
        e.tEnclume = (e.tEnclume == null ? 2 + Math.random() * 3 : e.tEnclume) - dt;
        if (e.tEnclume <= 0) { e.tEnclume = 6 + Math.random() * 7; const p = P(r.enclume, [0, 0]); for (let k = 0; k < 3; k++) setTimeout(() => { if (!detruit && !e.detruit) eclats(p[0], p[1], 3 + Math.floor(Math.random() * 3), v.zIndex); }, k * 420); }
      }
      if (r.etat === 'chantier') {
        e.tPouss = (e.tPouss == null ? 1 : e.tPouss) - dt; if (e.tPouss <= 0) { e.tPouss = 2.6 + Math.random() * 3; poussiere(e.x + (Math.random() - .5) * e.largeurAff * .6, e.y - 2, 5, 6); }
        e.tMart = (e.tMart == null ? .8 : e.tMart) - dt;
        if (e.tMart <= 0) { e.tMart = Math.random() < .3 ? .35 : 1.4 + Math.random() * 2.2; if (r.marteau) { const p = P(r.marteau, [0, 0]); eclats(p[0] + (Math.random() - .5) * 10 * u, p[1], 3, v.zIndex); if (!legere) copeaux(p[0], p[1] - 2 * u, 2 + Math.floor(Math.random() * 3), v.zIndex); } }
      }
    }
    // Les lampions du Hameau : une guirlande devant le kiosque. « allumees » : combien brillent (les Sommets du groupe dans la
    // semaine) ; un lampion qui s'allume s'éclaire doucement. On ne montre jamais qui l'a allumé.
    function guirlande(e) {
      const d = e.def, c = e.visuel, fil = new PIXI.Graphics(), tex = PIXI.Texture.from(DESSIN.lampion().c), L = [];
      c.addChild(fil);
      const refaire = () => {
        while (L.length) { const l = L.pop(); l.s.destroy(); l.g.destroy(); }
        for (let i = 0; i < (d.nombre || 12); i++) { const s = new PIXI.Sprite(tex); s.anchor.set(.5, .08); c.addChild(s); const g = new PIXI.Sprite(texLueur); g.anchor.set(.5); g.blendMode = 'add'; g.tint = 0xffc477; g.visible = false; couches.lueurs.addChild(g); L.push({ s, g, ph: Math.random() * 6.28, k: 0 }); }
      };
      refaire();
      e.nettoyer = () => { for (const l of L) l.g.destroy(); tex.destroy(true); };
      let n0 = d.nombre;
      return {
        evenement() {},
        maj(dt) {
          if (d.nombre !== n0) { n0 = d.nombre; refaire(); }
          const k0 = elements.get(d.autour || 'kiosque'), vis = !!(k0 && k0.visuel.visible && k0.visuel.alpha > .05);
          c.visible = vis; if (!vis) { for (const l of L) l.g.visible = false; return; }
          const [x0, y0, x1, y1] = boiteDe(k0), w = x1 - x0, h = y1 - y0, A2 = d.points || [[.25, .35], [.6, .405], [.87, .34]], creux = (d.creux || .04) * h;
          const fige = reduit(), nuitV = lum ? lum.feu : 0, lampes = Math.max(0, Math.min(1, (nuitV - .15) / .6)), allumees = Math.min(L.length, d.allumees || 0);
          const pts = A2.map(([fx, fy]) => [x0 + fx * w, y0 + fy * h]), ech = w / 141;
          c.zIndex = k0.visuel.zIndex + .5;
          fil.clear();
          for (let i = 0; i < pts.length - 1; i++) { fil.moveTo(pts[i][0], pts[i][1]); fil.quadraticCurveTo((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2 + creux * 2, pts[i + 1][0], pts[i + 1][1]); }
          fil.stroke({ width: .8 * ech, color: 0x3a2a20, alpha: .85 });
          const nSeg = pts.length - 1, tl = lum ? lum.teinte : [1, 1, 1], eteint = [tl[0] * .8, tl[1] * .76, tl[2] * .72], allume = [1, .88, .62];
          for (let i = 0; i < L.length; i++) {
            const l = L[i], tt = (i + .5) / L.length * nSeg, si = Math.min(nSeg - 1, Math.floor(tt)), t = tt - si, a = pts[si], b = pts[si + 1];
            const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + creux * 2, u1 = 1 - t, x = u1 * u1 * a[0] + 2 * u1 * t * mx + t * t * b[0], y = u1 * u1 * a[1] + 2 * u1 * t * my + t * t * b[1];
            l.k += ((i < allumees ? 1 : 0) - l.k) * Math.min(1, dt * 1.5);
            l.s.position.set(x, y); l.s.rotation = fige ? 0 : .12 * Math.sin(tempsEffets * 1.4 + l.ph) * ventA(x); l.s.scale.set(ech * .9 / DESSIN.R);
            l.s.tint = rvb(melange(eteint, allume, l.k));
            const vac = fige ? 1 : .86 + .14 * Math.sin(temps * 6 + l.ph * 3);
            l.g.visible = l.k > .02; l.g.position.set(x, y + 4.5 * ech); l.g.scale.set(.2 * ech); l.g.alpha = l.k * (.3 + .6 * lampes) * vac;
          }
        }
      };
    }

    // ---------- petites animations et particules
    const enCours = [];
    const animer = (duree, f, fin) => enCours.push({ t: 0, duree, f, fin });
    const particules = [];
    // 20/10 · les particules du monde (étincelles, braises, éclats et copeaux des chantiers, poussière, sable des pas, fumées, embruns, sillage, gouttes) vivent dans
    // des ParticleContainer (PixiJS 8.22) : une famille = un calque, une profondeur, un mode de fusion, une texture commune ; seules la position et la couleur
    // (le fondu) remontent au GPU à chaque image, plus l'échelle (« v ») ou la rotation (« r ») pour les familles qui en ont besoin ; ce qui brille est dans un
    // conteneur en mode « add » dont les particules héritent. Un Particle n'est pas un Sprite : la boucle lit o = q.p || q.s (un texte, un rond dessiné restent des sprites).
    const familles = new Map();
    function famille(couche, z, fusion, tex, dyn, dessous) {
      const cle = [couche, z == null ? '' : z.toFixed(2), fusion, tex.uid, dyn || ''].join('|'); let pc = familles.get(cle);
      if (!pc) {
        pc = new PIXI.ParticleContainer({ texture: tex, boundsArea: new PIXI.Rectangle(-200, -200, W + 400, H + 400), dynamicProperties: { position: true, color: true, vertex: /v/.test(dyn || ''), rotation: /r/.test(dyn || '') } });
        pc.blendMode = fusion; if (z != null) pc.zIndex = z; if (dessous) couches[couche].addChildAt(pc, 0); else couches[couche].addChild(pc); familles.set(cle, pc);
      }
      return pc;
    }
    function particule(pc, tex, o, q) { const p = new PIXI.Particle(Object.assign({ texture: tex, anchorX: .5, anchorY: .5 }, o)); pc.addParticle(p); q.p = p; q.pc = pc; particules.push(q); return p; }
    const echelleP = (q, sx, sy) => { if (q.p) { q.p.scaleX = sx; q.p.scaleY = sy == null ? sx : sy; } else q.s.scale.set(sx, sy == null ? sx : sy); };
    function etincelles(x, y, n = 18, couleur = 0xffc070, z = null) {
      const pc = z === null ? famille('vie', null, 'add', texPoint) : famille('objets', z + .2, 'add', texPoint);
      for (let i = 0; i < n; i++) { const k = .35 + Math.random() * .4; particule(pc, texPoint, { x: x + (Math.random() - .5) * 20, y, scaleX: k, scaleY: k, tint: couleur }, { vx: (Math.random() - .5) * 60, vy: -80 - Math.random() * 120, g: 90, vie: .8 + Math.random() * .8, t: 0 }); }
    }
    function poussiere(x, y, n, r) {
      const pc = famille('vie', null, 'normal', texPoint);
      for (let i = 0; i < n; i++) { const k = .8 + Math.random() * 1.2; particule(pc, texPoint, { x: x + (Math.random() - .5) * r * 2, y: y - Math.random() * 8, scaleX: k, scaleY: k, tint: 0xd9c3a0, alpha: .7 }, { a: .7, vx: (Math.random() - .5) * 50, vy: -20 - Math.random() * 30, g: 30, vie: .7 + Math.random() * .5, t: 0 }); }
    }
    // le sable soulevé par un sabot qui se pose : deux petites bouffées, au sol (derrière les jambes), teintées par la lumière
    function poussierePas(x, y, k) {
      if (reduit() || options.vieAmbiante === false) return;
      const teinte = lum ? lum.teinte : [1, 1, 1], c = rvb([1 * teinte[0], .94 * teinte[1], .84 * teinte[2]]);   // un peu plus clair que le sol : la poussière soulevée prend la lumière
      for (let i = 0; i < 2; i++) {
        const sens = Math.random() < .5 ? -1 : 1, k0 = .16 * k, pc = famille('sol', null, 'normal', texFumee, 'v');
        particule(pc, texFumee, { x: x + (Math.random() - .5) * 4 * k, y, anchorY: .7, scaleX: .16 * k, scaleY: .11 * k, tint: c, alpha: 0 }, { vx: sens * (6 + Math.random() * 8) * k, vy: -(3 + Math.random() * 4) * k, g: 6 * k, vie: .55 + Math.random() * .3, t: 0,
          maj: (q, r) => { echelleP(q, k0 * (1 + r * 1.6), k0 * .7 * (1 + r * 1.2)); (q.p || q.s).alpha = .7 * Math.min(1, r / .12) * Math.pow(1 - r, 1.3); } });
      }
    }
    function zzz(x, y) {
      const t = new PIXI.Text({ text: 'z', style: { fontFamily: 'Georgia, serif', fontSize: 16, fill: 0xeef2ff, fontStyle: 'italic' } });
      t.anchor.set(.5); t.position.set(x, y); t.alpha = 0; couches.vie.addChild(t);
      particules.push({ s: t, vx: 10, vy: -16, g: 0, vie: 2.2, t: 0, texte: true });
    }

    const tailleRepos = e => e.sx0 != null ? [e.sx0, e.sy0] : (e.s0 || (e.s0 = [e.visuel.scale.x, e.visuel.scale.y]));
    // Les réactions : ce qu'un élément sait faire quand un événement arrive (liste dans le JSON).
    const REACTIONS = {
      // la taille de repos de l'objet : deux réactions qui se chevauchent ne le laissent jamais grossi ou rétréci
      sautiller(e) { const v = e.visuel, [sx, sy] = tailleRepos(e); animer(.45, k => { const b = Math.sin(k * Math.PI); v.scale.y = sy * (1 + .07 * b); v.scale.x = sx * (1 - .03 * b); }, () => v.scale.set(sx, sy)); },
      etincelles(e) { etincelles(e.x, e.y - (e.def.largeur || 60) * .45, 22, undefined, e.def.type === 'personnage' ? null : e.visuel.zIndex); },
      embraser(e) { const v = e.visuel, [sx, sy] = tailleRepos(e); e.boost = 1; animer(3.2, k => { const b = Math.sin(Math.min(1, k * 3) * Math.PI / 2) * (1 - Math.max(0, k - .7) / .3); v.scale.set(sx * (1 + .32 * b), sy * (1 + .32 * b)); e.boost = 1 + 1.4 * b; }, () => { v.scale.set(sx, sy); e.boost = 1; }); for (let i = 0; i < 4; i++) setTimeout(() => etincelles(e.x, e.y - 50, 16, undefined, e.visuel.zIndex), i * 350); },
      briller(e) { animer(1.2, k => { e.visuel.alpha = 1; e.eclat = Math.sin(k * Math.PI); }, () => { e.eclat = 0; }); },
      rafale(e) { e.rafale = 1; animer(2, k => { e.rafale = 1 + 2.5 * Math.sin(k * Math.PI); }, () => { e.rafale = 1; }); }
    };

    function emettre(nom, donnees = {}) {
      if (nom === 'sommet' && !reduit()) { const f = feux()[0]; lancerRafale((f ? f.x : 360) - 120, 1.7, 230); pulsTemple = 1; }
      // 19/10 · les paliers du Mont s'allument sur la montagne : « mont-palier » (un de plus, l'éclat monte le long du chemin), « mont-paliers » (l'état, sans animation) ; le Sommet allume tout
      if (nom === 'mont-palier') montAllumer(donnees.n, true); else if (nom === 'mont-paliers') montAllumer(donnees.n, false); else if (nom === 'sommet') montAllumer(99, !reduit());
      // 19/10 · la caméra : au Sommet, un léger mouvement vers le Mont puis retour ; au départ en expédition, un léger suivi du bateau
      // 19/10 · au Sommet de nuit, une étoile filante (tout de suite)
      if (nom === 'sommet' && lum && lum.etoiles >= .6 && !reduit()) emetteurs.etoile = 0;
      if (nom === 'sommet' && !reduit()) { const mo = S.ambiance && S.ambiance.mont, pal = mo && mo.paliers && mo.paliers[mo.paliers.length - 1]; if (pal) camMont = { t: 0, duree: 3.2, dx: (pal[0] - camBase.x) * .2, dy: (pal[1] - camBase.y) * .2 }; }
      if (nom === 'expedition-depart' && !reduit() && !camSuivi) { const b = elts.find(o => o.def.type === 'bateau' && !o.detruit); if (b) camSuivi = { b, x0: b.x, y0: b.y, vu: false }; }
      for (const e of elements.values()) {
        const r = e.reactions[nom];
        if (r && (nom !== 'toucher' || donnees.cible === e.id)) for (const a of [].concat(r)) REACTIONS[a] && REACTIONS[a](e, donnees);
        if (e.cerveau) e.cerveau.evenement(nom, donnees);
      }
      for (const f of ecouteurs[nom] || []) try { f(donnees); } catch (err) { console.error(err); }
      for (const f of ecouteurs['*'] || []) try { f(nom, donnees); } catch (err) { console.error(err); }
    }

    // ---------- se déplacer : une grille fine du sol de la clairière (« sol » dans le JSON). Chaque objet posé y devient un
    // obstacle : son empreinte au sol (polygone ou ellipse, en fraction de son image), élargie de la taille des pieds d'un
    // compagnon (« navigation.pied »). Les compagnons s'évitent aussi entre eux.
    const P = S.chemins.points;
    const NAV = { c: 4, w: Math.ceil(W / 4), h: Math.ceil(H / 4) };
    const [PIED_X, PIED_Y] = (S.navigation && S.navigation.pied) || [18, 8];
    let grille = null;
    const grilleSale = () => { grille = null; gene.clear(); for (const o of elements.values()) { o.emp = undefined; o.bt = null; } };
    const gene = new Map();
    // l'empreinte au sol d'un objet, en coordonnées de la scène (un polygone)
    function empreinte(e) {
      const d = e.def;
      if (d.type === 'personnage' || SPECIAUX.has(d.type) || d.type === 'zone' || d.empreinte === false || !e.visuel.visible) return null;
      const v = e.visuel, w = Math.abs(v.width), h = Math.abs(v.height), pied = d.pied || 1, gauche = e.x - w / 2, haut = e.y - h * pied;
      const E = d.empreinte || {}, vers = ([fx, fy]) => [gauche + (d.miroir ? 1 - fx : fx) * w, haut + fy * h];
      const poly = (E.polyNiveaux && E.polyNiveaux[(d.niveau || 1) - 1]) || E.poly;
      if (poly) return poly.map(vers);
      const [cx, cy, fw, ra] = E.ellipse || [.5, .9, .42, .45];
      const rx = fw * w, ry = rx * ra, [x0, y0] = vers([cx, cy]);
      return Array.from({ length: 20 }, (_, i) => { const a = i / 20 * Math.PI * 2; return [x0 + Math.cos(a) * rx, y0 + Math.sin(a) * ry]; });
    }
    const empreinteDe = o => (o.emp === undefined ? (o.emp = empreinte(o)) : o.emp);
    // le rectangle de l'image d'un objet, en coordonnées de la scène
    function boiteDe(o) {
      if (o.bt) return o.bt;
      const v = o.visuel, w = Math.abs(v.width), h = Math.abs(v.height), pied = o.def.pied || 1, g = o.x - w / 2, haut = o.y - h * pied;
      return (o.bt = [g, haut, g + w, haut + h]);
    }
    // le bord avant d'une empreinte (son contour le plus bas) à l'abscisse x, prolongé au-delà de ses côtés : devant ou derrière l'objet ?
    function bordAvant(poly, x) {
      let mn = Infinity, mx = -Infinity; for (let i = 0; i < poly.length; i++) { const px = poly[i][0]; if (px < mn) mn = px; if (px > mx) mx = px; }
      x = Math.min(mx - .01, Math.max(mn + .01, x));
      let y = null;
      for (let i = 0; i < poly.length; i++) {
        const pa = poly[i], pb = poly[(i + 1) % poly.length], ax = pa[0], ay = pa[1], bx = pb[0], by = pb[1];
        if (ax === bx || (x - ax) * (x - bx) > 0) continue;
        const yy = ay + (by - ay) * (x - ax) / (bx - ax); if (y === null || yy > y) y = yy;
      }
      return y;
    }
    function tracer(g, poly) { g.beginPath(); poly.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); }
    function construireGrille() {
      const cv = document.createElement('canvas'); cv.width = NAV.w; cv.height = NAV.h;
      const g = cv.getContext('2d', { willReadFrequently: true });
      g.fillStyle = '#000'; g.fillRect(0, 0, NAV.w, NAV.h);
      g.setTransform(1 / NAV.c, 0, 0, 1 / NAV.c, 0, 0);
      g.fillStyle = '#fff'; tracer(g, S.sol || [[0, 760], [W, 760], [W, 1110], [0, 1110]]); g.fill();
      // les obstacles, élargis de la taille des pieds : tracés dans un repère écrasé en hauteur, l'élargissement est une ellipse
      const k = PIED_Y / PIED_X;
      g.setTransform(1 / NAV.c, 0, 0, k / NAV.c, 0, 0);
      g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineWidth = PIED_X * 2; g.lineJoin = 'round';
      for (const e of elements.values()) { const poly = empreinteDe(e); if (!poly) continue; tracer(g, poly.map(([x, y]) => [x, y / k])); g.fill(); g.stroke(); }
      const px = g.getImageData(0, 0, NAV.w, NAV.h).data;
      grille = new Uint8Array(NAV.w * NAV.h);
      for (let i = 0; i < grille.length; i++) grille[i] = px[i * 4] > 128 ? 1 : 0;
    }
    const dansGrille = (G, x, y) => { const i = Math.floor(x / NAV.c), j = Math.floor(y / NAV.c); return i >= 0 && j >= 0 && i < NAV.w && j < NAV.h && G[j * NAV.w + i] === 1; };
    const libre = (x, y) => { if (!grille) construireGrille(); return dansGrille(grille, x, y); };
    // la grille avec, en plus, la place occupée par les autres compagnons
    function grilleAvec(autres) {
      if (!grille) construireGrille();
      if (!autres || !autres.length) return grille;
      // une bulle autour de chacun : on passe à côté sans se frôler ; plus petite autour de qui est assis (on passe derrière lui)
      const G = grille.slice();
      for (const [ox, oy, assis] of autres) {
        const rx = assis ? PIED_X + 10 : PIED_X * 2 + 14, ry = assis ? PIED_Y + 5 : PIED_Y * 2 + 7;
        for (let j = Math.floor((oy - ry) / NAV.c); j <= Math.ceil((oy + ry) / NAV.c); j++) for (let i = Math.floor((ox - rx) / NAV.c); i <= Math.ceil((ox + rx) / NAV.c); i++) {
          if (i < 0 || j < 0 || i >= NAV.w || j >= NAV.h) continue;
          const dx = ((i + .5) * NAV.c - ox) / rx, dy = ((j + .5) * NAV.c - oy) / ry; if (dx * dx + dy * dy <= 1) G[j * NAV.w + i] = 0;
        }
      }
      return G;
    }

    function caseLibreProche(x, y, G) {
      if (!G) { if (!grille) construireGrille(); G = grille; }
      if (dansGrille(G, x, y)) return [x, y];
      for (let r = 1; r < 90; r++) for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, qx = x + Math.cos(a) * r * NAV.c, qy = y + Math.sin(a) * r * NAV.c * .6; if (dansGrille(G, qx, qy)) return [qx, qy]; }
      return [x, y];
    }
    const vueG = (G, ax, ay, bx, by) => { const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 2); for (let k = 1; k < n; k++) if (!dansGrille(G, ax + (bx - ax) * k / n, ay + (by - ay) * k / n)) return false; return true; };
    // le chemin le plus court de (x0, y0) à (x1, y1), en évitant aussi les autres compagnons ; sinon en ne contournant que
    // les objets ; et s'il n'y en a aucun, pas de chemin (jamais de ligne droite à travers un objet)
    function chemin(x0, y0, x1, y1, autres) {
      const r = (autres && autres.length && cheminDans(grilleAvec(autres), x0, y0, x1, y1)) || cheminDans(grilleAvec(null), x0, y0, x1, y1);
      return r || [];
    }
    let tamponsA = null;
    function cheminDans(grille, xd, yd, x1, y1) {
      const vue = (ax, ay, bx, by) => vueG(grille, ax, ay, bx, by);
      const [x0, y0] = caseLibreProche(xd, yd, grille); [x1, y1] = caseLibreProche(x1, y1, grille);
      if (!dansGrille(grille, x0, y0) || !dansGrille(grille, x1, y1)) return null;
      const w = NAV.w, idx = (x, y) => Math.floor(y / NAV.c) * w + Math.floor(x / NAV.c);
      const dep = idx(x0, y0), arr = idx(x1, y1), n = grille.length;
      // tampons réutilisés d'une recherche à l'autre (pas de grosse allocation à chaque chemin)
      if (!tamponsA || tamponsA.n !== n) tamponsA = { n, g: new Float32Array(n), prec: new Int32Array(n), ferme: new Uint8Array(n), tk: new Float64Array(4096), tv: new Int32Array(4096) };
      const { g, prec, ferme } = tamponsA; g.fill(Infinity); prec.fill(-1); ferme.fill(0);
      // tas binaire dans des tableaux typés (pas d'allocation par case) ; heuristique « octile », exacte sur une grille à 8 voisins
      const cxA = arr % w, cyA = Math.floor(arr / w);
      const h = i => { const dx = Math.abs(i % w - cxA), dy = Math.abs(Math.floor(i / w) - cyA); return (dx + dy - .586 * Math.min(dx, dy)) * 1.0005; };
      let tasN = 0;
      const pousser = (i, f) => {
        if (tasN >= tamponsA.tk.length) { const k2 = new Float64Array(tasN * 2), v2 = new Int32Array(tasN * 2); k2.set(tamponsA.tk); v2.set(tamponsA.tv); tamponsA.tk = k2; tamponsA.tv = v2; }
        const tk = tamponsA.tk, tv = tamponsA.tv; let k = tasN++;
        while (k > 0) { const p2 = (k - 1) >> 1; if (tk[p2] <= f) break; tk[k] = tk[p2]; tv[k] = tv[p2]; k = p2; }
        tk[k] = f; tv[k] = i;
      };
      const tirer = () => {
        const tk = tamponsA.tk, tv = tamponsA.tv, r = tv[0], fk = tk[--tasN], fv = tv[tasN]; let k = 0;
        for (;;) { let m = 2 * k + 1; if (m >= tasN) break; if (m + 1 < tasN && tk[m + 1] < tk[m]) m++; if (tk[m] >= fk) break; tk[k] = tk[m]; tv[k] = tv[m]; k = m; }
        tk[k] = fk; tv[k] = fv; return r;
      };
      g[dep] = 0; pousser(dep, h(dep));
      while (tasN) {
        const u = tirer(); if (u === arr) break; if (ferme[u]) continue; ferme[u] = 1;
        const ux = u % w, uy = Math.floor(u / w);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue; const vx = ux + dx, vy = uy + dy; if (vx < 0 || vy < 0 || vx >= w || vy >= NAV.h) continue;
          const v = vy * w + vx; if (!grille[v] || ferme[v]) continue;
          if (dx && dy && (!grille[uy * w + vx] || !grille[vy * w + ux])) continue;
          const ng = g[u] + (dx && dy ? 1.414 : 1); if (ng < g[v]) { g[v] = ng; prec[v] = u; pousser(v, ng + h(v)); }
        }
      }
      if (prec[arr] < 0 && arr !== dep) return null;
      const pts = []; for (let c = arr; c !== dep && c >= 0; c = prec[c]) pts.unshift([(c % w + .5) * NAV.c, (Math.floor(c / w) + .5) * NAV.c]);
      pts[pts.length - 1] = [x1, y1];
      // lissage : on garde seulement les points nécessaires pour contourner les obstacles
      const lisse2 = []; let ax = x0, ay = y0, k = 0;
      while (k < pts.length) { let j = pts.length - 1; while (j > k && !vue(ax, ay, pts[j][0], pts[j][1])) j--; lisse2.push(pts[j]); [ax, ay] = pts[j]; k = j + 1; }
      // parti d'un peu à côté du chemin (poussé, ou arrivé au bord) : il rejoint d'abord la case libre la plus proche
      if (Math.hypot(x0 - xd, y0 - yd) > 2) lisse2.unshift([x0, y0]);
      return lisse2;
    }
    // distance « au sol » : la profondeur compte double (vue en plongée)
    const distSol = (ax, ay, bx, by) => Math.hypot(ax - bx, (ay - by) * 2.2);
    // pour la vitesse de marche, la profondeur compte moins que pour les distances : 2,2 rendrait les trajets vers la mer
    // trop lents à l'écran. La marionnette règle la longueur de ses pas sur la même valeur (pas de glissade).
    const PERSP_PAS = 1.5;
    const loinDe = (x, y, eviter, d) => (eviter || []).every(([ox, oy]) => distSol(x, y, ox, oy) > d);
    // assez loin au sol, et sans se cacher l'un l'autre à l'image (l'un juste derrière l'autre)
    const degage = (x, y, eviter, d) => (eviter || []).every(([ox, oy]) => distSol(x, y, ox, oy) > d && (Math.abs(x - ox) > 50 || Math.abs(y - oy) > 58));
    function pointAuHasard(x, y, eviter) {
      if (!grille) construireGrille();
      for (let t = 0; t < 80; t++) {
        const qx = 90 + Math.random() * 540, qy = 790 + Math.random() * 300;
        // un endroit dégagé : pas caché derrière un objet, et loin des autres
        if (libre(qx, qy) && Math.hypot(qx - x, qy - y) > 90 && degage(qx, qy, eviter, 90) && geneEn(qx, qy) < .2) return [qx, qy];
      }
      return caseLibreProche(x, y);
    }
    // un point de la scène tombe-t-il sur un pixel visible de l'objet ?
    function opaqueEn(o, x, y) {
      const v = o.visuel, tex = v.texture; if (!tex) return false;
      const loc = v.toLocal({ x, y }, monde), px = Math.floor(loc.x + (v.anchor ? v.anchor.x * tex.width : 0)), py = Math.floor(loc.y + (v.anchor ? v.anchor.y * tex.height : 0));
      if (px < 0 || py < 0 || px >= tex.width || py >= tex.height) return false;
      const A2 = alphaDe(tex); return !A2 || A2.a[(py * A2.w + px) * 4 + 3] > 60;
    }
    // la part d'un compagnon assis en (x, y) qui chevaucherait un autre objet (de 0 à 1)
    function geneEn(x, y, sauf) {
      const cle = Math.round(x) + ',' + Math.round(y); if (gene.has(cle)) return gene.get(cle);
      const ech = echelleA(y), h = 96 * ech, l = 32 * ech; let n = 0, tot = 0;
      for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) {
        const qx = x - l + i / 4 * l * 2, qy = y - j / 6 * h; tot++;
        for (const o of elements.values()) {
          if (o === sauf || o.def.type === 'personnage' || SPECIAUX.has(o.def.type) || o.def.type === 'zone' || auSol(o.def) || !o.visuel.visible) continue;
          const b = boiteDe(o); if (qx < b[0] || qx > b[2] || qy < b[1] || qy > b[3]) continue;
          if (opaqueEn(o, qx, qy)) { n++; break; }
        }
      }
      gene.set(cle, n / tot); return n / tot;
    }
    // les places autour du feu : chaque compagnon s'assoit à la sienne, de préférence là où il ne se cache pas derrière un objet
    // les places possibles autour du feu : celles du JSON d'abord ; s'il y a du monde, un deuxième et un troisième cercle
    // (jamais juste devant le feu, il le cacherait)
    function placesSieges(f) {
      const Sg = S.lieux.sieges;
      const place = (rx, ry, a, rang) => { const r = a * Math.PI / 180, [x, y] = caseLibreProche(f.x + Math.cos(r) * rx, f.y - 12 + Math.sin(r) * ry); return { x, y, rang }; };
      const places = Sg.angles.map((a, rang) => place(Sg.rx, Sg.ry, a, rang));
      for (const k of [1.25, 1.5]) for (let a = 0; a < 360; a += 15) if (a < 50 || a > 130) places.push(place(Sg.rx * k, Sg.ry * k, a, 100 * k + a / 1000));
      return places;
    }
    function siegeLibre(eviter) {
      const Sg = S.lieux.sieges, f = Sg && elements.get(Sg.centre);
      if (!f) return P[S.lieux.feu];
      const places = placesSieges(f); for (const q of places) q.g = geneEn(q.x, q.y, f);
      const libres = places.filter(q => libre(q.x, q.y) && degage(q.x, q.y, eviter, 62));
      places.length = 0; places.push(...libres);
      if (!places.length) return caseLibreProche(f.x - Sg.rx, f.y);
      const seuil = Sg.gene == null ? .06 : Sg.gene;
      places.sort((a, b) => ((a.g > seuil) - (b.g > seuil)) || (a.g > seuil ? a.g - b.g : a.rang - b.rang));
      return [places[0].x, places[0].y];
    }
    // devant ou derrière : on compare le personnage aux seuls objets dont l'image le recouvre. Il passe devant un objet si ses pieds
    // sont plus bas que le bord avant de l'empreinte de l'objet. Les bornes trouvées servent aussi à ranger les compagnons entre eux.
    function profondeurPerso(e, x, y) {
      const p = e.visuel.marionnette, h = p ? p.hauteurVisible() : 100, l = h * .34;
      let bas = -Infinity, haut = Infinity, sb = 0, sh = 0;
      const L0 = elts;
      for (let io = 0; io < L0.length; io++) {
        const o = L0[io]; if (o.detruit) continue;
        if (o === e || o.def.type === 'personnage' || SPECIAUX.has(o.def.type) || !o.visuel.visible) continue;
        const poly = empreinteDe(o); if (!poly) continue;
        const b = boiteDe(o); if (x + l < b[0] || x - l > b[2] || y < b[1] || y - h > b[3]) continue;
        const ya = bordAvant(poly, x); if (ya === null) continue;
        const z = o.visuel.zIndex, s = Math.abs(y - ya);
        if (y >= ya) { if (z + .5 > bas) bas = z + .5; sb = Math.max(sb, s); } else { if (z - .5 < haut) haut = z - .5; sh = Math.max(sh, s); }
      }
      if (bas > haut) { if (sb >= sh) haut = Infinity; else bas = -Infinity; }
      if (!e.bornes) e.bornes = [0, 0]; e.bornes[0] = bas; e.bornes[1] = haut;
      return Math.min(haut, Math.max(bas, y));
    }
    // deux compagnons qui se recouvrent : celui qui a les pieds le plus bas passe devant, si les objets autour le permettent
    function rangerCompagnons() {
      const ps = persos;
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        let a = ps[i], b = ps[j]; if (!a.visuel.visible || !b.visuel.visible || !a.bornes || !b.bornes) continue;
        if (a.y < b.y) { const c = a; a = b; b = c; }
        const la = a.visuel.marionnette.hauteurVisible() * .34, lb = b.visuel.marionnette.hauteurVisible() * .34;
        if (Math.abs(a.x - b.x) > la + lb || a.visuel.zIndex > b.visuel.zIndex) continue;
        if (b.visuel.zIndex + .01 <= a.bornes[1]) a.visuel.zIndex = b.visuel.zIndex + .01;
        else if (a.visuel.zIndex - .01 >= b.bornes[0]) b.visuel.zIndex = a.visuel.zIndex - .01;
      }
    }

    // ---------- le bateau d'expédition : amarré au rivage ; il emmène les compagnons vers l'horizon et les ramène
    function navire(e) {
      const d = e.def, v = e.visuel, pts = [d.amarre, ...d.route];
      let etat = 'amarre', t = 0, s = 0, s0 = 1, a0 = 0, sens = 1, voile = .22, temps2 = Math.random() * 10, sillage = 0;
      const lisseS = u => u * u * (3 - 2 * u);
      // courbe passant par tous les points de la route (Catmull-Rom), s de 0 (amarre) à 1 (horizon)
      const point = s2 => {
        const n = pts.length - 1, f = Math.min(n - 1e-6, Math.max(0, s2 * n)), i = Math.floor(f), u = f - i;
        const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
        const c = (a, b, c2, d2) => .5 * (2 * b + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d2) * u * u + (-a + 3 * b - 3 * c2 + d2) * u * u * u);
        return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
      };
      const echelle = y => (d.longueur / (d.modele && VIE[d.modele] ? VIE[d.modele].largeur : 52)) * (.16 + .84 * Math.pow(Math.max(0, Math.min(1, (y - d.horizon) / (d.amarre[1] - d.horizon))), 1.25));
      let dirX = -1, dirY = 0, dos = 0, sensAff = 1;
      // lissages exprimés pour 60 images par seconde, corrigés selon le temps réel écoulé (même rendu à 30, 60 ou 120 Hz)
      const lis = (f, dt) => 1 - Math.pow(1 - f, dt * 60);
      const placer = (dt = 1 / 60) => {
        const [x, y] = point(s), k = echelle(y);
        // la direction réelle du mouvement décide de l'orientation : la proue regarde là où il va
        if (e.x != null) { const mx = x - e.x, my = y - e.y, mm = Math.hypot(mx, my); if (mm > .02) { const f = lis(.08, dt); dirX += (mx / mm - dirX) * f; dirY += (my / mm - dirY) * f; } }
        const dn = Math.hypot(dirX, dirY) || 1, ux = dirX / dn, uy = dirY / dn;
        if (Math.abs(ux) > .2 && (etat === 'aller' || etat === 'retour')) sens = ux < 0 ? 1 : -1;
        // Le dessin est vu de trois quarts, proue vers le bas à gauche : il est juste quand le bateau vient vers nous.
        // Quand il s'éloigne (vers le haut), on prend la vue de dos si elle est dessinée (proue vers le haut) ;
        // sinon la coque se relève côté proue (le mât reste vertical) pour que la proue regarde vers l'horizon.
        const enRoute = etat === 'aller' || etat === 'retour';
        const monte = enRoute ? Math.max(0, Math.min(1, (-uy - .15) / .35)) : 0;
        dos += ((v.arriere ? monte : 0) - dos) * lis(.12, dt);
        // trois vues : roulée (amarré), de côté (en route, vient vers nous), de dos (s'éloigne)
        const wRepos = v.repos ? Math.max(0, Math.min(1, (1 - voile) / .78)) : 0;
        // la vue du dessus apparaît pendant que celle du dessous reste opaque : jamais de coque à moitié transparente
        const wDos = Math.min(1, dos * 2), wCote = (wRepos > .999 ? 0 : 1) * (dos < .5 ? 1 : 1 - (dos - .5) * 2);
        v.corps.alpha = wCote; v.reflet.alpha = .22 * wCote;
        if (v.repos) { v.repos.g.alpha = wRepos * (1 - wDos); v.repos.r.alpha = .22 * wRepos * (1 - wDos); }
        if (v.arriere) { v.arriere.g.alpha = wDos; v.arriere.r.alpha = .22 * wDos; }
        for (const g of [v.corps, v.reflet, v.repos && v.repos.g, v.repos && v.repos.r, v.arriere && v.arriere.g, v.arriere && v.arriere.r]) if (g) g.visible = g.alpha > .01;
        const releve = (enRoute ? Math.max(-.25, Math.min(.62, Math.atan2(-uy, Math.abs(ux) + .2) * .75)) : 0);
        v.corps.skew.y += (releve - v.corps.skew.y) * lis(.1, dt); v.reflet.skew.y = v.corps.skew.y;
        const roulis = Math.sin(temps2 * 1.1) * .025;
        v.position.set(x, y + Math.sin(temps2 * 1.6) * .8 * k); sensAff += (sens - sensAff) * lis(.1, dt); if (Math.abs(sens - sensAff) < .01) sensAff = sens;
        v.scale.set(k * sensAff, k); v.corps.rotation = roulis;   // un demi-tour se voit comme un pivot (la largeur passe par zéro)
        v.lanterne.position.set(v.position.x + v.lanterneLocal[0] * k * sensAff, v.position.y + v.lanterneLocal[1] * k); v.lanterne.scale.set(v.lanterneEchelle * k);
        if (v.repos) v.repos.g.rotation = roulis; if (v.arriere) v.arriere.g.rotation = roulis;
        if (v.corps.voile) { v.corps.voile.scale.y = voile; v.reflet.voile.scale.y = voile; }
        e.x = x; e.y = y;
      };
      const api = {
        get etat() { return etat; },
        evenement(nom, x) {
          if (nom === 'compagnon-parti' && (etat === 'amarre' || etat === 'retour')) { etat = 'depart'; t = 0; }
          else if (nom === 'expedition-retour' && (etat === 'aller' || etat === 'large' || etat === 'depart')) { s0 = etat === 'large' ? 1 : Math.max(.02, s); a0 = etat === 'large' ? 0 : v.alpha; etat = 'retour'; t = 0; v.visible = true; }
        },
        maj(dt) {
          const fige = reduit(); if (!fige) temps2 += dt;
          if (fige && etat !== 'amarre' && etat !== 'large') { if (etat === 'retour') { etat = 'amarre'; s = 0; voile = .22; v.alpha = 1; emettre('bateau-accoste', { bateau: e.id }); } else { etat = 'large'; v.visible = false; emettre('bateau-au-large', { bateau: e.id }); } }
          if (etat === 'depart') { t += dt; sens = 1;  /* repart vers la gauche : il pivote s'il était tourné vers la plage */ voile = .22 + .78 * lisseS(Math.min(1, t / 1.6)); if (t > 1.8) { etat = 'aller'; t = 0; } }
          else if (etat === 'aller') { t += dt; const u = Math.min(1, t / d.duree.aller); s = lisseS(u); v.alpha = 1 - Math.max(0, (u - .9) / .1); if (u >= 1) { etat = 'large'; v.visible = false; emettre('bateau-au-large', { bateau: e.id }); } }
          else if (etat === 'retour') { t += dt; const u = Math.min(1, t / (d.duree.retour * Math.max(.25, s0))); s = s0 * (1 - lisseS(u)); v.alpha = Math.max(a0, Math.min(1, u / .1)); voile = u > .92 ? .22 + .78 * (1 - (u - .92) / .08) : 1; if (u >= 1) { etat = 'amarre'; voile = .22; emettre('bateau-accoste', { bateau: e.id }); } }
          if (etat !== 'large') placer(dt);
          // sillage : un peu d'écume derrière le bateau quand il avance
          if ((etat === 'aller' || etat === 'retour') && !fige) {
            sillage -= dt; if (sillage <= 0) { sillage = .14; const k = echelle(e.y); particule(famille('sol', null, 'normal', texPoint, '', true), texPoint, { x: e.x + 20 * k * sens, y: e.y + 1, scaleX: .5 * k + .15, scaleY: .22 * k + .06, alpha: .55 * v.alpha }, { a: .55 * v.alpha, vx: 0, vy: 0, g: 0, vie: 2.2, t: 0 }); }
          }
          v.lanterne.alpha = (lum ? Math.max(0, lum.feu - .4) * 1.6 : 0) * v.alpha; v.lanterne.visible = v.visible && etat !== 'large' && v.lanterne.alpha > .01;
        }
      };
      placer();
      e.nettoyer = () => { if (!v.lanterne.destroyed) v.lanterne.destroy(); };
      return api;
    }

    // ---------- les petites vies
    const jour = () => lum ? Math.max(0, 1 - lum.feu * 1.6) : 1;
    const echelleMer = y => .25 + .75 * Math.max(0, Math.min(1, (y - 392) / (740 - 392)));

    // un voilier passe au loin de temps en temps, sort de derrière le mont et file vers la gauche
    function passage(e) {
      const d = e.def, v = e.visuel, [a, b] = d.route, t0 = v.children[1].texture.width;
      let t = -d.attente * Math.random(), temps2 = 0;
      return {
        evenement() {},
        maj(dt) {
          if (reduit()) { v.visible = false; return; }
          t += dt; temps2 += dt;
          if (t < 0) { v.visible = false; return; }
          const u = t / d.duree;
          if (u >= 1) { t = -d.attente * (.6 + Math.random() * .8); v.visible = false; return; }
          const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u + Math.sin(temps2 * 1.3) * .4, k = d.largeur / t0;
          v.visible = true; v.position.set(x, y); v.scale.set(k); v.alpha = Math.min(1, u / .08, (1 - u) / .08);
          e.x = x; e.y = y;
        }
      };
    }

    // des mouettes qui tournent au-dessus de la mer ; l'une se pose sur la proue du bateau amarré
    async function mouettes(e) {
      const d = e.def, vol = await plancheVie('mouette'), posee = (await plancheVie('mouettePosee'))[0], cycle = [0, 1, 2, 1];
      const oiseaux = [];
      for (let i = 0; i < d.nombre; i++) {
        const s2 = new PIXI.Sprite(vol[0]); s2.anchor.set(.5); e.visuel.addChild(s2);
        const z = d.zone;
        oiseaux.push({ s: s2, th: Math.random() * 6.28, w: (.1 + Math.random() * .08) * (Math.random() < .5 ? -1 : 1), cx: z[0] + (Math.random() - .5) * z[2] * .5, cy: z[1] + (Math.random() - .5) * z[3] * .4, rx: z[2] * (.35 + Math.random() * .3), ry: z[3] * (.3 + Math.random() * .3), ph: Math.random() * 10, etat: 'vol', t: 0 });
      }
      const bateau = () => d.perche && elements.get(d.perche);
      const proue = () => { const b = bateau(); if (!b || !VIE[b.def.modele]) return null; const P2 = VIE[b.def.modele].proue, v2 = b.visuel; return [v2.position.x + P2[0] * v2.scale.x, v2.position.y + (P2[1] - 2) * v2.scale.y, Math.abs(v2.scale.y)]; };
      const orbite = o => [o.cx + Math.cos(o.th) * o.rx, o.cy + Math.sin(o.th) * o.ry - 10 * Math.sin(o.ph * .4)];
      // 19/10 · d'autres perchoirs : le bout du ponton et son piquet (d.perchoirs), quand le Ponton est construit (d.perchoirSi) ; une mouette
      // s'y pose parfois le jour (8 à 20 s), puis repart. La première mouette garde la proue du bateau amarré.
      const perchoirs = (d.perchoirs || []).map(q => ({ x: q[0], y: q[1], pris: null }));
      const pontonLa = () => { if (!d.perchoirSi) return true; const b = elements.get(d.perchoirSi); return !!(b && !b.detruit && b.visuel.visible && (!b.def.etat || b.def.etat === 'construit')); };
      const perchoirDe = o => o.perchoir ? o.perchoir() : proue();
      if (oiseaux.length && bateau() && bateau().cerveau.etat === 'amarre') { oiseaux[0].etat = 'perche'; oiseaux[0].perchoir = proue; }
      return {
        evenement(nom) {
          const o = oiseaux[0]; if (!o) return;
          if (nom === 'compagnon-parti' && o.etat === 'perche' && !o.perch) { o.etat = 'decolle'; o.t = 0; const p = proue(); o.de = p ? [p[0], p[1]] : orbite(o); }
          if (nom === 'bateau-accoste') setTimeout(() => { if (o.etat === 'vol') { o.perchoir = proue; o.etat = 'pose'; o.t = 0; o.de = [o.s.x, o.s.y]; } }, 6000);
        },
        get etats() { return oiseaux.map(o => o.etat + (o.perch ? '@ponton' : o.perchoir === proue ? '@bateau' : '')); },
        maj(dt) {
          const fige = reduit(), j = jour();
          // 19/10 · le ponton : une mouette en vol s'y pose de temps en temps (le jour), reste un moment, repart
          if (!fige && perchoirs.length) for (let i = 1; i < oiseaux.length; i++) {
            const o = oiseaux[i];
            if (o.etat === 'vol' && j > .5 && pontonLa()) { o.attente = (o.attente == null ? 6 + Math.random() * 10 : o.attente) - dt; if (o.attente <= 0) { o.attente = 25 + Math.random() * 35; const q = perchoirs.find(z => !z.pris); if (q) { q.pris = o; o.perch = q; o.perchoir = () => [q.x, q.y, 1.1]; o.reste = 8 + Math.random() * 12; o.etat = 'pose'; o.t = 0; o.de = [o.s.x, o.s.y]; } } }
            else if (o.etat === 'perche' && o.perch) { o.reste -= dt; if (o.reste <= 0 || j < .3 || !pontonLa()) { o.etat = 'decolle'; o.t = 0; const p = o.perchoir(); o.de = [p[0], p[1]]; o.perch.pris = null; o.perch = null; } }
          }
      for (const o of oiseaux) {
            if (!fige) { o.th += o.w * dt; o.ph += dt; o.t += dt; }
            let x, y, img = vol[cycle[Math.floor(o.ph * 7) % 4]], sens = 1;
            const plane = Math.sin(o.ph * .5) > .3;               // de temps en temps, elle plane
            if (plane) img = vol[2];
            if (o.etat === 'perche') {
              const p = perchoirDe(o); if (!p) { o.etat = 'vol'; o.perchoir = null; continue; }
              [x, y] = p; o.s.texture = posee; o.s.anchor.set(.5, .96); const k = p[2] * 1.1 * d.taille / 30; o.s.scale.set(k); o.s.position.set(x, y); o.s.alpha = 1; o.s.visible = true; continue;
            }
            o.s.anchor.set(.5);
            const [ox, oy] = orbite(o);
            if (o.etat === 'decolle' || o.etat === 'pose') {
              const p = perchoirDe(o), u = Math.min(1, o.t / 3), lu = u * u * (3 - 2 * u);
              const de = o.de, vers = o.etat === 'decolle' ? [ox, oy] : (p ? [p[0], p[1]] : [ox, oy]);
              x = de[0] + (vers[0] - de[0]) * lu; y = de[1] + (vers[1] - de[1]) * lu - Math.sin(u * Math.PI) * 30;
              img = vol[cycle[Math.floor(o.ph * 10) % 4]];
              sens = vers[0] >= de[0] ? 1 : -1;
              // côté proue : la taille, le point d'ancrage (les pattes) et l'opacité de la mouette posée ; côté ciel : ceux du vol
              const cote = o.etat === 'decolle' ? 1 - lu : lu, kVol = echelleMer(y) * d.taille / vol[0].width, kPose = p ? p[2] * 1.1 * d.taille / 30 * posee.width / vol[0].width : kVol;
              o.s.anchor.set(.5, .5 + .46 * cote); o.s.texture = img; o.s.position.set(x, y);
              const k2 = kVol + (kPose - kVol) * cote; o.s.scale.set(k2 * sens, k2);
              o.s.alpha = j + (1 - j) * cote; o.s.visible = o.s.alpha > .02;
              if (u >= 1) { o.etat = o.etat === 'decolle' ? 'vol' : (p ? 'perche' : 'vol'); if (o.etat === 'vol') { o.perchoir = null; if (o.perch) { o.perch.pris = null; o.perch = null; } } }
              continue;
            } else { x = ox; y = oy; sens = -Math.sin(o.th) * o.w * o.rx >= 0 ? 1 : -1; }
            const k = echelleMer(y) * d.taille / vol[0].width;
            o.s.texture = img; o.s.position.set(x, y); o.s.scale.set(k * sens, k);
            o.s.alpha = j; o.s.visible = j > .02;
          }
        }
      };
    }

    // des papillons qui vont de fleur en fleur le jour
    async function papillons(e) {
      const d = e.def, imgs = await plancheVie('papillon'), bat = [0, 1, 2, 1], liste = [];
      // une fleur au hasard : le point où se poser, et la profondeur de la plante (le papillon est rangé avec elle)
      const fleur = () => { const ids = d.fleurs.filter(id => elements.get(id)); const f = elements.get(ids[Math.floor(Math.random() * ids.length)]); return f ? [f.x + (Math.random() - .5) * (f.largeurAff || 30) * .4, f.y - (f.visuel.height || 40) * .82, f.visuel.zIndex + .1] : [360, 900, 1000]; };
      for (let i = 0; i < d.nombre; i++) { const s2 = new PIXI.Sprite(imgs[0]); s2.anchor.set(.5); couches.objets.addChild(s2); const [x, y, z] = fleur(); liste.push({ s: s2, x, y, z, cible: fleur(), etat: 'vol', t: Math.random() * 3, ph: Math.random() * 10 }); }
      e.nettoyer = () => liste.forEach(p => p.s.destroy());
      return {
        evenement() {},
        get positions() { return liste.filter(p => p.s.visible).map(p => [p.x, p.y]); },
        maj(dt) {
          const fige = reduit(), j = jour();
          for (const p of liste) {
            if (!fige) { p.ph += dt; p.t += dt; }
            if (p.etat === 'pose') {
              p.s.texture = imgs[Math.floor(p.ph * 1.6) % 2 ? 1 : 2];
              if (p.t > 2.5 + Math.random() * .05 * 60) { p.etat = 'vol'; p.t = 0; p.cible = fleur(); }
            } else if (!fige) {
              const dx = p.cible[0] - p.x, dy = p.cible[1] - p.y, dd = Math.hypot(dx, dy);
              const v = 26, zig = Math.sin(p.ph * 5.3) * 18, zag = Math.cos(p.ph * 3.7) * 14;
              if (dd < 4) { p.etat = 'pose'; p.t = 0; }
              else { const k = Math.min(1, v * dt / dd); p.x += dx * k + zig * dt; p.y += dy * k + zag * dt; p.z += (p.cible[2] - p.z) * k; }
              p.s.texture = imgs[bat[Math.floor(p.ph * 14) % 4]];
              if (Math.abs(dx) > 6) p.s.scale.x = Math.abs(p.s.scale.x) * (dx < 0 ? -1 : 1);   // il ne se retourne pas pour un écart de rien
            }
            const k = d.taille / imgs[0].width * echelleA(p.y);
            p.s.position.set(p.x, p.y + (p.etat === 'pose' ? 0 : Math.sin(p.ph * 9) * 1.5)); p.s.scale.set(Math.sign(p.s.scale.x || 1) * k, k);
            p.s.alpha = j; p.s.visible = j > .02; p.s.zIndex = p.z;
          }
        }
      };
    }

    // ---------- le comportement d'un compagnon : flâner, s'asseoir au feu, dormir la nuit, réagir, partir, revenir
    function cerveau(e) {
      const p = e.visuel.marionnette, L = S.lieux;
      let route = [], cible = null, attente = 1 + Math.random() * 2, mode = 'libre', reaction = 0, absent = false, partant = false, embarque = false, retourEnAttente = false, attendBateau = false;
      const leBateau = () => { for (let i = 0; i < elts.length; i++) if (elts[i].def.type === 'bateau') return elts[i]; return undefined; };
      let svx = 0, svy = 0, vue = null;
      const heure = () => lum ? lum.heure : 12;
      const nuit = () => { const h = heure(); return h >= 21 || h < 6; };
      const soir = () => { const h = heure(); return h >= 18.5 && h < 21; };
      // les autres compagnons présents : leur position, et l'endroit où ils vont
      // les autres compagnons présents (une liste par image, réutilisée)
      let autresL = [], autresT = -1;
      const autres = () => { if (autresT !== temps) { autresT = temps; autresL.length = 0; for (let i = 0; i < persos.length; i++) { const o = persos[i]; if (o !== e && o.cerveau && o.visuel.visible && !o.cerveau.absent) autresL.push(o); } } return autresL; };
      const occupes = () => autres().flatMap(o => [[o.x, o.y], ...(o.cerveau.but ? [o.cerveau.but] : [])]);
      // assis ou endormi : on peut passer plus près de lui
      const estAssis = o => { const n = o.visuel.marionnette.etatActif; return n === 'assis' || n === 'dort'; };
      const place = o => [o.x, o.y, estAssis(o)];
      const serreDe = o => estAssis(o) ? 30 : PIED_X * 2 + 2;
      let but = null, essais = 0, reroutes = 0, progres = { reste: Infinity, t: 0 }, immobile = 0, repart = 0, siege = null, vit = 0, cap = Math.PI / 2;
      // la direction où il regarde (d'après son dessin) : il part de là quand il se met en marche
      // angles : « cap » est la direction à l'écran ; la vue se choisit d'après la direction au sol (la profondeur compte 2,2 fois)
      const versSol = c => Math.atan2(Math.sin(c) * 2.2, Math.cos(c)) * 180 / Math.PI;
      const versEcran = deg => { const a = deg * Math.PI / 180; return Math.atan2(Math.sin(a) / 2.2, Math.cos(a)); };
      const capVisuel = () => versEcran(p.angleVue != null ? p.angleVue : 45);
      // se tourner sur place : vers un angle d'écran, à vitesse limitée (il passe par les vues intermédiaires)
      let capVise = null, vitTour = 4.5, assoirApres = null, reessai = null, reprise = null, coupDOeil = 2 + Math.random() * 3;
      // 19/10 · la vie au repos (un geste toutes les 6 à 14 s, jamais le même qu'avant), le départ tourné, l'au revoir avant d'embarquer,
      // la rencontre d'un compagnon en visite, la visite au coffre, les habitudes (compagnons 2 et 3 : la plage, le Comptoir)
      let geste = null, prochainGeste = 6 + Math.random() * 8, dernierGeste = null, departTourne = false, adieuFait = false, derniereVisiteCoffre = -99, rencontre = null;
      const habitudes = e.def.habitudes || [];
      const terrainK = (x, y) => { const T = S.terrain; if (!T) return 1; for (const k in T) { const z = T[k] && T[k].zone; if (z && x >= z[0] && y >= z[1] && x <= z[2] && y <= z[3]) return T[k].vitesse || .85; } return 1; };
      // les réactions à une quête validée : celles que la marionnette connaît, jamais deux fois la même d'affilée
      let derniereReaction = null;
      const choisirReaction = () => { const L = ['content', 'saute', 'bras', 'hoche', 'applaudit'].filter(n => p.reglages[n] && n !== derniereReaction); const n = L.length ? L[Math.floor(Math.random() * L.length)] : 'content'; derniereReaction = n; return n; };
      // le sens d'un demi-tour, choisi une fois au début (sinon, déjà de face, il hésiterait d'une image à l'autre et resterait bloqué)
      let sensSurPlace = 0, sensDemi = 0;
      const tournerA = (c, vite) => { cap = capVisuel(); capVise = c; vitTour = vite || 4.5; sensSurPlace = 0; };
      const tournerSurPlace = (dt, fige) => {
        if (capVise === null) { p.orienter(versSol(cap)); return; }   // la dernière vue se confirme
        if (fige) { cap = capVise; capVise = null; p.orienter(versSol(cap)); return; }
        // il tourne à vitesse constante au sol (pas à l'écran : la perspective ferait défiler les vues de face et de dos
        // trop lentement, celles de profil trop vite) ; un demi-tour passe par la face, vers nous
        const gs = versSol(cap), gt = versSol(capVise);
        let dg = ((gt - gs) % 360 + 540) % 360 - 180;
        if (sensSurPlace && Math.sign(dg) !== sensSurPlace && Math.abs(dg) > 2) dg -= Math.sign(dg) * 360;
        else if (!sensSurPlace && Math.abs(dg) > 150) { const autre = dg - Math.sign(dg) * 360, passe = d0 => { for (let i = 1; i < 12; i++) { const a = gs + d0 * i / 12; if (Math.cos((a - 90) * Math.PI / 180) > .97) return true; } return false; }; if (!passe(dg) && passe(autre)) dg = autre; }
        if (!sensSurPlace && Math.abs(dg) > 2) sensSurPlace = Math.sign(dg);
        const ng = gs + Math.sign(dg) * Math.min(Math.abs(dg), vitTour * 60 * dt);
        cap = versEcran(ng); p.orienter(ng);
        if (Math.abs(dg) < 1) { cap = capVise; capVise = null; }
      };
      const allure = e.def.allure || (.93 + Math.random() * .14);   // chacun son pas (« allure » dans la description : les compagnons 2 et 3)
      // s'asseoir face au feu : il se tourne d'abord vers lui (de trois quarts, en passant par les directions voisines),
      // puis il s'assoit ; le dessin assis regarde du même côté que la vue de trois quarts face
      const sAsseoir = () => {
        const f = S.lieux.sieges && elements.get(S.lieux.sieges.centre), versG = f ? e.x > f.x : p.miroirActif;
        assoirApres = { versG, t: 0 }; route = []; vit = 0; p.deplacement(0, 0);
        if (p.etatActif !== 'repos') p.etat('repos');
        tournerA(versEcran(versG ? 135 : 45), 6); attente = 99;
      };
      const finirDormir = () => { p.etat(nuit() ? 'dort' : 'assis'); p.tete(nuit() ? 'dort' : 'calme'); attente = nuit() ? 30 : 10 + Math.random() * 12; };
      const finirAssis = () => {
        const versG = assoirApres.versG; assoirApres = null;
        if (p.miroirActif !== versG) p.miroir(versG);
        // 19/10 · la nuit, il bâille avant de s'endormir
        if (nuit() && p.reglages.baille && !reduit()) { p.etat('assis'); p.tete('calme'); p.etat('baille'); geste = { nom: 'baille', t: p.reglages.baille.duree }; attente = 99; }
        else finirDormir();
      };
      const allerA = (x, y, ensuite) => {
        assoirApres = null; reessai = null; sensDemi = 0;
        const enRoute = route.length > 0 && p.etatActif === 'marche';
        route = chemin(e.x, e.y, x, y, autres().map(place)); reroutes = 0; progres = { reste: Infinity, t: 0 }; immobile = 0;
        if (!enRoute) { cap = capVisuel(); vit = 0; svx = Math.cos(cap); svy = Math.sin(cap); }
        if (!route.length) {
          // déjà sur place : il y est arrivé
          if (ensuite && Math.hypot(x - e.x, y - e.y) < 14) { but = null; cible = ensuite; vit = 0; arrivee(); return; }
          but = null; cible = null; p.etat('repos');
          // pas de chemin pour l'instant (des compagnons bloquent le passage) : pour déposer le butin ou partir, il réessaiera
          if (ensuite === 'deposer' || ensuite === 'disparaitre') reessai = { t: 1.2, x, y, cible: ensuite }; else attente = 1 + Math.random();
          return;
        }
        but = route[route.length - 1]; cible = ensuite || null; p.tete('calme');
        // 19/10 · le corps se tourne avant de partir : si le premier pas est à plus de 70° de son regard, il pivote d'abord sur place
        const [tx0, ty0] = route[0], visee = Math.atan2(ty0 - e.y, tx0 - e.x), ecart = ((visee - cap) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
        if (!enRoute && !reduit() && Math.abs(ecart) > 1.22 && Math.hypot(tx0 - e.x, ty0 - e.y) > 20) { departTourne = true; if (p.etatActif !== 'repos') p.etat('repos'); tournerA(visee, 6); }
        else { departTourne = false; p.etat('marche'); }
      };
      const aller = (lieu, ensuite) => allerA(P[lieu][0], P[lieu][1], ensuite);
      // aller à sa place au feu ; après quelques places prises ou inaccessibles, il s'assoit là où il est
      let refus = [];   // les places déjà tentées en vain
      const allerSAsseoir = () => {
        if (essais > 0 && siege) refus.push(siege);
        if (++essais > 4) { route = []; but = null; vit = 0; cible = 'assis'; arrivee(); return; }
        siege = siegeLibre(occupes().concat(refus)); allerA(siege[0], siege[1], 'assis');
      };
      const choisir = () => {
        if (mode === 'part' || absent) return;
        // assis, il ne se lève pas pendant qu'un autre passe tout près de lui (on passe plus près d'un compagnon assis)
        if (estAssis(e) && !(nuit() || soir()) && autres().some(o => distSol(e.x, e.y, o.x, o.y) < PIED_X * 2 + 8)) { attente = .4; return; }
        if (nuit() || soir()) {
          if (!siege || Math.hypot(e.x - siege[0], e.y - siege[1]) > 14) allerSAsseoir();
          else if (estAssis(e)) { if (nuit() && p.etatActif === 'assis' && p.reglages.baille && !reduit()) { p.etat('baille'); geste = { nom: 'baille', t: p.reglages.baille.duree }; attente = 99; } else { p.etat(nuit() ? 'dort' : 'assis'); p.tete(nuit() ? 'dort' : 'calme'); attente = 6; } }
          else sAsseoir();
          return;
        }
        siege = null; essais = 0; refus = [];
        // 19/10 · au réveil (vers 7 h), il se lève et s'étire avant toute chose
        if (p.etatActif === 'dort' || p.etatActif === 'assis') { p.etat('repos'); p.tete('calme'); geste = { nom: 'lever', t: .55, puis: () => { if (p.reglages.etire && !reduit()) lancerGeste('etire'); } }; attente = 4; return; }
        // mouvement réduit : le jour, il reste où il est (il ne saute pas d'un endroit à l'autre)
        if (reduit()) { if (p.etatActif !== 'repos') p.etat('repos'); attente = 3; return; }
        const r = Math.random();
        // 19/10 · ses habitudes (compagnons 2 et 3) : l'un aime la plage, l'autre le Comptoir ; il y va une fois sur trois
        if (habitudes.length && r < .3) {
          const h = habitudes[Math.floor(Math.random() * habitudes.length)], pt = P[h];
          if (pt && Math.hypot(pt[0] - e.x, pt[1] - e.y) > 60 && !occupes().some(o => Math.hypot(o[0] - pt[0], o[1] - pt[1]) < 40)) {
            const [qx, qy] = caseLibreProche(pt[0] + (Math.random() - .5) * 40, pt[1] + (Math.random() - .5) * 20);
            if (h === 'plage') { const v0 = (L.vues || [])[0]; vue = [qx, qy, v0 ? v0[2] : qx - 60, v0 ? v0[3] : qy - 160]; allerA(qx, qy, 'vue'); } else allerA(qx, qy, 'repos');
            return;
          }
        }
        // de temps en temps, il va regarder la mer depuis un « point de vue » (lieux.vues : x, y, et où regarder)
        const vues = (L.vues || []).filter(v => !occupes().some(o => Math.hypot(o[0] - v[0], o[1] - v[1]) < 40));
        if (r < .08 && vues.length) { vue = vues[Math.floor(Math.random() * vues.length)]; allerA(vue[0], vue[1], 'vue'); }
        else if (r < .62) { const [x, y] = pointAuHasard(e.x, e.y, occupes()); allerA(x, y, 'repos'); }
        else if (r < .82) allerSAsseoir();
        else { p.etat('repos'); attente = 3 + Math.random() * 4; }
      };
      // un coup d'œil : vers ce qui bouge près de lui (un papillon), un compagnon, le feu, le bateau, nous, ou un peu à côté
      const regarderAutour = () => {
        const cibles = [];
        for (const o of elements.values()) {
          if (o === e || !o.visuel.visible) continue;
          if (o.def.type === 'papillons' && o.cerveau && o.cerveau.positions) for (const [x, y] of o.cerveau.positions) { const d = distSol(e.x, e.y, x, y + 30); if (d < 170) cibles.push([x, y + 30, 3]); }
          else if (o.def.type === 'personnage' && !o.cerveau.absent) { if (distSol(e.x, e.y, o.x, o.y) < 220) cibles.push([o.x, o.y, 2]); }
          else if (o.def.lumiere && o.def.lumiere.rayon >= 200 && distSol(e.x, e.y, o.x, o.y) < 260) cibles.push([o.x, o.y, 1]);
          else if (o.def.type === 'bateau' && o.cerveau && o.cerveau.etat !== 'large') cibles.push([o.x, o.y, .6]);
        }
        const tot = cibles.reduce((a, c) => a + c[2], 0) + 1.6, r = Math.random() * tot;
        let acc = 0, choix = null; for (const c of cibles) { acc += c[2]; if (r < acc) { choix = c; break; } }
        let a;
        if (choix) a = Math.atan2(choix[1] - e.y, choix[0] - e.x);
        else if (r < acc + .7) a = versEcran(Math.random() < .5 ? 45 : 135);   // vers nous
        else a = cap + (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * .7);   // un peu à côté
        tournerA(a, 3);
      };
      // se tourner vers nous (de trois quarts, côté du centre de l'écran), assez vite : il réagit
      const regarder = () => tournerA(versEcran(e.x > W / 2 + 60 ? 135 : 45), 6);
      // 19/10 · la vie au repos : regarder la mer, s'étirer, se gratter la tête, regarder le feu, tapoter du pied, s'asseoir un moment
      // sur le banc s'il est posé. Toutes les 6 à 14 s debout le jour, jamais deux fois la même d'affilée. Aussi sur commande
      // (scene.geste) : bâiller, au revoir, signe de la main.
      const GESTES = ['mer', 'etire', 'gratte', 'feu', 'tapote', 'banc'];
      const lancerGeste = nom => {
        if (absent || mode !== 'libre' || reaction > 0 || route.length || geste || reduit()) return false;
        const R = p.reglages;
        if (nom === 'mer') { const v0 = (L.vues || [])[0]; tournerA(Math.atan2((v0 ? v0[3] : 560) - e.y, (v0 ? v0[2] : 300) - e.x), 3); geste = { nom, t: 3.5 }; }
        else if (nom === 'feu') { const f = S.lieux.sieges && elements.get(S.lieux.sieges.centre); if (!f) return false; tournerA(Math.atan2(f.y - e.y, f.x - e.x), 3); geste = { nom, t: 3 }; }
        else if (nom === 'banc') { const b = elements.get('banc'); if (!b || !b.visuel.visible || estAssis(e)) return false; const q = caseLibreProche(b.x, b.y + 8); if (occupes().some(o => Math.hypot(o[0] - q[0], o[1] - q[1]) < 40)) return false; dernierGeste = nom; siege = null; allerA(q[0], q[1], 'banc'); return route.length > 0 || cible === 'banc'; }
        else if (R[nom] && R[nom].duree) { if (p.etatActif !== 'repos' && !estAssis(e)) p.etat('repos'); if (nom === 'aurevoir' || nom === 'signe') regarder(); p.etat(nom); if (nom === 'aurevoir' || nom === 'signe') p.tete('content'); geste = { nom, t: R[nom].duree }; }
        else return false;
        dernierGeste = nom; attente = Math.max(attente, geste.t + .8); coupDOeil = Math.max(coupDOeil, geste.t + 1);
        return true;
      };
      const gesteAuHasard = () => {
        const L2 = GESTES.filter(n => n !== dernierGeste);
        for (let i = 0; i < 4 && L2.length; i++) { const n = L2.splice(Math.floor(Math.random() * L2.length), 1)[0]; if (lancerGeste(n)) break; }
        prochainGeste = 6 + Math.random() * 8;
      };
      const this_ = {
        evenement(nom, d) {
          if (absent && nom !== 'expedition-retour' && nom !== 'bateau-accoste') return;
          if (partant) { if (nom === 'expedition-retour') retourEnAttente = true; return; }
          // 22/10 · « Rentrer au camp » (ou la fin de l'expédition) pendant qu'il marche encore vers le ponton : il n'embarque pas,
          // il pose le sac et reprend sa vie au camp ; le bateau reste amarré (avant, l'événement était perdu : il partait quand même)
          if (nom === 'expedition-retour' && mode === 'part' && (!d || !d.compagnon || d.compagnon === e.id)) {
            mode = 'libre'; route = []; but = null; cible = null; reessai = null; reprise = null; geste = null; departTourne = false; adieuFait = false; vit = 0; reaction = 0;
            p.porter('sac', false); p.deplacement(0, 0); if (p.etatActif !== 'repos') p.etat('repos'); p.tete('calme'); attente = 1 + Math.random();
            return;
          }
          if ((nom === 'toucher' && d.cible === e.id) || nom === 'quete-validee' || nom === 'sommet') {
            assoirApres = null; geste = null; departTourne = false;
            // en route vers le bateau ou vers le coffre : il réagit, puis il reprend son chemin
            if (mode === 'part') reprise = [P[L.sortie], 'disparaitre']; else if (mode === 'revient') reprise = [P[L.coffre], 'deposer'];
          }
          // 19/10 · touché alors qu'il nous regarde déjà : un signe de la main ; sinon il se tourne vers nous (« touche », avec un petit salut)
          if (nom === 'toucher' && d.cible === e.id) { route = []; p.deplacement(0, 0); const nousRegarde = Math.abs(p.angleVue - 90) <= 60 && !estAssis(e) && p.reglages.signe; regarder(); const nomT = nousRegarde ? 'signe' : 'touche'; p.etat(nomT); p.tete('content'); reaction = p.reglages[nomT].duree; }
          // 19/10 · une quête validée : une réaction parmi cinq, jamais la même que la précédente ; le Sommet : il danse quelques secondes
          else if (nom === 'quete-validee' || nom === 'sommet') { route = []; p.deplacement(0, 0); regarder(); const nomR = nom === 'sommet' && p.reglages.danse ? 'danse' : choisirReaction(); p.etat(nomR); p.tete('content'); reaction = ((p.reglages[nomR] && p.reglages[nomR].duree) || p.reglages.content.duree) * (nomR === 'content' && nom === 'sommet' ? 2 : 1); }
          else if (nom === 'expedition-depart' && (!d.compagnon || d.compagnon === e.id)) { mode = 'part'; reaction = 0; geste = null; adieuFait = false; p.porter('sac', true); aller(L.sortie, 'disparaitre'); }
          else if (nom === 'expedition-retour' && (!d.compagnon || d.compagnon === e.id) && absent) {
            const b = leBateau();
            if (b && b.cerveau.etat !== 'amarre') attendBateau = true; else revenir();
          }
          else if (nom === 'bateau-accoste' && absent && attendBateau) { attendBateau = false; revenir(); }
          else if (nom === 'soir' || nom === 'nuit') { if (mode === 'libre') { route = []; attente = 0; } }
          // 19/10 · le retour sans reproche : il court vers le centre du camp (près du feu) et salue
          else if (nom === 'retour' && mode === 'libre') { assoirApres = null; reaction = 0; geste = null; const f = P[L.feu] || [e.x, e.y]; allerA(f[0] + 60, f[1] + 26, 'salut'); }
          // 19/10 · le coffre se remplit : de temps en temps (pas plus d'une fois par 45 s), il va le voir et hoche la tête
          else if (nom === 'coffre-recoit' && mode === 'libre' && !absent && !reduit() && temps - derniereVisiteCoffre > 45 && reaction <= 0 && !route.length && !geste && !estAssis(e) && Math.random() < .7) {
            derniereVisiteCoffre = temps; const c = P[L.coffre]; if (c) { dernierGeste = 'coffre'; allerA(c[0] + 26, c[1] + 8, 'coffre'); }
          }
          // 19/10 · un compagnon d'un proche arrive au camp : on va à sa rencontre, puis on le salue
          else if (nom === 'compagnon-arrive' && d.compagnon !== e.id && mode === 'libre' && !absent && !reduit()) {
            const o = elements.get(d.compagnon); if (!o) return; geste = null; assoirApres = null; siege = null;
            const c = [d.x != null ? d.x : o.x, d.y != null ? d.y : o.y], dx = e.x - c[0], dy = e.y - c[1], dn = Math.hypot(dx, dy) || 1, k = 64 + Math.random() * 20;
            const [qx, qy] = caseLibreProche(c[0] + dx / dn * k, c[1] + dy / dn * k * .6); rencontre = d.compagnon; allerA(qx, qy, 'rencontre');
          }
        },
        maj(dt) {
          if (absent) return;
          const fige = reduit();
          p.fige = fige;
          if (reaction > 0) { tournerSurPlace(dt, fige); reaction -= dt; if (reaction <= 0) { p.etat('repos'); p.tete('calme'); attente = .6; if (reprise) { const [pt, c2] = reprise; reprise = null; allerA(pt[0], pt[1], c2); } } p.maj(dt); return; }
          // 19/10 · un geste de la vie au repos en cours (ou le bâillement, l'au revoir, le lever) : il tient, puis reprend
          if (geste) { geste.t -= dt; if (!estAssis(e) && p.etatActif !== 'baille') tournerSurPlace(dt, fige); if (geste.t <= 0 || fige) { const g = geste; geste = null; if (g.nom === 'baille') finirDormir(); else if (g.nom !== 'banc' && p.etatActif !== 'repos' && !estAssis(e)) p.etat('repos'); if (g.puis) g.puis(); } p.deplacement(0, 0); p.maj(dt); return; }
          let vx = 0, vy = 0;
          // mouvement réduit : pas de marche, il est tout de suite arrivé (partir, revenir déposer, aller où on l'envoie)
          if (route.length && fige) { const f = route[route.length - 1]; route = []; but = null; vit = 0; e.x = f[0]; e.y = f[1]; e.def.x = e.x; e.def.y = e.y; poser(e); p.deplacement(0, 0); arrivee(); }
          if (route.length && !fige) {
            // 19/10 · il finit de se tourner vers son chemin avant de partir
            if (departTourne) { tournerSurPlace(dt, fige); if (capVise === null) { departTourne = false; cap = capVisuel(); svx = Math.cos(cap); svy = Math.sin(cap); p.etat('marche'); } p.deplacement(0, 0); p.maj(dt); return; }
            const [tx, ty] = route[0], dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
            // 19/10 · un peu plus lent sur le sable et le ponton (« terrain » du JSON)
            const v = p.def.vitesse * e.ech * allure * terrainK(e.x, e.y) * (mode === 'part' || mode === 'revient' ? 1.25 : cible === 'salut' ? 1.4 : 1);   // il presse le pas vers le bateau et vers le coffre ; il court pour saluer (retour)
            let reste = d; for (let i = 1; i < route.length; i++) reste += Math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]);
            const fin = route[route.length - 1], proches = partant ? [] : autres();
            // quelqu'un est déjà à l'endroit visé : il s'arrête un peu avant (ou cherche une autre place au feu)
            if (reste < 60 && proches.some(o => distSol(fin[0], fin[1], o.x, o.y) < PIED_X * 2 + 6)) {
              if (cible === 'assis') allerSAsseoir();
              else { route = []; but = null; vit = 0; arrivee(); }
              p.deplacement(0, 0); p.maj(dt); return;
            }
            // la marche : il accélère au départ, ralentit à l'arrivée, et arrondit les virages (il vise un peu au-delà du
            // prochain point quand il en approche) ; la direction tourne en douceur
            let ax = dx / (d || 1), ay = dy / (d || 1);
            if (route.length > 1 && d < 26) {
              const [nx, ny] = route[1], n2 = Math.hypot(nx - tx, ny - ty) || 1, w2 = 1 - d / 26;
              ax = ax * (1 - w2) + (nx - tx) / n2 * w2; ay = ay * (1 - w2) + (ny - ty) / n2 * w2;
            }
            // les autres compagnons : on les voit venir, on ralentit et on s'écarte (face à face, chacun passe à sa droite)
            let frein = 1;
            {
              const an = Math.hypot(ax, ay) || 1; ax /= an; ay /= an;
              const gn = Math.hypot(ax, ay * 2.2) || 1, ux = ax / gn, uy = ay * 2.2 / gn;
              let ex = 0, ey = 0;
              for (const o of proches) {
                const choc = serreDe(o) + 8, marge = choc + (estAssis(o) ? 8 : 20);
                const ox = o.x - e.x, oy = (o.y - e.y) * 2.2, dist = Math.hypot(ox, oy);
                const avant = ox * ux + oy * uy, lat = -ox * uy + oy * ux;
                // à l'image, l'un presque derrière l'autre : celui qui suit se décale sur le côté pour rester visible
                if (avant > 0 && Math.abs(o.x - e.x) < 34 && Math.abs(o.y - e.y) < 50) ex += (e.x >= o.x ? 1 : -1) * (1 - Math.abs(o.x - e.x) / 34) * .7;
                if (dist > 130 || avant <= 0 || Math.abs(lat) > marge) continue;
                // s'écarter, d'autant plus qu'il est proche et dans l'axe
                const sens = Math.abs(lat) < 5 ? 1 : -Math.sign(lat), k = (1 - Math.abs(lat) / marge) * Math.min(1, Math.max(0, (130 - avant) / 70));
                ex += -uy * sens * k; ey += ux * sens * k;
                // ralentir seulement s'il va vraiment le heurter : la distance qui reste avant le contact
                if (Math.abs(lat) < choc) {
                  const avantChoc = avant - Math.sqrt(choc * choc - lat * lat), face = o.cerveau.enMarche ? 1 : .7;
                  frein = Math.min(frein, Math.max(.25, Math.min(1, avantChoc / (48 * face))));
                }
              }
              if (ex || ey) { const sx = ux + ex * 1.5, sy = uy + ey * 1.5; ax = sx; ay = sy / 2.2; }
            }
            // il tourne à vitesse limitée ; pour un demi-tour, il passe par la face (vers nous), comme on se retourne vraiment,
            // et il ralentit d'autant plus que le virage est serré
            const vise = Math.atan2(ay, ax), tour = Math.PI * 2;
            let delta = ((vise - cap) % tour + tour * 1.5) % tour - Math.PI;
            if (Math.abs(delta) > 2.4) {
              if (sensDemi) { if (Math.sign(delta) !== sensDemi) delta -= Math.sign(delta) * tour; }
              else {
                const autre = delta - Math.sign(delta) * tour, passeBas = d0 => { const n = 12; for (let i = 1; i < n; i++) { const a = cap + d0 * i / n; if (Math.cos(a - Math.PI / 2) > .92) return true; } return false; };
                if (!passeBas(delta) && passeBas(autre)) delta = autre;
                sensDemi = Math.sign(delta);
              }
            } else if (Math.abs(delta) < 1.6) sensDemi = 0;
            const pivot = Math.sign(delta) * Math.min(Math.abs(delta) * (1 - Math.exp(-dt / .12)), 5.5 * dt);
            cap += pivot;
            const virage = Math.min(Math.PI, Math.abs(delta)), lent = Math.max(.28, Math.pow((1 + Math.cos(virage)) / 2, .8));
            const cibleV = v * Math.max(.3, Math.min(1, reste / 34)) * frein * lent;
            vit += (cibleV - vit) * (1 - Math.exp(-dt / .3));
            // la vitesse est une vitesse au sol : vers nous ou vers le fond, il avance moins vite à l'écran (perspective),
            // au même rythme de pas que de profil (la marionnette règle ses pas sur la même perspective, PERSP_PAS)
            const pas = vit * dt / Math.hypot(Math.cos(cap), PERSP_PAS * Math.sin(cap));
            let nx2 = e.x + Math.cos(cap) * pas, ny2 = e.y + Math.sin(cap) * pas;
            // le pas tomberait dans un objet : droit sur le point visé (il est en vue), sinon on glisse le long de l'obstacle
            if (!libre(nx2, ny2) && libre(e.x, e.y)) {
              const k = Math.min(1, pas / (d || 1)), sx = e.x + dx * k, sy = e.y + dy * k;
              if (libre(sx, sy)) { nx2 = sx; ny2 = sy; cap = Math.atan2(dy, dx); }
              else {
                // un pas de biais vers le point visé (±45°), sinon glisser le long de l'obstacle, sinon un pas de côté (±90°) :
                // il ne reste pas coincé dans le coin d'un obstacle quand il arrondit un virage
                const a0 = Math.atan2(dy, dx), essai = da => { const qx = e.x + Math.cos(a0 + da) * pas, qy = e.y + Math.sin(a0 + da) * pas; if (!libre(qx, qy)) return false; nx2 = qx; ny2 = qy; return true; };
                if (essai(.785) || essai(-.785)) { /* de biais */ }
                else if (libre(nx2, e.y)) ny2 = e.y; else if (libre(e.x, ny2)) nx2 = e.x;
                else if (!(essai(1.571) || essai(-1.571))) { nx2 = e.x; ny2 = e.y; }
              }
            }
            // jamais l'un dans l'autre : un pas qui rapprocherait trop d'un autre glisse le long de lui, ou attend
            for (const o of proches) {
              const d1 = distSol(nx2, ny2, o.x, o.y);
              const serre = serreDe(o);
              if (d1 >= serre || d1 >= distSol(e.x, e.y, o.x, o.y)) continue;
              const gx = (o.x - e.x), gy = (o.y - e.y) * 2.2, gl = Math.hypot(gx, gy) || 1, mx = nx2 - e.x, my = (ny2 - e.y) * 2.2;
              const pr = (mx * gx + my * gy) / gl; let sx = mx - gx / gl * Math.max(0, pr), sy = my - gy / gl * Math.max(0, pr);
              nx2 = e.x + sx; ny2 = e.y + sy / 2.2;
              if (!libre(nx2, ny2) || distSol(nx2, ny2, o.x, o.y) < Math.min(serre, distSol(e.x, e.y, o.x, o.y))) { nx2 = e.x; ny2 = e.y; }
            }
            // pris entre deux : le glissement le long de l'un ne doit pas le rapprocher d'un autre
            if (proches.some(o => distSol(nx2, ny2, o.x, o.y) < Math.min(serreDe(o), distSol(e.x, e.y, o.x, o.y) - 1e-6))) { nx2 = e.x; ny2 = e.y; }
            vx = (nx2 - e.x) / dt; vy = (ny2 - e.y) / dt;
            // à l'arrêt (il attend qu'un autre passe) : il reprend la pose de repos, et repart en marchant
            const bouge = Math.hypot(nx2 - e.x, ny2 - e.y) > pas * .3 + .02;
            immobile = bouge ? 0 : immobile + dt; repart = bouge ? repart + dt : 0;
            if (immobile > .45 && p.etatActif === 'marche') p.etat('repos'); else if (repart > .12 && p.etatActif === 'repos') p.etat('marche');
            // il n'approche plus du but : il cherche un autre passage, puis une autre place au feu, puis renonce
            if (reste < progres.reste - 3) progres = { reste, t: 0 }; else progres.t += dt;
            if (progres.t > 1.6) {
              progres = { reste: Infinity, t: 0 };
              if (reroutes < 2 && (route = chemin(e.x, e.y, fin[0], fin[1], proches.map(place))).length) { reroutes++; }
              else if (cible === 'assis') { route = []; allerSAsseoir(); }
              // déposer le butin, partir en expédition : il ne renonce pas, il attend un peu que la voie se libère et repart
              else if (cible === 'deposer' || cible === 'disparaitre') { const c2 = cible; route = []; vit = 0; p.etat('repos'); reessai = { t: .8 + Math.random() * .8, x: fin[0], y: fin[1], cible: c2 }; }
              else { route = []; but = null; cible = null; vit = 0; p.etat('repos'); attente = .8 + Math.random(); }
              p.deplacement(0, 0); p.maj(dt); return;
            }
            e.x = nx2; e.y = ny2; e.def.x = e.x; e.def.y = e.y; poser(e);
            // point atteint (ou dépassé dans le virage)
            const d2 = Math.hypot(tx - e.x, ty - e.y);
            if (d2 < Math.max(3, pas * 1.5) || (route.length > 1 && d2 < 12 && vueG(grille || (construireGrille(), grille), e.x, e.y, route[1][0], route[1][1]))) {
              route.shift(); if (!route.length) { but = null; vit = 0; arrivee(); }
            }
          } else if (!route.length) {
            // tourné vers le feu (ou au bout d'un moment, s'il n'y arrive pas) : il s'assoit
            if (assoirApres) { assoirApres.t += dt; if ((capVise === null && p.vueActive === 'face' && p.miroirActif === assoirApres.versG) || assoirApres.t > 1.6 || fige) finirAssis(); }
            else if (reessai) { reessai.t -= dt; if (reessai.t <= 0) { const r2 = reessai; reessai = null; allerA(r2.x, r2.y, r2.cible); } }
            else {
              attente -= dt; if (attente <= 0) choisir();
              // debout à ne rien faire : de temps en temps il regarde autour de lui (un papillon, un compagnon, le feu, nous…)
              else if (p.etatActif === 'repos' && capVise === null && !fige && (coupDOeil -= dt) <= 0) { coupDOeil = 3.5 + Math.random() * 4; regarderAutour(); }
              // 19/10 · la vie au repos : debout le jour, un petit geste toutes les 6 à 14 s
              else if (p.etatActif === 'repos' && !fige && !(nuit() || soir()) && mode === 'libre' && (prochainGeste -= dt) <= 0) gesteAuHasard();
            }
          }
          // l'orientation suit le cap (il tourne déjà progressivement) : 8 directions, chacune avec son dessin
          const lis = 1 - Math.exp(-dt / .22); svx += (vx - svx) * lis; svy += (vy - svy) * lis;
          const sv = Math.hypot(svx, svy);
          const assisOuDort = p.etatActif === 'assis' || p.etatActif === 'dort';
          if (route.length && !fige && sv > 4) { capVise = null; p.orienter(versSol(cap)); }
          else if (!assisOuDort) tournerSurPlace(dt, fige);
          p.deplacement(vx, vy);
          p.maj(dt);
          if (p.etatActif === 'dort' && Math.random() < dt * .35 && !fige) zzz(e.x + 14 * e.ech, e.y - 62 * e.ech);
        },
        get mode() { return mode; },
        get absent() { return absent; },
        get enMarche() { return route.length > 0 && reaction <= 0; },
        // envoyer le compagnon quelque part (le jeu, ou un toucher sur le sol)
        allerVers(x, y) { if (absent || mode === 'part') return false; reaction = 0; geste = null; siege = null; allerA(x, y, 'repos'); return route.length > 0; },
        // 19/10 · un geste de la vie au repos sur commande
        geste(nom) { return lancerGeste(nom); },
        get but() { return but || (siege && p.etatActif !== 'marche' ? siege : null); }
      };
      return this_;
      function revenir() {
        absent = false; mode = 'revient'; const b = leBateau(), s = P[L.sortie];
        const sv = L.sortieVers || [8, -34], dep = b ? (b.def.quai || [b.def.amarre[0] - 8, b.def.amarre[1] + 6]) : [s[0] + sv[0], s[1] + sv[1]];
        e.x = dep[0]; e.y = dep[1]; e.def.x = e.x; e.def.y = e.y; poser(e); e.visuel.visible = true;
        // il descend du bateau déjà tourné vers le rivage
        cap = Math.atan2(s[1] - e.y, s[0] - e.x); capVise = null; svx = Math.cos(cap); svy = Math.sin(cap); p.orienter(versSol(cap));
        e.visuel.alpha = 0; animer(.9, k => { e.visuel.alpha = k; });
        route = [[s[0], s[1]], ...chemin(s[0], s[1], P[L.coffre][0], P[L.coffre][1], autres().map(place))]; but = route[route.length - 1]; cible = 'deposer'; p.etat('marche'); p.tete('calme');
      }
      // arrivé, il se tourne vers un compagnon proche, sinon vers le feu s'il est à côté
      function tournerVers() {
        const f = S.lieux.sieges && elements.get(S.lieux.sieges.centre);
        const o = autres().map(q => [q, distSol(e.x, e.y, q.x, q.y)]).filter(([, d]) => d < 160).sort((a, b) => a[1] - b[1])[0];
        const tx = o ? o[0].x : f && distSol(e.x, e.y, f.x, f.y) < 190 ? f.x : null;
        const ty = o ? o[0].y : f ? f.y : e.y;
        if (tx !== null && Math.hypot(tx - e.x, ty - e.y) > 10) tournerA(Math.atan2(ty - e.y, tx - e.x));
      }
      function sEffacer(duree) {
        animer(duree, k => { e.visuel.alpha = 1 - k; }, () => { absent = true; partant = false; route = []; e.visuel.visible = false; mode = 'libre'; p.etat('repos'); emettre('compagnon-parti', { compagnon: e.id }); if (retourEnAttente) { retourEnAttente = false; setTimeout(() => this_.evenement('expedition-retour', { compagnon: e.id }), 1500); } });
      }
      function arrivee() {
        if (partant) {
          // au bout du ponton : un pas vers le bateau, et il s'efface en montant à bord
          if (embarque) { embarque = false; const b = leBateau(); if (b) route = [[e.x + (b.def.amarre[0] - e.x) * .35, e.y + (b.def.amarre[1] - e.y) * .35]]; sEffacer(.8); }
          return;
        }
        if (cible === 'assis') {
          // assis face au feu (il se tourne d'abord vers lui)
          essais = 0; refus = []; siege = [e.x, e.y];
          sAsseoir();
        }
        else if (cible === 'disparaitre') {
          // 19/10 · avant d'embarquer, il se tourne vers nous et fait au revoir de la main (une fois, jamais en mouvement réduit)
          if (!adieuFait && p.reglages.aurevoir && !reduit()) { adieuFait = true; regarder(); p.etat('aurevoir'); p.tete('content'); geste = { nom: 'aurevoir', t: p.reglages.aurevoir.duree, puis: () => { cible = 'disparaitre'; p.tete('calme'); arrivee(); } }; return; }
          adieuFait = false;
          const b = leBateau(), q = b && b.def.quai;
          partant = true;
          // un ponton (« quai » du bateau) : il le longe jusqu'au bout, puis monte à bord
          if (q) { embarque = true; route = [[q[0], q[1]]]; if (p.etatActif !== 'marche') p.etat('marche'); return; }
          // sinon il continue vers le bateau (ou, sans bateau, dans la direction « lieux.sortieVers ») en s'effaçant
          const sv = L.sortieVers || [8, -34]; route = [b ? [e.x + (b.def.amarre[0] - e.x) * .6, e.y + (b.def.amarre[1] - e.y) * .6] : [e.x + sv[0], e.y + sv[1]]];
          sEffacer(1.1);
          return;
        }
        else if (cible === 'vue' && vue) { p.etat('repos'); p.tete('calme'); attente = 5 + Math.random() * 5; tournerA(Math.atan2(vue[3] - e.y, vue[2] - e.x), 3); coupDOeil = attente + 1; }
        else if (cible === 'deposer') { p.porter('sac', false); regarder(); p.etat('content'); p.tete('content'); reaction = p.reglages.content.duree; mode = 'libre'; poussiere(e.x + 16, e.y, 10, 10); emettre('butin-depose', { compagnon: e.id }); }
        else if (cible === 'salut') { regarder(); p.etat('touche'); p.tete('content'); reaction = p.reglages.touche.duree + .4; }
        // 19/10 · assis un moment sur le banc (il se lève tout seul) ; la visite au coffre (il hoche la tête) ; la rencontre (il salue, bras levés)
        else if (cible === 'banc') { const b = elements.get('banc'); if (b) { const versG = e.x > b.x; if (p.miroirActif !== versG) p.miroir(versG); } p.etat('assis'); p.tete('calme'); siege = null; geste = { nom: 'banc', t: 8 + Math.random() * 6, puis: () => { p.etat('repos'); attente = 1 + Math.random(); } }; }
        else if (cible === 'coffre') { const c = P[L.coffre]; if (c) tournerA(Math.atan2(c[1] - 12 - e.y, c[0] - e.x), 5); const nomR = p.reglages.hoche ? 'hoche' : 'content'; p.etat(nomR); p.tete('content'); reaction = p.reglages[nomR].duree; attente = 2 + Math.random() * 2; }
        else if (cible === 'rencontre') { const o = rencontre && elements.get(rencontre); rencontre = null; if (o && o.visuel.visible) tournerA(Math.atan2(o.y - e.y, o.x - e.x), 5); const nomR = p.reglages.bras ? 'bras' : 'content'; p.etat(nomR); p.tete('content'); reaction = p.reglages[nomR].duree; attente = 3 + Math.random() * 3; }
        else { p.etat('repos'); p.tete('calme'); attente = 2.5 + Math.random() * 5; tournerVers(); }
        cible = null;
      }
    }

    // ---------- la lumière : un seul état, appliqué au fond, aux objets et aux personnages
    const reperes = F.reperes;
    function etatLumiere(h) {
      h = ((h % 24) + 24) % 24;
      let i = 0; while (i < reperes.length - 1 && !(h >= reperes[i][0] && h <= reperes[i + 1][0])) i++;
      const [h0, a] = reperes[i], [h1, b] = reperes[Math.min(i + 1, reperes.length - 1)];
      const t = a === b || h1 === h0 ? 0 : lisse((h - h0) / (h1 - h0));
      const A = F.moments[a], B = F.moments[b];
      return { heure: h, a: A, b: B, t, etat: (t < .5 ? A : B).id, suivant: B.id, progression: t,
        teinte: melange(A.teinte, B.teinte, t), feu: A.feu + (B.feu - A.feu) * t, etoiles: A.etoiles + (B.etoiles - A.etoiles) * t,
        lumiere: t < .5 ? A.lumiere : B.lumiere, ombre: t < .5 ? A.ombre : B.ombre, accent: t < .5 ? A.accent : B.accent,
        reflet: melange(hex(A.lumiere), hex(B.lumiere), t) };
    }
    let derniersMoments = '';
    // 22/10 · lie aux shaders les fonds des deux moments courants (nettoyés, ou bruts si effets.ecumePeinte ≥ 0,5) et leurs ciels ; un compteur
    // ne garde que la dernière demande si deux se suivent vite (un fond nettoyé à la demande prend quelques dizaines de ms)
    let ecumeBrut = null, relierN = 0, relierPromesse = null, liesCle = '';   // 23/10 · liesCle : les moments des fonds liés aux shaders
    function relierFonds() {
      if (!lum) return null;
      const brut = (F.effets.ecumePeinte == null ? 0 : F.effets.ecumePeinte) >= .5, seq = ++relierN, cleV = lum.a.id + '>' + lum.b.id; ecumeBrut = brut; derniersMoments = cleV;
      const FP = c => brut ? T(c) : nettoyerMoment(c);
      return (relierPromesse = Promise.all([FP(lum.a.fond), FP(lum.b.fond), T(lum.a.ciel), T(lum.b.ciel)]).then(([fa, fb, ca, cb]) => {
        if (seq !== relierN || detruit) return;
        for (const sh of shaders) { const r = sh.resources; r.uFondA = fa.source; r.uFondB = fb.source; r.uCielA = ca.source; r.uCielB = cb.source; r.u.uniforms.uMix = lum.t; }
        liesCle = cleV;
      }));
    }
    // la phase de la lune du jour (0 = nouvelle lune, 0,5 = pleine lune) ; « phaseLune » dans les options pour la forcer
    const phaseLune = options.phaseLune != null ? options.phaseLune : ((((options.date || Date.now()) / 86400000 - 10962.76) / 29.530588853) % 1 + 1) % 1;
    // course des astres : la même que le décor actuel (de gauche à droite, arc bas et large)
    const lisseP = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
    function astre(h, lever, coucher, horizon, sommet, rayon) {
      const duree = ((coucher - lever) + 24) % 24, ecoule = ((h - lever) + 24) % 24;
      if (ecoule > duree) return [0, 0, 0, rayon];
      const t = ecoule / duree, vis = lisseP(0, .08, t) * (1 - lisseP(.88, .98, t)), bord = Math.pow(Math.abs(t - .5) * 2, 1.4);
      return [(-.08 + 1.16 * t) * W, (horizon - (horizon - sommet) * 4 * t * (1 - t)) * H, vis, rayon * (1.04 + .14 * bord)];
    }
    function appliquerLumiere() {
      const h = typeof options.heure === 'function' ? options.heure() : options.heure != null ? options.heure : (d => d.getHours() + d.getMinutes() / 60)(new Date());
      lum = etatLumiere(h);
      const cle = lum.a.id + '>' + lum.b.id;
      for (const sh of shaders) {
        const r = sh.resources, u = r.u.uniforms;
        if (liesCle === cle) u.uMix = lum.t; u.uEtoiles = lum.etoiles;   // 23/10 · le mélange suit les fonds liés (relierFonds le pose quand ils arrivent)
        const nc = melange(hex(lum.a.nuage.couleur), hex(lum.b.nuage.couleur), lum.t);
        u.uNuageCouleur[0] = nc[0]; u.uNuageCouleur[1] = nc[1]; u.uNuageCouleur[2] = nc[2];
        u.uNuage[0] = lum.a.nuage.teinte + (lum.b.nuage.teinte - lum.a.nuage.teinte) * lum.t; u.uNuage[1] = lum.a.nuage.opacite + (lum.b.nuage.opacite - lum.a.nuage.opacite) * lum.t;
        const so = astre(lum.heure, F.astres.leverSoleil, F.astres.coucherSoleil, .305, .085, 15.3), lu = astre(lum.heure, F.astres.leverLune, F.astres.coucherLune, .295, .095, 18.4);
        u.uSoleil[0] = so[0]; u.uSoleil[1] = so[1]; u.uSoleil[2] = so[2]; u.uLune[0] = lu[0]; u.uLune[1] = lu[1]; u.uLune[2] = lu[2]; u.uAstres[0] = so[3]; u.uAstres[1] = lu[3];
        const ec = melange(lum.a.ecume, lum.b.ecume, lum.t); u.uEcumeCouleur[0] = ec[0]; u.uEcumeCouleur[1] = ec[1]; u.uEcumeCouleur[2] = ec[2];
        u.uReflet[0] = lum.reflet[0] * .55; u.uReflet[1] = lum.reflet[1] * .55; u.uReflet[2] = lum.reflet[2] * .55;
      }
      if (cle !== derniersMoments) relierFonds();   // 22/10 · les fonds nettoyés (ou bruts), voir relierFonds
      for (const [id, c] of Object.entries(cascades)) { const enA = id === lum.a.id, enB = id === lum.b.id && lum.t > .001 && lum.b.id !== lum.a.id; c.groupe.visible = enA || enB; c.groupe.alpha = enB ? lum.t : 1; c.groupe.zIndex = enB ? 1 : 0; }
      majFalaise();   // 22/10 · la falaise gauche : la découpe du moment, fondue vers la suivante
      for (const e of elements.values()) teinter(e);
      try { options.onLumiere && options.onLumiere({ heure: lum.heure, etat: lum.etat, suivant: lum.suivant, progression: lum.progression, lumiere: lum.lumiere, ombre: lum.ombre, accent: lum.accent }); } catch (err) { console.error(err); }
      return lum;
    }
    // les lumières du camp (feu, lanternes…) : la liste est refaite une fois par image au plus
    let feuxListe = null, feuxT = -1;
    function feux() { if (feuxT !== temps || !feuxListe) { feuxT = temps; feuxListe = elts.filter(e => e.def.lumiere && e.visuel.visible); } return feuxListe; }
    // 19/10 · le feu comme jauge : la part de lumière selon son état (les braises restent chaleureuses : jamais éteintes)
    const JAUGE = { braises: .62, stable: 1, ardent: 1.25 };
    const jaugeK = e => JAUGE[e.def.jauge] || 1;
    let legere = false;   // « Animations légères » (reglages.legere) : lu à chaque image
    const teinteTmp = [1, 1, 1];
    function teinter(e) {
      if (!lum) return;
      let r0 = lum.teinte[0], g0 = lum.teinte[1], b0 = lum.teinte[2];
      // sur la mer (le bateau, les mouettes, le voilier), la nuit est plus sombre que sur la clairière
      if (e.def.type === 'bateau' || e.def.type === 'mouettes' || e.def.type === 'voilier') { const k = 1 - .38 * Math.max(0, Math.min(1, (lum.feu - .3) / .55)); r0 *= k; g0 *= k; b0 *= k; }
      const fx = feux();
      for (let i = 0; i < fx.length; i++) {
        const f = fx[i]; if (f === e) continue;
        const d = Math.hypot(e.x - f.x, (e.y - f.y) * 1.6), r = f.def.lumiere.rayon;
        if (d < r) { const k = lum.feu * .85 * Math.pow(1 - d / r, 1.3) * jaugeK(f), c2 = f.def.lumiere.couleur; r0 += (c2[0] - r0) * k; g0 += (c2[1] - g0) * k; b0 += (c2[2] - b0) * k; }
      }
      const tf = e.visuel.teinteFixe; if (tf) { r0 *= tf[0]; g0 *= tf[1]; b0 *= tf[2]; }
      // 19/10 · en braises, le feu est plus rouge et un peu plus sombre (il reste chaleureux) ; ardent : la lumière fait le travail
      if (e.def.jauge === 'braises') { r0 *= .96; g0 *= .82; b0 *= .72; }
      if (e.def.lumiere) { r0 += (1 - r0) * .7; g0 += (1 - g0) * .7; b0 += (1 - b0) * .7; }
      teinteTmp[0] = r0; teinteTmp[1] = g0; teinteTmp[2] = b0;
      const nt = rvb(teinteTmp); if (e.teinteMise !== nt) { e.teinteMise = nt; e.visuel.tint = nt; }
      const forceOmbre = 1 - lum.feu * .45;
      if (e.ombre) e.ombre.alpha = ombreDe(e.def).a * forceOmbre * (e.visuel.alpha);
      if (e.visuel.marionnette) e.visuel.marionnette.ombre(forceOmbre * .9);
    }

    // ---------- la vie ambiante : lucioles la nuit, oiseaux le jour
    const lucioles = [], oiseaux = [];
    if (options.vieAmbiante !== false) {
      for (let i = 0; i < 16; i++) { const s = new PIXI.Sprite(texPoint); s.anchor.set(.5); s.blendMode = 'add'; s.tint = 0xd8ff8a; s.scale.set(.45); couches.vie.addChild(s); const x0 = 120 + Math.random() * 480, y0 = 760 + Math.random() * 320; lucioles.push({ s, x: x0, y: y0, x0, y0, ox: Math.random() * 2 - 1, oy: Math.random() * 2 - 1, actif: i < 4, p: Math.random() * 10 }); }
      for (let i = 0; i < 3; i++) { const g = new PIXI.Graphics().moveTo(-5, -2).quadraticCurveTo(-2, -4, 0, 0).quadraticCurveTo(2, -4, 5, -2).stroke({ width: 1.2, color: 0x2a3340, alpha: .75 }); couches.fond.addChild(g); oiseaux.push({ g, x: -40 - i * 30, y: 140 + i * 22, v: 22 + i * 4, p: i }); }
    }

    // 19/10 · la nuit, les lucioles vivent près de la lavande et du laurier quand ils sont posés (ambiance.lucioles) ; sans plante, quelques-unes au bord de la clairière
    let luciolesT = -9;
    function ancrerLucioles() {
      const AL = (S.ambiance && S.ambiance.lucioles) || { plantes: ['lavande', 'laurier'], rayon: 55, parPlante: 6, sans: 4 };
      const pl = AL.plantes.map(id => elements.get(id)).filter(o => o && !o.detruit && o.visuel.visible);
      for (let i = 0; i < lucioles.length; i++) {
        const l = lucioles[i];
        if (pl.length) { const o = pl[i % pl.length], h = Math.abs(o.visuel.height) || 40; l.actif = i < pl.length * AL.parPlante; l.x = o.x + l.ox * AL.rayon; l.y = o.y - h * .5 + l.oy * h * .5; }
        else { l.actif = i < AL.sans; l.x = l.x0; l.y = l.y0; }
      }
    }
    // ---------- le vent commun : de temps en temps une rafale traverse le camp de gauche à droite
    const rafale = { x: -999, v: 150, pic: 0, force: 0, active: false, attente: 5 + Math.random() * 6 };
    function lancerRafale(x, pic, v) { Object.assign(rafale, { x, pic, v, active: true, t: 0 }); }
    const ventA = x => 1 + rafale.force * Math.exp(-Math.pow((x - rafale.x) / 150, 2));
    function majRafale(dt, fige) {
      if (fige) { rafale.force = 0; return; }
      if (!rafale.active) { rafale.attente -= dt; if (rafale.attente <= 0) lancerRafale(-220, .55 + Math.random() * .7, 120 + Math.random() * 70); }
      else {
        rafale.t += dt; rafale.x += rafale.v * dt;
        rafale.force = rafale.pic * Math.min(1, rafale.t / 1.2) * Math.max(0, Math.min(1, (W + 250 - rafale.x) / 200));
        if (rafale.x > W + 250) { rafale.active = false; rafale.force = 0; rafale.attente = 7 + Math.random() * 12; }
      }
    }

    const A = S.ambiance || {};
    const emetteurs = { fumee: 0, braise: .8, embrun: 0, etoile: 20 + Math.random() * 20 };
    let pulsTemple = 0;
    // la fumée et les braises du feu
    function fumer(e, dt, nuitV) {
      const h = Math.abs(e.visuel.height), x = e.x, y = e.y - h * .62;
      emetteurs.fumee -= dt;
      if (emetteurs.fumee <= 0) {
        emetteurs.fumee = (.32 + Math.random() * .12) * (legere ? 1.8 : 1) * (jaugeK(e) < 1 ? 1.3 : 1);   // 19/10 · braises : moins de fumée ; animations légères : moins encore
        const vie = 4.8 + Math.random() * 1.8, a = (.5 - nuitV * .12) * Math.min(1.4, e.boost || 1) * (jaugeK(e) < 1 ? .75 : 1);
        const gris = melange([.86, .84, .8], [.46, .48, .56], nuitV), chaud = [1, .78, .55];
        particule(famille('objets', e.visuel.zIndex + .2, 'normal', texFumee, 'v'), texFumee, { x: x + (Math.random() - .5) * 8, y, scaleX: .32 * (e.ech || 1), scaleY: .32 * (e.ech || 1), alpha: 0 }, { vx: 3 + Math.random() * 4, vy: -22 - Math.random() * 8, g: 0, vie, t: 0, vent: true,   // devant le feu, derrière qui se tient devant lui
          maj: (q, r) => { const k = .32 + 1.25 * r; echelleP(q, k * (e.ech || 1)); const o = q.p || q.s; o.alpha = a * Math.min(1, r / .1) * Math.pow(1 - r, 1.3); o.tint = rvb(melange(chaud, gris, Math.min(1, r / .35 + (1 - nuitV)))); } });
      }
      emetteurs.braise -= dt;
      if (emetteurs.braise <= 0) {
        emetteurs.braise = (.6 + Math.random() * 1.4) / ((e.boost || 1) * jaugeK(e)) * (legere ? 1.6 : 1);   // 19/10 · les étincelles sont un peu plus nombreuses quand le feu est ardent
        for (let n = 0, nb = 1 + Math.floor(Math.random() * 2); n < nb; n++) {
          const ph = Math.random() * 10, k = .18 + Math.random() * .12;
          particule(famille('objets', e.visuel.zIndex + .2, 'add', texPoint), texPoint, { x: x + (Math.random() - .5) * 14, y: y + 14, scaleX: k, scaleY: k, tint: 0xffa04a }, { vx: (Math.random() - .5) * 18, vy: -55 - Math.random() * 35, g: 14, vie: 1.1 + Math.random() * .8, t: 0, vent: true,
            maj: (q, r) => { (q.p || q.s).alpha = (1 - r) * (.55 + .45 * Math.sin(q.t * 24 + ph)); } });
        }
      }
    }
    // les embruns au pied de la cascade, et l'arc-en-ciel du matin
    const pied = A.piedCascade, brumeCascade = pied ? new PIXI.Sprite(texLueur) : null;
    let arc = null;
    if (pied) {
      brumeCascade.anchor.set(.5); brumeCascade.position.set(pied[0], pied[1] - 4); brumeCascade.scale.set(.42, .28); couches.sol.addChild(brumeCascade);
      arc = new PIXI.Container(); arc.position.set(pied[0] - 4, pied[1] + 14);
      const couleurs = [0xff6b5a, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0x9775fa];
      couleurs.forEach((c, i) => { const g = new PIXI.Graphics(); g.arc(0, 0, 34 - i * 2.2, Math.PI * 1.12, Math.PI * 1.58).stroke({ width: 2.3, color: c, alpha: .9 }); arc.addChild(g); });
      arc.blendMode = 'add'; arc.alpha = 0; couches.sol.addChild(arc);
    }
    function embruns(dt, fige) {
      if (!pied) return;
      const teinte = rvb(lum ? lum.teinte : [1, 1, 1]);
      brumeCascade.tint = teinte; brumeCascade.alpha = .32 + (fige ? 0 : .06 * Math.sin(temps * 1.3));
      if (!fige) {
        emetteurs.embrun -= dt;
        if (emetteurs.embrun <= 0) {
          emetteurs.embrun = .11;
          const k0 = .1 + Math.random() * .08;
          particule(famille('sol', null, 'normal', texFumee, 'v'), texFumee, { x: pied[0] + (Math.random() - .5) * 16, y: pied[1] + (Math.random() - .5) * 4, scaleX: k0, scaleY: k0, tint: teinte, alpha: 0 }, { vx: (Math.random() - .5) * 14, vy: -9 - Math.random() * 10, g: 0, vie: 1.6 + Math.random() * .9, t: 0, vent: true,
            maj: (q, r) => { echelleP(q, k0 * (1 + r * 1.4)); (q.p || q.s).alpha = .3 * Math.min(1, r / .15) * (1 - r); } });
        }
      }
      // l'arc-en-ciel : le matin, quand le soleil est levé et pas caché
      const h = lum ? lum.heure : 12, matin = lisseP(6.7, 7.3, h) * (1 - lisseP(9.4, 10.4, h));
      arc.alpha = .3 * matin;
    }
    // étoiles filantes, la nuit, de temps en temps
    const filante = new PIXI.Graphics(); couches.large.addChild(filante);
    let etoile = null;
    function filantes(dt, fige) {
      filante.clear();
      if (fige || !lum || lum.etoiles < .6) return;
      if (!etoile) { emetteurs.etoile -= dt; if (emetteurs.etoile <= 0) { const sens = Math.random() < .5 ? -1 : 1; etoile = { x: 60 + Math.random() * 330, y: 30 + Math.random() * 150, vx: sens * (260 + Math.random() * 120), vy: 110 + Math.random() * 70, t: 0, vie: .8 + Math.random() * .3 }; emetteurs.etoile = 18 + Math.random() * 30; } return; }
      etoile.t += dt; const r = etoile.t / etoile.vie; if (r >= 1) { etoile = null; return; }
      const hx = etoile.x + etoile.vx * etoile.t, hy = etoile.y + etoile.vy * etoile.t, n = Math.hypot(etoile.vx, etoile.vy), ux = etoile.vx / n, uy = etoile.vy / n, env = Math.sin(Math.PI * r);
      for (let k = 0; k < 5; k++) { const a0 = k * 11, a1 = (k + 1) * 11; filante.moveTo(hx - ux * a0, hy - uy * a0).lineTo(hx - ux * a1, hy - uy * a1).stroke({ width: 1.6 - k * .25, color: 0xf2f5ff, alpha: env * (1 - k / 5) * .9 }); }
    }
    // ---------- (17/10) encore un peu de vie : des feuilles et des pétales emportés par les rafales (ils se posent au sol puis
    // s'effacent), des poissons (et parfois un dauphin) qui sautent dans la baie, l'ombre des nuages qui passe sur le camp,
    // des oiseaux qui planent autour du sommet. Rien de tout cela en mouvement réduit.
    const texFeuille = (() => { const c = document.createElement('canvas'); c.width = 16; c.height = 8; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, 4); g.quadraticCurveTo(8, -1.5, 16, 4); g.quadraticCurveTo(8, 9.5, 0, 4); g.fill(); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; g.beginPath(); g.moveTo(1.5, 4); g.lineTo(14.5, 4); g.stroke(); return PIXI.Texture.from(c); })();
    const texPoisson = (() => { const c = document.createElement('canvas'); c.width = 32; c.height = 12; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(2, 6); g.quadraticCurveTo(10, -1, 22, 5); g.lineTo(31, 1); g.lineTo(28, 6); g.lineTo(31, 11); g.lineTo(22, 7); g.quadraticCurveTo(10, 13, 2, 6); g.fill(); return PIXI.Texture.from(c); })();
    const texDauphin = (() => { const c = document.createElement('canvas'); c.width = 48; c.height = 20; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(1, 11); g.quadraticCurveTo(4, 9, 8, 9); g.quadraticCurveTo(20, 3, 34, 9); g.lineTo(40, 6); g.lineTo(47, 3); g.lineTo(43, 10); g.lineTo(47, 16); g.lineTo(39, 12); g.quadraticCurveTo(22, 17, 9, 12.5); g.quadraticCurveTo(4, 12.5, 1, 11); g.fill(); g.beginPath(); g.moveTo(19, 6.5); g.quadraticCurveTo(22, 0, 26, 1); g.quadraticCurveTo(24, 3, 25, 7); g.fill(); return PIXI.Texture.from(c); })();
    const feuilles = [];
    const SOURCES_FEUILLES = A.feuilles || [
      { id: 'olivier', c: [0x8a9a5b, 0x6f8546, 0xa7a35c] }, { id: 'laurier', c: [0xe48aa8, 0xd46a8e, 0x7a9450] },
      { x: 34, y: 780, c: [0x5d7a3e, 0x7a8f4a, 0x8a9a5b] }, { x: 688, y: 800, c: [0x5d7a3e, 0x7a8f4a, 0x8a9a5b] }];
    function majFeuilles(dt, fige, teinte) {
      if (fige || options.vieAmbiante === false) { for (const f of feuilles) f.s.visible = false; return; }
      if (rafale.active && rafale.force > .25 && feuilles.length < 28) for (const src of SOURCES_FEUILLES) {
        let x, y;
        if (src.id) { const o = elements.get(src.id); if (!o || !o.visuel.visible) continue; const b = boiteDe(o); x = b[0] + Math.random() * (b[2] - b[0]); y = b[1] + Math.random() * (b[3] - b[1]) * .6; }
        else { x = src.x + (Math.random() - .5) * 50; y = src.y + (Math.random() - .5) * 80; }
        if (Math.abs(x - rafale.x) > 160 || Math.random() > dt * 2.4 * rafale.force) continue;
        const s = new PIXI.Sprite(texFeuille), k = echelleA(y) * (.6 + Math.random() * .25); s.anchor.set(.5); s.scale.set(k); s.position.set(x, y); couches.vie.addChild(s);
        const c0 = src.c[Math.floor(Math.random() * src.c.length)];
        feuilles.push({ s, c: [(c0 >> 16 & 255) / 255, (c0 >> 8 & 255) / 255, (c0 & 255) / 255], vx: 18 + Math.random() * 26, vy: 9 + Math.random() * 10, sol: Math.min(1060, y + 70 + Math.random() * 170), ph: Math.random() * 6.28, rot: (Math.random() - .5) * 6, t: 0, pose: 0, k });
      }
      for (let i = feuilles.length - 1; i >= 0; i--) {
        const f = feuilles[i], s = f.s; f.t += dt; s.visible = true;
        if (!f.pose) {
          s.x += (f.vx * .4 + 50 * (ventA(s.x) - 1) + 6 + Math.sin(f.t * 3 + f.ph) * 14) * dt; s.y += (f.vy + Math.sin(f.t * 4.2 + f.ph) * 9) * dt;
          s.rotation += f.rot * dt; s.scale.y = f.k * (.5 + .5 * Math.abs(Math.sin(f.t * 5 + f.ph)));
          if (s.y >= f.sol) { f.pose = f.t; s.scale.y = f.k * .55; couches.sol.addChild(s); }
        } else if (f.t - f.pose > 2.5) s.alpha = Math.max(0, 1 - (f.t - f.pose - 2.5) / 1.6);
        s.tint = rvb([f.c[0] * teinte[0], f.c[1] * teinte[1], f.c[2] * teinte[2]]);
        if (s.alpha <= 0 || s.x > W + 30) { s.destroy(); feuilles.splice(i, 1); }
      }
    }
    let eauCPU = null;   // l'eau des masques (rouge), lue avec le ciel plus bas
    const eauEn = (x, y) => { if (!eauCPU) return 0; const cw = W / 4, i = Math.floor(x / 4), j = Math.floor(y / 4); return i < 0 || j < 0 || i >= cw || j >= H / 4 ? 0 : eauCPU[j * cw + i] / 255; };
    const sauts = []; let attenteSaut = 5 + Math.random() * 8;
    function anneau(x, y, k) {   // un rond dans l'eau, et quelques gouttes
      const g = new PIXI.Graphics(); couches.sol.addChild(g); g.position.set(x, y);
      particules.push({ s: g, vx: 0, vy: 0, g: 0, vie: 1.3, t: 0, maj: (q, r) => { const R2 = (3 + 13 * r) * k; q.s.clear(); q.s.ellipse(0, 0, R2, R2 * .32).stroke({ width: 1.1, color: 0xffffff, alpha: .55 * (1 - r) }); } });
      for (let i = 0; i < 4; i++) { const k2 = .18 * k + Math.random() * .1; particule(famille('sol', null, 'normal', texPoint), texPoint, { x, y, scaleX: k2, scaleY: k2, tint: 0xe8f4ff }, { vx: (Math.random() - .5) * 30 * k, vy: -(20 + Math.random() * 25) * k, g: 120 * k, vie: .45 + Math.random() * .2, t: 0 }); }
    }
    function majSauts(dt, fige, teinte, nuitV) {
      if (!fige && options.vieAmbiante !== false && eauCPU) {
        attenteSaut -= dt;
        if (attenteSaut <= 0) {
          attenteSaut = (8 + Math.random() * 14) * (nuitV > .6 ? 2 : 1);
          for (let essai = 0; essai < 14; essai++) {
            const x = 110 + Math.random() * 500, y = 430 + Math.random() * 240;
            if (!surFalaiseG(x, y) && eauEn(x, y) > .8 && eauEn(x - 16, y) > .8 && eauEn(x + 16, y) > .8 && eauEn(x, y + 8) > .8) {
              const dauphin = Math.random() < .14, k = .45 + .5 * Math.max(0, Math.min(1, (y - 430) / 240)), sens = Math.random() < .5 ? -1 : 1;
              const s = new PIXI.Sprite(dauphin ? texDauphin : texPoisson); s.anchor.set(.5); s.visible = false; couches.sol.addChild(s);
              sauts.push({ s, x, y, k: k * (dauphin ? 1.2 : .85), sens, t: 0, d: dauphin ? 1.25 : .75, L: (dauphin ? 46 : 16) * k, Hh: (dauphin ? 24 : 11) * k, c: dauphin ? [.5, .56, .63] : [.8, .86, .9], dauphin });
              anneau(x, y, k);
              break;
            }
          }
        }
      }
      for (let i = sauts.length - 1; i >= 0; i--) {
        const o = sauts[i]; o.t += dt; const u = Math.min(1, o.t / o.d), x = o.x + o.sens * o.L * u, y = o.y - o.Hh * 4 * u * (1 - u), dy = -o.Hh * 4 * (1 - 2 * u);
        o.s.visible = !fige; o.s.position.set(x, y); o.s.scale.set(o.k * .5 * (o.sens > 0 ? -1 : 1), o.k * .5); o.s.rotation = Math.atan2(o.sens * dy, o.L);
        o.s.tint = rvb([o.c[0] * teinte[0], o.c[1] * teinte[1], o.c[2] * teinte[2]]);
        if (u >= 1) { anneau(x, o.y, o.k / (o.dauphin ? 1.2 : .85)); o.s.destroy(); sauts.splice(i, 1); }
      }
    }
    const ombresNuages = [];
    if (options.vieAmbiante !== false) for (let i = 0; i < 2; i++) { const s2 = new PIXI.Sprite(texOmbre); s2.anchor.set(.5); s2.alpha = 0; couches.lueurs.addChildAt(s2, 0); ombresNuages.push({ s: s2, x: Math.random() * W, y: 830 + i * 140, v: 6 + Math.random() * 5, l: 300 + Math.random() * 160 }); }
    function majNuagesSol(dt, fige, nuitV) {
      const jourV = Math.max(0, 1 - nuitV * 1.8);
      for (const o of ombresNuages) {
        if (!fige) { o.x += o.v * (1 + .5 * (ventA(o.x) - 1)) * dt; if (o.x > W + o.l * .6) { o.x = -o.l * .6; o.y = 800 + Math.random() * 250; o.l = 300 + Math.random() * 160; } }
        o.s.position.set(o.x, o.y); o.s.scale.set(o.l / 64, o.l * .34 / 64); o.s.alpha = fige ? 0 : .2 * jourV;
      }
    }
    const planeurs = [], sommetMont = A.lueurs && A.lueurs[0] ? [A.lueurs[0].x, A.lueurs[0].y] : [510, 124];
    if (options.vieAmbiante !== false) for (let i = 0; i < 3; i++) { const g = new PIXI.Graphics().moveTo(-6, -1.4).quadraticCurveTo(-2.6, -4, 0, 0).quadraticCurveTo(2.6, -4, 6, -1.4).stroke({ width: 1.1, color: 0x2a3340, alpha: .85 }); couches.sol.addChild(g); planeurs.push({ g, a: i * 2.1 + Math.random(), rx: 58 + i * 24, ry: 15 + i * 6, v: (.2 + i * .05) * (i % 2 ? -1 : 1), dy: -26 + i * 16, battre: 0 }); }
    function majPlaneurs(dt, fige, nuitV) {
      for (const o of planeurs) {
        if (!fige) { o.a += o.v * dt; o.battre = Math.max(0, o.battre - dt); if (o.battre <= 0 && Math.random() < dt * .25) o.battre = .9; }
        const x = sommetMont[0] + Math.cos(o.a) * o.rx, y = sommetMont[1] + o.dy + Math.sin(o.a) * o.ry, loin = Math.sin(o.a) < 0;
        const k = loin ? .72 : .9, aile = o.battre > 0 ? .45 + .55 * Math.abs(Math.cos(o.battre * 18)) : 1;
        o.g.position.set(x, y); o.g.scale.set(k, k * aile); o.g.alpha = fige ? 0 : Math.max(0, 1 - nuitV * 1.4) * (loin ? .6 : .85);
      }
    }
    // poussières dorées dans la lumière du jour
    const poussieres = [];
    if (options.vieAmbiante !== false) for (let i = 0; i < 14; i++) { const s2 = new PIXI.Sprite(texPoint); s2.anchor.set(.5); s2.blendMode = 'add'; s2.tint = 0xfff0c2; s2.scale.set(.2 + Math.random() * .12); couches.vie.addChild(s2); poussieres.push({ s: s2, x: 80 + Math.random() * 560, y: 780 + Math.random() * 280, p: Math.random() * 10 }); }
    // les rayons du soleil : un éventail de grands rais de lumière qui partent du soleil et descendent sur la mer et le camp,
    // forts au lever et au coucher, discrets à midi, absents la nuit ; chacun respire lentement. « effets.rayons » règle
    // leur force (1 par défaut, 0 pour les retirer).
    const texRai = (() => {
      // un rai diffus : étroit près du soleil, large en bas, profil doux (gaussien) d'un bord à l'autre ; il naît loin du soleil
      // (rien de vif autour de l'astre) et s'éteint lentement en s'éloignant
      const w = 128, h = 512, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
      const im = g.createImageData(w, h), d = im.data;
      for (let y = 0; y < h; y++) {
        const v = y / (h - 1), lo = v * v * (3 - 2 * v), naissance = Math.min(1, v / .24), fondu = 1 - Math.max(0, (v - .4) / .6);
        const long = naissance * naissance * (3 - 2 * naissance) * fondu * fondu, demi = (w / 2) * (.14 + .86 * lo);
        for (let x = 0; x < w; x++) { const dx = (x + .5 - w / 2) / demi, a = long * Math.exp(-dx * dx * 2.2), i = (y * w + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255); }
      }
      g.putImageData(im, 0, 0); return PIXI.Texture.from(c);
    })();
    const rais = [];
    if (options.vieAmbiante !== false) for (let i = 0; i < 7; i++) {
      const s2 = new PIXI.Sprite(texRai); s2.anchor.set(.5, 0); s2.blendMode = 'add'; s2.visible = false; couches.lueurs.addChild(s2);
      rais.push({ s: s2, ecart: (i - 3) / 3, ph: Math.random() * 6.28, per: 9 + Math.random() * 7, l: .85 + Math.random() * .35, w: 1.1 + Math.random() * .8 });
    }
    // le ciel visible (bleu des masques), lu une fois : un soleil caché derrière le mont ou la falaise ne lance pas de rayons
    let cielCPU = null;
    try {
      const src = (await T(F.masques)).source.resource, cv = document.createElement('canvas'); cv.width = W / 4; cv.height = H / 4;
      const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(ecume.masqueCanvas || src, 0, 0, cv.width, cv.height);   // 22/10 · le masque fermé
      const px = g.getImageData(0, 0, cv.width, cv.height).data; cielCPU = new Uint8Array(cv.width * cv.height);
      eauCPU = new Uint8Array(cv.width * cv.height);
      for (let i = 0; i < cielCPU.length; i++) { cielCPU[i] = px[i * 4 + 2]; eauCPU[i] = px[i * 4]; }
    } catch (err) { cielCPU = null; }
    const cielEn = (x, y) => { if (!cielCPU) return 1; const cw = W / 4, i = Math.max(0, Math.min(cw - 1, Math.floor(x / 4))), j = Math.floor(y / 4); return j < 0 ? 1 : j >= H / 4 ? 0 : cielCPU[j * cw + i] / 255; };
    // la part du disque du soleil qui est dans le ciel (0 : caché, 1 : en entier)
    const soleilVu = (sx, sy, R) => { let n = 0, t = 0; for (let k = -1; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = k < 0 ? 0 : R * (k % 2 ? 1.25 : .7); t += cielEn(sx + Math.cos(a) * r, sy + Math.sin(a) * r); n++; } return t / n; };
    function majRais(fige) {
      const force = F.effets.rayons == null ? 1 : F.effets.rayons;
      if (!lum || !force || !rais.length) { for (const r of rais) r.s.visible = false; return; }
      const [sx, sy, vis, R] = astre(lum.heure, F.astres.leverSoleil, F.astres.coucherSoleil, .305, .085, 15.3);
      const t = (lum.heure - F.astres.leverSoleil) / (F.astres.coucherSoleil - F.astres.leverSoleil);
      // forts quand le soleil est bas (lumière rasante), discrets à midi ; rien quand le soleil est caché ; moins la nuit venant
      const bas = 1 - Math.sin(Math.PI * Math.max(0, Math.min(1, t))), vu = vis > 0 ? soleilVu(sx, sy, R) : 0;
      const k = force * Math.sqrt(vis) * vu * (.12 + .88 * bas) * Math.max(0, 1 - lum.feu * 2);
      if (k < .01) { for (const r of rais) r.s.visible = false; return; }
      const c = rvb(melange(hex(lum.a.lumiere || '#fff4dc'), hex(lum.b.lumiere || '#fff4dc'), lum.t));
      // l'éventail vise le camp (en bas de l'écran), depuis le soleil ; les rais se chevauchent en une lumière diffuse
      const axe = Math.atan2(980 - sy, 360 - sx);
      for (const r of rais) {
        const b = fige ? .75 : .6 + .4 * Math.sin(tempsEffets * 6.283 / r.per + r.ph), a = axe + r.ecart * .26 + (fige ? 0 : .012 * Math.sin(tempsEffets * .17 + r.ph));
        r.s.visible = true; r.s.position.set(sx, sy); r.s.rotation = a - Math.PI / 2;
        const lg = Math.hypot(W, H) * r.l; r.s.scale.set(r.w * (1.5 + .9 * bas), lg / 512);
        r.s.tint = c; r.s.alpha = .16 * k * b;
      }
    }
    // les lueurs du décor (le temple de l'Olympe) : la nuit, et quand le Sommet est atteint
    const lueursFond = (A.lueurs || []).map(L => { const g = new PIXI.Sprite(texLueur); g.anchor.set(.5); g.blendMode = 'add'; g.tint = rvb(L.c || [1, .9, .7]); g.position.set(L.x, L.y); g.scale.set(L.r * 2.3 / 128); couches.lueurs.addChild(g); return { L, g }; });
    // 19/10 · le chemin du Mont (ambiance.mont du JSON) : 4 lampes, une par palier, éteintes au départ ; un éclat monte le long du chemin jusqu'au palier qui s'allume
    const MONT = A.mont || null;
    // 20/10 · quatre torches le long du chemin (ambiance.mont.torches) : un poteau dessiné (toujours là), la flamme de la planche flambeau-anime et sa lueur quand la torche est allumée
    const torcheTex = (() => { const [c, g] = (function () { const cv = document.createElement('canvas'); cv.width = 24; cv.height = 72; const gg = cv.getContext('2d'); return [cv, gg]; })();
      g.lineCap = 'round'; g.strokeStyle = '#3a2a1e'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(12, 70); g.lineTo(12, 22); g.stroke(); g.strokeStyle = '#6a4a2e'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(11, 68); g.lineTo(11, 24); g.stroke();
      g.fillStyle = '#5a3a22'; g.beginPath(); g.ellipse(12, 20, 8, 4, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#2c1e14'; g.beginPath(); g.ellipse(12, 19, 6.5, 2.6, 0, 0, Math.PI * 2); g.fill();
      return PIXI.Texture.from(c); })();
    let flammeImgs = null; if (MONT && MONT.torches && S.planches[MONT.torches.planche]) { const p = S.planches[MONT.torches.planche], t = await T(p.fichier); flammeImgs = []; for (let i = 0; i < p.images; i++) flammeImgs.push(new PIXI.Texture({ source: t.source, frame: new PIXI.Rectangle((i % p.colonnes) * p.w, Math.floor(i / p.colonnes) * p.h, p.w, p.h) })); }
    const torches = [], montLampes = MONT ? MONT.paliers.map(([x, y], i) => {
      const hT = (MONT.torches && MONT.torches.hauteur) || 30, k = hT / 72;
      const po = new PIXI.Sprite(torcheTex); po.anchor.set(.5, 1); po.position.set(x, y); po.scale.set(k); couches.lueurs.addChild(po);
      const g = new PIXI.Sprite(texLueur); g.anchor.set(.5); g.blendMode = 'add'; g.tint = rvb(MONT.couleur || [1, .86, .6]); g.position.set(x, y - hT * .78); g.scale.set((MONT.rayon || 22) * 2.3 / 128); g.alpha = 0; g.vise = 0; couches.lueurs.addChild(g);
      let fl = null; if (flammeImgs) { fl = new PIXI.Sprite(flammeImgs[0]); fl.anchor.set(.5, .78); fl.position.set(x, y - hT * .7); fl.scale.set(hT * .9 / 256); fl.alpha = 0; fl.ph = Math.random() * 6; couches.lueurs.addChild(fl); }
      torches.push({ g, fl, po }); return g; }) : [];
    let montAllumes = 0;
    function montEclat(versN) {
      if (!MONT) return; const ch = MONT.chemin, cible = MONT.paliers[versN - 1]; if (!cible) return;
      let fin = 0, dm = Infinity; ch.forEach((pt, i) => { const d = Math.hypot(pt[0] - cible[0], pt[1] - cible[1]); if (d < dm) { dm = d; fin = i; } });
      const pts = ch.slice(0, fin + 1).concat([cible]), seg = []; let L = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
      const s = new PIXI.Sprite(texPoint); s.anchor.set(.5); s.blendMode = 'add'; s.tint = 0xfff0c0; s.scale.set(1.7); couches.lueurs.addChild(s);
      animer(Math.min(2.2, .6 + L / 420), k => {
        const e2 = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; let d = e2 * L, i = 0; while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
        const u = seg[i] ? Math.min(1, d / seg[i]) : 1, x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u; s.position.set(x, y); s.alpha = .7 + .3 * Math.sin(temps * 20);
        if (Math.random() < .6) { const k2 = .5 + Math.random() * .5; particule(famille('lueurs', null, 'add', texPoint), texPoint, { x, y, scaleX: k2, scaleY: k2, tint: 0xffd890 }, { vx: (Math.random() - .5) * 20, vy: -8 - Math.random() * 18, g: 8, vie: .45 + Math.random() * .4, t: 0 }); }
      }, () => { s.destroy(); etincelles(cible[0], cible[1], 12, 0xffe0a0); });
    }
    function montAllumer(n, anime) { n = Math.max(0, Math.min(montLampes.length, n | 0)); if (anime && n > montAllumes && !reduit()) montEclat(n); montAllumes = n; montLampes.forEach((g, i) => { g.vise = i < n ? 1 : 0; }); }

    // ---------- toucher
    canvas.style.touchAction = 'manipulation';
    app.stage.eventMode = 'static'; app.stage.hitArea = app.screen;
    // On touche ce qui est vraiment dessiné (la transparence de l'image compte), avec une petite marge pour le doigt,
    // et c'est l'élément le plus en avant qui répond. Un compagnon se touche sur tout son corps.
    const alphas = new Map();
    function alphaDe(texture) {
      const src = texture.source, f = texture.frame, cle = src.uid + ':' + f.x + ',' + f.y + ',' + f.width;
      if (alphas.has(cle)) return alphas.get(cle);
      let r = null;
      try {
        const cv = document.createElement('canvas'); cv.width = f.width; cv.height = f.height;
        const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(src.resource, f.x, f.y, f.width, f.height, 0, 0, f.width, f.height);
        r = { w: f.width, h: f.height, a: g.getImageData(0, 0, f.width, f.height).data };
      } catch (err) { r = null; }
      alphas.set(cle, r); return r;
    }
    function estTouche(e, global, pt) {
      const v = e.visuel;
      if (v.marionnette) { const h = v.marionnette.hauteurVisible(); return Math.abs(pt.x - e.x) < h * .36 && pt.y < e.y + 6 && pt.y > e.y - h * 1.02; }
      if (v.plan && v.plan.zone) {
        const r = v.plan, u = (e.largeurAff || r.w) / r.w, [zx, zy, zrx, zry] = r.zone, cx = e.x + (zx - r.w / 2) * u, cy = e.y - (r.sol - zy) * u, m = 10 / monde.scale.x;
        if (((pt.x - cx) / (zrx * u + m)) ** 2 + ((pt.y - cy) / (zry * u + m)) ** 2 <= 1) return true;
      }
      const tex = v.texture;
      if (!tex) { const b = v.getBounds(); return global.x >= b.x && global.x <= b.x + b.width && global.y >= b.y && global.y <= b.y + b.height; }
      const loc = v.toLocal(global), px = loc.x + (v.anchor ? v.anchor.x * tex.width : 0), py = loc.y + (v.anchor ? v.anchor.y * tex.height : 0);
      const A2 = alphaDe(tex);
      if (!A2) return px >= 0 && py >= 0 && px < tex.width && py < tex.height;
      const marge = 8 / (Math.abs(v.scale.x || 1) * monde.scale.x);
      for (const [ox, oy] of [[0, 0], [marge, 0], [-marge, 0], [0, marge], [0, -marge]]) {
        const x = Math.floor(px + ox), y = Math.floor(py + oy);
        if (x >= 0 && y >= 0 && x < A2.w && y < A2.h && A2.a[(y * A2.w + x) * 4 + 3] > 40) return true;
      }
      return false;
    }
    app.stage.on('pointertap', ev => {
      const pt = monde.toLocal(ev.global);
      const touches = [...elements.values()].filter(e => e.def.touchable && e.visuel.visible && e.visuel.alpha > .2 && estTouche(e, ev.global, pt))
        .sort((a, b) => b.visuel.zIndex - a.visuel.zIndex);
      if (touches.length) emettre('toucher', { cible: touches[0].id, x: pt.x, y: pt.y });
      else emettre('toucher-sol', { x: pt.x, y: pt.y, libre: libre(pt.x, pt.y) });   // le sol : le jeu peut y envoyer un compagnon
    });

    // ---------- éléments du JSON
    for (const d of S.elements) { try { await ajouter(JSON.parse(JSON.stringify(d))); } catch (err) { erreur('Élément « ' + d.id + ' » : ' + err.message); } }
    appliquerLumiere();
    // 22/10 · les fonds des deux moments du départ sont nettoyés (et liés) avant la première image, pendant l'écran de chargement
    if (relierPromesse) await relierPromesse;

    // ---------- la boucle
    let dernierLum = 0, perfSomme = 0, perfN = 0;
    // 19/10 · onglet caché : la boucle s'arrête (rien ne tourne), elle repart au retour
    let pauseOnglet = false;
    const surVisibilite = () => { if (document.hidden) { if (!pauseOnglet) { pauseOnglet = true; app.ticker.stop(); } } else if (pauseOnglet) { pauseOnglet = false; if (!enPause && !detruit) app.ticker.start(); } };
    document.addEventListener('visibilitychange', surVisibilite);
    // 22/10 · la boucle est une fonction à part (boucle(secondes)) : le ticker l'appelle à chaque image, et les pages de vérification
    // peuvent faire avancer la scène d'un coup, sans attendre le rendu (scene.avancer(secondes) ; en headless le rendu est très lent)
    const boucle = dtBrut => {
      if (enPause || detruit) return;
      const tTick = performance.now();
      const dt = Math.min(.06, dtBrut), fige = reduit(); legere = !!F.effets.legere;
      const cadV = F.effets.cadence === 30 || (legere && !F.effets.cadence) ? 30 : 60; if (cadV !== cadence) { cadence = cadV; app.ticker.maxFPS = cadence; }   // 20/10 · la cadence
      if (F.effets.cull && PIXI.Culler) PIXI.Culler.shared.cull(app.stage, app.screen);   // 20/10 · préparé pour la caméra : rien n'est caché tant que tout le camp est visible
      temps += dt; if (!fige) tempsEffets += dt;
      majCamera(dt);
      if (temps - dernierLum > (options.lumiereRapide ? 0 : .5)) { dernierLum = temps; appliquerLumiere(); }
      majRafale(dt, fige);
      const h = lum ? lum.heure : 12, lampes = lum ? Math.max(0, Math.min(1, (lum.feu - .2) / .6)) : 0;
      const brume = (F.effets.brume == null ? 1 : F.effets.brume) * lisseP(5.6, 6.4, h) * (1 - lisseP(7.6, 9, h));
      if (voileSoir) { const ks = lisseP(SOIR.de, SOIR.plein, h) * (1 - lisseP(SOIR.fin, SOIR.bout, h)); voileSoir.m.alpha = SOIR.alpha * ks; voileSoir.a.alpha = SOIR.chaleurAlpha * ks; }   // 20/10 · le soir tamisé
      for (const mu of montsVent) { mu.uniforms.uTemps = tempsEffets; mu.uniforms.uRafale[0] = rafale.x; mu.uniforms.uRafale[1] = rafale.force; }
      // 22/10 · l'écume peinte en direct (reglages.ecumePeinte) : dès que la valeur change de côté, les fonds bruts ou nettoyés sont reliés
      if (ecumeBrut !== null && ((F.effets.ecumePeinte == null ? 0 : F.effets.ecumePeinte) >= .5) !== ecumeBrut) relierFonds();
      const kb = lisseP(6.6, 8, h), bc0 = .97 + (.93 - .97) * kb, bc1 = .9 + (.94 - .9) * kb, bc2 = .86 + (.96 - .86) * kb;
      for (const sh of shaders) {
        const u = sh.resources.u.uniforms; u.uTemps = tempsEffets; u.uCielHaut = camEcran.ciel || 0;   // 22/10 · la bande de ciel au-dessus du tableau
        u.uRafale[0] = rafale.x; u.uRafale[1] = rafale.force; u.uBrume = brume; u.uPhase = phaseLune;
        if (lum) { u.uBrumeCouleur[0] = bc0; u.uBrumeCouleur[1] = bc1; u.uBrumeCouleur[2] = bc2; }
        u.uVaguesImg = fige ? 0 : (tempsEffets * vaguesDef.ips * (F.effets.vitesseVagues || 1)) % vaguesDef.images;
        u.uEau = F.effets.eau; u.uReflets = F.effets.reflets; u.uVagues = F.effets.vagues == null ? 1 : F.effets.vagues;   // 22/10 · réglables en direct (curseurs, pages de vérification)
        const f = feux()[0];
        if (f) { u.uFeu[0] = f.x; u.uFeu[1] = f.y - 10; u.uFeu[2] = lum.feu * .55 * (f.boost || 1) * jaugeK(f); }
        else u.uFeu[2] = 0;
      }
      if (falaiseG && kFalaise() !== falaiseG.k) majFalaise();   // 22/10 · reglages.falaiseGauche, lu en direct
      // cascade
      const pos = fige ? 0 : (tempsEffets * 1000 / 140) % 5, i = Math.floor(pos), k = lisse(pos - i);
      for (const id in cascades) { const c = cascades[id]; if (!c.groupe.visible) continue; c.a.texture = c.imgs[i]; c.b.texture = c.imgs[(i + 1) % 5]; c.a.alpha = 1; c.b.alpha = k; }
      // éléments
      const L0 = elts;
      for (let ie = 0; ie < L0.length; ie++) {
        const e = L0[ie], v = e.visuel, d = e.def; if (e.detruit) continue;
        if (d.type === 'sprites' && v.images) {
          // le tissu et les clochettes s'agitent quand la rafale passe ; le feu s'emballe au Sommet
          if (v.ph == null) v.ph = v.decalage * 1000 / v.ms;
          if (!fige) v.ph += dt * 1000 / v.ms * (e.boost > 1.2 ? 1.6 : 1) * (d.lumiere ? 1 : 1 + .9 * (ventA(e.x) - 1));
          v.texture = v.images[fige ? 0 : Math.floor(v.ph) % v.images.length];
        }
        if (d.vent && v.base && !fige) {
          const buf = v.geometry.getAttribute('aPosition').buffer, data = buf.data, b = v.base, hTex = v.texture.height;
          const s = (Math.sin(tempsEffets * 1.3 + e.x * .03) * .6 + Math.sin(tempsEffets * 2.7 + e.x * .07) * .25) * d.vent * (e.rafale || 1) * F.effets.vent * ventA(e.x);
          for (let j = 0; j < data.length; j += 2) { const h = 1 - b[j + 1] / hTex; data[j] = b[j] + s * 4.2 * h * h; }
          buf.update();
        }
        if (e.lueur) {
          const vac = .85 + .15 * Math.sin(temps * 8.3) * Math.sin(temps * 4.1 + 1);
          const r = d.lumiere.rayon * .9 * (e.boost || 1);
          e.lueur.position.set(e.x, e.y - (d.lumiere.rayon < 200 ? (e.visuel.height || 40) * .6 : 30)); e.lueur.scale.set(r / 64, r * .62 / 64); if (e.lueur.__t === undefined) { e.lueur.__t = 1; e.lueur.tint = rvb(d.lumiere.couleur); }
          e.lueur.alpha = (d.lumiere.rayon < 200 ? lum.feu * .55 : .12 + lum.feu * .5) * vac * (e.boost > 1 ? 1.25 : 1) * jaugeK(e); e.lueur.zIndex = v.zIndex + .05;
        }
        if (e.lueurs) majLueurs(e, lampes, fige);
        if (e.eau) majEau(e, dt, fige);
        if (d.fumee && !fige && v.visible) fumer(e, dt, lum ? lum.feu : 0);
        if (e.cerveau) e.cerveau.maj(dt);
        if (v.plan) majPlan(e, dt, fige);
        if (e.etiq) { e.etiq.visible = v.visible && v.alpha > .05; e.etiq.alpha = v.alpha; e.etiq.position.set(v.position.x, v.position.y - v.marionnette.hauteurVisible() * 1.08); }
        // un compagnon qui marche entre ou sort de la lumière du feu : sa teinte suit à chaque image (pas par paliers)
        if (d.type === 'personnage' && lum && e.visuel.visible) teinter(e);
      }
      rangerCompagnons();
      majPortees(); majRais(fige);
      embruns(dt, fige); filantes(dt, fige);
      if (pulsTemple > 0) pulsTemple = Math.max(0, pulsTemple - dt / 3.5);
      for (let il = 0; il < lueursFond.length; il++) { const L = lueursFond[il].L, g = lueursFond[il].g, fl = fige ? 1 : .9 + .1 * Math.sin(temps * 2.1); g.alpha = Math.max(lampes * (L.i || .6) * fl, Math.sin(Math.min(1, pulsTemple) * Math.PI) * .9); }
      // les lampes du Mont : plus visibles la nuit, un léger vacillement ; en mouvement réduit elles changent d'un coup
      for (let im = 0; im < montLampes.length; im++) { const g = montLampes[im], cible = (g.vise ? 1 : 0) * (.55 + .45 * lampes) * (fige ? 1 : .94 + .06 * Math.sin(temps * 3.1 + im)); g.alpha += (cible - g.alpha) * (fige ? 1 : Math.min(1, dt * 2.5));   /* 20/10 · une torche éteinte : le poteau seul ; allumée : la flamme et sa lueur */
        const tq = torches[im]; if (tq && tq.fl) { tq.fl.alpha = Math.min(1, g.alpha * 1.4); if (!fige && g.alpha > .02) { tq.fl.ph += dt * 1000 / 50; tq.fl.texture = tq.fl.images ? tq.fl.images[Math.floor(tq.fl.ph) % tq.fl.images.length] : (flammeImgs ? flammeImgs[Math.floor(tq.fl.ph) % flammeImgs.length] : tq.fl.texture); } } }
      // animations ponctuelles et particules
      for (let j = enCours.length - 1; j >= 0; j--) { const a = enCours[j]; a.t += dt; const k2 = Math.min(1, a.t / a.duree); a.f(k2); if (k2 >= 1) { enCours.splice(j, 1); a.fin && a.fin(); } }
      for (let j = particules.length - 1; j >= 0; j--) {
        const q = particules[j], o = q.p || q.s; q.t += dt; q.vy += q.g * dt; o.x += (q.vx + (q.vent ? 26 * (ventA(o.x) - 1) + 3 : 0)) * dt; o.y += q.vy * dt;
        const r = q.t / q.vie; if (q.maj) q.maj(q, Math.min(1, r)); else o.alpha = q.texte ? Math.sin(Math.min(1, r) * Math.PI) * .9 : (q.a == null ? 1 : q.a) * (1 - r);
        if (r >= 1) { if (q.p) q.pc.removeParticle(q.p); else q.s.destroy(); particules.splice(j, 1); }
      }
      // vie ambiante
      const nuitV = lum ? lum.feu : 0;
      if (temps - luciolesT > 1.5) { luciolesT = temps; ancrerLucioles(); }
      for (let il = 0; il < lucioles.length; il++) { const l = lucioles[il]; l.p += dt; l.s.position.set(l.x + Math.sin(l.p * .7) * 22, l.y + Math.sin(l.p * 1.1) * 12); l.s.alpha = fige || !l.actif || (legere && il % 2) ? 0 : Math.max(0, nuitV - .5) * 1.8 * (.5 + .5 * Math.sin(l.p * 2.3)); }
      for (const d2 of poussieres) { if (!fige) { d2.p += dt; d2.x += (4 + 30 * (ventA(d2.x) - 1)) * dt; if (d2.x > 660) d2.x = 60; } d2.s.position.set(d2.x + Math.sin(d2.p * .6) * 12, d2.y + Math.sin(d2.p * .9) * 9); d2.s.alpha = fige || legere ? 0 : Math.max(0, 1 - nuitV * 2.2) * .55 * (.5 + .5 * Math.sin(d2.p * 1.7)) * Math.max(0, Math.min(1, (d2.x - 60) / 50, (660 - d2.x) / 50)); }   // elle s'efface avant de revenir de l'autre côté
      for (const o of oiseaux) { o.x += o.v * dt * (fige ? 0 : 1); if (o.x > W + 60) o.x = -60 - Math.random() * 400; o.g.position.set(o.x, o.y + Math.sin(o.x * .03 + o.p) * 6); o.g.scale.y = .6 + .4 * Math.abs(Math.sin(tempsEffets * 6 + o.p)); o.g.alpha = legere ? 0 : Math.max(0, 1 - nuitV * 1.4) * .9; }
      const teinteV = lum ? lum.teinte : [1, 1, 1];
      // « Animations légères » : plus de feuilles, de poissons, d'ombres de nuages ni d'oiseaux autour du sommet (comme en mouvement réduit pour ces petites vies)
      const figeL = fige || legere;
      majFeuilles(dt, figeL, teinteV); majSauts(dt, figeL, teinteV, nuitV); majNuagesSol(dt, figeL, nuitV); majPlaneurs(dt, figeL, nuitV);
      perfSomme += performance.now() - tTick; perfN++;
    };
    app.ticker.add(tk => boucle(tk.deltaMS / 1000));

    canvas.style.opacity = '1';
    try { options.onPret && options.onPret(); } catch (err) { console.error(err); }
    // 22/10 · les fonds des autres moments, nettoyés en différé, un par tâche (sinon ils le seraient au premier changement de moment)
    { const restants = F.moments.map(m => m.fond).filter(c => !ecume.propres[c]); const suivant = () => { if (detruit || ecume.erreur) return; if (document.hidden || enPause) return void setTimeout(suivant, 500); const c = restants.shift(); if (c) nettoyerMoment(c).then(() => setTimeout(suivant, 0), () => {}); }; if (ecume.masque) setTimeout(suivant, 1500); }   // 23/10 · rien pendant que l'onglet est caché ou la scène en pause ; départ 1,5 s après l'entrée
    // Préparer en arrière-plan, par petits morceaux, ce qui coûte la première fois : la transparence des images (toucher,
    // places cachées) et la gêne de chaque place au feu. Sinon le premier « je vais m'asseoir » fait sauter une image.
    {
      const travaux = [];
      for (const o of elements.values()) if (o.visuel && o.visuel.texture && o.def.type !== 'personnage' && !SPECIAUX.has(o.def.type)) {
        const t = o.visuel.texture; travaux.push(() => alphaDe(t));
        if (o.portee) { const t0 = o.visuel.images ? o.visuel.images[0] : t; travaux.push(() => silhouetteDe(t0)); }
      }
      const Sg = S.lieux.sieges, f = Sg && elements.get(Sg.centre);
      if (f) travaux.push(() => { for (const q of placesSieges(f)) travaux.push(() => geneEn(q.x, q.y, f)); });
      let i = 0;
      const pas = () => {
        if (detruit) return;
        const t0 = performance.now();
        while (i < travaux.length && performance.now() - t0 < 5) { try { travaux[i](); } catch (err) { /* sans importance */ } i++; }
        if (i < travaux.length) setTimeout(pas, 40);
      };
      setTimeout(pas, 600);
    }

    return {
      app, PIXI,
      pause() { enPause = true; app.ticker.stop(); },
      reprendre() { enPause = false; if (!document.hidden) app.ticker.start(); else pauseOnglet = true; },
      lumiere: () => appliquerLumiere(),
      detruire() { detruit = true; ro.disconnect(); document.removeEventListener('visibilitychange', surVisibilite); app.destroy(false, { children: true });
        // 23/10 · les toiles de l'écume (masque, fonds nettoyés) : Texture.from(toile) les range dans le Cache de PixiJS, app.destroy ne les touche pas
        for (const tx of [ecume.masqueTex, ...Object.values(ecume.propres)]) if (tx) { const cv = tx.source && tx.source.resource; try { tx.destroy(true); } catch (e) { } if (cv && 'width' in cv) cv.width = cv.height = 0; }
        ecume.propres = {}; ecume.masqueTex = null; ecume.masqueCanvas = null; },
      // 19/10 · le temps passé dans la boucle (JavaScript, sans le rendu) depuis la dernière lecture : moyenne en ms, et le nombre d'images
      get perf() { const m = perfN ? perfSomme / perfN : 0, n = perfN; perfSomme = 0; perfN = 0; return { moyenneMs: +m.toFixed(2), images: n, ecumeMs: +Object.values(ecume.ms).reduce((s, v) => s + v, 0).toFixed(1) }; },
      // 22/10 · l'écume peinte : l'état du nettoyage des fonds (ms par moment, ms du masque et de la chauffe ; le masque : blobs, pixels rendus à l'eau, pixels de roche dans l'eau ; les moments prêts, la bande traitée, bruts ou non)
      get ecume() { return { ms: Object.assign({}, ecume.ms), masqueMs: ecume.masqueMs, chauffeMs: ecume.chauffeMs, total: +Object.values(ecume.ms).reduce((s, v) => s + v, 0).toFixed(1), prets: ecume.prets.slice(), bande: ecume.bande ? Object.assign({}, ecume.bande) : null, masque: ecume.masque ? { blobs: ecume.masque.blobs, ajoutes: ecume.masque.ajoutes, roches: ecume.masque.roches } : null, erreur: ecume.erreur, brut: !!ecumeBrut }; },
      emettre, on(nom, f) { (ecouteurs[nom] = ecouteurs[nom] || []).push(f); return () => { ecouteurs[nom] = ecouteurs[nom].filter(g => g !== f); }; },
      ajouter: async d => { const e = await ajouter(d); return e && e.id; },
      retirer, definir,
      // 22/10 · pour les pages de vérification : l'état du comportement (le bateau : amarre, depart, aller, large, retour ; un compagnon : libre, part, revient)
      // et si l'élément est visible (un compagnon parti en expédition ne l'est plus)
      element: id => { const e = elements.get(id); return e && { id: e.id, def: e.def, x: e.x, y: e.y, etat: e.cerveau ? (e.cerveau.etat != null ? e.cerveau.etat : e.cerveau.mode) : undefined, but: e.cerveau && e.cerveau.but ? e.cerveau.but.slice() : null, visible: !!(e.visuel && e.visuel.visible && e.visuel.alpha > .01) }; },
      // le rectangle de l'image d'un élément [gauche, haut, droite, bas], dans le repère de la scène (pour poser une étiquette)
      boite: id => { const e = elements.get(id); return e && e.visuel ? boiteDe(e).slice() : null; },
      compagnon: id => { const e = elements.get(id); return e && e.visuel.marionnette; },
      elements: () => [...elements.keys()],
      reglages: S.fond.effets,
      get json() { return S; },
      reactions: REACTIONS,
      rafale: (x = -220, force = 1, vitesse = 160) => lancerRafale(x, force, vitesse),
      // 19/10 · la caméra : camera({ x, y, z, cache }) pose le cadrage de base (x, y : le point de la scène au centre ; z : zoom, 1 au moins ;
      // cache : la hauteur masquée en bas de l'écran par une feuille, qui autorise la vue à descendre d'autant) ; { immediat } : sans glissement ; sans argument : l'état courant
      camera(c, o) { if (c) { for (const k of ['x', 'y', 'z', 'cache']) if (c[k] != null && isFinite(c[k])) camBase[k] = c[k]; camBase.auto = c.z === 'auto' || c.z === 0; if (!camBase.auto && !(camBase.z >= zMin())) camBase.z = zMin(); if (reduit() || (o && o.immediat)) camPoser(); } return Object.assign({}, camEcran); },   /* 22/10 · z 0 ou 'auto' : toute la largeur du tableau (zMin) */
      // 19/10 · la vie au repos sur commande (pages de démonstration) : scene.geste('minotaure', 'etire')
      geste(id, nom) { const e = elements.get(id); return !!(e && e.cerveau && e.cerveau.geste && e.cerveau.geste(nom)); },
      // 19/10 · le temps de la scène en secondes (les pages de vérification attendent en temps de scène, pas en temps réel)
      get temps() { return temps; },
      // 22/10 · pour les pages de vérification : faire avancer la scène de « secondes » d'un coup, par pas de 1/60 s, puis dessiner une image
      // (le rendu headless est trop lent pour suivre le temps réel ; les minuteries (setTimeout) ne sont pas avancées)
      avancer(secondes, pas = 1 / 60) { if (detruit) return; for (let t = 0; t < secondes - 1e-9; t += pas) boucle(Math.min(pas, secondes - t)); app.render(); },
      deplacer: (id, x, y) => { const e = elements.get(id); return !!(e && e.cerveau && e.cerveau.allerVers && e.cerveau.allerVers(x, y)); },
      navigation: () => {
        if (!grille) construireGrille();
        const Sg = S.lieux.sieges, f = Sg && elements.get(Sg.centre);
        const sieges = f ? Sg.angles.map(a => { const r = a * Math.PI / 180, [x, y] = caseLibreProche(f.x + Math.cos(r) * Sg.rx, f.y - 12 + Math.sin(r) * Sg.ry); return { angle: a, x, y, gene: geneEn(x, y, f) }; }) : [];
        return { c: NAV.c, w: NAV.w, h: NAV.h, g: Array.from(grille), sieges, siege: f ? siegeLibre([]) : null };
      },
      get phaseLune() { return phaseLune; },
      // un poisson saute tout de suite (pages de vérification, démonstration)
      sautDePoisson() { attenteSaut = 0; },
      // l'état de la vie ambiante (pour les pages de vérification)
      get vie() { const mo = elements.get('mouettes'); return { feuilles: feuilles.map(f => [Math.round(f.s.x), Math.round(f.s.y), !!f.pose]), sauts: sauts.length, attenteSaut: +attenteSaut.toFixed(1), eau: !!eauCPU, rafale: [Math.round(rafale.x), +rafale.force.toFixed(2), rafale.active],
        filante: !!etoile, lucioles: lucioles.filter(l => l.actif).map(l => [Math.round(l.x), Math.round(l.y)]), mouettes: mo && mo.cerveau && mo.cerveau.etats ? mo.cerveau.etats : [], legere, jauge: (() => { const f = elements.get('feu'); return f ? f.def.jauge || 'stable' : null; })() }; }
    };
  }

  // Passer du repère du téléphone (390 × 844, celui de V.CAMP) au repère de la scène (720 × 1280, cadrage « cover »).
  const K = 844 / H, OX = (W * K - 390) / 2;
  const depuisTelephone = (x, y) => [Math.round((x + OX) / K * 10) / 10, Math.round(y / K * 10) / 10];
  // Un objet de V.CAMP.objets (s = rectangle dans l'atlas, c = [centre x, bas y], k = ajustement) → une entrée de la scène.
  const elementDepuisCamp = (id, o, echelle = .36, place) => {
    const [x, y] = depuisTelephone(...(place || o.c));
    return { id, type: 'fixe', atlas: o.s, x, y, largeur: Math.round(o.s[2] * echelle * (o.k || 1) / K * 10) / 10 };
  };
  // DESSIN : les dessins provisoires des bâtiments (pour l'atelier et les pages de vérification)
  global.AthenaScene = { monter, depuisTelephone, elementDepuisCamp, dessins: DESSIN };
})(typeof window !== 'undefined' ? window : globalThis);
