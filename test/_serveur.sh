#!/usr/bin/env bash
# Sert demo/ sur http://localhost:8766/ en arrière-plan, sauf si le port répond déjà.
PORT=8766
RACINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ecoute() { (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; }

if ecoute; then
  echo "serveur déjà actif sur http://localhost:$PORT/"
  exit 0
fi

mkdir -p "$RACINE/test/logs"
cd "$RACINE" || exit 1
nohup setsid python3 -I -m http.server "$PORT" --directory demo > "$RACINE/test/logs/serveur.log" 2>&1 < /dev/null &
disown 2>/dev/null

for _ in $(seq 1 50); do
  if ecoute; then echo "serveur démarré sur http://localhost:$PORT/ (demo/)"; exit 0; fi
  sleep 0.1
done
echo "le serveur n'a pas démarré (voir test/logs/serveur.log)" >&2
exit 1
