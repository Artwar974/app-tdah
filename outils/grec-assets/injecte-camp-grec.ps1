param(
 [string]$Html='C:\Users\berri\Documents\Claude\journal-de-quetes.html',
 [string]$Assets='C:\Users\berri\Documents\Claude\grec-assets\camp-set'
)
$s=[IO.File]::ReadAllText($Html)
$start=$s.IndexOf('const CAMPSKINS=')
$end=$s.IndexOf('};const CAMPMETA=',$start)
if($start -lt 0 -or $end -lt 0){throw 'Bornes CAMPSKINS introuvables'}
$bloc=$s.Substring($start,$end-$start)
$families=@('tente','panneau','journal','oeuf')
$parts=@()
foreach($fam in $families){
  $vars=@()
  for($i=0;$i -lt 5;$i++){
    $p=Join-Path $Assets ($fam+'-'+$i+'.png')
    if(!(Test-Path -LiteralPath $p)){throw "Asset absent: $p"}
    $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($p))
    $vars+=($i.ToString()+':"data:image/png;base64,'+$b64+'"')
  }
  $parts+=($fam+':{'+($vars -join ',')+'}')
}
$insert=',grec:{'+($parts -join ',')+'}'
$g=$bloc.IndexOf(',grec:{')
if($g -ge 0){
  # Le biome grec est le dernier membre du catalogue : remplacement déterministe de
  # son bloc, sans toucher aux millions de caractères des autres images embarquées.
  $ancienDebut=$start+$g
  $nouveau=$s.Remove($ancienDebut,$end-$ancienDebut).Insert($ancienDebut,$insert)
}else{$nouveau=$s.Insert($end,$insert)}
$delta=$nouveau.Length-$s.Length
if([Math]::Abs($delta) -gt 200000){throw 'Variation de taille injectée anormale'}
[IO.File]::WriteAllText($Html,$nouveau,[Text.UTF8Encoding]::new($false))
Write-Output ('Injecté: '+($nouveau.Length-$s.Length)+' caractères')
