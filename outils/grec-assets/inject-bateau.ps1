param(
  [string]$Html='C:\Users\berri\Documents\Claude\journal-de-quetes.html',
  [string]$Image='C:\Users\berri\Documents\Claude\grec-assets\bateau.png'
)
$ErrorActionPreference='Stop';$s=[IO.File]::ReadAllText($Html)
$b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes($Image))
$a='/* BATEAU GREC EMBARQUE */';$z='/* FIN BATEAU GREC EMBARQUE */'
$bloc=$a+"`r`nconst GREC_BOAT_SRC=`"data:image/png;base64,"+$b64+"`";`r`n"+$z
$p=$s.IndexOf($a)
if($p -ge 0){$e=$s.IndexOf($z,$p);if($e -lt 0){throw 'Fin bateau absente'};$e+=$z.Length;$s=$s.Remove($p,$e-$p).Insert($p,$bloc)}
else{$rep='const CAMPSKINS=';$p=$s.IndexOf($rep);if($p -lt 0){throw 'Repère absent'};$s=$s.Insert($p,$bloc+"`r`n")}
[IO.File]::WriteAllText($Html,$s,[Text.UTF8Encoding]::new($false))
