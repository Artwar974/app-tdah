param(
  [string]$Html='C:\Users\berri\Documents\Claude\journal-de-quetes.html',
  [string]$Image='C:\Users\berri\Documents\Claude\grec-assets\second.png'
)
$ErrorActionPreference='Stop'
$s=[IO.File]::ReadAllText($Html)
$b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($Image))
$ligne='BIOMEIMG.grec.second="data:image/png;base64,'+$b64+'";'
$debut='/* PLAN GREC DE SECOND RANG : îles devant les bateaux */'
$fin='/* FIN PLAN GREC DE SECOND RANG */'
$bloc=$debut+"`r`n"+$ligne+"`r`n"+$fin
$a=$s.IndexOf($debut)
if($a -ge 0){$z=$s.IndexOf($fin,$a);if($z -lt 0){throw 'Fin du second plan absente'};$z+=$fin.Length;$s=$s.Remove($a,$z-$a).Insert($a,$bloc)}
else{
  $rep='const CAMPSKINS='
  $p=$s.IndexOf($rep);if($p -lt 0){throw 'Repère CAMPSKINS absent'}
  $s=$s.Insert($p,$bloc+"`r`n")
}
[IO.File]::WriteAllText($Html,$s,[Text.UTF8Encoding]::new($false))
