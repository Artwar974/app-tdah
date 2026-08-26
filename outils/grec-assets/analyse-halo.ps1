param([string]$Dir='C:\Users\berri\Documents\Claude\grec-assets\set1-jeu')
Add-Type -AssemblyName System.Drawing
Get-ChildItem -LiteralPath $Dir -Filter *.png | ForEach-Object {
  $im=[Drawing.Bitmap]::new($_.FullName);$nWhite=0;$nPale=0;$nEdge=0
  for($y=0;$y -lt $im.Height;$y++){for($x=0;$x -lt $im.Width;$x++){
    $c=$im.GetPixel($x,$y);if($c.A -lt 16){continue}
    $edge=$false
    for($dy=-1;$dy -le 1 -and -not $edge;$dy++){for($dx=-1;$dx -le 1;$dx++){
      $xx=$x+$dx;$yy=$y+$dy
      if($xx -lt 0 -or $yy -lt 0 -or $xx -ge $im.Width -or $yy -ge $im.Height -or $im.GetPixel($xx,$yy).A -lt 16){$edge=$true;break}
    }}
    if(!$edge){continue};$nEdge++
    $mx=[Math]::Max($c.R,[Math]::Max($c.G,$c.B));$mn=[Math]::Min($c.R,[Math]::Min($c.G,$c.B))
    if($mn -ge 235){$nWhite++}
    if($mn -ge 205 -and ($mx-$mn) -le 24){$nPale++}
  }}
  $im.Dispose();[pscustomobject]@{Fichier=$_.Name;Bord=$nEdge;Blanc235=$nWhite;ClairDesature=$nPale}
}
