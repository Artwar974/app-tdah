param([int]$Port = 8347)

$racine = Split-Path -Parent $PSScriptRoot
$adresse = "http://localhost:$Port/index.html"

Write-Host "APP TDAH disponible sur : $adresse" -ForegroundColor Green
Write-Host "Pour un téléphone sur le même Wi-Fi, remplacez localhost par l'adresse IPv4 de cet ordinateur."

Set-Location -LiteralPath $racine
& python -m http.server $Port --bind 0.0.0.0
