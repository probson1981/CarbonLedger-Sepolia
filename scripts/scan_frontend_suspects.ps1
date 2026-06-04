<#
.SYNOPSIS
  CarbonLedger - Varredura de suspeitos no frontend e scripts.

.DESCRIPTION
  Procura ocorrências relacionadas a:
  - taxa 0.1 ETH
  - taxa 0.001 ETH
  - parseEther
  - submeterProjeto
  - cadastrarProjeto
  - projectRegistry
  - window.ethereum
  - declare global
  - RegistroProjetosCarbono
  - contracts.generated

  A saída principal é gravada em arquivo TXT, sem despejar tudo no terminal.

.USAGE
  powershell -ExecutionPolicy Bypass -File .\scripts\scan_frontend_suspects.ps1

  Com nome personalizado:
  powershell -ExecutionPolicy Bypass -File .\scripts\scan_frontend_suspects.ps1 -OutputTxt .\scan-carbonledger-suspects-filtrado.txt
#>

param(
  [string]$OutputTxt = ".\scan-carbonledger-suspects-filtrado.txt"
)

$ErrorActionPreference = "Stop"

$Root = (Get-Location).Path

$PastasParaVarrer = @(
  "frontend\src",
  "scripts",
  "contracts",
  "deployments"
)

$ExtensoesPermitidas = @(
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".cjs",
  ".mjs",
  ".json",
  ".sol"
)

$Padroes = @(
  "0\.1",
  "0\.001",
  "parseEther",
  "submeterProjeto",
  "cadastrarProjeto",
  "projectRegistry",
  "window\.ethereum",
  "declare global",
  "eth_requestAccounts",
  "eth_accounts",
  "eth_chainId",
  "RegistroProjetosCarbono",
  "contracts\.generated",
  "obterEnderecoContrato",
  "obterRedeAtual"
)

function Escrever-Linha {
  param(
    [string]$Texto = ""
  )

  Add-Content -Path $OutputTxt -Value $Texto -Encoding UTF8
}

function Eh-ArquivoPermitido {
  param(
    [System.IO.FileInfo]$Arquivo
  )

  if ($Arquivo.FullName -match "\\node_modules\\") {
    return $false
  }

  if ($Arquivo.FullName -match "\\\.vite\\") {
    return $false
  }

  if ($Arquivo.FullName -match "\\cache\\") {
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

function Obter-ArquivosParaVarrer {
  $arquivos = @()

  foreach ($pasta in $PastasParaVarrer) {
    $caminho = Join-Path $Root $pasta

    if (-not (Test-Path $caminho)) {
      continue
    }

    $arquivos += Get-ChildItem -Path $caminho -Recurse -File | Where-Object {
      Eh-ArquivoPermitido $_
    }
  }

  return $arquivos
}

function Varrer-Arquivo {
  param(
    [System.IO.FileInfo]$Arquivo
  )

  $resultadosDoArquivo = @()

  foreach ($padrao in $Padroes) {
    $achados = Select-String `
      -Path $Arquivo.FullName `
      -Pattern $padrao `
      -CaseSensitive:$false `
      -ErrorAction SilentlyContinue

    foreach ($achado in $achados) {
      $resultadosDoArquivo += [PSCustomObject]@{
        Arquivo = $Arquivo.FullName
        Linha   = $achado.LineNumber
        Padrao  = $padrao
        Texto   = $achado.Line.Trim()
      }
    }
  }

  return $resultadosDoArquivo
}

if (Test-Path $OutputTxt) {
  Remove-Item $OutputTxt -Force
}

Escrever-Linha "=============================================="
Escrever-Linha "CarbonLedger - Varredura de suspeitos"
Escrever-Linha "=============================================="
Escrever-Linha ""
Escrever-Linha "Raiz do projeto: $Root"
Escrever-Linha "Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Escrever-Linha ""

$arquivos = Obter-ArquivosParaVarrer

Escrever-Linha "Pastas varridas:"
foreach ($pasta in $PastasParaVarrer) {
  Escrever-Linha "- $pasta"
}

Escrever-Linha ""
Escrever-Linha "Arquivos analisados: $($arquivos.Count)"
Escrever-Linha ""

$todosResultados = @()

foreach ($arquivo in $arquivos) {
  $todosResultados += Varrer-Arquivo -Arquivo $arquivo
}

Escrever-Linha "Total de ocorrências encontradas: $($todosResultados.Count)"
Escrever-Linha ""

if ($todosResultados.Count -eq 0) {
  Escrever-Linha "Nenhuma ocorrência encontrada."
}
else {
  $agrupadoPorArquivo = $todosResultados | Group-Object Arquivo

  foreach ($grupo in $agrupadoPorArquivo) {
    Escrever-Linha "----------------------------------------------"
    Escrever-Linha "ARQUIVO:"
    Escrever-Linha $grupo.Name
    Escrever-Linha "----------------------------------------------"

    $itensOrdenados = $grupo.Group | Sort-Object Linha, Padrao

    foreach ($item in $itensOrdenados) {
      Escrever-Linha ("Linha {0} | Padrão: {1}" -f $item.Linha, $item.Padrao)
      Escrever-Linha ("  {0}" -f $item.Texto)
      Escrever-Linha ""
    }
  }
}

Escrever-Linha ""
Escrever-Linha "=============================================="
Escrever-Linha "Resumo por padrão"
Escrever-Linha "=============================================="
Escrever-Linha ""

$resumoPorPadrao = $todosResultados | Group-Object Padrao | Sort-Object Name

foreach ($grupo in $resumoPorPadrao) {
  Escrever-Linha ("{0}: {1}" -f $grupo.Name, $grupo.Count)
}

Escrever-Linha ""
Escrever-Linha "=============================================="
Escrever-Linha "Resumo por arquivo"
Escrever-Linha "=============================================="
Escrever-Linha ""

$resumoPorArquivo = $todosResultados | Group-Object Arquivo | Sort-Object Count -Descending

foreach ($grupo in $resumoPorArquivo) {
  Escrever-Linha ("{0}: {1}" -f $grupo.Name, $grupo.Count)
}

Write-Host ""
Write-Host "=============================================="
Write-Host "CarbonLedger - Varredura concluída"
Write-Host "=============================================="
Write-Host ""
Write-Host "Arquivo TXT gerado:"
Write-Host $OutputTxt
Write-Host ""
Write-Host "Ocorrências encontradas:" $todosResultados.Count
Write-Host ""