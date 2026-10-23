/*! athena-jeu.js 2.0 — les règles du jeu de la V1, en fonctions simples.
 * Les valeurs sont dans athena-v1.js (V.JEU). Le Prototype et la page Mécaniques appellent ces fonctions :
 * règles et chiffres ne peuvent pas diverger.
 * L’ancienne version (offrandes, élan chiffré, feu qui redescend la nuit) reste dans Archives/Coulisses/commun. */
(function (W) {
const J = () => W.ATHENA_V1.JEU;
const G = W.AthenaJeu = {
  /* XP et niveaux */
  niveau: xp => Math.floor(xp / J().xpParNiveau) + 1,
  pctNiveau: xp => Math.round((xp % J().xpParNiveau) / J().xpParNiveau * 100),
  /* La tente : étape (1 à 4) pour un niveau, et l’étape qui s’ouvre pile à ce niveau */
  tente: niv => { let e = 1; J().tente.forEach(([s, n]) => { if (niv >= n) e = s; }); return e; },
  tenteAuNiveau: niv => J().tente.find(x => x[1] === niv) || null,
  /* Gains */
  gainsQuete: () => ({ xp: J().xpParQuete, or: J().orParQuete }),
  bonusJournee: opt => ({ or: opt === 'coffre' ? J().bonus.coffre : 0 }),
  /* Le décor selon l’heure */
  moment: h => (h < J().moments.coucher ? 'jour' : h < J().moments.nuit ? 'coucher' : 'nuit'),
  /* L’aide du geste : les premières validations, ou après quelques jours sans validation */
  aideEligible: ({ validees, derniere, now }) => validees < J().aide.validations || (derniere > 0 && now - derniere > J().aide.joursSans * 864e5),
  /* Le calendrier des journées : objets offerts arrivés à cette journée et pas encore au camp */
  offertsJusqua: (jour, possedes) => J().objets.filter(o => !o[2] && o[3] <= jour && !(possedes || []).includes(o[0])).map(o => o[0])
};
})(window);
