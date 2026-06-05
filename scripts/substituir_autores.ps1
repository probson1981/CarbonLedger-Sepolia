param(
  [switch]$SomenteSimular
)

$ErrorActionPreference = "Stop"

$raizProjeto = Get-Location
$utf8SemBom = New-Object System.Text.UTF8Encoding($false)

$autor1 = "Alanio Lima"
$autor2 = "Ednardo Peixoto"
$autor3 = "Patr" + [char]0x00ED + "cio Alves"

$backupDir = Join-Path $raizProjeto ("backups_autores_" + (Get-Date -Format "yyyyMMdd-HHmmss"))

$extensoesPermitidas = @(
  ".sol",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ps1",
  ".md"
)

$pastasIgnoradasFixas = @(
  "node_modules",
  "dist",
  "build",
  "artifacts",
  "cache",
  "coverage",
  ".git",
  ".next",
  ".vite",
  "typechain-types"
)

function Testar-CaminhoIgnorado {
  param([System.IO.FileInfo]$Arquivo)

  $caminho = $Arquivo.FullName
  $nome = $Arquivo.Name

  foreach ($pasta in $pastasIgnoradasFixas) {
    if ($caminho -match "\\$([regex]::Escape($pasta))(\\|$)") {
      return $true
    }
  }

  # Ignora qualquer pasta criada como backup, por exemplo:
  # backups_encoding_20260605-183038
  # backups_autores_20260605-190000
  if ($caminho -match "\\backups_[^\\]+(\\|$)") {
    return $true
  }

  # Ignora arquivos backup soltos dentro de src ou config.
  if ($nome -match "\.backup" -or $nome -match "backup-" -or $nome -match "App\.backup" -or $nome -match "\.antes_") {
    return $true
  }

  # Ignora este próprio script para não alterar documentação interna por acidente.
  if ($nome -eq "substituir_autores.ps1") {
    return $true
  }

  return $false
}

function Obter-CaminhoRelativo {
  param(
    [string]$Base,
    [string]$Caminho
  )

  $baseUri = New-Object System.Uri(($Base.TrimEnd("\") + "\"))
  $caminhoUri = New-Object System.Uri($Caminho)

  return [System.Uri]::UnescapeDataString(
    $baseUri.MakeRelativeUri($caminhoUri).ToString()
  ).Replace("/", "\")
}

function Testar-LinhaAutorPatricio {
  param([string]$Linha)

  # Aceita Patrício Alves com acento correto ou com alguma variação corrompida.
  $padrao = '^(?<prefixo>\s*(?:///\s*|//\s*|\*\s*)?@author\s+)Patr.+cio Alves\s*$'

  return [regex]::Match($Linha, $padrao)
}

Write-Host ""
Write-Host "=============================================="
Write-Host "CarbonLedger - Substituicao de autores"
Write-Host "=============================================="
Write-Host "Raiz do projeto: $raizProjeto"
Write-Host "Modo simulacao: $SomenteSimular"
Write-Host ""

$arquivos = Get-ChildItem -Path $raizProjeto -Recurse -File | Where-Object {
  $extensoesPermitidas -contains $_.Extension.ToLowerInvariant() -and
  -not (Testar-CaminhoIgnorado $_)
}

$totalArquivosVerificados = 0
$totalArquivosAlterados = 0
$totalLinhasAlteradas = 0
$relatorio = New-Object System.Collections.Generic.List[string]

foreach ($arquivo in $arquivos) {
  $totalArquivosVerificados++

  $linhas = [System.IO.File]::ReadAllLines($arquivo.FullName, [System.Text.Encoding]::UTF8)

  $novasLinhas = New-Object System.Collections.Generic.List[string]
  $alteracoesNoArquivo = 0

  for ($i = 0; $i -lt $linhas.Count; $i++) {
    $linha = $linhas[$i]
    $match = Testar-LinhaAutorPatricio $linha

    if ($match.Success) {
      $inicioJanela = [Math]::Max(0, $i - 3)
      $fimJanela = [Math]::Min($linhas.Count - 1, $i + 3)

      $janela = ($linhas[$inicioJanela..$fimJanela] -join "`n")

      $jaTemAlanio = $janela.Contains($autor1)
      $jaTemEdnardo = $janela.Contains($autor2)
      $jaTemPatricio = $janela.Contains($autor3)

      if ($jaTemAlanio -and $jaTemEdnardo -and $jaTemPatricio) {
        $novasLinhas.Add($linha)
        continue
      }

      $prefixo = $match.Groups["prefixo"].Value

      $novasLinhas.Add($prefixo + $autor1)
      $novasLinhas.Add($prefixo + $autor2)
      $novasLinhas.Add($prefixo + $autor3)

      $alteracoesNoArquivo++
      $totalLinhasAlteradas++

      continue
    }

    $novasLinhas.Add($linha)
  }

  if ($alteracoesNoArquivo -gt 0) {
    $relativo = Obter-CaminhoRelativo $raizProjeto.Path $arquivo.FullName
    $relatorio.Add("$relativo : $alteracoesNoArquivo substituicao(oes)")

    if (-not $SomenteSimular) {
      $destinoBackup = Join-Path $backupDir $relativo
      $pastaBackup = Split-Path $destinoBackup -Parent

      New-Item -ItemType Directory -Force $pastaBackup | Out-Null
      Copy-Item -LiteralPath $arquivo.FullName -Destination $destinoBackup -Force

      [System.IO.File]::WriteAllLines(
        $arquivo.FullName,
        $novasLinhas,
        $utf8SemBom
      )
    }

    $totalArquivosAlterados++
  }
}

Write-Host "Arquivos verificados: $totalArquivosVerificados"
Write-Host "Arquivos alterados:   $totalArquivosAlterados"
Write-Host "Linhas substituidas:  $totalLinhasAlteradas"
Write-Host ""

if ($relatorio.Count -gt 0) {
  Write-Host "Arquivos encontrados:"
  foreach ($item in $relatorio) {
    Write-Host " - $item"
  }
} else {
  Write-Host "Nenhuma ocorrencia encontrada para substituicao."
}

if (-not $SomenteSimular -and $totalArquivosAlterados -gt 0) {
  Write-Host ""
  Write-Host "Backup dos arquivos alterados criado em:"
  Write-Host $backupDir
}

Write-Host ""
Write-Host "Concluido."