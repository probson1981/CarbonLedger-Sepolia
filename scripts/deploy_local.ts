/**
 * @file deploy_local.ts
 * @author Patrício Alves
 *
 * @notice
 * Deploy local completo do protocolo CarbonLedger.
 *
 * @dev
 * Executar com um Hardhat node local já aberto:
 *
 * npx hardhat run scripts/deploy_local.ts --network localhost
 */

import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const { ethers } = await network.connect();

const ENDERECO_ZERO = "0x0000000000000000000000000000000000000000";

const TipoOrganizacao = {
  Nenhum: 0,
  Proponente: 1,
  Validador: 2,
  Comprador: 3,
  Administrador: 4,
} as const;

type ContasLocais = {
  admin: string;
  proponente: string;
  validador1: string;
  validador2: string;
  comprador: string;
  usuarioExtra: string;
};

type ContratosDeploy = {
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
};

function jsonReplacer(_chave: string, valor: unknown) {
  if (typeof valor === "bigint") {
    return valor.toString();
  }

  return valor;
}

function removerArquivoSeExistir(caminhoArquivo: string) {
  if (fs.existsSync(caminhoArquivo)) {
    fs.rmSync(caminhoArquivo, { force: true });
    console.log(`Arquivo removido: ${caminhoArquivo}`);
  }
}

function criarDiretorioSeNecessario(caminhoDiretorio: string) {
  if (!fs.existsSync(caminhoDiretorio)) {
    fs.mkdirSync(caminhoDiretorio, { recursive: true });
    console.log(`Diretório criado: ${caminhoDiretorio}`);
  }
}

function fazerBackupSeExistir(caminhoArquivo: string) {
  if (!fs.existsSync(caminhoArquivo)) {
    return;
  }

  const pasta = path.dirname(caminhoArquivo);
  const extensao = path.extname(caminhoArquivo);
  const nomeBase = path.basename(caminhoArquivo, extensao);

  const data = new Date()
    .toISOString()
    .replaceAll(":", "-")
    .replaceAll(".", "-");

  const caminhoBackup = path.join(
    pasta,
    `${nomeBase}.backup-${data}${extensao}`
  );

  fs.copyFileSync(caminhoArquivo, caminhoBackup);

  console.log(`Backup criado: ${caminhoBackup}`);
}

function verificarRedeLocal(chainId: number) {
  const redeLocal = chainId === 31337 || chainId === 1337;

  if (!redeLocal) {
    throw new Error(
      `Este script deve ser usado apenas em rede local. Chain ID detectado: ${chainId}`
    );
  }
}

async function aguardarTransacao(tx: { wait: () => Promise<unknown> }) {
  await tx.wait();
}

async function implantarContrato(
  nomeContrato: string,
  ...args: unknown[]
): Promise<any> {
  console.log(`Implantando ${nomeContrato}...`);

  const factory = await ethers.getContractFactory(nomeContrato);
  const contrato = await factory.deploy(...args);

  await contrato.waitForDeployment();

  const endereco = await contrato.getAddress();

  console.log(`${nomeContrato}: ${endereco}\n`);

  return contrato;
}

function gerarArquivoContratosTs(contratos: ContratosDeploy) {
  return `/**
 * @file contratos.ts
 * @author Patrício Alves
 *
 * @notice
 * Arquivo gerado automaticamente pelo script scripts/deploy_local.ts.
 */

import type { NomeRedeSuportada } from "./redes";

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
  "${ENDERECO_ZERO}";

export const ENDERECOS_CONTRATOS: Record<
  NomeRedeSuportada,
  EnderecosContratos
> = {
  localhost: {
    TokenImpactoCarbono: "${contratos.TokenImpactoCarbono}",
    CreditoCarbonoToken: "${contratos.CreditoCarbonoToken}",
    CertificadoCompensacaoNFT: "${contratos.CertificadoCompensacaoNFT}",
    RegistroOrganizacoes: "${contratos.RegistroOrganizacoes}",
    TesourariaCarbono: "${contratos.TesourariaCarbono}",
    RegistroProjetosCarbono: "${contratos.RegistroProjetosCarbono}",
    ValidacaoProjetos: "${contratos.ValidacaoProjetos}",
    MercadoCarbono: "${contratos.MercadoCarbono}",
    RegistroAposentadorias: "${contratos.RegistroAposentadorias}",
    StakingCarbono: "${contratos.StakingCarbono}",
    GovernancaCarbono: "${contratos.GovernancaCarbono}",
    MockPriceFeedChainlink: "${contratos.MockPriceFeedChainlink}",
    AdaptadorOraculoChainlink: "${contratos.AdaptadorOraculoChainlink}",
  },

  sepolia: {
    TokenImpactoCarbono: ENDERECO_NAO_CONFIGURADO,
    CreditoCarbonoToken: ENDERECO_NAO_CONFIGURADO,
    CertificadoCompensacaoNFT: ENDERECO_NAO_CONFIGURADO,
    RegistroOrganizacoes: ENDERECO_NAO_CONFIGURADO,
    TesourariaCarbono: ENDERECO_NAO_CONFIGURADO,
    RegistroProjetosCarbono: ENDERECO_NAO_CONFIGURADO,
    ValidacaoProjetos: ENDERECO_NAO_CONFIGURADO,
    MercadoCarbono: ENDERECO_NAO_CONFIGURADO,
    RegistroAposentadorias: ENDERECO_NAO_CONFIGURADO,
    StakingCarbono: ENDERECO_NAO_CONFIGURADO,
    GovernancaCarbono: ENDERECO_NAO_CONFIGURADO,
    MockPriceFeedChainlink: ENDERECO_NAO_CONFIGURADO,
    AdaptadorOraculoChainlink: ENDERECO_NAO_CONFIGURADO,
  },
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

  throw new Error(
    \`Rede não suportada pelo frontend: \${String(identificadorRede)}\`
  );
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
      \`Contrato \${nomeContrato} nao configurado para a rede \${nomeRede}\`
    );
  }

  return endereco;
}
`;
}

function gerarArquivoContasLocaisTs(contas: ContasLocais) {
  return `/**
 * @file contasLocais.ts
 * @author Patrício Alves
 *
 * @notice
 * Arquivo gerado automaticamente pelo script scripts/deploy_local.ts.
 */

export type PapelContaLocal =
  | "Administrador"
  | "Proponente"
  | "Validador"
  | "Comprador"
  | "Usuario";

export interface ContaLocal {
  chave: string;
  nome: string;
  papel: PapelContaLocal;
  endereco: string;
}

export const CONTAS_LOCAIS: Record<string, ContaLocal> = {
  admin: {
    chave: "admin",
    nome: "CarbonLedger Admin",
    papel: "Administrador",
    endereco: "${contas.admin}",
  },

  proponente: {
    chave: "proponente",
    nome: "Proponente Solar",
    papel: "Proponente",
    endereco: "${contas.proponente}",
  },

  validador1: {
    chave: "validador1",
    nome: "Validador Ambiental 1",
    papel: "Validador",
    endereco: "${contas.validador1}",
  },

  validador2: {
    chave: "validador2",
    nome: "Validador Ambiental 2",
    papel: "Validador",
    endereco: "${contas.validador2}",
  },

  comprador: {
    chave: "comprador",
    nome: "Comprador Industrial",
    papel: "Comprador",
    endereco: "${contas.comprador}",
  },

  usuarioExtra: {
    chave: "usuarioExtra",
    nome: "Usuario Extra",
    papel: "Usuario",
    endereco: "${contas.usuarioExtra}",
  },
};

function normalizarEndereco(endereco: string): string {
  return endereco.trim().toLowerCase();
}

export function obterContaLocalPorEndereco(
  endereco: string
): ContaLocal | undefined {
  const enderecoNormalizado = normalizarEndereco(endereco);

  return Object.values(CONTAS_LOCAIS).find(
    (conta) => normalizarEndereco(conta.endereco) === enderecoNormalizado
  );
}

export function descreverContaLocal(endereco: string): string {
  const conta = obterContaLocalPorEndereco(endereco);

  if (!conta) {
    return \`Conta nao mapeada: \${endereco}\`;
  }

  return \`\${conta.nome} - \${conta.papel}\`;
}
`;
}

async function main() {
  console.log("\n==============================================");
  console.log("CarbonLedger - Deploy Local Completo");
  console.log("==============================================\n");

  const redeAntes = await ethers.provider.getNetwork();
  const chainIdDetectado = Number(redeAntes.chainId);

  console.log(`Chain ID detectado: ${chainIdDetectado}`);

  verificarRedeLocal(chainIdDetectado);

  console.log("");
  console.log("Aviso:");
  console.log(
    "Este script nao executa hardhat_reset. Para limpar a blockchain local,"
  );
  console.log("reinicie manualmente o terminal onde roda npx hardhat node.");
  console.log("");

  const pastaDeployments = path.join(process.cwd(), "deployments");
  const arquivoLocalhost = path.join(pastaDeployments, "localhost.json");

  const pastaConfigFrontend = path.join(
    process.cwd(),
    "frontend",
    "src",
    "config"
  );

  const arquivoContratosTs = path.join(pastaConfigFrontend, "contratos.ts");

  const arquivoContasLocaisTs = path.join(
    pastaConfigFrontend,
    "contasLocais.ts"
  );

  criarDiretorioSeNecessario(pastaDeployments);
  criarDiretorioSeNecessario(pastaConfigFrontend);

  console.log("Limpando arquivos gerados anteriormente...");
  removerArquivoSeExistir(arquivoLocalhost);
  fazerBackupSeExistir(arquivoContratosTs);
  fazerBackupSeExistir(arquivoContasLocaisTs);
  console.log("");

  const [
    admin,
    proponente,
    validador1,
    validador2,
    comprador,
    usuarioExtra,
  ] = await ethers.getSigners();

  const rede = await ethers.provider.getNetwork();

  console.log("Contas locais usadas no deploy:");
  console.log(`- Admin: ${admin.address}`);
  console.log(`- Proponente: ${proponente.address}`);
  console.log(`- Validador 1: ${validador1.address}`);
  console.log(`- Validador 2: ${validador2.address}`);
  console.log(`- Comprador: ${comprador.address}`);
  console.log(`- Usuario extra: ${usuarioExtra.address}\n`);

  const suprimentoInicial = ethers.parseUnits("1000000", 18);

  const tokenImpactoCarbono = await implantarContrato(
    "TokenImpactoCarbono",
    suprimentoInicial
  );

  const enderecoTokenImpactoCarbono = await tokenImpactoCarbono.getAddress();

  const creditoCarbonoToken = await implantarContrato(
    "CreditoCarbonoToken",
    "ipfs://carbonledger/creditos/{id}.json"
  );

  const enderecoCreditoCarbonoToken = await creditoCarbonoToken.getAddress();

  const certificadoCompensacaoNFT = await implantarContrato(
    "CertificadoCompensacaoNFT"
  );

  const enderecoCertificadoCompensacaoNFT =
    await certificadoCompensacaoNFT.getAddress();

  const registroOrganizacoes = await implantarContrato("RegistroOrganizacoes");

  const enderecoRegistroOrganizacoes = await registroOrganizacoes.getAddress();

  const tesourariaCarbono = await implantarContrato(
    "TesourariaCarbono",
    enderecoTokenImpactoCarbono
  );

  const enderecoTesourariaCarbono = await tesourariaCarbono.getAddress();

  const registroProjetosCarbono = await implantarContrato(
    "RegistroProjetosCarbono",
    enderecoRegistroOrganizacoes,
    enderecoTesourariaCarbono
  );

  const enderecoRegistroProjetosCarbono =
    await registroProjetosCarbono.getAddress();

  const taxaSubmissaoProjeto =
    await registroProjetosCarbono.taxaSubmissaoProjeto();

  console.log(
    `Taxa de submissao de projeto: ${ethers.formatEther(
      taxaSubmissaoProjeto
    )} ETH\n`
  );

  const validacaoProjetos = await implantarContrato(
    "ValidacaoProjetos",
    enderecoRegistroOrganizacoes,
    enderecoRegistroProjetosCarbono
  );

  const enderecoValidacaoProjetos = await validacaoProjetos.getAddress();

  const stakingCarbono = await implantarContrato(
    "StakingCarbono",
    enderecoTokenImpactoCarbono,
    enderecoTesourariaCarbono
  );

  const enderecoStakingCarbono = await stakingCarbono.getAddress();

  const mercadoCarbono = await implantarContrato(
    "MercadoCarbono",
    enderecoCreditoCarbonoToken,
    enderecoRegistroOrganizacoes,
    enderecoTesourariaCarbono
  );

  const enderecoMercadoCarbono = await mercadoCarbono.getAddress();

  const registroAposentadorias = await implantarContrato(
    "RegistroAposentadorias",
    enderecoRegistroOrganizacoes,
    enderecoCreditoCarbonoToken,
    enderecoCertificadoCompensacaoNFT,
    enderecoTesourariaCarbono
  );

  const enderecoRegistroAposentadorias =
    await registroAposentadorias.getAddress();

  const governancaCarbono = await implantarContrato(
    "GovernancaCarbono",
    enderecoTokenImpactoCarbono
  );

  const enderecoGovernancaCarbono = await governancaCarbono.getAddress();

  const precoInicialETHUSD = ethers.parseUnits("3500", 8);

  const mockPriceFeedChainlink = await implantarContrato(
    "MockPriceFeedChainlink",
    8,
    "ETH / USD",
    1,
    precoInicialETHUSD
  );

  const enderecoMockPriceFeedChainlink =
    await mockPriceFeedChainlink.getAddress();

  const adaptadorOraculoChainlink = await implantarContrato(
    "AdaptadorOraculoChainlink",
    enderecoMockPriceFeedChainlink
  );

  const enderecoAdaptadorOraculoChainlink =
    await adaptadorOraculoChainlink.getAddress();

  const contratos: ContratosDeploy = {
    TokenImpactoCarbono: enderecoTokenImpactoCarbono,
    CreditoCarbonoToken: enderecoCreditoCarbonoToken,
    CertificadoCompensacaoNFT: enderecoCertificadoCompensacaoNFT,
    RegistroOrganizacoes: enderecoRegistroOrganizacoes,
    TesourariaCarbono: enderecoTesourariaCarbono,
    RegistroProjetosCarbono: enderecoRegistroProjetosCarbono,
    ValidacaoProjetos: enderecoValidacaoProjetos,
    MercadoCarbono: enderecoMercadoCarbono,
    RegistroAposentadorias: enderecoRegistroAposentadorias,
    StakingCarbono: enderecoStakingCarbono,
    GovernancaCarbono: enderecoGovernancaCarbono,
    MockPriceFeedChainlink: enderecoMockPriceFeedChainlink,
    AdaptadorOraculoChainlink: enderecoAdaptadorOraculoChainlink,
  };

  console.log("Cadastrando organizacoes locais...");

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      admin.address,
      "CarbonLedger Admin",
      "ADMIN-LOCAL",
      "ipfs://carbonledger/organizacoes/admin.json",
      TipoOrganizacao.Administrador
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      proponente.address,
      "Proponente Solar",
      "PROP-LOCAL-001",
      "ipfs://carbonledger/organizacoes/proponente-solar.json",
      TipoOrganizacao.Proponente
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      validador1.address,
      "Validador Ambiental 1",
      "VAL-LOCAL-001",
      "ipfs://carbonledger/organizacoes/validador-1.json",
      TipoOrganizacao.Validador
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      validador2.address,
      "Validador Ambiental 2",
      "VAL-LOCAL-002",
      "ipfs://carbonledger/organizacoes/validador-2.json",
      TipoOrganizacao.Validador
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      comprador.address,
      "Comprador Industrial",
      "COMP-LOCAL-001",
      "ipfs://carbonledger/organizacoes/comprador-industrial.json",
      TipoOrganizacao.Comprador
    )
  );

  console.log("Organizacoes locais cadastradas.\n");

  const contas: ContasLocais = {
    admin: admin.address,
    proponente: proponente.address,
    validador1: validador1.address,
    validador2: validador2.address,
    comprador: comprador.address,
    usuarioExtra: usuarioExtra.address,
  };

  const deployment = {
    projeto: "CarbonLedger",
    rede: "localhost",
    chainId: rede.chainId,
    dataDeploy: new Date().toISOString(),
    contas,
    contratos,
  };

  fs.writeFileSync(
    arquivoLocalhost,
    JSON.stringify(deployment, jsonReplacer, 2),
    "utf8"
  );

  console.log(`Arquivo gerado: ${arquivoLocalhost}`);

  const conteudoContratosTs = gerarArquivoContratosTs(contratos);
  fs.writeFileSync(arquivoContratosTs, conteudoContratosTs, "utf8");

  console.log(`Arquivo atualizado: ${arquivoContratosTs}`);

  const conteudoContasLocaisTs = gerarArquivoContasLocaisTs(contas);
  fs.writeFileSync(arquivoContasLocaisTs, conteudoContasLocaisTs, "utf8");

  console.log(`Arquivo atualizado: ${arquivoContasLocaisTs}\n`);

  console.log("==============================================");
  console.log("Deploy local completo concluido com sucesso");
  console.log("==============================================\n");

  console.log("Contratos implantados:");
  console.log(JSON.stringify(contratos, null, 2));

  console.log("\nContas para usar no MetaMask:");
  console.log(`Admin: ${admin.address}`);
  console.log(`Proponente: ${proponente.address}`);
  console.log(`Validador 1: ${validador1.address}`);
  console.log(`Validador 2: ${validador2.address}`);
  console.log(`Comprador: ${comprador.address}`);

  console.log("\nPróximos comandos sugeridos:");
  console.log("npx hardhat run scripts/setup_local.ts --network localhost");
  console.log("node scripts/sync_frontend_deployments.cjs");

  console.log("\nAgora selecione no MetaMask:");
  console.log("- Rede: Hardhat Localhost");
  console.log("- Conta correspondente ao Proponente Solar");
  console.log("");
}

main().catch((erro) => {
  console.error("\nErro no deploy local:");
  console.error(erro);
  process.exitCode = 1;
});