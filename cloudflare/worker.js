// Sert demo/ comme le ferait GitHub Pages : chaque fichier à son adresse exacte (wrangler.jsonc, html_handling "none"),
// « …/ » ouvre « …/index.html », un fichier absent répond 404. Les fichiers qui existent sont servis sans passer par ici.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/')) {
      url.pathname += 'index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};
