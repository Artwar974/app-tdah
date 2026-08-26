param(
  [Parameter(Mandatory=$true)][string]$Html,
  [Parameter(Mandatory=$true)][string]$Images
)
$ErrorActionPreference='Stop'
$items=@(
  @{Token='__GREC_RUINES__'; File='ruines-colonne.png'},
  @{Token='__GREC_OLIVIER__'; File='olivier.png'},
  @{Token='__GREC_ATHENA__'; File='statue-athena.png'},
  @{Token='__GREC_TENTE__'; File='tente-grecque.png'}
)
foreach($it in $items){
  $b64=[Convert]::ToBase64String([IO.File]::ReadAllBytes((Join-Path $Images $it.File)))
  $old=(Get-Content -LiteralPath $Html | Where-Object {$_ -like "*$($it.Token)*"} | Select-Object -First 1)
  if(-not $old){throw "Repère absent : $($it.Token)"}
  $new=$old.Replace($it.Token,$b64)
  $patch="*** Begin Patch`n*** Update File: $Html`n@@`n-$old`n+$new`n*** End Patch`n"
  $patch | & apply_patch
  if($LASTEXITCODE -ne 0){throw "Échec d'injection : $($it.File)"}
}
