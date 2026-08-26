param([string]$Dir='C:\Users\berri\Documents\Claude\grec-assets\set1-jeu',[string]$Out='C:\Users\berri\Documents\Claude\grec-assets\zoom-contours.png')
Add-Type -AssemblyName System.Drawing
$files=@('olivier.png','statue-athena.png','ruines-colonne.png','tente-grecque.png');$ims=@($files|ForEach-Object{[Drawing.Bitmap]::new((Join-Path $Dir $_))})
$scale=5;$gap=30;$w=[int](($ims|ForEach-Object{$_.Width*$scale}|Measure-Object -Sum).Sum+$gap*($ims.Count+1));$h=[int]((($ims|ForEach-Object{$_.Height}|Measure-Object -Maximum).Maximum*$scale)+$gap*2)
$cv=[Drawing.Bitmap]::new($w,$h);$g=[Drawing.Graphics]::FromImage($cv);$g.Clear([Drawing.Color]::FromArgb(24,27,38));$g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::NearestNeighbor;$x=$gap
for($i=0;$i -lt $ims.Count;$i++){$im=$ims[$i];$g.DrawImage($im,$x,$gap,$im.Width*$scale,$im.Height*$scale);$x+=$im.Width*$scale+$gap;$im.Dispose()}
$g.Dispose();$cv.Save($Out,[Drawing.Imaging.ImageFormat]::Png);$cv.Dispose()
