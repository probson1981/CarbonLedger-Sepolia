/**
 * @file setup_local.ts
 * @author Patrício Alves
 * @notice Script de configuração local dos contratos do CarbonLedger.
 *
 * @dev
 * Este script deve ser executado depois do deploy_local.ts.
 *
 * MVP atual:
 * - Mantém os contratos completos implantados.
 * - Mantém as permissões entre os contratos.
 * - Desativa temporariamente a exigência de staking para validação.
 * - Configura votação curta com prazo de 60 segundos.
 * - Configura quórum mínimo de 1 voto.
 * - Mantém taxa de submissão de projeto em 0.001 ETH.
 *
 * Objetivo imediato:
 * - permitir cadastro de projeto pelo proponente;
 * - permitir validação simplificada por validador cadastrado;
 * - permitir iniciar votação;
 * - permitir aprovar ou rejeitar;
 * - permitir encerrar votação após prazo curto.
 */

import fs from "node:fs";
import path from "node:path";
import { network } from "hardhat";

const ENDERECO_ZERO = "0x0000000000000000000000000000000000000000";

type EthersRuntime = any;

let ethersRuntime: EthersRuntime | null = null;

function obterEthers(): EthersRuntime {
  if (!ethersRuntime) {
    throw new Error(
      "Ethers ainda não foi inicializado. Chame network.connect() antes."
    );
  }

  return ethersRuntime;
}

type EnderecosContratos = {
  TokenImpactoCarbono?: string;
  CreditoCarbonoToken?: string;
  CertificadoCompensacaoNFT?: string;
  RegistroOrganizacoes?: string;
  TesourariaCarbono?: string;
  RegistroProjetosCarbono?: string;
  ValidacaoProjetos?: string;
  MercadoCarbono?: string;
  RegistroAposentadorias?: string;
  StakingCarbono?: string;
  GovernancaCarbono?: string;
  MockPriceFeedChainlink?: string;
  AdaptadorOraculoChainlink?: string;
};

type DadosDeployLocal = {
  projeto?: string;
  rede?: string;
  networkName?: string;
  chainId?: string | number;
  deployer?: string;
  geradoEm?: string;
  dataDeploy?: string;
  contratos: EnderecosContratos;
};

type StatusEtapa = "executada" | "ja_configurada" | "pulada" | "erro";

type EtapaSetup = {
  etapa: string;
  status: StatusEtapa;
  motivo?: string;
  txHash?: string;
  bloco?: number;
};

type ResultadoStakingValidacao = {
  enderecoStaking: string;
  exigirStakeMinimo: boolean;
  stakeMinimoValidador: string;
};

type ResultadoParametrosVotacao = {
  prazoVotacaoSegundos: string;
  quorumMinimo: string;
};

const DIRETORIO_DEPLOYMENTS = path.join(process.cwd(), "deployments");

const ARQUIVO_DEPLOY_LOCAL = path.join(
  DIRETORIO_DEPLOYMENTS,
  "localhost.json"
);

const ARQUIVO_SETUP_LOCAL = path.join(
  DIRETORIO_DEPLOYMENTS,
  "localhost.setup.json"
);

const etapasSetup: EtapaSetup[] = [];

function registrarEtapa(etapa: EtapaSetup): void {
  etapasSetup.push(etapa);
}

function normalizarEndereco(endereco: string | undefined): string {
  return (endereco ?? "").trim().toLowerCase();
}

function enderecoConfigurado(endereco: string | undefined): endereco is string {
  const enderecoNormalizado = normalizarEndereco(endereco);

  return (
    enderecoNormalizado.length > 0 &&
    enderecoNormalizado !== normalizarEndereco(ENDERECO_ZERO)
  );
}

function obterEnderecoObrigatorio(
  nomeContrato: string,
  endereco: string | undefined
): string {
  if (!enderecoConfigurado(endereco)) {
    throw new Error(
      `${nomeContrato} não está configurado em deployments/localhost.json. Endereço: ${
        endereco ?? "indefinido"
      }`
    );
  }

  return endereco;
}

async function enderecoPossuiContrato(
  endereco: string | undefined
): Promise<boolean> {
  if (!enderecoConfigurado(endereco)) {
    return false;
  }

  const ethers = obterEthers();
  const codigo = await ethers.provider.getCode(endereco);

  return codigo !== "0x";
}

function carregarDeployLocal(): DadosDeployLocal {
  if (!fs.existsSync(ARQUIVO_DEPLOY_LOCAL)) {
    throw new Error(`Arquivo de deploy não encontrado: ${ARQUIVO_DEPLOY_LOCAL}`);
  }

  const conteudo = fs.readFileSync(ARQUIVO_DEPLOY_LOCAL, "utf8");

  return JSON.parse(conteudo) as DadosDeployLocal;
}

function salvarRelatorioSetup(relatorio: unknown): void {
  if (!fs.existsSync(DIRETORIO_DEPLOYMENTS)) {
    fs.mkdirSync(DIRETORIO_DEPLOYMENTS, { recursive: true });
  }

  fs.writeFileSync(
    ARQUIVO_SETUP_LOCAL,
    JSON.stringify(relatorio, null, 2),
    "utf8"
  );
}

async function carregarContratoObrigatorio(
  nomeContrato: string,
  endereco: string | undefined
): Promise<any> {
  const ethers = obterEthers();
  const enderecoSeguro = obterEnderecoObrigatorio(nomeContrato, endereco);

  const possuiCodigo = await enderecoPossuiContrato(enderecoSeguro);

  if (!possuiCodigo) {
    throw new Error(
      `${nomeContrato} não possui bytecode no endereço ${enderecoSeguro}. Rode o deploy local novamente.`
    );
  }

  return ethers.getContractAt(nomeContrato, enderecoSeguro);
}

async function carregarContratoOpcional(
  nomeContrato: string,
  endereco: string | undefined
): Promise<any | null> {
  const ethers = obterEthers();

  if (!enderecoConfigurado(endereco)) {
    registrarEtapa({
      etapa: `Carregar ${nomeContrato}`,
      status: "pulada",
      motivo: `${nomeContrato} está com endereço zero ou indefinido.`,
    });

    console.log(`PULADO: ${nomeContrato} está com endereço zero ou indefinido.`);

    return null;
  }

  const possuiCodigo = await enderecoPossuiContrato(endereco);

  if (!possuiCodigo) {
    registrarEtapa({
      etapa: `Carregar ${nomeContrato}`,
      status: "pulada",
      motivo: `${nomeContrato} não possui bytecode no endereço ${endereco}.`,
    });

    console.log(
      `PULADO: ${nomeContrato} não possui bytecode no endereço ${endereco}.`
    );

    return null;
  }

  return ethers.getContractAt(nomeContrato, endereco);
}

async function executarTransacao(
  descricao: string,
  acao: () => Promise<any>
): Promise<any> {
  console.log(`Executando: ${descricao}`);

  const tx = await acao();

  console.log(`  tx: ${tx.hash}`);

  const recibo = await tx.wait();

  console.log(`  confirmado no bloco: ${recibo?.blockNumber}`);
  console.log("");

  registrarEtapa({
    etapa: descricao,
    status: "executada",
    txHash: tx.hash,
    bloco: recibo?.blockNumber,
  });

  return recibo;
}

async function garantirAutorizacao(params: {
  nomeContratoControle: string;
  contratoControle: any;
  nomeContratoAutorizado: string;
  enderecoContratoAutorizado: string | undefined;
}): Promise<boolean> {
  const {
    nomeContratoControle,
    contratoControle,
    nomeContratoAutorizado,
    enderecoContratoAutorizado,
  } = params;

  const descricao = `${nomeContratoControle}.autorizarContrato(${nomeContratoAutorizado}, true)`;

  if (!enderecoConfigurado(enderecoContratoAutorizado)) {
    registrarEtapa({
      etapa: descricao,
      status: "pulada",
      motivo: `${nomeContratoAutorizado} está com endereço zero ou indefinido.`,
    });

    console.log(
      `PULADO: ${descricao}. ${nomeContratoAutorizado} está com endereço zero ou indefinido.`
    );
    console.log("");

    return false;
  }

  const possuiCodigo = await enderecoPossuiContrato(enderecoContratoAutorizado);

  if (!possuiCodigo) {
    registrarEtapa({
      etapa: descricao,
      status: "pulada",
      motivo: `${nomeContratoAutorizado} não possui bytecode no endereço ${enderecoContratoAutorizado}.`,
    });

    console.log(
      `PULADO: ${descricao}. ${nomeContratoAutorizado} não possui bytecode no endereço ${enderecoContratoAutorizado}.`
    );
    console.log("");

    return false;
  }

  const jaAutorizado = await contratoControle.contratosAutorizados(
    enderecoContratoAutorizado
  );

  if (jaAutorizado) {
    registrarEtapa({
      etapa: descricao,
      status: "ja_configurada",
      motivo: `${nomeContratoAutorizado} já estava autorizado em ${nomeContratoControle}.`,
    });

    console.log(
      `OK: ${nomeContratoAutorizado} já está autorizado em ${nomeContratoControle}`
    );
    console.log("");

    return true;
  }

  await executarTransacao(descricao, () =>
    contratoControle.autorizarContrato(enderecoContratoAutorizado, true)
  );

  return true;
}

async function consultarAutorizacaoSegura(
  contratoControle: any,
  enderecoContratoAutorizado: string | undefined
): Promise<boolean> {
  if (!enderecoConfigurado(enderecoContratoAutorizado)) {
    return false;
  }

  const possuiCodigo = await enderecoPossuiContrato(enderecoContratoAutorizado);

  if (!possuiCodigo) {
    return false;
  }

  return contratoControle.contratosAutorizados(enderecoContratoAutorizado);
}

async function configurarParametrosVotacaoMVP(
  validacaoProjetos: any | null
): Promise<ResultadoParametrosVotacao> {
  const prazoVotacaoMVP = 60n;
  const quorumMinimoMVP = 1n;

  const descricao = "ValidacaoProjetos.alterarParametrosVotacao(60 segundos, 1 voto)";

  if (!validacaoProjetos) {
    registrarEtapa({
      etapa: descricao,
      status: "pulada",
      motivo: "ValidacaoProjetos não está implantado.",
    });

    console.log(`PULADO: ${descricao}. ValidacaoProjetos não está implantado.`);
    console.log("");

    return {
      prazoVotacaoSegundos: prazoVotacaoMVP.toString(),
      quorumMinimo: quorumMinimoMVP.toString(),
    };
  }

  let prazoAtual = 0n;
  let quorumAtual = 0n;

  try {
    prazoAtual = BigInt((await validacaoProjetos.prazoVotacao()).toString());
    quorumAtual = BigInt((await validacaoProjetos.quorumMinimo()).toString());
  } catch {
    prazoAtual = 0n;
    quorumAtual = 0n;
  }

  const parametrosJaConfigurados =
    prazoAtual === prazoVotacaoMVP && quorumAtual === quorumMinimoMVP;

  if (parametrosJaConfigurados) {
    registrarEtapa({
      etapa: descricao,
      status: "ja_configurada",
      motivo: "Parâmetros de votação do MVP já estavam configurados.",
    });

    console.log("OK: Parâmetros de votação do MVP já estavam configurados.");
    console.log("");
  } else {
    await executarTransacao(descricao, () =>
      validacaoProjetos.alterarParametrosVotacao(
        prazoVotacaoMVP,
        quorumMinimoMVP
      )
    );
  }

  let prazoFinal = prazoVotacaoMVP;
  let quorumFinal = quorumMinimoMVP;

  try {
    prazoFinal = BigInt((await validacaoProjetos.prazoVotacao()).toString());
    quorumFinal = BigInt((await validacaoProjetos.quorumMinimo()).toString());
  } catch {
    prazoFinal = prazoVotacaoMVP;
    quorumFinal = quorumMinimoMVP;
  }

  return {
    prazoVotacaoSegundos: prazoFinal.toString(),
    quorumMinimo: quorumFinal.toString(),
  };
}

async function configurarStakeValidacaoMVP(
  validacaoProjetos: any | null
): Promise<ResultadoStakingValidacao> {
  const descricao =
    "ValidacaoProjetos.configurarStakeValidador(sem staking para MVP)";

  if (!validacaoProjetos) {
    registrarEtapa({
      etapa: descricao,
      status: "pulada",
      motivo: "ValidacaoProjetos não está implantado.",
    });

    console.log(`PULADO: ${descricao}. ValidacaoProjetos não está implantado.`);
    console.log("");

    return {
      enderecoStaking: ENDERECO_ZERO,
      exigirStakeMinimo: false,
      stakeMinimoValidador: "0",
    };
  }

  const enderecoStakingAtual = await validacaoProjetos.stakingCarbono();
  const exigirStakeAtual = await validacaoProjetos.exigirStakeMinimo();
  const stakeMinimoAtual = await validacaoProjetos.stakeMinimoValidador();

  const stakingMVPJaConfigurado =
    normalizarEndereco(enderecoStakingAtual) === normalizarEndereco(ENDERECO_ZERO) &&
    exigirStakeAtual === false &&
    BigInt(stakeMinimoAtual.toString()) === 0n;

  if (stakingMVPJaConfigurado) {
    registrarEtapa({
      etapa: descricao,
      status: "ja_configurada",
      motivo: "Validação MVP já estava configurada sem staking obrigatório.",
    });

    console.log("OK: Validação MVP já está configurada sem staking obrigatório.");
    console.log("");
  } else {
    await executarTransacao(descricao, () =>
      validacaoProjetos.configurarStakeValidador(ENDERECO_ZERO, false, 0)
    );
  }

  return {
    enderecoStaking: await validacaoProjetos.stakingCarbono(),
    exigirStakeMinimo: await validacaoProjetos.exigirStakeMinimo(),
    stakeMinimoValidador: (
      await validacaoProjetos.stakeMinimoValidador()
    ).toString(),
  };
}

async function depositarReservaTesourariaSePossivel(params: {
  tokenImpactoCarbono: any;
  tesourariaCarbono: any;
  enderecoTesouraria: string;
}): Promise<void> {
  const { tokenImpactoCarbono, tesourariaCarbono, enderecoTesouraria } = params;

  const ethers = obterEthers();

  const reservaInicialTIC = ethers.parseUnits("100000", 18);
  const saldoTICTesouraria = await tesourariaCarbono.saldoTIC();

  if (saldoTICTesouraria >= reservaInicialTIC) {
    registrarEtapa({
      etapa: "TesourariaCarbono.depositarTIC(100000 TIC)",
      status: "ja_configurada",
      motivo: "Tesouraria já possui reserva TIC suficiente.",
    });

    console.log(
      `OK: Tesouraria já possui reserva TIC suficiente: ${ethers.formatUnits(
        saldoTICTesouraria,
        18
      )} TIC`
    );
    console.log("");

    return;
  }

  await executarTransacao(
    "TokenImpactoCarbono.approve(TesourariaCarbono, 100000 TIC)",
    () => tokenImpactoCarbono.approve(enderecoTesouraria, reservaInicialTIC)
  );

  await executarTransacao("TesourariaCarbono.depositarTIC(100000 TIC)", () =>
    tesourariaCarbono.depositarTIC(
      reservaInicialTIC,
      "reserva inicial para recompensas de staking"
    )
  );
}

async function main(): Promise<void> {
  console.log("");
  console.log("Iniciando setup local do CarbonLedger...");
  console.log("");

  const conexao = await network.connect();
  ethersRuntime = conexao.ethers;

  const ethers = obterEthers();

  const dadosDeploy = carregarDeployLocal();

  const [deployer] = await ethers.getSigners();

  const enderecoDeployer = await deployer.getAddress();
  const saldoDeployer = await ethers.provider.getBalance(enderecoDeployer);

  const rede = dadosDeploy.rede ?? dadosDeploy.networkName ?? "localhost";
  const chainId = String(dadosDeploy.chainId ?? "31337");

  console.log(`Rede:     ${rede}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Deployer: ${enderecoDeployer}`);
  console.log(`Saldo:    ${ethers.formatEther(saldoDeployer)} ETH`);
  console.log("");

  const enderecos = dadosDeploy.contratos;

  console.log("Carregando contratos obrigatórios...");
  console.log("");

  const tokenImpactoCarbono = await carregarContratoObrigatorio(
    "TokenImpactoCarbono",
    enderecos.TokenImpactoCarbono
  );

  const creditoCarbonoToken = await carregarContratoObrigatorio(
    "CreditoCarbonoToken",
    enderecos.CreditoCarbonoToken
  );

  const certificadoCompensacaoNFT = await carregarContratoObrigatorio(
    "CertificadoCompensacaoNFT",
    enderecos.CertificadoCompensacaoNFT
  );

  const tesourariaCarbono = await carregarContratoObrigatorio(
    "TesourariaCarbono",
    enderecos.TesourariaCarbono
  );

  const registroProjetosCarbono = await carregarContratoObrigatorio(
    "RegistroProjetosCarbono",
    enderecos.RegistroProjetosCarbono
  );

  console.log("");
  console.log("Carregando contratos opcionais...");
  console.log("");

  const validacaoProjetos = await carregarContratoOpcional(
    "ValidacaoProjetos",
    enderecos.ValidacaoProjetos
  );

  await carregarContratoOpcional("MercadoCarbono", enderecos.MercadoCarbono);

  await carregarContratoOpcional(
    "RegistroAposentadorias",
    enderecos.RegistroAposentadorias
  );

  await carregarContratoOpcional("StakingCarbono", enderecos.StakingCarbono);

  await carregarContratoOpcional(
    "GovernancaCarbono",
    enderecos.GovernancaCarbono
  );

  await carregarContratoOpcional(
    "AdaptadorOraculoChainlink",
    enderecos.AdaptadorOraculoChainlink
  );

  console.log("");
  console.log("Configurando permissões disponíveis...");
  console.log("");

  const validacaoAutorizada = await garantirAutorizacao({
    nomeContratoControle: "RegistroProjetosCarbono",
    contratoControle: registroProjetosCarbono,
    nomeContratoAutorizado: "ValidacaoProjetos",
    enderecoContratoAutorizado: enderecos.ValidacaoProjetos,
  });

  const creditoAutorizadoNoRegistro = await garantirAutorizacao({
    nomeContratoControle: "RegistroProjetosCarbono",
    contratoControle: registroProjetosCarbono,
    nomeContratoAutorizado: "CreditoCarbonoToken",
    enderecoContratoAutorizado: enderecos.CreditoCarbonoToken,
  });

  const aposentadoriaAutorizadaNoCredito = await garantirAutorizacao({
    nomeContratoControle: "CreditoCarbonoToken",
    contratoControle: creditoCarbonoToken,
    nomeContratoAutorizado: "RegistroAposentadorias",
    enderecoContratoAutorizado: enderecos.RegistroAposentadorias,
  });

  const aposentadoriaAutorizadaNoCertificado = await garantirAutorizacao({
    nomeContratoControle: "CertificadoCompensacaoNFT",
    contratoControle: certificadoCompensacaoNFT,
    nomeContratoAutorizado: "RegistroAposentadorias",
    enderecoContratoAutorizado: enderecos.RegistroAposentadorias,
  });

  const stakingAutorizado = await garantirAutorizacao({
    nomeContratoControle: "TesourariaCarbono",
    contratoControle: tesourariaCarbono,
    nomeContratoAutorizado: "StakingCarbono",
    enderecoContratoAutorizado: enderecos.StakingCarbono,
  });

  const parametrosVotacao = await configurarParametrosVotacaoMVP(
    validacaoProjetos
  );

  const stakingValidacao = await configurarStakeValidacaoMVP(
    validacaoProjetos
  );

  const enderecoTesouraria = obterEnderecoObrigatorio(
    "TesourariaCarbono",
    enderecos.TesourariaCarbono
  );

  await depositarReservaTesourariaSePossivel({
    tokenImpactoCarbono,
    tesourariaCarbono,
    enderecoTesouraria,
  });

  const saldoFinalTICTesouraria = await tesourariaCarbono.saldoTIC();

  const validacaoAutorizadaFinal = await consultarAutorizacaoSegura(
    registroProjetosCarbono,
    enderecos.ValidacaoProjetos
  );

  const creditoAutorizadoNoRegistroFinal = await consultarAutorizacaoSegura(
    registroProjetosCarbono,
    enderecos.CreditoCarbonoToken
  );

  const aposentadoriaAutorizadaNoCreditoFinal =
    await consultarAutorizacaoSegura(
      creditoCarbonoToken,
      enderecos.RegistroAposentadorias
    );

  const aposentadoriaAutorizadaNoCertificadoFinal =
    await consultarAutorizacaoSegura(
      certificadoCompensacaoNFT,
      enderecos.RegistroAposentadorias
    );

  const stakingAutorizadoFinal = await consultarAutorizacaoSegura(
    tesourariaCarbono,
    enderecos.StakingCarbono
  );

  const relatorioSetup = {
    projeto: dadosDeploy.projeto ?? "CarbonLedger",
    rede,
    chainId,
    deployer: enderecoDeployer,
    deployOrigem: {
      dataDeploy: dadosDeploy.dataDeploy ?? null,
      geradoEm: dadosDeploy.geradoEm ?? null,
    },
    configuradoEm: new Date().toISOString(),
    modo: "MVP - validação simplificada sem staking obrigatório",
    autorizacoes: {
      ValidacaoProjetos_em_RegistroProjetosCarbono:
        validacaoAutorizadaFinal,
      CreditoCarbonoToken_em_RegistroProjetosCarbono:
        creditoAutorizadoNoRegistroFinal,
      RegistroAposentadorias_em_CreditoCarbonoToken:
        aposentadoriaAutorizadaNoCreditoFinal,
      RegistroAposentadorias_em_CertificadoCompensacaoNFT:
        aposentadoriaAutorizadaNoCertificadoFinal,
      StakingCarbono_em_TesourariaCarbono: stakingAutorizadoFinal,
    },
    resultadosIntermediarios: {
      ValidacaoProjetos_em_RegistroProjetosCarbono: validacaoAutorizada,
      CreditoCarbonoToken_em_RegistroProjetosCarbono:
        creditoAutorizadoNoRegistro,
      RegistroAposentadorias_em_CreditoCarbonoToken:
        aposentadoriaAutorizadaNoCredito,
      RegistroAposentadorias_em_CertificadoCompensacaoNFT:
        aposentadoriaAutorizadaNoCertificado,
      StakingCarbono_em_TesourariaCarbono: stakingAutorizado,
    },
    parametrosVotacao,
    stakingValidacao,
    tesouraria: {
      saldoTIC: saldoFinalTICTesouraria.toString(),
      saldoTICFormatado: ethers.formatUnits(saldoFinalTICTesouraria, 18),
    },
    etapas: etapasSetup,
    contratos: enderecos,
  };

  salvarRelatorioSetup(relatorioSetup);

  console.log("");
  console.log("Resumo do setup:");
  console.log("");
  console.log(
    `ValidacaoProjetos autorizado no RegistroProjetosCarbono: ${validacaoAutorizadaFinal}`
  );
  console.log(
    `CreditoCarbonoToken autorizado no RegistroProjetosCarbono: ${creditoAutorizadoNoRegistroFinal}`
  );
  console.log(
    `RegistroAposentadorias autorizado no CreditoCarbonoToken: ${aposentadoriaAutorizadaNoCreditoFinal}`
  );
  console.log(
    `RegistroAposentadorias autorizado no CertificadoCompensacaoNFT: ${aposentadoriaAutorizadaNoCertificadoFinal}`
  );
  console.log(
    `StakingCarbono autorizado na TesourariaCarbono: ${stakingAutorizadoFinal}`
  );
  console.log(
    `Prazo de votação MVP: ${parametrosVotacao.prazoVotacaoSegundos} segundos`
  );
  console.log(`Quórum mínimo MVP: ${parametrosVotacao.quorumMinimo} voto`);
  console.log(
    `Stake obrigatório na validação: ${stakingValidacao.exigirStakeMinimo}`
  );
  console.log(
    `Stake mínimo exigido na validação: ${ethers.formatUnits(
      BigInt(stakingValidacao.stakeMinimoValidador),
      18
    )} TIC`
  );
  console.log(
    `Saldo TIC da Tesouraria: ${ethers.formatUnits(
      saldoFinalTICTesouraria,
      18
    )} TIC`
  );
  console.log("");

  console.log(`Relatório de setup salvo em: ${ARQUIVO_SETUP_LOCAL}`);
  console.log("");
  console.log("Setup local concluído com sucesso.");
}

main().catch((erro: unknown) => {
  console.error("");
  console.error("Erro no setup local do CarbonLedger:");
  console.error(erro);
  process.exitCode = 1;
});