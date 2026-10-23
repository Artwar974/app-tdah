// Génère les icônes de la PWA depuis la flamme de la vignette du Prototype (aucune image dessinée à la main) :
// demo/icones/icone.svg = copie exacte du SVG du <template id="__bundler_thumbnail"> de demo/Prototype.dc.html (sans data-bg-color),
// icone-512.png et icone-192.png = le SVG rendu à 512 et 192 px, icone-maskable-512.png = le même dessin réduit à 80 % et centré sur le fond #f4eee6
// (zone sûre des icônes maskable), badge-96.png = la flamme seule en blanc sur fond transparent (badge monochrome des notifications).
// Lancer : node outils/generer-icones.js   (Node + Playwright, Chromium déjà installé ; aucune autre dépendance)
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RACINE = path.join(__dirname, '..');
const PROTO = path.join(RACINE, 'demo', 'Prototype.dc.html');
const DOSSIER = path.join(RACINE, 'demo', 'icones');
const FOND = '#f4eee6', FLAMME = '#a3452a';

const html = fs.readFileSync(PROTO, 'utf8');
const m = html.match(/<template id="__bundler_thumbnail">(<svg[\s\S]*?<\/svg>)<\/template>/);
if (!m) { console.error('generer-icones : vignette introuvable dans demo/Prototype.dc.html'); process.exit(1); }
const svg = m[1].replace(/\s+data-bg-color="[^"]*"/, '');
const flamme = (svg.match(new RegExp('<path d="([^"]+)" fill="' + FLAMME + '"')) || [])[1];
if (!flamme) { console.error('generer-icones : la flamme (' + FLAMME + ') est introuvable dans la vignette'); process.exit(1); }
const badge = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="' + flamme + '" fill="#fff"/></svg>';

// Une page de n × n px dont le corps porte le fond (ou rien) et le SVG à la taille voulue, centré
const page = (dessin, n, taille, fond) => '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:' + n + 'px;height:' + n + 'px;overflow:hidden;background:' + (fond || 'transparent') + '}body{display:flex;align-items:center;justify-content:center}svg{display:block;width:' + taille + 'px;height:' + taille + 'px}</style></head><body>' + dessin + '</body></html>';

(async () => {
  fs.mkdirSync(DOSSIER, { recursive: true });
  fs.writeFileSync(path.join(DOSSIER, 'icone.svg'), svg + '\n');
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1 });
  const rendre = async (nom, dessin, n, taille, fond, transparent) => {
    await p.setViewportSize({ width: n, height: n });
    await p.setContent(page(dessin, n, taille, fond), { waitUntil: 'load' });
    await p.screenshot({ path: path.join(DOSSIER, nom), clip: { x: 0, y: 0, width: n, height: n }, omitBackground: !!transparent });
    console.log('✓ icones/' + nom + ' (' + n + ' × ' + n + ')');
  };
  await rendre('icone-512.png', svg, 512, 512, FOND);
  await rendre('icone-192.png', svg, 192, 192, FOND);
  await rendre('icone-maskable-512.png', svg, 512, 410, FOND);   // 80 % centrés : le dessin reste entier sous tous les masques
  await rendre('badge-96.png', badge, 96, 96, null, true);
  await b.close();
  console.log('✓ icones/icone.svg (copie de la vignette du Prototype)');
})().catch((e) => { console.error('generer-icones : ' + e.message); process.exit(1); });
