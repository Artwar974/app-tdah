# Tunnel HTTPS vers la démo, pour l'essayer sur un téléphone tout de suite, sans attendre GitHub Pages.
# Un téléphone n'installe une PWA (et n'affiche ses notifications) que depuis une adresse https : le Wi-Fi en http ne suffit pas.
#  1. Si rien ne répond sur le port 8347, lance outils/serveur-local.ps1 dans une nouvelle fenêtre (il sert le dossier du dépôt).
#  2. Lance « cloudflared tunnel --url http://localhost:8347 » (tunnel rapide, sans compte) et affiche l'adresse https://….trycloudflare.com/demo/
#     à coller dans Mobile test › « Une autre adresse » : le QR se dessine tout de suite.
# Ctrl+C arrête le tunnel ; le serveur local reste ouvert dans sa fenêtre. L'adresse change à chaque lancement.
# Lancer : powershell -ExecutionPolicy Bypass -File outils\tunnel-https.ps1
param([int]$Port = 8347)

$ErrorActionPreference = 'Stop'

function Test-Port([int]$p) {
  $c = New-Object System.Net.Sockets.TcpClient
  try { $c.Connect('127.0.0.1', $p); return $true } catch { return $false } finally { $c.Close() }
}

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
  Write-Host "cloudflared n'est pas installé. Installez-le avec :" -ForegroundColor Yellow
  Write-Host "  winget install Cloudflare.cloudflared"
  Write-Host "puis ouvrez une nouvelle fenêtre PowerShell et relancez ce script."
  exit 1
}

if (Test-Port $Port) {
  Write-Host "Un serveur répond déjà sur le port $Port : le tunnel l'utilise tel quel."
} else {
  Write-Host "Lancement du serveur local (outils/serveur-local.ps1, port $Port) dans une nouvelle fenêtre…"
  Start-Process powershell -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $PSScriptRoot 'serveur-local.ps1'), '-Port', "$Port")
  for ($i = 0; $i -lt 50 -and -not (Test-Port $Port); $i++) { Start-Sleep -Milliseconds 200 }
  if (-not (Test-Port $Port)) {
    Write-Host "Le serveur local ne répond pas sur le port $Port (Python est-il installé ? voir la fenêtre du serveur)." -ForegroundColor Red
    exit 1
  }
}

# cloudflared écrit son journal dans un fichier qu'on relit pour y trouver l'adresse du tunnel (elle s'affiche aussi dans cette fenêtre)
$journal = Join-Path ([System.IO.Path]::GetTempPath()) ('athena-tunnel-' + [guid]::NewGuid().ToString('N') + '.log')
Write-Host "Ouverture du tunnel HTTPS vers http://localhost:$Port …"
$tunnel = Start-Process -FilePath $cloudflared.Source -ArgumentList @('tunnel', '--url', "http://localhost:$Port", '--logfile', $journal) -NoNewWindow -PassThru

$adresse = $null
for ($i = 0; $i -lt 150 -and -not $adresse -and -not $tunnel.HasExited; $i++) {
  Start-Sleep -Milliseconds 200
  if (Test-Path -LiteralPath $journal) {
    $m = Select-String -LiteralPath $journal -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
    if ($m) { $adresse = $m.Matches[0].Value }
  }
}

if ($adresse) {
  $demo = $adresse + '/demo/'
  Write-Host ''
  Write-Host 'Adresse de la démo, à coller dans Mobile test › « Une autre adresse » (le QR se dessine tout de suite) :' -ForegroundColor Green
  Write-Host "  $demo" -ForegroundColor Green
  try { Set-Clipboard -Value $demo; Write-Host '  (copiée dans le presse-papiers)' } catch { }
  Write-Host ''
} elseif ($tunnel.HasExited) {
  Write-Host "cloudflared s'est arrêté (code $($tunnel.ExitCode)) : voir les messages ci-dessus." -ForegroundColor Red
  Remove-Item -LiteralPath $journal -ErrorAction SilentlyContinue
  exit 1
} else {
  Write-Host "L'adresse du tunnel n'a pas encore été vue : elle s'affiche plus haut (https://….trycloudflare.com) ; ajoutez /demo/ à la fin pour Mobile test." -ForegroundColor Yellow
}

Write-Host 'Ctrl+C pour arrêter le tunnel.'
try { Wait-Process -Id $tunnel.Id }
finally {
  if (-not $tunnel.HasExited) { Stop-Process -Id $tunnel.Id -Force -ErrorAction SilentlyContinue }
  Remove-Item -LiteralPath $journal -ErrorAction SilentlyContinue
}
