param(
  [string]$Source='C:\Users\berri\Documents\Claude\grec-assets\set1-jeu',
  [string]$Destination='C:\Users\berri\Documents\Claude\grec-assets\set1-jeu-propre'
)
$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Get-ChildItem -LiteralPath $Source -Filter *.png | ForEach-Object {
  $im=[Drawing.Bitmap]::new($_.FullName);$w=$im.Width;$h=$im.Height
  $seed=New-Object 'bool[,]' $w,$h;$del=New-Object 'bool[,]' $w,$h
  for($y=0;$y -lt $h;$y++){for($x=0;$x -lt $w;$x++){
    $c=$im.GetPixel($x,$y);if($c.A -gt 8 -and [Math]::Min($c.R,[Math]::Min($c.G,$c.B)) -ge 235){$seed[$x,$y]=$true;$del[$x,$y]=$true}
  }}
  # Deux pixels maximum autour d'un blanc pur : uniquement les gris très clairs et
  # désaturés du résidu de fond. Le marbre chaud, les feuilles et les reflets dorés
  # ne satisfont pas ce critère et restent donc intacts.
  for($pass=0;$pass -lt 2;$pass++){
    $add=New-Object 'bool[,]' $w,$h
    for($y=0;$y -lt $h;$y++){for($x=0;$x -lt $w;$x++){if(!$del[$x,$y]){continue}
      for($dy=-1;$dy -le 1;$dy++){for($dx=-1;$dx -le 1;$dx++){
        $xx=$x+$dx;$yy=$y+$dy;if($xx -lt 0 -or $yy -lt 0 -or $xx -ge $w -or $yy -ge $h -or $del[$xx,$yy]){continue}
        $c=$im.GetPixel($xx,$yy);$mx=[Math]::Max($c.R,[Math]::Max($c.G,$c.B));$mn=[Math]::Min($c.R,[Math]::Min($c.G,$c.B))
        if($c.A -gt 8 -and $mn -ge 205 -and ($mx-$mn) -le 26){$add[$xx,$yy]=$true}
      }}
    }}
    for($y=0;$y -lt $h;$y++){for($x=0;$x -lt $w;$x++){if($add[$x,$y]){$del[$x,$y]=$true}}}
  }
  $n=0;for($y=0;$y -lt $h;$y++){for($x=0;$x -lt $w;$x++){if($del[$x,$y]){$im.SetPixel($x,$y,[Drawing.Color]::Transparent);$n++}}}
  $out=Join-Path $Destination $_.Name;$im.Save($out,[Drawing.Imaging.ImageFormat]::Png);$im.Dispose()
  [pscustomobject]@{Fichier=$_.Name;PixelsRetires=$n}
}
