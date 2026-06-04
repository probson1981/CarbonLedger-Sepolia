<#
.SYNOPSIS
  CarbonLedger - Rastreador de referências antigas e endereços obsoletos.

.DESCRIPTION
  Este script procura referências antigas que podem estar causando chamadas para
  contratos obsoletos no Hardhat Localhost.

  Ele verifica:
  - endereços antigos presentes em deployments *.OLD.json;
  - endereços de backups em frontend/src/config;
  - endereço específico informado pelo usuário;
  - referências a localhost.setup.OLD.json;
  - leituras perigosas usando wildcards em deployments;
  - chamadas a contratos antigos dentro de scripts, frontend e deployments.

  Saídas geradas:
  - scan-stale-references.txt
  - scan-stale-references.csv

.USAGE
  powershell -ExecutionPolicy Bypass -File .\scripts\trace_stale_references.ps1

  Com endereço específico:
  powershell -ExecutionPolicy Bypass -File .\scripts\trace_stale_references.ps1 -EnderecoSuspeito "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e"

  Incluindo artifacts:
  powershell -ExecutionPolicy Bypass -File .\scripts\trace_stale_references.ps1 -IncluirArtifacts

  Mover arquivos OLD para pasta separada:
  powershell -ExecutionPolicy Bypass -File .\scripts\trace_stale_references.ps1 -QuarentenarOld
#>

param(
  [string]$EnderecoSuspeito = "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e",
  [string]$OutputTxt = ".\scan-stale-references.txt",
  [string]$OutputCsv = ".\scan-stale-references.csv",
  [switch]$IncluirArtifacts,
  [switch]$QuarentenarOld
)

$ErrorActionPreference = "Stop"

$Root = (Get-Location).Path

$DeploymentAtual = Join-Path $Root "deployments\localhost.json"
$PastaDeployments = Join-Path $Root "deployments"
$PastaQuarentena = Join-Path $Root "deployments_old"

$ExtensoesPermitidas = @(
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".cjs",
  ".mjs",
  ".json",
  ".sol",
  ".ps1",
  ".txt",
  ".csv"
)

$PastasParaVarrer = @(
  "scripts",
  "frontend\src",
  "contracts",
  "deployments"
)

if ($IncluirArtifacts) {
  $PastasParaVarrer += "artifacts"
}

$RegexEndereco = "0x[a-fA-F0-9]{40}"

$PadroesExtras = @(
  "localhost\.setup\.OLD\.json",
  "\.OLD\.json",
  "backup-",
  "Get-ChildItem.*deployments",
  "deployments\\\*\.json",
  "deployments/\*\.json",
  "readFileSync.*deployments",
  "localhost\.json",
  "localhost\.setup\.json",
  "RegistroProjetosCarbono",
  "CreditoCarbonoToken",
  "getContractAt",
  "getContractFactory",
  "ethers\.Contract",
  "obterEnderecoContrato",
  "DEPLOYMENTS",
  "contracts\.generated"
)

function Escrever-Linha {
  param([string]$Texto = "")

  Add-Content -Path $OutputTxt -Value $Texto -Encoding UTF8
}

function Normalizar-Endereco {
  param([string]$Endereco)

  if ([string]::IsNullOrWhiteSpace($Endereco)) {
    return ""
  }

  return $Endereco.Trim().ToLowerInvariant()
}

function Arquivo-Permitido {
  param([System.IO.FileInfo]$Arquivo)

  $full = $Arquivo.FullName

  if ($full -match "\\node_modules\\") {
    return $false
  }

  if ($full -match "\\\.vite\\") {
    return $false
  }

  if ($full -match "\\cache\\") {
    return $false
  }

  if ($Arquivo.Name -like "*.map") {
    return $false
  }

  if ($Arquivo.Name -like "*.dbg.json") {
    return $false
  }

  return $ExtensoesPermitidas -contains $Arquivo.Extension
}

function Obter-Arquivos {
  $arquivos = @()

  foreach ($pastaRelativa in $PastasParaVarrer) {
    $pasta = Join-Path $Root $pastaRelativa

    if (-not (Test-Path $pasta)) {
      continue
    }

    $arquivos += Get-ChildItem -Path $pasta -Recurse -File | Where-Object {
      Arquivo-Permitido $_
    }
  }

  return $arquivos
}

function Extrair-Enderecos-De-Arquivo {
  param([string]$Caminho)

  if (-not (Test-Path $Caminho)) {
    return @()
  }

  $texto = Get-Content $Caminho -Raw -ErrorAction SilentlyContinue

  if ([string]::IsNullOrWhiteSpace($texto)) {
    return @()
  }

  $matches = [regex]::Matches($texto, $RegexEndereco)

  $enderecos = @()

  foreach ($match in $matches) {
    $enderecos += (Normalizar-Endereco $match.Value)
  }

  return $enderecos | Sort-Object -Unique
}

function Obter-Enderecos-Atuais {
  if (-not (Test-Path $DeploymentAtual)) {
    return @()
  }

  return Extrair-Enderecos-De-Arquivo $DeploymentAtual
}

function Obter-Arquivos-Antigos {
  $arquivosAntigos = @()

  if (Test-Path $PastaDeployments) {
    $arquivosAntigos += Get-ChildItem -Path $PastaDeployments -Recurse -File | Where-Object {
      $_.Name -match "\.OLD\.json$" -or $_.Name -match "old" -or $_.Name -match "backup"
    }
  }

  $pastaConfig = Join-Path $Root "frontend\src\config"

  if (Test-Path $pastaConfig) {
    $arquivosAntigos += Get-ChildItem -Path $pastaConfig -Recurse -File | Where-Object {
      $_.Name -match "backup" -or $_.Name -match "\.OLD"
    }
  }

  return $arquivosAntigos | Sort-Object FullName -Unique
}

function Obter-Enderecos-Antigos {
  param(
    [string[]]$EnderecosAtuais
  )

  $enderecosAntigos = @()
  $arquivosAntigos = Obter-Arquivos-Antigos

  foreach ($arquivo in $arquivosAntigos) {
    $enderecosAntigos += Extrair-Enderecos-De-Arquivo $arquivo.FullName
  }

  if (-not [string]::IsNullOrWhiteSpace($EnderecoSuspeito)) {
    $enderecosAntigos += (Normalizar-Endereco $EnderecoSuspeito)
  }

  $enderecosAntigos = $enderecosAntigos | Sort-Object -Unique

  $enderecosObsoletos = @()

  foreach ($endereco in $enderecosAntigos) {
    if ($EnderecosAtuais -notcontains $endereco) {
      $enderecosObsoletos += $endereco
    }
  }

  return $enderecosObsoletos | Sort-Object -Unique
}

function Buscar-Padroes-No-Arquivo {
  param(
    [System.IO.FileInfo]$Arquivo,
    [string[]]$EnderecosObsoletos
  )

  $resultados = @()

  $padroesBusca = @()

  foreach ($endereco in $EnderecosObsoletos) {
    if (-not [string]::IsNullOrWhiteSpace($endereco)) {
      $padroesBusca += [regex]::Escape($endereco)
    }
  }

  $padroesBusca += $PadroesExtras

  foreach ($padrao in $padroesBusca) {
    $achados = Select-String `
      -Path $Arquivo.FullName `
      -Pattern $padrao `
      -CaseSensitive:$false `
      -ErrorAction SilentlyContinue

    foreach ($achado in $achados) {
      $tipo = "Padrão"

      if ($EnderecosObsoletos -contains (Normalizar-Endereco $achado.Matches[0].Value)) {
        $tipo = "Endereço obsoleto"
      }

      if ($padrao -match "OLD|backup") {
        $tipo = "Arquivo antigo ou backup"
      }

      if ($padrao -match "Get-ChildItem|readFileSync|deployments") {
        $tipo = "Possível leitura perigosa"
      }

      $resultados += [PSCustomObject]@{
        Tipo    = $tipo
        Arquivo = $Arquivo.FullName
        Linha   = $achado.LineNumber
        Padrao  = $padrao
        Texto   = $achado.Line.Trim()
      }
    }
  }

  return $resultados
}

function Quarentenar-Arquivos-Old {
  $arquivosOld = @()

  if (Test-Path $PastaDeployments) {
    $arquivosOld += Get-ChildItem -Path $PastaDeployments -File | Where-Object {
      $_.Name -match "\.OLD\.json$" -or $_.Name -match "old"
    }
  }

  if ($arquivosOld.Count -eq 0) {
    return @()
  }

  if (-not (Test-Path $PastaQuarentena)) {
    New-Item -ItemType Directory -Path $PastaQuarentena | Out-Null
  }

  $movidos = @()

  foreach ($arquivo in $arquivosOld) {
    $destino = Join-Path $PastaQuarentena $arquivo.Name

    if (Test-Path $destino) {
      $base = [System.IO.Path]::GetFileNameWithoutExtension($arquivo.Name)
      $ext = [System.IO.Path]::GetExtension($arquivo.Name)
      $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
      $destino = Join-Path $PastaQuarentena "$base-$stamp$ext"
    }

    Move-Item -Path $arquivo.FullName -Destination $destino

    $movidos += [PSCustomObject]@{
      Origem  = $arquivo.FullName
      Destino = $destino
    }
  }

  return $movidos
}

if (Test-Path $OutputTxt) {
  Remove-Item $OutputTxt -Force
}

if (Test-Path $OutputCsv) {
  Remove-Item $OutputCsv -Force
}

Escrever-Linha "=============================================="
Escrever-Linha "CarbonLedger - Rastreamento de referências antigas"
Escrever-Linha "=============================================="
Escrever-Linha ""
Escrever-Linha "Raiz do projeto: $Root"
Escrever-Linha "Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Escrever-Linha ""

if (-not (Test-Path $DeploymentAtual)) {
  Escrever-Linha "ATENÇÃO: deployments\localhost.json não encontrado."
  Escrever-Linha "Rode primeiro o deploy local."
  Escrever-Linha ""
}

$enderecosAtuais = Obter-Enderecos-Atuais
$arquivosAntigos = Obter-Arquivos-Antigos
$enderecosObsoletos = Obter-Enderecos-Antigos -EnderecosAtuais $enderecosAtuais

Escrever-Linha "Deployment atual usado como referência:"
Escrever-Linha $DeploymentAtual
Escrever-Linha ""

Escrever-Linha "Endereços atuais encontrados em deployments\localhost.json:"
if ($enderecosAtuais.Count -eq 0) {
  Escrever-Linha "- Nenhum endereço atual encontrado."
}
else {
  foreach ($endereco in $enderecosAtuais) {
    Escrever-Linha "- $endereco"
  }
}

Escrever-Linha ""
Escrever-Linha "Arquivos antigos ou backups detectados:"
if ($arquivosAntigos.Count -eq 0) {
  Escrever-Linha "- Nenhum arquivo antigo ou backup detectado."
}
else {
  foreach ($arquivo in $arquivosAntigos) {
    Escrever-Linha "- $($arquivo.FullName)"
  }
}

Escrever-Linha ""
Escrever-Linha "Endereços obsoletos ou suspeitos a rastrear:"
if ($enderecosObsoletos.Count -eq 0) {
  Escrever-Linha "- Nenhum endereço obsoleto encontrado."
}
else {
  foreach ($endereco in $enderecosObsoletos) {
    Escrever-Linha "- $endereco"
  }
}

Escrever-Linha ""
Escrever-Linha "Pastas varridas:"
foreach ($pasta in $PastasParaVarrer) {
  Escrever-Linha "- $pasta"
}

Escrever-Linha ""

if ($QuarentenarOld) {
  Escrever-Linha "Quarentena de arquivos OLD solicitada."
  $movidos = Quarentenar-Arquivos-Old

  if ($movidos.Count -eq 0) {
    Escrever-Linha "- Nenhum arquivo OLD movido."
  }
  else {
    Escrever-Linha "Arquivos movidos para deployments_old:"
    foreach ($movido in $movidos) {
      Escrever-Linha "- $($movido.Origem) -> $($movido.Destino)"
    }
  }

  Escrever-Linha ""
}

$arquivos = Obter-Arquivos
$resultados = @()

foreach ($arquivo in $arquivos) {
  $resultados += Buscar-Padroes-No-Arquivo `
    -Arquivo $arquivo `
    -EnderecosObsoletos $enderecosObsoletos
}

$resultados = $resultados | Sort-Object Arquivo, Linha, Tipo, Padrao

Escrever-Linha "Total de arquivos analisados: $($arquivos.Count)"
Escrever-Linha "Total de ocorrências encontradas: $($resultados.Count)"
Escrever-Linha ""

Escrever-Linha "=============================================="
Escrever-Linha "Ocorrências detalhadas"
Escrever-Linha "=============================================="
Escrever-Linha ""

if ($resultados.Count -eq 0) {
  Escrever-Linha "Nenhuma ocorrência encontrada."
}
else {
  $agrupado = $resultados | Group-Object Arquivo

  foreach ($grupo in $agrupado) {
    Escrever-Linha "----------------------------------------------"
    Escrever-Linha "ARQUIVO:"
    Escrever-Linha $grupo.Name
    Escrever-Linha "----------------------------------------------"

    foreach ($item in ($grupo.Group | Sort-Object Linha, Tipo, Padrao)) {
      Escrever-Linha ("Linha {0} | Tipo: {1} | Padrão: {2}" -f $item.Linha, $item.Tipo, $item.Padrao)
      Escrever-Linha ("  {0}" -f $item.Texto)
      Escrever-Linha ""
    }
  }
}

Escrever-Linha ""
Escrever-Linha "=============================================="
Escrever-Linha "Resumo por tipo"
Escrever-Linha "=============================================="
Escrever-Linha ""

$resumoTipo = $resultados | Group-Object Tipo | Sort-Object Count -Descending

if ($resumoTipo.Count -eq 0) {
  Escrever-Linha "- Sem ocorrências."
}
else {
  foreach ($grupo in $resumoTipo) {
    Escrever-Linha ("{0}: {1}" -f $grupo.Name, $grupo.Count)
  }
}

Escrever-Linha ""
Escrever-Linha "=============================================="
Escrever-Linha "Resumo por arquivo"
Escrever-Linha "=============================================="
Escrever-Linha ""

$resumoArquivo = $resultados | Group-Object Arquivo | Sort-Object Count -Descending

if ($resumoArquivo.Count -eq 0) {
  Escrever-Linha "- Sem ocorrências."
}
else {
  foreach ($grupo in $resumoArquivo) {
    Escrever-Linha ("{0}: {1}" -f $grupo.Name, $grupo.Count)
  }
}

if ($resultados.Count -gt 0) {
  $resultados | Export-Csv -Path $OutputCsv -NoTypeInformation -Encoding UTF8
}

Write-Host ""
Write-Host "=============================================="
Write-Host "CarbonLedger - Rastreamento concluído"
Write-Host "=============================================="
Write-Host ""
Write-Host "TXT gerado:"
Write-Host $OutputTxt
Write-Host ""
Write-Host "CSV gerado:"
Write-Host $OutputCsv
Write-Host ""
Write-Host "Ocorrências encontradas:" $resultados.Count
Write-Host ""