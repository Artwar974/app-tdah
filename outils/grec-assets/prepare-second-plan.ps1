param(
  [string]$Source='C:\Users\berri\Desktop\APPLI\3.0\GREC\2nd_plan_grec.png',
  [string]$Destination='C:\Users\berri\Documents\Claude\grec-assets\second.png'
)
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$src=[Drawing.Bitmap]::new($Source)
try{
  # Le plan doit être un cache de relief transparent : le blanc de détourage ne doit
  # jamais recouvrir la mer, et le petit rectangle bleu résiduel à gauche appartient
  # à l'ancien aplat d'eau, pas aux îles.
  for($y=0;$y -lt $src.Height;$y++){for($x=0;$x -lt $src.Width;$x++){
    $c=$src.GetPixel($x,$y)
    $mn=[Math]::Min($c.R,[Math]::Min($c.G,$c.B));$mx=[Math]::Max($c.R,[Math]::Max($c.G,$c.B))
    $blanc=($c.A -gt 8 -and $mn -gt 226 -and ($mx-$mn) -lt 20)
    $blocBleu=($x -ge 205 -and $x -le 300 -and $y -ge 500 -and $y -le 640 -and $c.B -gt $c.R*1.35 -and $c.B -gt $c.G*1.08)
    if($blanc -or $blocBleu){$src.SetPixel($x,$y,[Drawing.Color]::Transparent)}
  }}
  $dst=[Drawing.Bitmap]::new(330,550,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try{
    $g=[Drawing.Graphics]::FromImage($dst)
    try{
      $g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
      $g.Clear([Drawing.Color]::Transparent)
      $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
      $g.DrawImage($src,[Drawing.Rectangle]::new(0,0,330,550),0,0,$src.Width,$src.Height,[Drawing.GraphicsUnit]::Pixel)
    }finally{$g.Dispose()}
    $dst.Save($Destination,[Drawing.Imaging.ImageFormat]::Png)
  }finally{$dst.Dispose()}
}finally{$src.Dispose()}

