param([string]$Source,[string]$Destination)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$tailles=@{
  'ruines-colonne.png'=@(100,115)
  'olivier.png'=@(120,132)
  'statue-athena.png'=@(70,160)
  'tente-grecque.png'=@(160,100)
}
foreach($nom in $tailles.Keys){
  $src=[Drawing.Bitmap]::FromFile((Join-Path $Source $nom))
  $tw=$tailles[$nom][0];$th=$tailles[$nom][1]
  $dst=[Drawing.Bitmap]::new([int]$tw,[int]$th,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g=[Drawing.Graphics]::FromImage($dst)
  $g.CompositingMode=[Drawing.Drawing2D.CompositingMode]::SourceCopy
  $g.CompositingQuality=[Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode=[Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.DrawImage($src,[Drawing.Rectangle]::new(0,0,$tw,$th),0,0,$src.Width,$src.Height,[Drawing.GraphicsUnit]::Pixel)
  $g.Dispose();$src.Dispose()
  $dst.Save((Join-Path $Destination $nom),[Drawing.Imaging.ImageFormat]::Png);$dst.Dispose()
}
