[CmdletBinding()]
param(
  [int]$Port = 4188
)

$ErrorActionPreference = 'Stop'
$toolDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$server = Join-Path $toolDirectory 'editor-server.py'
$url = "http://127.0.0.1:$Port/__editor__/?editor=open&version=standalone-v1"
$pythonCommand = Get-Command 'python' -ErrorAction SilentlyContinue
$pythonExecutable = if ($pythonCommand) {
  $pythonCommand.Source
} else {
  Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
}
if (-not (Test-Path -LiteralPath $pythonExecutable)) {
  throw 'Python est introuvable. Ouvre une session Codex locale ou installe Python 3.'
}

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $existing) {
  Start-Process -FilePath $pythonExecutable -ArgumentList @($server, '--port', $Port, '--no-browser') -WindowStyle Hidden
  $deadline = [DateTime]::UtcNow.AddSeconds(12)
  do {
    Start-Sleep -Milliseconds 250
    $existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  } while (-not $existing -and [DateTime]::UtcNow -lt $deadline)
  if (-not $existing) { throw "Le serveur de l'éditeur n'a pas démarré sur le port $Port." }
}

Start-Process $url
Write-Host "Éditeur ATHENA ouvert : $url"
Write-Host "Valider crée uniquement une proposition. Annuler ne touche pas aux fichiers de l'application."
