/*
 * athena-marionnette.js — personnages en morceaux (marionnette 2D), pour la scène du camp.
 *
 * Un personnage = un dossier d'images découpées (torse, bras, jambes, queue, pagne, têtes…)
 * et un fichier JSON qui dit où se trouve chaque morceau, autour de quel point il tourne,
 * et les réglages de chaque animation. Le code ne connaît aucun personnage en particulier :
 * un nouveau compagnon = un nouveau dossier + un nouveau JSON. Un champ maillage peut animer une illustration continue avec les mêmes articulations.
 *
 *   const m = await AthenaMarionnette.charger(PIXI, 'assets/scene/minotaure/minotaure.json');
 *   const p = m.creer();            // → PIXI.Container prêt à poser dans la scène
 *   p.etat('marche');               // repos, marche, content, touche, assis, dort ; (19/10) saute, bras, hoche, applaudit, danse, etire, gratte, tapote, baille, aurevoir, signe
 *   p.reglages.clignement           // (19/10) la tête « dort » 120 ms toutes les 3 à 6 s quand il nous regarde ; p.reglages.secondaire : queue, pagne et bras suivent avec un retard
 *   p.teteVisible                   // (19/10) la tête affichée à cet instant (le clignement se voit ici)
 *   p.vue('face' | 'dos');  p.miroir(true|false);  p.tete('calme'|'content'|'dort');
 *   p.porter('sac', true);          // un objet porté (déclaré dans « objets » du JSON)
 *   p.maj(dt);                      // à chaque image (secondes)
 *   p.reglages                      // les réglages des animations (modifiables en direct, page Atelier)
 *
 * Vues : « face » = de trois quarts vers le bas, « dos » = de trois quarts vers le haut, « assis ».
 * Le pied (point posé au sol) est l'origine du conteneur : x, y du conteneur = position au sol.
 */
(function (global) {
  'use strict';

  const rad = d => d * Math.PI / 180;

  async function charger(PIXI, url, options = {}) {
    const resoudre = options.resoudre || (u => u);
    const reponse = await fetch(resoudre(url));
    if (!reponse.ok) throw new Error('Marionnette introuvable : ' + url);
    const def = await reponse.json();
    const dossier = url.slice(0, url.lastIndexOf('/') + 1);
    const textures = {};
    const aCharger = [];
    const ajouter = (cle, chemin) => aCharger.push(PIXI.Assets.load(resoudre(dossier + chemin)).then(t => { textures[cle] = t; }));
    for (const [nomVue, v] of Object.entries(def.vues)) {
      if (v.maillage) ajouter(nomVue + '/peau', v.maillage.image);
      if (v.morceaux && !v.maillage) for (const k of Object.keys(v.morceaux)) ajouter(nomVue + '/' + k, v.dossier + '/' + k + '.png');
      // la même vue retournée peut avoir ses propres images (le tatouage reste sur la bonne épaule)
      if (v.variante) for (const k of v.variante.morceaux) ajouter(nomVue + '/' + k + v.variante.suffixe, v.dossier + '/' + k + v.variante.suffixe + '.png');
      if (v.corps) ajouter(nomVue + '/corps', v.dossier + '/corps.png');
      if (v.tete) for (const t of Object.keys(v.tete.images)) ajouter(nomVue + '/tete_' + t, v.dossier + '/tete_' + t + '.png');
    }
    for (const [k, chemin] of Object.entries(def.objets || {})) ajouter('objet/' + k, chemin);
    await Promise.all(aCharger);
    return { def, textures, creer: (opts) => creer(PIXI, def, textures, opts || {}) };
  }

  // Skinning 2D : les illustrations restent continues, les animations pilotent des articulations virtuelles.
  // Les poids sont calculés une seule fois ; chaque compagnon possède son propre tampon de sommets.
  function creerPeau(PIXI, texture, v, morceaux) {
    const mesh = new PIXI.MeshPlane({ texture, verticesX: v.maillage.colonnes || 25, verticesY: v.maillage.lignes || 33 });
    mesh.label = 'peau-articulee'; mesh.position.set(-v.pied[0], -v.pied[1]);
    const buffer = mesh.geometry.getAttribute('aPosition').buffer, original = new Float32Array(buffer.data);
    const noms = ['torse', ...Object.keys(v.maillage.regions || {}).filter(k => k !== 'torse' && morceaux[k])];
    const N = noms.length, poids = new Float32Array(original.length / 2 * N), matrices = new Float32Array(N * 6);
    const influence = (x,y,poly) => {
      let dedans = false, proche = Infinity;
      for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
        const [ax,ay]=poly[j],[bx,by]=poly[i];
        if((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax) dedans=!dedans;
        const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy || 1)));
        proche=Math.min(proche,Math.hypot(x-ax-dx*t,y-ay-dy*t));
      }
      const f=v.maillage.fondu || 8; let a=Math.max(0,Math.min(1,.5+(dedans?proche:-proche)/(2*f))); return a*a*(3-2*a);
    };
    for(let i=0;i<original.length;i+=2) {
      const offset=i/2*N; let somme=0;
      for(let k=1;k<N;k++) { const w=influence(original[i],original[i+1],v.maillage.regions[noms[k]]); poids[offset+k]=w; somme+=w; }
      poids[offset]=Math.max(0,1-somme); const total=Math.max(1,somme);
      for(let k=1;k<N;k++) poids[offset+k]/=total;
    }
    const mettreAJour = () => {
      for(let k=0;k<N;k++) {
        const m=morceaux[noms[k]], c=Math.cos(m.rotation), sn=Math.sin(m.rotation), o=k*6;
        matrices[o]=c*m.scale.x;matrices[o+1]=sn*m.scale.x;matrices[o+2]=-sn*m.scale.y;matrices[o+3]=c*m.scale.y;
        matrices[o+4]=m.position.x-m.base.x*matrices[o]-m.base.y*matrices[o+2];
        matrices[o+5]=m.position.y-m.base.x*matrices[o+1]-m.base.y*matrices[o+3];
      }
      for(let i=0;i<original.length;i+=2) {
        const x=original[i]-v.pied[0],y=original[i+1]-v.pied[1],offset=i/2*N;let px=0,py=0;
        for(let k=0;k<N;k++) { const w=poids[offset+k];if(w===0)continue;const o=k*6;px+=w*(x*matrices[o]+y*matrices[o+2]+matrices[o+4]);py+=w*(x*matrices[o+1]+y*matrices[o+3]+matrices[o+5]); }
        buffer.data[i]=px+v.pied[0];buffer.data[i+1]=py+v.pied[1];
      }
      buffer.update();
    };
    return { mesh, mettreAJour };
  }

  function creer(PIXI, def, textures, opts) {
    const racine = new PIXI.Container();
    racine.label = def.nom;
    const corps = new PIXI.Container();          // tourné / retourné selon la direction
    racine.addChild(corps);
    const reglages = JSON.parse(JSON.stringify(def.animations));
    // 19/10 · réglages généraux (hors états) : le clignement des yeux et le mouvement secondaire (queue, pagne, bras qui suivent avec un retard)
    if (!reglages.clignement) reglages.clignement = { duree: .12, min: 3, max: 6 };
    if (!reglages.secondaire) reglages.secondaire = { ressort: 9, amortissement: .75, elan: .9, queue: 1, pagne: 1, bras: .6 };
    const echelleBase = def.hauteur / def.hauteurCadre;
    let echelleProfondeur = 1;

    // Construit une vue : un conteneur par vue, chaque morceau = un sprite dont l'ancre est son pivot.
    // Ombre douce (dégradé radial), partagée par toutes les marionnettes
    if (!creer.texOmbre) {
      const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d');
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      r.addColorStop(0, 'rgba(0,0,0,.72)'); r.addColorStop(.55, 'rgba(0,0,0,.38)'); r.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = r; g.fillRect(0, 0, 64, 64); creer.texOmbre = PIXI.Texture.from(cv);
    }
    let forceOmbre = 1;
    const vues = {};
    for (const [nomVue, v] of Object.entries(def.vues)) {
      const c = new PIXI.Container();
      c.visible = false;
      const morceaux = {};
      // les ombres au sol : une sous le corps, une sous chaque sabot (elles suivent les pas)
      const ombres = [];
      if (v.ombres) {
        const ajouterOmbre = (o, sabot) => {
          const s = new PIXI.Sprite(creer.texOmbre); s.anchor.set(.5);
          s.position.set(o.x - v.pied[0], o.y - v.pied[1]); s.scale.set(o.rx * 2 / 64, o.ry * 2 / 64); s.rotation = rad(o.rot || 0);
          s.alphaBase = o.a == null ? 1 : o.a; s.sabot = sabot; s.repos = { x: s.position.x, y: s.position.y };
          c.addChild(s); ombres.push(s);
        };
        if (v.ombres.corps) ajouterOmbre(v.ombres.corps, null);
        for (const [jambe, o] of Object.entries(v.ombres.sabots || {})) ajouterOmbre(o, jambe);
      }
      const pose = (tex, x, y, pivot) => {
        const s = new PIXI.Sprite(tex);
        const px = pivot ? pivot[0] : x, py = pivot ? pivot[1] : y;
        s.anchor.set((px - x) / tex.width, (py - y) / tex.height);
        s.position.set(px - v.pied[0], py - v.pied[1]);
        s.base = { x: s.position.x, y: s.position.y };
        return s;
      };
      let peau = null;
      if (v.maillage) {
        for (const [k,m] of Object.entries(v.morceaux)) {
          const b = new PIXI.Container(); b.label = k;
          b.position.set(m.pivot[0]-v.pied[0],m.pivot[1]-v.pied[1]); b.base={x:b.position.x,y:b.position.y}; morceaux[k]=b;
        }
        peau = creerPeau(PIXI,textures[nomVue+'/peau'],v,morceaux); c.addChild(peau.mesh);
        if (v.tete) {
          const t = morceaux.tete; t.images = {};
          for (const [nom,p] of Object.entries(v.tete.images)) {
            const s = nom === 'calme' ? new PIXI.Container() : new PIXI.Sprite(textures[nomVue+'/tete_'+nom]);
            s.position.set(p.x-v.tete.pivot[0],p.y-v.tete.pivot[1]); s.visible=nom==='calme';t.addChild(s);t.images[nom]=s;
          }
          if (v.tete.masque) {
            const pts=v.tete.masque.flatMap(([x,y])=>[x-v.tete.pivot[0],y-v.tete.pivot[1]]);
            const masque=new PIXI.Graphics().poly(pts,true).fill(0xffffff);t.addChild(masque);t.mask=masque;
          }
          c.addChild(t);
        }
        if (v.maillage.assis) morceaux.corps=morceaux.torse;
      } else if (v.morceaux) {
        for (const k of v.ordre) {
          if (k === 'tete') {
            const t = new PIXI.Container();
            t.position.set(v.tete.pivot[0] - v.pied[0], v.tete.pivot[1] - v.pied[1]);
            t.base = { x: t.position.x, y: t.position.y };
            // « echelle » : la tête de cette vue ramenée à la taille des autres vues (dessins venus de planches différentes)
            t.echelle = v.tete.echelle || 1; t.scale.set(t.echelle);
            t.images = {};
            for (const [nom, p] of Object.entries(v.tete.images)) {
              const s = new PIXI.Sprite(textures[nomVue + '/tete_' + nom]);
              s.position.set(p.x - v.tete.pivot[0], p.y - v.tete.pivot[1]);
              s.visible = nom === 'calme';
              t.addChild(s); t.images[nom] = s;
            }
            c.addChild(t); morceaux.tete = t;
            continue;
          }
          const m = v.morceaux[k];
          const s = pose(textures[nomVue + '/' + k], m.x, m.y, m.pivot);
          s.label = k; s.texBase = s.texture; if (v.variante) s.texVariante = textures[nomVue + '/' + k + v.variante.suffixe] || null;
          c.addChild(s); morceaux[k] = s;
        }
      }
      if (v.corps) {
        const s = pose(textures[nomVue + '/corps'], v.corps.x, v.corps.y, [v.corps.x + v.corps.w / 2, v.corps.y + v.corps.h]);
        c.addChild(s); morceaux.corps = s;
        const t = new PIXI.Container();
        t.position.set(v.tete.pivot[0] - v.pied[0], v.tete.pivot[1] - v.pied[1]);
        t.base = { x: t.position.x, y: t.position.y };
        t.images = {};
        for (const [nom, p] of Object.entries(v.tete.images)) {
          const s2 = new PIXI.Sprite(textures[nomVue + '/tete_' + nom]);
          s2.position.set(p.x - v.tete.pivot[0], p.y - v.tete.pivot[1]);
          s2.visible = nom === 'calme';
          t.addChild(s2); t.images[nom] = s2;
        }
        c.addChild(t); morceaux.tete = t;
      }
      // objets portés (le sac) : derrière ou devant le torse selon la vue
      if (v.sac && textures['objet/sac']) {
        const s = new PIXI.Sprite(textures['objet/sac']);
        s.anchor.set(.5, .5);
        s.scale.set(v.sac.echelle);
        s.position.set(v.sac.x - v.pied[0], v.sac.y - v.pied[1]);
        s.base = { x: s.position.x, y: s.position.y };
        s.visible = false;
        const iTorse = c.children.indexOf(morceaux.torse);
        c.addChildAt(s, v.sac.derriere ? Math.max(0, iTorse) : iTorse + 1);
        morceaux.sac = s;
      }
      for (const [nom,a] of Object.entries(v.accessoires || {})) {
        const holder=new PIXI.Container({label:'accessoire-'+nom}), s=new PIXI.Sprite(textures['objet/'+nom]);s.anchor.set(...a.ancre);holder.addChild(s);
        holder.position.set(a.attache[0]-v.pied[0],a.attache[1]-v.pied[1]);holder.base={x:holder.position.x,y:holder.position.y};holder.visible=false;
        if (a.main && v.maillage) {
          const [x,y,w,h]=a.main,t=new PIXI.Texture({source:textures[nomVue+'/peau'].source,frame:new PIXI.Rectangle(x,y,w,h)}),main=new PIXI.Sprite(t);
          main.position.set(x-a.attache[0],y-a.attache[1]);holder.addChild(main);
        }
        morceaux[nom]=holder;if(a.derriere)c.addChildAt(holder,0);else c.addChild(holder);
      }
      corps.addChild(c);
      vues[nomVue] = { c, morceaux, def: v, ombres, peau, accessoires: Object.entries(v.accessoires || {}) };
    }

    let vueActive = 'face', miroir = false, etatActif = 'repos', teteActive = 'calme';
    // 19/10 · le bâillement ferme les yeux un instant ; assis, il bâille assis (vueGardee) ; le clignement ; les ressorts du mouvement secondaire
    let bailleFerme = false, vueGardee = null; const vitPrec = { x: 0, y: 0 }, ressorts = {}, clign = { t: 2 + Math.random() * 3, ferme: false };
    const dernierU = {};   // la phase de chaque jambe à l'image d'avant (pour savoir quand un sabot se pose)
    let temps = Math.random() * 10, tEtat = 0, porte = { sac: false };
    let vitesse = { x: 0, y: 0 }, phaseMarche = 0, allure = { dx: .8, dy: .27 }, vitesseConnue = false, melange = null;
    // s'asseoir, se lever : il plie d'abord (l'ancien dessin se tasse vers le sol), puis le nouveau dessin prend sa place
    // et se pose (assis : il finit de se tasser ; debout : il se déplie). Pas de fondu, pas de double image.
    let geste = null;   // { vue, etat, t, d1, d2, assied }
    const vueEtat = () => (vueGardee || (etatActif === 'assis' || etatActif === 'dort' ? 'assis' : vueActive));
    const nomVue = () => (geste && geste.t < geste.d1 ? geste.vue : vueEtat());
    // un changement de vue (face, dos, assis) se fait en fondu court : l'ancienne vue s'efface par-dessus la nouvelle
    let fondu = null;
    // se retourner (gauche ↔ droite) : l'image d'avant le demi-tour reste un instant par-dessus et s'efface (fondu court),
    // comme pour le passage d'une vue à l'autre. Il faut le moteur de rendu de la scène (p.renderer) ; sans lui, retournement net.
    let fantome = null, candidat = null, candidatDepuis = 0;
    const effacerFantome = () => { if (fantome) { fantome.sprite.destroy(); fantome.tex.destroy(true); fantome = null; } };
    // duree : temps de l'effacement ; vif : l'image d'avant s'efface vite au début (un changement de direction ressemble
    // alors à un vrai pivot, sans double image transparente), sinon en douceur (s'asseoir, se lever)
    const creerFantome = (duree = .2, vif = false) => {
      effacerFantome();
      if (!(duree > 0) || !api.renderer || api.fige || !corps.visible || racine.alpha < .05) return;
      try {
        const b = corps.getLocalBounds(), w = b.maxX - b.minX, h = b.maxY - b.minY;
        if (!(w > 1 && h > 1)) return;
        const tex = api.renderer.generateTexture({ target: corps, resolution: Math.min(2, api.renderer.resolution || 1) });
        const sprite = new PIXI.Sprite(tex);
        sprite.position.set(corps.position.x + b.minX * corps.scale.x, corps.position.y + b.minY * corps.scale.y);
        sprite.scale.set(corps.scale.x, corps.scale.y);
        racine.addChild(sprite);
        fantome = { sprite, tex, t: 0, duree, vif };
      } catch (err) { fantome = null; }
    };
    const montrer = () => {
      const nv = nomVue();
      for (const n in vues) {
        const v = vues[n], active = n === nv, sortante = fondu && fondu.vue === n && !active;
        v.c.visible = active || !!sortante; v.c.alpha = sortante ? Math.max(0, fondu.t / fondu.duree) : 1;
        if (sortante) corps.setChildIndex(v.c, corps.children.length - 1);
      }
      corps.scale.set(echelleBase * echelleProfondeur * (miroir ? -1 : 1), echelleBase * echelleProfondeur);
      const va = vues[nv];
      if (va && va.def.variante) for (const s of va.liste || (va.liste = Object.values(va.morceaux))) if (s.texBase) s.texture = miroir && s.texVariante ? s.texVariante : s.texBase;
    };
    const choisirTete = nom => {
      for (const v of Object.values(vues)) {
        const t = v.morceaux.tete; if (!t || !t.images) continue;
        const dispo = t.images[nom] ? nom : 'calme';
        for (const [n, s] of Object.entries(t.images)) s.visible = n === dispo;
      }
    };
    // remet en pose de repos la vue affichée (et celle qui s'efface) : les autres seront remises quand elles serviront
    const reinitVue = v => {
      if (!v) return;
      for (const s of v.liste || (v.liste = Object.values(v.morceaux))) {
        if (!s.base) continue;
        const e = s.echelle || 1; s.position.set(s.base.x, s.base.y); s.rotation = 0; s.sol = null; s.scale.set((s.scale.x < 0 ? -1 : 1) * e, e);
        if (s === v.morceaux.sac) s.scale.set(v.def.sac.echelle);
      }
    };
    const reinit = () => {
      reinitVue(vues[nomVue()]); if (fondu) reinitVue(vues[fondu.vue]);
      corps.position.set(0, 0); corps.rotation = 0;
    };

    // Les animations : chaque fonction pose les morceaux de la vue active à l'instant t.
    const A = {
      repos(m, t, r) {
        const w = 2 * Math.PI * r.frequence, b = Math.sin(t * w);
        if (m.torse) { m.torse.scale.y = 1 + r.respiration * b; }
        if (m.tete) { m.tete.position.y = m.tete.base.y - 2.5 * (b + 1) * r.respiration * 40; m.tete.rotation = rad(r.tete * Math.sin(t * w * .5 + 1)); }
        if (m.brasG) m.brasG.rotation = rad(r.bras * Math.sin(t * w + .6));
        if (m.brasD) m.brasD.rotation = rad(-r.bras * Math.sin(t * w + .2));
        if (m.brasG) m.brasG.position.y = m.brasG.base.y - 2 * (b + 1) * r.respiration * 30;
        if (m.brasD) m.brasD.position.y = m.brasD.base.y - 2 * (b + 1) * r.respiration * 30;
        if (m.queue) m.queue.rotation = rad(r.queue * Math.sin(t * 1.7) + 3 * Math.sin(t * 4.1));
        if (m.pagne) m.pagne.rotation = rad(r.pagne * Math.sin(t * 1.3 + .4));
        if (m.sac) m.sac.position.y = m.sac.base.y - 2 * (b + 1) * r.respiration * 30;
      },
      // La marche : le sabot posé reste collé au sol pendant que le corps avance (il recule sous lui à la vitesse
      // du déplacement), l'autre se lève et passe devant. Le rythme des pas découle de la vitesse et de la foulée.
      marche(m, t, r, v) {
        const sabots = v.def.ombres && v.def.ombres.sabots;
        const { dx, dy } = allure;
        const ph = phaseMarche, beta = r.appui, S = r.foulee;
        const jambe = (nom, u) => {
          const j = m[nom]; if (!j || !sabots || !sabots[nom]) return 0;
          let a, lev = 0;
          if (u < beta) a = .5 - u / beta;
          else { const w = (u - beta) / (1 - beta); a = -.5 + w * w * (3 - 2 * w); lev = r.levee * Math.sin(Math.PI * w); }
          const sab = sabots[nom], piv = v.def.morceaux[nom].pivot, vx0 = sab.x - piv[0], vy0 = sab.y - piv[1];
          const tx = vx0 + dx * a * S, ty = vy0 + dy * a * S - lev;
          // la jambe vise le point où le sabot doit être : elle pivote à la hanche (pas vers la gauche ou la droite) et
          // s'allonge ou se raccourcit un peu (pas vers nous ou vers le fond, sabot levé) ; le reste, s'il en reste, en la déplaçant
          // (17/10) des bornes plus serrées : la jambe s'allonge et pivote moins, la marche est plus souple
          const L2 = tx * tx + ty * ty, ech = Math.abs(vy0) > 1 ? Math.max(.88, Math.min(1.12, Math.sqrt(Math.max(0, L2 - vx0 * vx0)) / Math.abs(vy0))) : 1;
          const ey = vy0 * ech, th = Math.max(-.36, Math.min(.36, Math.atan2(ty, tx) - Math.atan2(ey, vx0)));
          const c = Math.cos(th), sn = Math.sin(th), rx = vx0 * c - ey * sn, ry = vx0 * sn + ey * c;
          let ox = tx - rx, oy = ty - ry; const n = Math.hypot(ox, oy); if (n > 4) { ox *= 4 / n; oy *= 4 / n; }
          j.rotation = th; j.scale.y = ech; j.position.x = j.base.x + ox; j.position.y = j.base.y + oy;
          j.sol = { x: sab.x + dx * a * S - v.def.pied[0], y: sab.y + dy * a * S - v.def.pied[1] }; j.lev = lev;
          // le sabot se pose (début de l'appui) : la scène peut y faire voler un peu de poussière
          const avant = dernierU[nom]; dernierU[nom] = u;
          if (avant != null && u < avant && avant - u > .5 && api.surPas && !api.fige) api.surPas(j.sol.x * corps.scale.x, j.sol.y * corps.scale.y, nom);
          return a;
        };
        const aG = jambe('jambeG', ph % 1), aD = jambe('jambeD', (ph + .5) % 1);
        const haut = -r.rebond * (.5 - .5 * Math.cos(ph * 4 * Math.PI));
        for (const k of ['torse', 'pagne', 'brasG', 'brasD', 'tete', 'queue', 'sac']) if (m[k]) m[k].position.y = m[k].base.y + haut;
        const sens = dx >= 0 ? 1 : -1;
        if (m.brasG) m.brasG.rotation = rad(-r.bras * aD * 2 * sens);
        if (m.brasD) m.brasD.rotation = rad(-r.bras * aG * 2 * sens);
        if (m.torse) m.torse.rotation = rad(r.roulis * Math.sin(ph * 2 * Math.PI));
        if (m.tete) m.tete.rotation = rad(r.tete * Math.sin(ph * 4 * Math.PI + .6));
        if (m.queue) m.queue.rotation = rad(r.queue * Math.sin(ph * 2 * Math.PI + 1.2));
        if (m.pagne) m.pagne.rotation = rad(r.pagne * (aG - aD));
      },
      content(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), ph = d * Math.PI * r.sauts, saut = Math.abs(Math.sin(ph)) * (1 - d * .3);
        corps.position.y = -r.hauteur * saut;
        // au sol, il se tasse (l'élan, la réception) ; en l'air, il s'étire un peu quand il monte ou retombe vite
        const sol = Math.max(0, 1 - saut * 4), st = 1 - .08 * sol + .035 * Math.abs(Math.cos(ph)) * (1 - sol);
        corps.scale.y *= st; corps.scale.x *= 1 + (1 - st) * .45;
        if (m.brasG) m.brasG.rotation = rad(r.bras * saut);
        if (m.brasD) m.brasD.rotation = rad(-r.bras * saut);
        if (m.jambeG) m.jambeG.rotation = rad(-6 * saut);
        if (m.jambeD) m.jambeD.rotation = rad(6 * saut);
      },
      touche(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree);
        const ecr = d < .25 ? Math.sin(d / .25 * Math.PI) : 0;
        corps.scale.y *= 1 - r.ecrasement * ecr;
        corps.scale.x *= 1 + r.ecrasement * .6 * ecr;
        if (m.brasD && d > .15) m.brasD.rotation = rad(-r.salut * Math.sin(Math.min(1, (d - .15) / .2) * Math.PI / 2) * (1 - Math.max(0, d - .75) / .25) + 10 * Math.sin(t * 14) * (d < .75 ? 1 : 0));
      },
      assis(m, t, r) {
        const w = 2 * Math.PI * r.frequence, b = Math.sin(t * w);
        if (m.corps) m.corps.scale.y = 1 + r.respiration * b;
        if (m.tete) { m.tete.position.y = m.tete.base.y - (b + 1) * r.respiration * 60; m.tete.rotation = rad(r.tete * Math.sin(t * w * .5)); }
      },
      dort(m, t, r) { A.assis(m, t, r); if (m.tete) m.tete.rotation = rad(6 + r.tete * Math.sin(t * 2 * Math.PI * r.frequence)); },
      // 19/10 · cinq réactions à une quête validée (la scène en tire une au hasard, jamais deux fois la même d'affilée), et la danse du Sommet
      saute(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), e = r.elan || .1;
        // l'élan (il se tasse), un seul grand saut, la réception (il se tasse à nouveau)
        const air = d < e ? 0 : d < .78 ? Math.sin((d - e) / (.78 - e) * Math.PI) : 0, tasse = d < e ? Math.sin(d / e * Math.PI) : d > .78 ? Math.sin(Math.min(1, (d - .78) / .22) * Math.PI) : 0;
        corps.position.y = -r.hauteur * air;
        const st = 1 - .1 * tasse + .05 * air * (d < .45 ? 1 : .4); corps.scale.y *= st; corps.scale.x *= 1 + (1 - st) * .5;
        if (m.brasG) m.brasG.rotation = rad(r.bras * air); if (m.brasD) m.brasD.rotation = rad(-r.bras * air);
        if (m.jambeG) m.jambeG.rotation = rad(-8 * air); if (m.jambeD) m.jambeD.rotation = rad(8 * air);
      },
      bras(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), monte = Math.sin(Math.min(1, d / .22) * Math.PI / 2) * (1 - Math.max(0, d - .78) / .22);
        if (m.brasG) m.brasG.rotation = rad(r.bras * monte + 4 * Math.sin(t * 9) * monte); if (m.brasD) m.brasD.rotation = rad(-r.bras * monte - 4 * Math.sin(t * 9 + 1) * monte);
        corps.position.y = -r.rebond * Math.abs(Math.sin(d * Math.PI * 2)) * monte;
        if (m.tete) m.tete.rotation = rad(r.tete * Math.sin(d * Math.PI * 3) * monte);
      },
      hoche(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d) * Math.PI), h = Math.sin(d * Math.PI * 2 * r.fois);
        if (m.tete) { m.tete.rotation = rad(r.tete * h * env); m.tete.position.y = m.tete.base.y + 3 * Math.max(0, h) * env; }
        if (m.brasG) m.brasG.rotation = rad(r.bras * env); if (m.brasD) m.brasD.rotation = rad(-r.bras * env);
        corps.scale.y *= 1 + .015 * h * env;
      },
      applaudit(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d) * Math.PI), c = .5 + .5 * Math.sin(tEtat * 2 * Math.PI * r.frequence);
        // les deux bras se rejoignent devant lui, en rythme ; il rebondit à peine
        if (m.brasG) m.brasG.rotation = rad((r.bras * .6 + r.bras * c) * env); if (m.brasD) m.brasD.rotation = rad(-(r.bras * .6 + r.bras * c) * env);
        corps.position.y = -r.rebond * c * env;
        if (m.tete) m.tete.rotation = rad(2 * Math.sin(tEtat * 2 * Math.PI * r.frequence * .5) * env);
      },
      danse(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.min(1, d / .15) * (1 - Math.max(0, d - .85) / .15), w = tEtat * 2 * Math.PI * r.frequence, s = Math.sin(w);
        corps.rotation = rad(r.roulis * s * env); corps.position.y = -r.hauteur * Math.abs(Math.sin(w)) * env;
        const st = 1 - .04 * Math.abs(Math.cos(w)) * env; corps.scale.y *= st; corps.scale.x *= 1 + (1 - st) * .5;
        if (m.brasG) m.brasG.rotation = rad(r.bras * (.55 + .45 * s) * env); if (m.brasD) m.brasD.rotation = rad(-r.bras * (.55 - .45 * s) * env);
        if (m.tete) m.tete.rotation = rad(-r.tete * s * env); if (m.queue) m.queue.rotation = rad(r.queue * Math.sin(w + .8) * env);
        if (m.pagne) m.pagne.rotation = rad(3 * s * env);
      },
      // 19/10 · la vie au repos : s'étirer, se gratter la tête, tapoter du pied ; bâiller (avant de dormir, assis ou debout) ;
      // l'au revoir de la main (avant d'embarquer) ; le signe de la main (touché alors qu'il nous regarde). Une enveloppe monte, tient, redescend.
      etire(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d / .35) * Math.PI / 2) * (1 - Math.max(0, d - .7) / .3), tremble = 1 + .02 * Math.sin(t * 23) * env;
        const haut = r.etirement * 150 * env;   // le torse s'allonge depuis les hanches : la tête et les épaules montent d'autant
        if (m.brasG) { m.brasG.rotation = rad(r.bras * env + 3 * Math.sin(t * 7) * env); m.brasG.position.y = m.brasG.base.y - haut; }
        if (m.brasD) { m.brasD.rotation = rad(-r.bras * env - 3 * Math.sin(t * 7 + 1) * env); m.brasD.position.y = m.brasD.base.y - haut; }
        if (m.torse) m.torse.scale.y *= 1 + r.etirement * env * tremble;
        if (m.tete) { m.tete.rotation = rad(r.tete * env); m.tete.position.y = m.tete.base.y - haut; }
        corps.scale.x *= 1 - r.etirement * .25 * env;
      },
      gratte(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d / .25) * Math.PI / 2) * (1 - Math.max(0, d - .78) / .22);
        if (m.brasD) m.brasD.rotation = rad(-(r.bras * env + 6 * Math.sin(t * 2 * Math.PI * r.frequence) * env));
        if (m.tete) m.tete.rotation = rad(r.tete * env);
      },
      tapote(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d / .2) * Math.PI / 2) * (1 - Math.max(0, d - .85) / .15), b = Math.abs(Math.sin(tEtat * Math.PI * r.frequence));
        if (m.jambeD) { m.jambeD.rotation = rad(-r.pied * b * env); m.jambeD.position.y = m.jambeD.base.y - r.levee * b * env; }
        if (m.tete) m.tete.rotation = rad(r.tete * Math.sin(tEtat * 2 * Math.PI * r.frequence) * env);
        corps.position.y = -1.5 * b * env;
      },
      baille(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d / .4) * Math.PI / 2) * (1 - Math.max(0, d - .72) / .28);
        if (m.tete) { m.tete.rotation = rad(r.tete * env); m.tete.position.y = m.tete.base.y - r.etirement * 120 * env; }
        if (m.torse) m.torse.scale.y *= 1 + r.etirement * env;
        if (m.corps) m.corps.scale.y *= 1 + r.etirement * env;   // assis : un seul dessin du corps
        if (m.brasG) m.brasG.rotation = rad(r.bras * env); if (m.brasD) m.brasD.rotation = rad(-r.bras * .4 * env);
        // au plus fort du bâillement, la tête « dort » (yeux fermés) ; la tête d'avant revient à la fin
        const ferme = d > .3 && d < .8; if (ferme !== bailleFerme) { bailleFerme = ferme; choisirTete(ferme ? 'dort' : teteActive); }
      },
      aurevoir(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d / .18) * Math.PI / 2) * (1 - Math.max(0, d - .82) / .18);
        if (m.brasD) m.brasD.rotation = rad(-(r.bras * env + 14 * Math.sin(tEtat * 2 * Math.PI * r.frequence) * env));
        if (m.tete) m.tete.rotation = rad(3 * Math.sin(tEtat * Math.PI * r.frequence) * env);
        corps.position.y = -2 * Math.abs(Math.sin(tEtat * Math.PI * r.frequence)) * env;
      },
      signe(m, t, r) {
        A.repos(m, t, reglages.repos);
        const d = Math.min(1, tEtat / r.duree), env = Math.sin(Math.min(1, d / .2) * Math.PI / 2) * (1 - Math.max(0, d - .78) / .22);
        if (m.brasD) m.brasD.rotation = rad(-(r.bras * env + 12 * Math.sin(tEtat * 2 * Math.PI * r.frequence) * env));
        if (m.tete) m.tete.rotation = rad(r.tete * env);
      }
    };

    const api = {
      racine, reglages, def,
      etat(nom) {
        if (!A[nom]) return etatActif;
        if (nom !== etatActif) {
          const avant = nomVue(), ancien = geste && geste.t < geste.d1 ? geste.etat : etatActif;
          // 19/10 · bâiller assis reste assis (pas de lever) ; les yeux fermés d'un bâillement interrompu se rouvrent
          const garde = nom === 'baille' && (etatActif === 'assis' || etatActif === 'dort' || vueGardee === 'assis') ? 'assis' : null;
          const apres = nom === 'assis' || nom === 'dort' || garde ? 'assis' : vueActive;
          if (bailleFerme) { bailleFerme = false; choisirTete(teteActive); }
          vueGardee = garde; geste = null; etatActif = nom; tEtat = 0;
          // s'asseoir ou se lever change de dessin : le geste en deux temps (voir plus haut) ; mouvement réduit : net
          if (apres !== avant) { melange = null; if (!api.fige && vues[avant]) geste = { vue: avant, etat: ancien, t: 0, d1: .15, d2: .26, assied: apres === 'assis' }; }
          else melange = { etat: ancien, t: .28, duree: .28, temps: temps };
          montrer();
        }
        return etatActif;
      },
      get etatActif() { return etatActif; },
      get phaseMarche() { return phaseMarche; },
      get vueActive() { return vueActive; },
      get miroirActif() { return miroir; },
      // changer de direction : le nouveau dessin est là tout de suite, en entier ; l'ancien, aplati en une seule image,
      // s'efface par-dessus en un éclair (fonduTour secondes). Pas de fondu morceau par morceau : il rendait le
      // personnage transparent et dédoublé pendant tout un tour sur lui-même.
      fonduTour: .06,
      vue(nom) { if (vues[nom] && nom !== vueActive) { const avant = nomVue(); if (vueActive === avant) creerFantome(api.fonduTour, true); vueActive = nom; montrer(); } },
      miroir(m) { if (m !== miroir) { creerFantome(api.fonduTour, true); miroir = m; montrer(); } },
      // la direction du regard, en degrés au sol (0 = vers la droite, 90 = vers nous) : la vue la plus proche parmi
      // « directions » du JSON. Hystérésis : on ne change que si la nouvelle direction est nettement plus proche.
      orienter(angle) {
        const dirs = def.directions; if (!dirs) return;
        const ecart = a => Math.abs(((angle - a) % 360 + 540) % 360 - 180);
        let best = dirs[0]; for (const d of dirs) if (ecart(d.angle) < ecart(best.angle)) best = d;
        const actuelle = dirs.find(d => d.vue === vueActive && !!d.miroir === miroir);
        if (actuelle && actuelle !== best && ecart(best.angle) > ecart(actuelle.angle) - 12) { candidat = null; return; }
        if (best.vue === vueActive && !!best.miroir === miroir) { candidat = null; return; }
        // on tourne d'une direction à la voisine, sans en sauter (un demi-tour passe par toutes les vues entre les deux)
        if (actuelle) {
          const tri = dirs.slice().sort((a, b) => a.angle - b.angle), n = tri.length, ia = tri.indexOf(actuelle), ib = tri.indexOf(best);
          const pasRing = ((ib - ia) % n + n) % n;
          if (pasRing > 1 && pasRing < n - 1) best = tri[(ia + (pasRing <= n / 2 ? 1 : -1) + n) % n];
        }
        // la nouvelle direction doit se confirmer un court instant (pas de clignotement entre deux vues)
        if (actuelle && !api.fige) {
          if (candidat !== best) { candidat = best; candidatDepuis = temps; return; }
          if (temps - candidatDepuis < .07) return;
        }
        candidat = null;
        if (!!best.miroir !== miroir) {
          // retourné en même temps : l'image d'avant s'efface par-dessus (pas de fondu de vue, il serait retourné lui aussi)
          creerFantome(api.fonduTour, true); miroir = !!best.miroir; vueActive = best.vue; fondu = null; montrer();
        } else api.vue(best.vue);
      },
      get angleVue() { const dirs = def.directions || []; const d = dirs.find(q => q.vue === vueActive && !!q.miroir === miroir); return d ? d.angle : 45; },
      renderer: null,
      perspective: 1.5,
      surPas: null,   // (x, y, jambe) : un sabot se pose, en x, y par rapport aux pieds du personnage (repère de la scène)
      profondeur(e) { echelleProfondeur = e; montrer(); },
      tete(nom) { teteActive = nom; choisirTete(nom); },
      ombre(force) { forceOmbre = force; },
      deplacement(vx, vy) { vitesse.x = vx; vitesse.y = vy; vitesseConnue = true; },
      porter(objet, oui) { const noms = objet === 'sac' ? [objet,...(def.accessoiresAvecSac || [])] : [objet]; for(const n of noms) { porte[n] = oui; for (const v of Object.values(vues)) if (v.morceaux[n]) v.morceaux[n].visible = oui; } },
      fige: false,
      maj(dt) {
        if (api.fige) { melange=null;fondu=null;effacerFantome(); }
        if (!api.fige) { temps += dt; tEtat += dt; }
        // 19/10 · le clignement : quand il nous regarde (une vue avec des têtes), la tête « dort » 120 ms toutes les 3 à 6 s ;
        // jamais pendant « dort », un bâillement, ni en mouvement réduit
        if (!api.fige && reglages.clignement) {
          const rc = reglages.clignement, va = vues[nomVue()], tetes = va && va.morceaux.tete && va.morceaux.tete.images;
          if (clign.ferme) { clign.t -= dt; if (clign.t <= 0) { clign.ferme = false; choisirTete(teteActive); clign.t = rc.min + Math.random() * (rc.max - rc.min); } }
          else { clign.t -= dt; if (clign.t <= 0) { if (tetes && tetes.dort && teteActive !== 'dort' && !bailleFerme) { clign.ferme = true; clign.t = rc.duree; choisirTete('dort'); } else clign.t = .8; } }
        } else if (clign.ferme) { clign.ferme = false; choisirTete(teteActive); }
        if (fondu) { fondu.t -= dt; if (fondu.t <= 0) fondu = null; }
        if (fantome) {
          fantome.t += dt; const u = Math.min(1, fantome.t / fantome.duree);
          fantome.sprite.alpha = fantome.vif ? (1 - u) * (1 - u) : 1 - u * u * (3 - 2 * u);
          if (u >= 1) effacerFantome();
        }
        if (geste) {
          const pliait = geste.t < geste.d1;
          geste.t = api.fige ? geste.d1 + geste.d2 : geste.t + dt;
          // le changement de dessin : l'image d'avant (déjà tassée) s'efface en un éclair par-dessus la nouvelle
          if (pliait && geste.t >= geste.d1) creerFantome(.07, true);
          if (geste.t >= geste.d1 + geste.d2) geste = null;
        }
        const v = vues[nomVue()], etatAnim = geste && geste.t < geste.d1 ? geste.etat : etatActif;
        reinit(); montrer();
        if (etatAnim === 'marche') {
          // vitesse du déplacement dans le repère du dessin (retourné si le personnage regarde de l'autre côté)
          // Le rythme des pas suit la vitesse au sol (la même dans toutes les directions) ; à l'écran, un pas vers nous ou
          // vers le fond est raccourci par la perspective (api.perspective : la scène donne la sienne).
          const sc = echelleBase * echelleProfondeur, fx = vitesse.x / sc * (miroir ? -1 : 1), fy = vitesse.y / sc, P = api.perspective;
          const sp = Math.hypot(fx, fy * P);
          const r = reglages.marche;
          let vit;
          if (sp > 8) { allure = { dx: fx / sp, dy: fy / sp }; vit = sp; }
          else if (vitesseConnue) vit = sp;   // dans la scène : les pas suivent la vitesse réelle (pas de glissade au démarrage)
          else {
            // aperçu (atelier) : il marche dans la direction de sa vue
            const a = api.angleVue * Math.PI / 180;
            allure = { dx: Math.cos(a) * (miroir ? -1 : 1), dy: Math.sin(a) / P }; vit = r.apercu;
          }
          if (!api.fige) phaseMarche += dt * r.appui * vit / r.foulee;
        }
        // passage d'un état à l'autre : la pose de l'ancien état se fond dans la nouvelle (pas de saut)
        let instant = null;
        if (melange && A[melange.etat]) {
          A[melange.etat](v.morceaux, temps, reglages[melange.etat], v);
          instant = { corps: [corps.position.x, corps.position.y, corps.scale.x, corps.scale.y], parts: Object.values(v.morceaux).map(s => [s, s.position.x, s.position.y, s.rotation, s.scale.x, s.scale.y]) };
          reinit(); montrer();
          melange.t -= dt; if (melange.t <= 0) melange = null;
        }
        A[etatAnim](v.morceaux, temps, reglages[etatAnim], v);
        // de face et de dos, le balancement des bras se voit peu : la vue réduit les amplitudes (marche)
        const ka = v.def.anim;
        if (ka && etatAnim === 'marche') {
          const m = v.morceaux;
          if (ka.bras != null) { if (m.brasG) m.brasG.rotation *= ka.bras; if (m.brasD) m.brasD.rotation *= ka.bras; }
          if (ka.pagne != null && m.pagne) m.pagne.rotation *= ka.pagne;
          if (ka.queue != null && m.queue) m.queue.rotation *= ka.queue;
        }
        // (17/10) les bras restent près du corps : vu de face ou de dos, un bras qui s'écarte (brasG : rotation positive,
        // brasD : négative, dans le repère du dessin) ne s'écarte qu'à « brasDehors » ; « brasColles » (degrés) les rapproche
        // un peu du corps, à l'arrêt comme en marchant
        if (ka && (etatAnim === 'marche' || etatAnim === 'repos')) {
          const m = v.morceaux, dehors = etatAnim === 'marche' && ka.brasDehors != null ? ka.brasDehors : 1, colle = rad(ka.brasColles || 0) * (etatAnim === 'marche' ? 1 : .6);
          if (m.brasG) { const r0 = m.brasG.rotation; m.brasG.rotation = (r0 > 0 ? r0 * dehors : r0) - colle; }
          if (m.brasD) { const r0 = m.brasD.rotation; m.brasD.rotation = (r0 < 0 ? r0 * dehors : r0) + colle; }
        }
        if (instant) {
          const u = 1 - Math.max(0, melange ? melange.t / melange.duree : 0), k = u * u * (3 - 2 * u), L = (a, b) => a + (b - a) * k;
          for (const [s2, x, y, r2, sx, sy] of instant.parts) { s2.position.set(L(x, s2.position.x), L(y, s2.position.y)); s2.rotation = L(r2, s2.rotation); s2.scale.set(L(sx, s2.scale.x), L(sy, s2.scale.y)); }
          const [cx, cy, csx, csy] = instant.corps; corps.position.set(L(cx, corps.position.x), L(cy, corps.position.y)); corps.scale.set(L(csx, corps.scale.x), L(csy, corps.scale.y));
        }
        // s'asseoir, se lever : le tassement, ancré aux pieds (le corps garde son volume : un peu plus large quand il se tasse)
        if (geste) {
          let sy;
          if (geste.t < geste.d1) { const u = geste.t / geste.d1; sy = 1 - (geste.assied ? .12 : .07) * u * u; }
          else {
            const u = Math.min(1, (geste.t - geste.d1) / geste.d2), r = 1 - u;
            sy = geste.assied ? 1 - .07 * r * r : 1 - .1 * r * r + .06 * Math.sin(Math.PI * u) * r;
          }
          corps.scale.y *= sy; corps.scale.x *= 1 + (1 - sy) * .45;
        }
        // 19/10 · le mouvement secondaire : la queue, le pagne et les bras suivent la pose avec un léger retard (ressort amorti) et se
        // balancent encore après un arrêt ; l'à-coup d'un départ ou d'un arrêt les entraîne. Rien en mouvement réduit.
        if (reglages.secondaire && !api.fige && dt > 0) {
          const rs = reglages.secondaire, w = rs.ressort, z = rs.amortissement, sc = echelleBase * echelleProfondeur || 1;
          const ax = (vitesse.x - vitPrec.x) / Math.max(dt, 1e-3) / sc * (miroir ? -1 : 1); vitPrec.x = vitesse.x; vitPrec.y = vitesse.y;
          const impulsion = Math.max(-1, Math.min(1, ax / 900)) * rs.elan;
          for (const k of ['queue', 'pagne', 'brasG', 'brasD']) {
            const s = v.morceaux[k]; if (!s) continue;
            const gain = k === 'queue' ? rs.queue : k === 'pagne' ? rs.pagne : rs.bras; if (!gain) continue;
            const cible = s.rotation, st = ressorts[k] || (ressorts[k] = { r: cible, v: 0 });
            st.v += (w * w * (cible - st.r) - 2 * z * w * st.v) * dt + impulsion * (k === 'queue' ? 2.2 : k === 'pagne' ? 1.4 : .8) * (k === 'brasG' ? -1 : 1);
            st.r += st.v * dt;
            s.rotation = cible + (st.r - cible) * gain;
          }
        } else for (const k in ressorts) { const s = v.morceaux[k]; if (s) { ressorts[k].r = s.rotation; ressorts[k].v = 0; } }
        if (v.peau) {
          // Un petit salut garde les articulations et les plis de l'illustration en place.
          for (const k of ['brasG','brasD']) if (v.morceaux[k]) v.morceaux[k].rotation=Math.max(-.25,Math.min(.25,v.morceaux[k].rotation));
          v.peau.mettreAJour();
          for (const [nom,a] of v.accessoires) {
            const o=v.morceaux[nom],b=v.morceaux[a.os],dx=a.attache[0]-v.def.morceaux[a.os].pivot[0],dy=a.attache[1]-v.def.morceaux[a.os].pivot[1],cr=Math.cos(b.rotation),sn=Math.sin(b.rotation);
            o.position.set(b.position.x+dx*cr-dy*sn,b.position.y+dx*sn+dy*cr);o.rotation=b.rotation;
          }
        }
        // les ombres restent au sol : celle du corps rétrécit quand il saute, celles des sabots suivent la jambe
        const saut = Math.max(0, -corps.position.y) / (echelleBase * echelleProfondeur);
        for (const o of v.ombres) {
          o.position.y = o.repos.y - corps.position.y / (echelleBase * echelleProfondeur);
          let a = o.alphaBase * forceOmbre * Math.max(.35, 1 - saut / 60);
          const j = o.sabot && v.morceaux[o.sabot];
          if (j && j.sol) {
            o.position.x = j.sol.x; o.position.y = j.sol.y - corps.position.y / (echelleBase * echelleProfondeur);
            a *= Math.max(0, 1 - j.lev / 9);
          } else if (j) {
            const sab = v.def.ombres.sabots[o.sabot], piv = v.def.morceaux[o.sabot].pivot;
            const dx = sab.x - piv[0], dy = sab.y - piv[1], cr = Math.cos(j.rotation), sr = Math.sin(j.rotation);
            o.position.x = j.position.x + dx * cr - dy * sr;
            const levee = j.base.y - j.position.y;
            a *= Math.max(0, 1 - levee / 9);
          }
          o.alpha = a;
        }
      },
      hauteurVisible() { return def.hauteur * echelleProfondeur; },
      // 19/10 · la tête affichée à cet instant (le clignement et le bâillement montrent « dort » un court moment)
      get teteVisible() { const va = vues[nomVue()], t = va && va.morceaux.tete; if (!t || !t.images) return null; for (const n in t.images) if (t.images[n].visible) return n; return null; }
    };
    montrer();
    api.maj(0);
    return api;
  }

  global.AthenaMarionnette = { charger };
})(typeof window !== 'undefined' ? window : globalThis);
