/**
 * @file deploy_sepolia.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 *
 * @notice
 * Deploy do protocolo CarbonLedger na rede de teste Sepolia.
 *
 * @dev
 * Executar com:
 *
 * npx hardhat run scripts/deploy_sepolia.ts --network sepolia
 *
 * Requisitos no .env:
 *
 * SEPOLIA_RPC_URL=
 * SEPOLIA_DEPLOYER_PRIVATE_KEY=
 * ETHERSCAN_API_KEY=
 *
 * SEPOLIA_ADMIN_ADDRESS=
 * SEPOLIA_PROPONENTE_ADDRESS=
 * SEPOLIA_VALIDADOR1_ADDRESS=
 * SEPOLIA_VALIDADOR2_ADDRESS=
 * SEPOLIA_COMPRADOR_ADDRESS=
 * SEPOLIA_USUARIO_EXTRA_ADDRESS=
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

type ContasSepolia = {
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

function criarDiretorioSeNecessario(caminhoDiretorio: string) {
  if (!fs.existsSync(caminhoDiretorio)) {
    fs.mkdirSync(caminhoDiretorio, { recursive: true });
    console.log(`Diretório criado: ${caminhoDiretorio}`);
  }
}

function removerArquivoSeExistir(caminhoArquivo: string) {
  if (fs.existsSync(caminhoArquivo)) {
    fs.rmSync(caminhoArquivo, { force: true });
    console.log(`Arquivo removido: ${caminhoArquivo}`);
  }
}

function verificarRedeSepolia(chainId: number) {
  if (chainId !== 11155111) {
    throw new Error(
      `Este script deve ser usado apenas na Sepolia. Chain ID detectado: ${chainId}`
    );
  }
}

function obterVariavelAmbienteObrigatoria(nome: string): string {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${nome}`);
  }

  return valor;
}

function obterEnderecoAmbienteObrigatorio(nome: string): string {
  const valor = obterVariavelAmbienteObrigatoria(nome);

  if (!ethers.isAddress(valor)) {
    throw new Error(`Endereço inválido em ${nome}: ${valor}`);
  }

  return ethers.getAddress(valor);
}

function obterEnderecoAmbienteOpcional(
  nome: string,
  fallback: string
): string {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    return ethers.getAddress(fallback);
  }

  if (!ethers.isAddress(valor)) {
    throw new Error(`Endereço inválido em ${nome}: ${valor}`);
  }

  return ethers.getAddress(valor);
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

async function main() {
  console.log("\n==============================================");
  console.log("CarbonLedger - Deploy Sepolia");
  console.log("==============================================\n");

  const redeAntes = await ethers.provider.getNetwork();
  const chainIdDetectado = Number(redeAntes.chainId);

  console.log(`Chain ID detectado: ${chainIdDetectado}`);

  verificarRedeSepolia(chainIdDetectado);

  const [deployer] = await ethers.getSigners();

  const enderecoDeployer = await deployer.getAddress();
  const saldoDeployer = await ethers.provider.getBalance(enderecoDeployer);

  console.log(`Deployer: ${enderecoDeployer}`);
  console.log(`Saldo:    ${ethers.formatEther(saldoDeployer)} Sepolia ETH\n`);

  if (saldoDeployer === 0n) {
    throw new Error(
      "A conta deployer está sem Sepolia ETH. Envie Sepolia ETH antes de fazer o deploy."
    );
  }

  const contas: ContasSepolia = {
    admin: obterEnderecoAmbienteOpcional(
      "SEPOLIA_ADMIN_ADDRESS",
      enderecoDeployer
    ),
    proponente: obterEnderecoAmbienteObrigatorio(
      "SEPOLIA_PROPONENTE_ADDRESS"
    ),
    validador1: obterEnderecoAmbienteObrigatorio(
      "SEPOLIA_VALIDADOR1_ADDRESS"
    ),
    validador2: obterEnderecoAmbienteObrigatorio(
      "SEPOLIA_VALIDADOR2_ADDRESS"
    ),
    comprador: obterEnderecoAmbienteObrigatorio(
      "SEPOLIA_COMPRADOR_ADDRESS"
    ),
    usuarioExtra: obterEnderecoAmbienteOpcional(
      "SEPOLIA_USUARIO_EXTRA_ADDRESS",
      enderecoDeployer
    ),
  };

  console.log("Contas Sepolia usadas no MVP:");
  console.log(`- Admin: ${contas.admin}`);
  console.log(`- Proponente: ${contas.proponente}`);
  console.log(`- Validador 1: ${contas.validador1}`);
  console.log(`- Validador 2: ${contas.validador2}`);
  console.log(`- Comprador: ${contas.comprador}`);
  console.log(`- Usuario extra: ${contas.usuarioExtra}\n`);

  const pastaDeployments = path.join(process.cwd(), "deployments");
  const arquivoSepolia = path.join(pastaDeployments, "sepolia.json");

  criarDiretorioSeNecessario(pastaDeployments);

  console.log("Limpando deploy anterior da Sepolia, se existir...");
  removerArquivoSeExistir(arquivoSepolia);
  console.log("");

  const suprimentoInicial = ethers.parseUnits("1000000", 18);

  const tokenImpactoCarbono = await implantarContrato(
    "TokenImpactoCarbono",
    suprimentoInicial
  );

  const enderecoTokenImpactoCarbono =
    await tokenImpactoCarbono.getAddress();

  const creditoCarbonoToken = await implantarContrato(
    "CreditoCarbonoToken",
    "ipfs://carbonledger/creditos/{id}.json"
  );

  const enderecoCreditoCarbonoToken =
    await creditoCarbonoToken.getAddress();

  const certificadoCompensacaoNFT = await implantarContrato(
    "CertificadoCompensacaoNFT"
  );

  const enderecoCertificadoCompensacaoNFT =
    await certificadoCompensacaoNFT.getAddress();

  const registroOrganizacoes = await implantarContrato(
    "RegistroOrganizacoes"
  );

  const enderecoRegistroOrganizacoes =
    await registroOrganizacoes.getAddress();

  const tesourariaCarbono = await implantarContrato(
    "TesourariaCarbono",
    enderecoTokenImpactoCarbono
  );

  const enderecoTesourariaCarbono =
    await tesourariaCarbono.getAddress();

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
    `Taxa de submissão de projeto: ${ethers.formatEther(
      taxaSubmissaoProjeto
    )} ETH\n`
  );

  const validacaoProjetos = await implantarContrato(
    "ValidacaoProjetos",
    enderecoRegistroOrganizacoes,
    enderecoRegistroProjetosCarbono
  );

  const enderecoValidacaoProjetos =
    await validacaoProjetos.getAddress();

  const stakingCarbono = await implantarContrato(
    "StakingCarbono",
    enderecoTokenImpactoCarbono,
    enderecoTesourariaCarbono
  );

  const enderecoStakingCarbono =
    await stakingCarbono.getAddress();

  const mercadoCarbono = await implantarContrato(
    "MercadoCarbono",
    enderecoCreditoCarbonoToken,
    enderecoRegistroOrganizacoes,
    enderecoTesourariaCarbono
  );

  const enderecoMercadoCarbono =
    await mercadoCarbono.getAddress();

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

  const enderecoGovernancaCarbono =
    await governancaCarbono.getAddress();

  /*
   * Para o MVP na Sepolia, mantemos um mock de price feed.
   * Isso evita depender de oráculo externo durante a apresentação.
   */
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

  console.log("Cadastrando organizações Sepolia...");

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      contas.admin,
      "CarbonLedger Admin",
      "ADMIN-SEPOLIA",
      "ipfs://carbonledger/organizacoes/admin.json",
      TipoOrganizacao.Administrador
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      contas.proponente,
      "Proponente Solar",
      "PROP-SEPOLIA-001",
      "ipfs://carbonledger/organizacoes/proponente-solar.json",
      TipoOrganizacao.Proponente
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      contas.validador1,
      "Validador Ambiental 1",
      "VAL-SEPOLIA-001",
      "ipfs://carbonledger/organizacoes/validador-1.json",
      TipoOrganizacao.Validador
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      contas.validador2,
      "Validador Ambiental 2",
      "VAL-SEPOLIA-002",
      "ipfs://carbonledger/organizacoes/validador-2.json",
      TipoOrganizacao.Validador
    )
  );

  await aguardarTransacao(
    await registroOrganizacoes.cadastrarOrganizacao(
      contas.comprador,
      "Comprador Industrial",
      "COMP-SEPOLIA-001",
      "ipfs://carbonledger/organizacoes/comprador-industrial.json",
      TipoOrganizacao.Comprador
    )
  );

  console.log("Organizações Sepolia cadastradas.\n");

  const rede = await ethers.provider.getNetwork();

  const deployment = {
    projeto: "CarbonLedger",
    rede: "sepolia",
    chainId: rede.chainId,
    dataDeploy: new Date().toISOString(),
    deployer: enderecoDeployer,
    contas,
    contratos,
    explorador: {
      nome: "Sepolia Etherscan",
      urlBase: "https://sepolia.etherscan.io",
    },
  };

  fs.writeFileSync(
    arquivoSepolia,
    JSON.stringify(deployment, jsonReplacer, 2),
    "utf8"
  );

  console.log(`Arquivo gerado: ${arquivoSepolia}\n`);

  console.log("==============================================");
  console.log("Deploy Sepolia concluído com sucesso");
  console.log("==============================================\n");

  console.log("Contratos implantados:");
  console.log(JSON.stringify(contratos, null, 2));

  console.log("\nLinks no Sepolia Etherscan:");
  for (const [nome, endereco] of Object.entries(contratos)) {
    console.log(`${nome}: https://sepolia.etherscan.io/address/${endereco}`);
  }

  console.log("\nPróximos comandos sugeridos:");
  console.log("npx hardhat run scripts/setup_sepolia.ts --network sepolia");
  console.log("npx hardhat run scripts/verify_sepolia.ts --network sepolia");
  console.log("");
}

main().catch((erro) => {
  console.error("\nErro no deploy Sepolia:");
  console.error(erro);
  process.exitCode = 1;
});