$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$vendor = Join-Path $root 'vendor\gsap'
$openDoodles = Join-Path $root 'assets\sources\open-doodles'
$openPeeps = Join-Path $root 'assets\sources\open-peeps'
$highlights = Join-Path $root 'assets\sources\highlights'

New-Item -ItemType Directory -Force -Path $vendor, $openDoodles, $openPeeps, $highlights | Out-Null

function Download-Asset {
  param(
    [Parameter(Mandatory=$true)][string]$Url,
    [Parameter(Mandatory=$true)][string]$Destination
  )
  Write-Host "Downloading $Destination"
  Invoke-WebRequest -Uri $Url -OutFile $Destination -UseBasicParsing
}

# GSAP pinned for reproducibility. Plugins are distributed with GSAP 3.13+.
$gsapBase = 'https://raw.githubusercontent.com/greensock/GSAP/3.15.0/dist'
$gsapFiles = @(
  'gsap.min.js',
  'CustomEase.min.js',
  'MorphSVGPlugin.min.js',
  'DrawSVGPlugin.min.js',
  'MotionPathPlugin.min.js',
  'Flip.min.js'
)
foreach ($file in $gsapFiles) {
  Download-Asset "$gsapBase/$file" (Join-Path $vendor $file)
}

# Open Doodles — small starter subset. CC0. Full library remains available from opendoodles.com.
$doodles = @{
  'groovy.svg' = 'https://opendoodles.s3-us-west-1.amazonaws.com/groovy.svg'
  'unboxing.svg' = 'https://opendoodles.s3-us-west-1.amazonaws.com/unboxing.svg'
  'meditating.svg' = 'https://opendoodles.s3-us-west-1.amazonaws.com/meditating.svg'
  'roller-skating.svg' = 'https://opendoodles.s3-us-west-1.amazonaws.com/roller-skating.svg'
}
foreach ($name in $doodles.Keys) {
  Download-Asset $doodles[$name] (Join-Path $openDoodles $name)
}

# Open Peeps — ready-to-download SVG examples from the official site. CC0.
$peeps = @{
  'peep-57.svg' = 'https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535858f5fa1a45cdfa3a07_peep-57.svg'
  'peep-86.svg' = 'https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e535bb6e35d38cae7684f8c_peep-86.svg'
  'peep-2.svg'  = 'https://cdn.prod.website-files.com/5e51c674258ffe10d286d30a/5e532a4c258ffe237b8ef2c1_peep-2.svg'
}
foreach ($name in $peeps.Keys) {
  Download-Asset $peeps[$name] (Join-Path $openPeeps $name)
}

# Highlights — first three arrow elements from the official catalogue. CC0.
$highlightAssets = @{
  'arrow-01.svg' = 'https://uploads-ssl.webflow.com/618ce467f09b34ebf2fdf6be/62761a51c2ed017c9d5608ca_Arrow%201.svg'
  'arrow-02.svg' = 'https://uploads-ssl.webflow.com/618ce467f09b34ebf2fdf6be/62761a51abd640e56d6a3361_Arrow%202.svg'
  'arrow-03.svg' = 'https://uploads-ssl.webflow.com/618ce467f09b34ebf2fdf6be/62761a513c3926ee7535f51e_Arrow%203.svg'
}
foreach ($name in $highlightAssets.Keys) {
  Download-Asset $highlightAssets[$name] (Join-Path $highlights $name)
}

Write-Host ''
Write-Host 'Athena Motion Lab assets are ready.' -ForegroundColor Green
Write-Host "Open: $root\index.html"
Write-Host 'For the complete Open Peeps and Highlights packs, use the official library download/Figma links documented in THIRD_PARTY.md.'
