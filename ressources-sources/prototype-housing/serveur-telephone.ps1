param(
  [string]$Racine = $PSScriptRoot,
  [int]$Port = 8350
)

$root = [IO.Path]::GetFullPath($Racine).TrimEnd('\') + '\'
$types = @{
  '.html'='text/html; charset=utf-8'
  '.png'='image/png'
  '.jpg'='image/jpeg'
  '.jpeg'='image/jpeg'
  '.gif'='image/gif'
  '.css'='text/css; charset=utf-8'
  '.js'='text/javascript; charset=utf-8'
}

$server = New-Object Net.Sockets.TcpListener([Net.IPAddress]::Any,$Port)
$server.Start()
Write-Host "Housing Prairie accessible sur le port $Port"

try {
  while ($true) {
    $client = $server.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = New-Object IO.StreamReader($stream,[Text.Encoding]::ASCII,$false,1024,$true)
      $first = $reader.ReadLine()
      while (($line = $reader.ReadLine()) -ne $null -and $line -ne '') {}

      $relative = 'index.html'
      if ($first -match '^GET\s+([^\s?]+)') {
        $relative = [Uri]::UnescapeDataString($Matches[1]).TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
      }

      $candidate = [IO.Path]::GetFullPath((Join-Path $root ($relative -replace '/','\')))
      $ok = $candidate.StartsWith($root,[StringComparison]::OrdinalIgnoreCase) -and
            (Test-Path -LiteralPath $candidate -PathType Leaf)

      if ($ok) {
        $body = [IO.File]::ReadAllBytes($candidate)
        $ext = [IO.Path]::GetExtension($candidate).ToLowerInvariant()
        $mime = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $head = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
      } else {
        $body = [Text.Encoding]::UTF8.GetBytes('Introuvable')
        $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
      }

      $headerBytes = [Text.Encoding]::ASCII.GetBytes($head)
      $stream.Write($headerBytes,0,$headerBytes.Length)
      $stream.Write($body,0,$body.Length)
      $stream.Flush()
    } catch {} finally {
      $client.Close()
    }
  }
} finally {
  $server.Stop()
}
