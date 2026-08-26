param(
  [string]$Source='C:\Users\berri\Desktop\APPLI\3.0\GREC\bateau_grec.png',
  [string]$Destination='C:\Users\berri\Documents\Claude\grec-assets\bateau.png'
)
$ErrorActionPreference='Stop';Add-Type -AssemblyName System.Drawing
$im=[Drawing.Bitmap]::new($Source)
try{
  $l=$im.Width;$r=-1;$t=$im.Height;$b=-1
  for($y=0;$y -lt $im.Height;$y++){for($x=0;$x -lt $im.Width;$x++){
    if($im.GetPixel($x,$y).A -gt 8){if($x -lt $l){$l=$x};if($x -gt $r){$r=$x};if($y -lt $t){$t=$y};if($y -gt $b){$b=$y}}
  }}
  if($r -lt $l){throw 'Bateau vide'}
  $cw=$r-$l+1;$ch=$b-$t+1;$ow=44;$oh=[Math]::Max(1,[int][Math]::Round($ch*$ow/$cw))
  $out=[Drawing.Bitmap]::new($ow,$oh,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try{
    $g=[Drawing.Graphics]::FromImage($out)
    try{
      $g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
      $g.Clear([Drawing.Color]::Transparent)
      $g.CompositingQuality=[Drawing.Drawing2D.CompositingQuality]::HighQuality
      $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
      $g.DrawImage($im,[Drawing.Rectangle]::new(0,0,$ow,$oh),$l,$t,$cw,$ch,[Drawing.GraphicsUnit]::Pixel)
    }finally{$g.Dispose()}
    $out.Save($Destination,[Drawing.Imaging.ImageFormat]::Png)
  }finally{$out.Dispose()}
}finally{$im.Dispose()}

