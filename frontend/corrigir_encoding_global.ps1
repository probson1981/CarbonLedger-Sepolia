$ErrorActionPreference = "Stop"

$raiz = Get-Location

if ((Split-Path $raiz -Leaf) -ne "frontend") {
  throw "Execute este script dentro da pasta frontend."
}

$srcPath = Join-Path $raiz "src"
$backupDir = Join-Path $raiz ("backups_encoding_" + (Get-Date -Format "yyyyMMdd-HHmmss"))

New-Item -ItemType Directory -Force $backupDir | Out-Null

Write-Host ""
Write-Host "Movendo arquivos backup para fora de src..."

$arquivosBackup = Get-ChildItem -Path $srcPath -Recurse -File | Where-Object {
  $_.Name -like "*.backup*" -or
  $_.Name -like "App.backup*" -or
  $_.Name -like "*.antes_*"
}

foreach ($arquivo in $arquivosBackup) {
  $relativo = $arquivo.FullName.Substring($srcPath.Length).TrimStart("\", "/")
  $destino = Join-Path $backupDir ("src\" + $relativo)

  New-Item -ItemType Directory -Force (Split-Path $destino) | Out-Null
  Move-Item -LiteralPath $arquivo.FullName -Destination $destino -Force

  Write-Host "Movido: $relativo"
}

$utf8SemBom = New-Object System.Text.UTF8Encoding($false)

$mapa = [ordered]@{}

function Add-MojibakeMap {
  param(
    [int[]]$OldCodes,
    [int[]]$NewCodes
  )

  $old = -join ($OldCodes | ForEach-Object { [char]$_ })
  $new = -join ($NewCodes | ForEach-Object { [char]$_ })

  $script:mapa[$old] = $new
}

# Letras minusculas acentuadas corrompidas
Add-MojibakeMap @(0x00C3, 0x00A0) @(0x00E0) # Ã  -> à
Add-MojibakeMap @(0x00C3, 0x00A1) @(0x00E1) # Ã¡ -> á
Add-MojibakeMap @(0x00C3, 0x00A2) @(0x00E2) # Ã¢ -> â
Add-MojibakeMap @(0x00C3, 0x00A3) @(0x00E3) # Ã£ -> ã
Add-MojibakeMap @(0x00C3, 0x00A7) @(0x00E7) # Ã§ -> ç
Add-MojibakeMap @(0x00C3, 0x00A8) @(0x00E8) # Ã¨ -> è
Add-MojibakeMap @(0x00C3, 0x00A9) @(0x00E9) # Ã© -> é
Add-MojibakeMap @(0x00C3, 0x00AA) @(0x00EA) # Ãª -> ê
Add-MojibakeMap @(0x00C3, 0x00AD) @(0x00ED) # Ã­ -> í
Add-MojibakeMap @(0x00C3, 0x00B3) @(0x00F3) # Ã³ -> ó
Add-MojibakeMap @(0x00C3, 0x00B4) @(0x00F4) # Ã´ -> ô
Add-MojibakeMap @(0x00C3, 0x00B5) @(0x00F5) # Ãµ -> õ
Add-MojibakeMap @(0x00C3, 0x00BA) @(0x00FA) # Ãº -> ú

# Letras maiusculas acentuadas em variantes comuns
Add-MojibakeMap @(0x00C3, 0x0081) @(0x00C1) # Á
Add-MojibakeMap @(0x00C3, 0x0089) @(0x00C9) # É
Add-MojibakeMap @(0x00C3, 0x008D) @(0x00CD) # Í
Add-MojibakeMap @(0x00C3, 0x0093) @(0x00D3) # Ó
Add-MojibakeMap @(0x00C3, 0x009A) @(0x00DA) # Ú
Add-MojibakeMap @(0x00C3, 0x0083) @(0x00C3) # Ã
Add-MojibakeMap @(0x00C3, 0x0087) @(0x00C7) # Ç

# Variantes de Windows-1252
Add-MojibakeMap @(0x00C3, 0x2030) @(0x00C9) # Ã‰ -> É
Add-MojibakeMap @(0x00C3, 0x201C) @(0x00D3) # Ã“ -> Ó
Add-MojibakeMap @(0x00C3, 0x0160) @(0x00DA) # Ãš -> Ú
Add-MojibakeMap @(0x00C3, 0x2021) @(0x00C7) # Ã‡ -> Ç

# Simbolos comuns com Â
Add-MojibakeMap @(0x00C2, 0x00A0) @(0x0020) # espaco nao separavel
Add-MojibakeMap @(0x00C2, 0x00BA) @(0x00BA) # º
Add-MojibakeMap @(0x00C2, 0x00AA) @(0x00AA) # ª
Add-MojibakeMap @(0x00C2, 0x00B0) @(0x00B0) # °
Add-MojibakeMap @(0x00C2, 0x00B7) @(0x00B7) # ·

Write-Host ""
Write-Host "Corrigindo arquivos ativos em src..."

$arquivosCodigo = Get-ChildItem -Path $srcPath -Recurse -File | Where-Object {
  ($_.Extension -eq ".ts" -or $_.Extension -eq ".tsx") -and
  $_.Name -notlike "*.backup*" -and
  $_.Name -notlike "App.backup*" -and
  $_.Name -notlike "*.antes_*"
}

$arquivosAlterados = 0

foreach ($arquivo in $arquivosCodigo) {
  $textoOriginal = [System.IO.File]::ReadAllText($arquivo.FullName, [System.Text.Encoding]::UTF8)
  $textoNovo = $textoOriginal

  foreach ($chave in $mapa.Keys) {
    $textoNovo = $textoNovo.Replace($chave, $mapa[$chave])
  }

  # Remove caractere de substituicao, quando existir
  $textoNovo = $textoNovo.Replace([string][char]0xFFFD, "")

  if ($textoNovo -ne $textoOriginal) {
    [System.IO.File]::WriteAllText($arquivo.FullName, $textoNovo, $utf8SemBom)

    $relativo = $arquivo.FullName.Substring($srcPath.Length).TrimStart("\", "/")
    Write-Host "Corrigido: $relativo"

    $arquivosAlterados += 1
  }
}

Write-Host ""
Write-Host "Arquivos alterados: $arquivosAlterados"

Write-Host ""
Write-Host "Varredura final por caracteres suspeitos em arquivos ativos..."

$badChars = @([char]0x00C3, [char]0x00C2, [char]0xFFFD)

$achados = @()

foreach ($arquivo in $arquivosCodigo) {
  $texto = [System.IO.File]::ReadAllText($arquivo.FullName, [System.Text.Encoding]::UTF8)

  if ($texto.IndexOfAny($badChars) -ge 0) {
    $relativo = $arquivo.FullName.Substring($srcPath.Length).TrimStart("\", "/")
    $achados += $relativo
  }
}

if ($achados.Count -eq 0) {
  Write-Host "Nenhum caractere suspeito encontrado em arquivos ativos."
} else {
  Write-Host "Ainda existem caracteres suspeitos nos arquivos abaixo:"
  $achados | ForEach-Object { Write-Host " - $_" }
}

Write-Host ""
Write-Host "Backups movidos para:"
Write-Host $backupDir

Write-Host ""
Write-Host "Agora rode:"
Write-Host "npm run build"