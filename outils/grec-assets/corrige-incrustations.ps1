param(
  [string]$Source='C:\Users\berri\Documents\Claude\grec-assets\set1-jeu',
  [string]$Destination='C:\Users\berri\Documents\Claude\grec-assets\set1-jeu-corrige'
)
$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Get-ChildItem -LiteralPath $Source -Filter *.png | ForEach-Object {
  $im=[Drawing.Bitmap]::new($_.FullName);$w=$im.Width;$h=$im.Height
  if($_.Name -eq 'olivier.png'){
    $bad=New-Object 'bool[,]' $w,$h
    # Les résidus visibles sont tous dans la couronne. Les blancs des pierres situées
    # sous y=100 sont de vrais reflets et ne sont donc jamais concernés.
    $zones=@(@(36,21,43,29),@(11,49,17,54),@(53,63,61,69),@(23,69,27,73))
    for($y=0;$y -lt [Math]::Min(100,$h);$y++){for($x=0;$x -lt $w;$x++){
      $c=$im.GetPixel($x,$y);$mn=[Math]::Min($c.R,[Math]::Min($c.G,$c.B));$mx=[Math]::Max($c.R,[Math]::Max($c.G,$c.B))
      $dans=$false;foreach($z in $zones){if($x -ge $z[0] -and $x -le $z[2] -and $y -ge $z[1] -and $y -le $z[3]){$dans=$true;break}}
      if($dans -and $c.A -gt 200 -and $mn -ge 180 -and ($mx-$mn) -le 48){$bad[$x,$y]=$true}
    }}
    $changes=@()
    for($y=0;$y -lt [Math]::Min(100,$h);$y++){for($x=0;$x -lt $w;$x++){if(!$bad[$x,$y]){continue}
      $trouve=$null
      for($r=1;$r -le 5 -and $null -eq $trouve;$r++){
        $cand=@();for($dy=-$r;$dy -le $r;$dy++){for($dx=-$r;$dx -le $r;$dx++){
          if([Math]::Max([Math]::Abs($dx),[Math]::Abs($dy)) -ne $r){continue};$xx=$x+$dx;$yy=$y+$dy
          if($xx -lt 0 -or $yy -lt 0 -or $xx -ge $w -or $yy -ge $h -or $bad[$xx,$yy]){continue}
          $q=$im.GetPixel($xx,$yy);if($q.A -gt 220 -and $q.G -gt 45 -and $q.G -ge ($q.B*1.12)){$cand+=$q}
        }}
        if($cand.Count){$trouve=$cand[[int][Math]::Floor($cand.Count/2)]}
      }
      if($null -ne $trouve){$changes+=,@($x,$y,$trouve)}else{$changes+=,@($x,$y,[Drawing.Color]::Transparent)}
    }}
    foreach($v in $changes){$im.SetPixel($v[0],$v[1],$v[2])}
    # Les plaques de faux fond possèdent aussi un liseré gris plus sombre. On remplace
    # donc chacune par un petit morceau voisin de la même couronne, pixel pour pixel.
    $clones=@(@(36,21,43,29,45,21),@(11,49,17,54,18,49),@(53,63,61,69,44,63),@(23,69,27,73,28,69))
    foreach($z in $clones){$copie=@();for($yy=0;$yy -le ($z[3]-$z[1]);$yy++){for($xx=0;$xx -le ($z[2]-$z[0]);$xx++){
      $copie+=,$im.GetPixel($z[4]+$xx,$z[5]+$yy)
    }};$k=0;for($yy=$z[1];$yy -le $z[3];$yy++){for($xx=$z[0];$xx -le $z[2];$xx++){$im.SetPixel($xx,$yy,$copie[$k]);$k++}}}
  }
  if($_.Name -eq 'statue-athena.png'){
    # Bande de faux fond restée entre la lance et la silhouette. Sa couleur neutre
    # tranche avec le marbre chaud : le critère chromatique évite d'effacer la statue.
    for($y=47;$y -le [Math]::Min(108,$h-1);$y++){for($x=20;$x -le [Math]::Min(31,$w-1);$x++){
      $c=$im.GetPixel($x,$y);$mn=[Math]::Min($c.R,[Math]::Min($c.G,$c.B));$mx=[Math]::Max($c.R,[Math]::Max($c.G,$c.B))
      if($c.A -gt 200 -and $mn -ge 180 -and ($mx-$mn) -le 45){$im.SetPixel($x,$y,[Drawing.Color]::Transparent)}
    }}
    # Le résidu suit une diagonale très régulière entre la lance et la robe. Cette
    # étroite bande appartient entièrement à l'ancien fond, pas à la sculpture.
    for($y=47;$y -le [Math]::Min(108,$h-1);$y++){
      $cx=[int][Math]::Round(22+($y-47)*8/61);for($x=$cx-2;$x -le $cx+2;$x++){
        if($x -ge 0 -and $x -lt $w){$im.SetPixel($x,$y,[Drawing.Color]::Transparent)}
      }
    }
  }
  $out=Join-Path $Destination $_.Name;$im.Save($out,[Drawing.Imaging.ImageFormat]::Png);$im.Dispose()
}
