/**
 * @file sync_frontend_deployments.cjs
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 *
 * @notice
 * Sincroniza os deployments locais e as ABIs dos contratos Solidity
 * com o frontend React/Vite do CarbonLedger.
 *
 * @dev
 * Este script gera:
 *
 * frontend/src/config/contracts.generated.ts
 *
 * O arquivo gerado contém:
 * - DEPLOYMENTS: endereços atualizados a partir de deployments/localhost.json
 * - ABIS: ABIs extraídas dos artifacts do Hardhat
 *
 * Importante:
 * Os endereços vêm de deployments/localhost.json.
 * As ABIs vêm de artifacts/contracts.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

const DEPLOYMENT_LOCALHOST = path.join(
  ROOT,
  "deployments",
  "localhost.json"
);

const ARTIFACTS_CONTRACTS_DIR = path.join(
  ROOT,
  "artifacts",
  "contracts"
);

const FRONTEND_CONFIG_DIR = path.join(
  ROOT,
  "frontend",
  "src",
  "config"
);

const OUTPUT_FILE = path.join(
  FRONTEND_CONFIG_DIR,
  "contracts.generated.ts"
);

function arquivoExiste(caminho) {
  return fs.existsSync(caminho) && fs.statSync(caminho).isFile();
}

function diretorioExiste(caminho) {
  return fs.existsSync(caminho) && fs.statSync(caminho).isDirectory();
}

function lerJson(caminho) {
  return JSON.parse(fs.readFileSync(caminho, "utf8"));
}

function criarDiretorioSeNecessario(caminho) {
  if (!fs.existsSync(caminho)) {
    fs.mkdirSync(caminho, { recursive: true });
  }
}

function listarArquivosRecursivo(pasta) {
  if (!diretorioExiste(pasta)) {
    return [];
  }

  const entradas = fs.readdirSync(pasta, { withFileTypes: true });

  const arquivos = [];

  for (const entrada of entradas) {
    const caminhoCompleto = path.join(pasta, entrada.name);

    if (entrada.isDirectory()) {
      arquivos.push(...listarArquivosRecursivo(caminhoCompleto));
      continue;
    }

    if (entrada.isFile()) {
      arquivos.push(caminhoCompleto);
    }
  }

  return arquivos;
}

function normalizarChainId(chainId) {
  if (typeof chainId === "bigint") {
    return chainId.toString();
  }

  if (typeof chainId === "number") {
    return String(chainId);
  }

  if (typeof chainId === "string") {
    return chainId;
  }

  return "31337";
}

function extrairContratosDoDeployment(deployment) {
  if (deployment.contratos && typeof deployment.contratos === "object") {
    return deployment.contratos;
  }

  const chavesIgnoradas = new Set([
    "projeto",
    "rede",
    "networkName",
    "chainId",
    "deployer",
    "geradoEm",
    "dataDeploy",
    "contas",
    "contratos",
  ]);

  const contratos = {};

  for (const [chave, valor] of Object.entries(deployment)) {
    if (chavesIgnoradas.has(chave)) {
      continue;
    }

    if (typeof valor === "string" && valor.startsWith("0x")) {
      contratos[chave] = valor;
    }
  }

  return contratos;
}

function carregarDeploymentLocalhost() {
  if (!arquivoExiste(DEPLOYMENT_LOCALHOST)) {
    throw new Error(
      `Arquivo de deployment local não encontrado: ${DEPLOYMENT_LOCALHOST}`
    );
  }

  const deployment = lerJson(DEPLOYMENT_LOCALHOST);

  const chainId = normalizarChainId(deployment.chainId);
  const contratos = extrairContratosDoDeployment(deployment);

  if (!contratos || Object.keys(contratos).length === 0) {
    throw new Error(
      "Nenhum contrato foi encontrado dentro de deployments/localhost.json."
    );
  }

  const deployer =
    deployment.deployer ||
    deployment.contas?.admin ||
    "";

  const geradoEm =
    deployment.dataDeploy ||
    deployment.geradoEm ||
    new Date().toISOString();

  return {
    [chainId]: {
      projeto: deployment.projeto || "CarbonLedger",
      networkName: deployment.rede || deployment.networkName || "localhost",
      chainId,
      deployer,
      geradoEm,
      contratos,
      ...contratos,
    },
  };
}

function carregarAbisDosArtifacts() {
  if (!diretorioExiste(ARTIFACTS_CONTRACTS_DIR)) {
    throw new Error(
      `Pasta de artifacts não encontrada: ${ARTIFACTS_CONTRACTS_DIR}`
    );
  }

  const arquivos = listarArquivosRecursivo(ARTIFACTS_CONTRACTS_DIR);

  const abis = {};

  for (const arquivo of arquivos) {
    if (!arquivo.endsWith(".json")) {
      continue;
    }

    if (arquivo.endsWith(".dbg.json")) {
      continue;
    }

    const artifact = lerJson(arquivo);

    if (!artifact.contractName || !Array.isArray(artifact.abi)) {
      continue;
    }

    abis[artifact.contractName] = artifact.abi;
  }

  if (Object.keys(abis).length === 0) {
    throw new Error("Nenhuma ABI foi encontrada nos artifacts do Hardhat.");
  }

  return abis;
}

function gerarConteudoTs(deployments, abis) {
  return `/* eslint-disable */
// Arquivo gerado automaticamente.
// Não edite manualmente.
//
// Para atualizar depois de um deploy local, rode:
// node scripts/sync_frontend_deployments.cjs

export const DEPLOYMENTS = ${JSON.stringify(deployments, null, 2)} as const;

export const ABIS = ${JSON.stringify(abis, null, 2)} as const;

export type SupportedChainId = keyof typeof DEPLOYMENTS;
export type ContractName = keyof typeof ABIS;
`;
}

function main() {
  console.log("");
  console.log("==============================================");
  console.log("CarbonLedger - Sync Frontend Deployments");
  console.log("==============================================");
  console.log("");

  const deployments = carregarDeploymentLocalhost();
  const abis = carregarAbisDosArtifacts();

  criarDiretorioSeNecessario(FRONTEND_CONFIG_DIR);

  const conteudo = gerarConteudoTs(deployments, abis);

  fs.writeFileSync(OUTPUT_FILE, conteudo, "utf8");

  console.log(`Arquivo gerado: ${OUTPUT_FILE}`);
  console.log("");

  console.log("Redes sincronizadas:");
  console.log(Object.keys(deployments));

  console.log("");
  console.log("Contratos no deployment local:");
  console.log(Object.keys(deployments["31337"]?.contratos || deployments[Object.keys(deployments)[0]].contratos));

  console.log("");
  console.log("ABIs encontradas:");
  console.log(Object.keys(abis));

  console.log("");
  console.log("Sincronização concluída com sucesso.");
  console.log("");
}

try {
  main();
} catch (erro) {
  console.error("");
  console.error("Erro ao sincronizar frontend:");
  console.error(erro);
  process.exitCode = 1;
}
