/**
 * @file sync_frontend_deployments.cjs
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 *
 * @notice
 * Sincroniza os deployments e as ABIs dos contratos Solidity
 * com o frontend React e Vite do CarbonLedger.
 *
 * @dev
 * Este script gera automaticamente:
 *
 * frontend/src/config/contracts.generated.ts
 * frontend/src/config/contratos.ts
 *
 * Uso:
 *
 * node scripts/sync_frontend_deployments.cjs
 *
 * ou:
 *
 * node scripts/sync_frontend_deployments.cjs localhost
 * node scripts/sync_frontend_deployments.cjs sepolia
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();

const DEPLOYMENTS_DIR = path.join(ROOT, "deployments");

const ARTIFACTS_CONTRACTS_DIR = path.join(ROOT, "artifacts", "contracts");

const FRONTEND_CONFIG_DIR = path.join(ROOT, "frontend", "src", "config");

const OUTPUT_CONTRACTS_GENERATED = path.join(
  FRONTEND_CONFIG_DIR,
  "contracts.generated.ts"
);

const OUTPUT_CONTRATOS_TS = path.join(
  FRONTEND_CONFIG_DIR,
  "contratos.ts"
);

const REDES_CONHECIDAS = {
  localhost: {
    arquivo: "localhost.json",
    chainIdPadrao: "31337",
  },
  sepolia: {
    arquivo: "sepolia.json",
    chainIdPadrao: "11155111",
  },
};

const NOMES_CONTRATOS = [
  "TokenImpactoCarbono",
  "CreditoCarbonoToken",
  "CertificadoCompensacaoNFT",
  "RegistroOrganizacoes",
  "TesourariaCarbono",
  "RegistroProjetosCarbono",
  "ValidacaoProjetos",
  "MercadoCarbono",
  "RegistroAposentadorias",
  "StakingCarbono",
  "GovernancaCarbono",
  "MockPriceFeedChainlink",
  "AdaptadorOraculoChainlink",
];

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

function normalizarChainId(chainId, chainIdPadrao) {
  if (typeof chainId === "bigint") {
    return chainId.toString();
  }

  if (typeof chainId === "number") {
    return String(chainId);
  }

  if (typeof chainId === "string") {
    return chainId.trim();
  }

  return chainIdPadrao;
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
    "explorador",
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

function carregarDeployment(nomeRede) {
  const configRede = REDES_CONHECIDAS[nomeRede];

  if (!configRede) {
    throw new Error(`Rede não suportada pelo script de sync: ${nomeRede}`);
  }

  const caminhoDeployment = path.join(DEPLOYMENTS_DIR, configRede.arquivo);

  if (!arquivoExiste(caminhoDeployment)) {
    console.log(`PULADO: deployment não encontrado para ${nomeRede}.`);
    console.log(`Arquivo esperado: ${caminhoDeployment}`);
    console.log("");
    return null;
  }

  const deployment = lerJson(caminhoDeployment);

  const chainId = normalizarChainId(
    deployment.chainId,
    configRede.chainIdPadrao
  );

  const contratos = extrairContratosDoDeployment(deployment);

  if (!contratos || Object.keys(contratos).length === 0) {
    throw new Error(
      `Nenhum contrato foi encontrado dentro de ${configRede.arquivo}.`
    );
  }

  const deployer = deployment.deployer || deployment.contas?.admin || "";

  const geradoEm =
    deployment.dataDeploy || deployment.geradoEm || new Date().toISOString();

  return {
    nomeRede,
    chainId,
    dados: {
      projeto: deployment.projeto || "CarbonLedger",
      networkName: deployment.rede || deployment.networkName || nomeRede,
      chainId,
      deployer,
      geradoEm,
      contas: deployment.contas || {},
      contratos,
      explorador: deployment.explorador || null,
      ...contratos,
    },
  };
}

function obterRedesSolicitadas() {
  const argumento = process.argv[2];

  if (!argumento) {
    return Object.keys(REDES_CONHECIDAS);
  }

  const rede = argumento.trim().toLowerCase();

  if (!REDES_CONHECIDAS[rede]) {
    throw new Error(
      `Rede inválida: ${argumento}. Use localhost, sepolia ou nenhum argumento.`
    );
  }

  return [rede];
}

function carregarDeployments() {
  const redesSolicitadas = obterRedesSolicitadas();

  const deploymentsPorChainId = {};
  const deploymentsPorNomeRede = {};

  for (const nomeRede of redesSolicitadas) {
    const deployment = carregarDeployment(nomeRede);

    if (!deployment) {
      continue;
    }

    deploymentsPorChainId[deployment.chainId] = deployment.dados;
    deploymentsPorNomeRede[deployment.nomeRede] = deployment.dados;
  }

  if (Object.keys(deploymentsPorChainId).length === 0) {
    throw new Error("Nenhum deployment válido foi encontrado.");
  }

  return {
    deploymentsPorChainId,
    deploymentsPorNomeRede,
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

function gerarConteudoContractsGenerated(deployments, abis) {
  return `/* eslint-disable */
// Arquivo gerado automaticamente.
// Não edite manualmente.
//
// Para atualizar depois de um deploy, rode:
// node scripts/sync_frontend_deployments.cjs
//
// Também é possível sincronizar uma rede específica:
// node scripts/sync_frontend_deployments.cjs localhost
// node scripts/sync_frontend_deployments.cjs sepolia

export const DEPLOYMENTS = ${JSON.stringify(deployments, null, 2)} as const;

export const ABIS = ${JSON.stringify(abis, null, 2)} as const;

export type SupportedChainId = keyof typeof DEPLOYMENTS;
export type ContractName = keyof typeof ABIS;
`;
}

function obterEnderecoContratoOuZero(contratos, nomeContrato) {
  const endereco = contratos?.[nomeContrato];

  if (typeof endereco === "string" && endereco.startsWith("0x")) {
    return endereco;
  }

  return "0x0000000000000000000000000000000000000000";
}

function gerarBlocoRedeContratos(nomeRede, deployment) {
  const contratos = deployment?.contratos || {};

  const linhas = NOMES_CONTRATOS.map((nomeContrato) => {
    const endereco = obterEnderecoContratoOuZero(contratos, nomeContrato);
    return `    ${nomeContrato}: "${endereco}",`;
  });

  return `  ${nomeRede}: {\n${linhas.join("\n")}\n  },`;
}

function gerarConteudoContratosTs(deploymentsPorNomeRede) {
  const localhost = deploymentsPorNomeRede.localhost || null;
  const sepolia = deploymentsPorNomeRede.sepolia || null;

  const blocoLocalhost = gerarBlocoRedeContratos("localhost", localhost);
  const blocoSepolia = gerarBlocoRedeContratos("sepolia", sepolia);

  return `/* eslint-disable */
// Arquivo gerado automaticamente.
// Não edite manualmente.
//
// Para atualizar depois de um deploy, rode:
// node scripts/sync_frontend_deployments.cjs

export type NomeRedeSuportada = "localhost" | "sepolia";

export interface EnderecosContratos {
  TokenImpactoCarbono: string;
  CreditoCarbonoToken: string;
  CertificadoCompensacaoNFT: string;
  RegistroOrganizacoes: string;
  TesourariaCarbono: string;
  RegistroProjetosCarbono: string;
  ValidacaoProjetos: string;
  MercadoCarbono: string;
  RegistroAposentadorias: string;
  StakingCarbono: string;
  GovernancaCarbono: string;
  MockPriceFeedChainlink: string;
  AdaptadorOraculoChainlink: string;
}

export type IdentificadorRede = NomeRedeSuportada | string | number | bigint;

export const ENDERECO_NAO_CONFIGURADO =
  "0x0000000000000000000000000000000000000000";

export const ENDERECOS_CONTRATOS: Record<
  NomeRedeSuportada,
  EnderecosContratos
> = {
${blocoLocalhost}

${blocoSepolia}
};

export function resolverNomeRede(
  identificadorRede: IdentificadorRede
): NomeRedeSuportada {
  const valor = String(identificadorRede).trim().toLowerCase();

  if (valor === "localhost" || valor === "31337" || valor === "0x7a69") {
    return "localhost";
  }

  if (valor === "sepolia" || valor === "11155111" || valor === "0xaa36a7") {
    return "sepolia";
  }

  throw new Error(\`Rede não suportada pelo frontend: \${String(identificadorRede)}\`);
}

export function obterEnderecosContratos(
  identificadorRede: IdentificadorRede
): EnderecosContratos {
  const nomeRede = resolverNomeRede(identificadorRede);

  return ENDERECOS_CONTRATOS[nomeRede];
}

export function obterEnderecoContrato(
  identificadorRede: IdentificadorRede,
  nomeContrato: keyof EnderecosContratos
): string {
  const nomeRede = resolverNomeRede(identificadorRede);
  const endereco = ENDERECOS_CONTRATOS[nomeRede][nomeContrato];

  if (!endereco || endereco === ENDERECO_NAO_CONFIGURADO) {
    throw new Error(
      \`Contrato \${String(nomeContrato)} não configurado para a rede \${nomeRede}\`
    );
  }

  return endereco;
}
`;
}

function main() {
  console.log("");
  console.log("==============================================");
  console.log("CarbonLedger - Sync Frontend Deployments");
  console.log("==============================================");
  console.log("");

  const { deploymentsPorChainId, deploymentsPorNomeRede } = carregarDeployments();
  const abis = carregarAbisDosArtifacts();

  criarDiretorioSeNecessario(FRONTEND_CONFIG_DIR);

  const conteudoContractsGenerated = gerarConteudoContractsGenerated(
    deploymentsPorChainId,
    abis
  );

  const conteudoContratosTs = gerarConteudoContratosTs(deploymentsPorNomeRede);

  fs.writeFileSync(
    OUTPUT_CONTRACTS_GENERATED,
    conteudoContractsGenerated,
    "utf8"
  );

  fs.writeFileSync(OUTPUT_CONTRATOS_TS, conteudoContratosTs, "utf8");

  console.log(`Arquivo gerado: ${OUTPUT_CONTRACTS_GENERATED}`);
  console.log(`Arquivo gerado: ${OUTPUT_CONTRATOS_TS}`);
  console.log("");

  console.log("Redes sincronizadas:");
  console.log(Object.keys(deploymentsPorChainId));

  console.log("");
  console.log("Contratos por rede:");

  for (const [chainId, dados] of Object.entries(deploymentsPorChainId)) {
    console.log("");
    console.log(`${dados.networkName} (${chainId}):`);
    console.log(Object.keys(dados.contratos || {}));
  }

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