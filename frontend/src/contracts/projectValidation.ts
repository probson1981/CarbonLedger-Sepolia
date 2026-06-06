import { ethers } from "ethers";
import { obterRedeAtual } from "../config/redes";
import { obterEnderecoContrato } from "../config/contratos";

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

type WindowComEthereum = typeof window & {
  ethereum?: EthereumProvider;
};

type ResultadoTransacaoValidacao = {
  hash: string;
  receipt: ethers.TransactionReceipt | null;
};

export type DadosVotacaoProjeto = {
  idProjeto: string;
  inicioVotacao: string;
  fimVotacao: string;
  votosAprovacao: string;
  votosRejeicao: string;
  somaCreditosSugeridos: string;
  quantidadeSugestoes: string;
  encerrada: boolean;
  aprovado: boolean;
  creditosAprovados: string;
  tempoRestanteSegundos: number;
  podeEncerrar: boolean;
};

export type ResultadoConsultaValidacao = {
  validadorApto: boolean;
  votacaoAberta: boolean;
  totalVotos: string;
  dadosVotacao: DadosVotacaoProjeto | null;
};

export type StatusProjetoBlockchain =
  | "Pendente de validação"
  | "Em análise"
  | "Aprovado"
  | "Rejeitado"
  | "Créditos emitidos"
  | "Desconhecido";

export type ResultadoEstadoProjetoBlockchain = {
  idProjeto: string;
  estadoCodigo: string;
  aprovado: boolean;
  emitido: boolean;
  creditosSolicitados: string;
  statusSugerido: StatusProjetoBlockchain;
};

export const VotoProjeto = {
  Nenhum: 0,
  Aprovar: 1,
  Rejeitar: 2,
} as const;

const ABI_VALIDACAO_PROJETOS = [
  "function validadorApto(address carteira) view returns (bool)",
  "function iniciarVotacao(uint256 idProjeto)",
  "function votarProjeto(uint256 idProjeto, uint8 voto, uint256 creditosSugeridos)",
  "function encerrarVotacao(uint256 idProjeto)",
  "function votacaoAberta(uint256 idProjeto) view returns (bool)",
  "function totalVotos(uint256 idProjeto) view returns (uint256)",
  "function votacoes(uint256 idProjeto) view returns (uint256 idProjetoRetornado, uint256 inicioVotacao, uint256 fimVotacao, uint256 votosAprovacao, uint256 votosRejeicao, uint256 somaCreditosSugeridos, uint256 quantidadeSugestoes, bool encerrada, bool aprovado, uint256 creditosAprovados)",
];

const ABI_REGISTRO_PROJETOS_CARBONO = [
  "function obterEstadoProjeto(uint256 idProjeto) view returns (uint8)",
  "function projetoAprovado(uint256 idProjeto) view returns (bool)",
  "function projetoEmitido(uint256 idProjeto) view returns (bool)",
  "function obterCreditosSolicitados(uint256 idProjeto) view returns (uint256)",
];

function obterEthereum(): EthereumProvider | undefined {
  return (window as WindowComEthereum).ethereum;
}

function obterPrimeiraConta(contas: unknown): string {
  if (Array.isArray(contas) && typeof contas[0] === "string") {
    return contas[0];
  }

  return "";
}

function validarIdProjeto(idProjeto: string | number | bigint): bigint {
  const id = BigInt(idProjeto);

  if (id <= 0n) {
    throw new Error("ID do projeto inválido.");
  }

  return id;
}

function validarCreditosSugeridos(
  creditosSugeridos: string | number | bigint
): bigint {
  const creditos = BigInt(creditosSugeridos);

  if (creditos <= 0n) {
    throw new Error("A quantidade de créditos sugeridos deve ser maior que zero.");
  }

  return creditos;
}

function obterTimestampAtualSegundos(): number {
  return Math.floor(Date.now() / 1000);
}

function extrairMensagemErro(erro: unknown): string {
  if (typeof erro !== "object" || erro === null) {
    return "Erro desconhecido na validação do projeto.";
  }

  const erroObj = erro as {
    reason?: unknown;
    shortMessage?: unknown;
    message?: unknown;
    info?: {
      error?: {
        message?: unknown;
      };
    };
  };

  if (typeof erroObj.reason === "string" && erroObj.reason.trim()) {
    return erroObj.reason;
  }

  if (
    typeof erroObj.shortMessage === "string" &&
    erroObj.shortMessage.trim()
  ) {
    return erroObj.shortMessage;
  }

  if (
    typeof erroObj.info?.error?.message === "string" &&
    erroObj.info.error.message.trim()
  ) {
    return erroObj.info.error.message;
  }

  if (typeof erroObj.message === "string" && erroObj.message.trim()) {
    return erroObj.message;
  }

  return "Erro desconhecido na validação do projeto.";
}

function tratarErroValidacao(erro: unknown): Error {
  console.error("Erro bruto na validação do projeto:", erro);

  const mensagem = extrairMensagemErro(erro);

  if (mensagem.includes("Validador nao apto")) {
    return new Error(
      "Validador não apto. Confira se a carteira conectada está cadastrada como validador ativo no contrato RegistroOrganizacoes."
    );
  }

  if (mensagem.includes("Contrato nao autorizado")) {
    return new Error(
      "Contrato de validação não autorizado no RegistroProjetosCarbono. Execute o setup local para autorizar o ValidacaoProjetos."
    );
  }

  if (mensagem.includes("Estado invalido")) {
    return new Error(
      "Estado inválido do projeto. Para iniciar votação, o projeto precisa estar no estado Submetido."
    );
  }

  if (mensagem.includes("Votacao ja iniciada")) {
    return new Error("A votação deste projeto já foi iniciada.");
  }

  if (mensagem.includes("Projeto inexistente")) {
    return new Error("Projeto inexistente na blockchain.");
  }

  return new Error(mensagem);
}

async function obterProviderEChainId() {
  const ethereum = obterEthereum();

  if (!ethereum) {
    throw new Error("MetaMask não encontrada no navegador.");
  }

  const rede = await obterRedeAtual();
  const chainIdAtual = String(rede.chainId);

  if (chainIdAtual !== "31337") {
    throw new Error(
      `Rede incorreta. Selecione Hardhat Localhost na MetaMask. Chain ID atual: ${chainIdAtual}`
    );
  }

  const provider = new ethers.BrowserProvider(ethereum);

  return {
    provider,
    chainIdAtual,
  };
}

async function obterContratoValidacao(comSigner: boolean) {
  const { provider, chainIdAtual } = await obterProviderEChainId();

  const enderecoValidacaoProjetos = obterEnderecoContrato(
    chainIdAtual,
    "ValidacaoProjetos"
  );

  if (comSigner) {
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();

    return new ethers.Contract(
      enderecoValidacaoProjetos,
      ABI_VALIDACAO_PROJETOS,
      signer
    );
  }

  return new ethers.Contract(
    enderecoValidacaoProjetos,
    ABI_VALIDACAO_PROJETOS,
    provider
  );
}

async function obterContratoRegistroProjetos() {
  const { provider, chainIdAtual } = await obterProviderEChainId();

  const enderecoRegistroProjetos = obterEnderecoContrato(
    chainIdAtual,
    "RegistroProjetosCarbono"
  );

  return new ethers.Contract(
    enderecoRegistroProjetos,
    ABI_REGISTRO_PROJETOS_CARBONO,
    provider
  );
}

function sugerirStatusProjeto(params: {
  estadoCodigo: string;
  aprovado: boolean;
  emitido: boolean;
}): StatusProjetoBlockchain {
  const { estadoCodigo, aprovado, emitido } = params;

  if (emitido || estadoCodigo === "5") {
    return "Créditos emitidos";
  }

  if (aprovado || estadoCodigo === "3") {
    return "Aprovado";
  }

  if (estadoCodigo === "4") {
    return "Rejeitado";
  }

  if (estadoCodigo === "2") {
    return "Em análise";
  }

  if (estadoCodigo === "1") {
    return "Pendente de validação";
  }

  return "Desconhecido";
}

function descreverEstadoProjeto(estadoCodigo: string): string {
  switch (estadoCodigo) {
    case "0":
      return "Rascunho";
    case "1":
      return "Submetido";
    case "2":
      return "Em votação";
    case "3":
      return "Aprovado";
    case "4":
      return "Rejeitado";
    case "5":
      return "Emitido";
    case "6":
      return "Suspenso";
    case "7":
      return "Revogado";
    default:
      return "Desconhecido";
  }
}

function converterDadosVotacao(votacao: unknown): DadosVotacaoProjeto | null {
  const valores = votacao as Array<unknown>;

  const idProjeto = BigInt(String(valores[0]));

  if (idProjeto === 0n) {
    return null;
  }

  const inicioVotacao = BigInt(String(valores[1]));
  const fimVotacao = BigInt(String(valores[2]));
  const votosAprovacao = BigInt(String(valores[3]));
  const votosRejeicao = BigInt(String(valores[4]));
  const somaCreditosSugeridos = BigInt(String(valores[5]));
  const quantidadeSugestoes = BigInt(String(valores[6]));
  const encerrada = Boolean(valores[7]);
  const aprovado = Boolean(valores[8]);
  const creditosAprovados = BigInt(String(valores[9]));

  const agora = obterTimestampAtualSegundos();
  const fimNumero = Number(fimVotacao);
  const tempoRestanteSegundos = Math.max(0, fimNumero - agora);

  return {
    idProjeto: idProjeto.toString(),
    inicioVotacao: inicioVotacao.toString(),
    fimVotacao: fimVotacao.toString(),
    votosAprovacao: votosAprovacao.toString(),
    votosRejeicao: votosRejeicao.toString(),
    somaCreditosSugeridos: somaCreditosSugeridos.toString(),
    quantidadeSugestoes: quantidadeSugestoes.toString(),
    encerrada,
    aprovado,
    creditosAprovados: creditosAprovados.toString(),
    tempoRestanteSegundos,
    podeEncerrar: !encerrada && tempoRestanteSegundos === 0,
  };
}

export async function obterContaAtualMetaMask(): Promise<string> {
  const ethereum = obterEthereum();

  if (!ethereum) {
    throw new Error("MetaMask não encontrada no navegador.");
  }

  const contas = await ethereum.request({
    method: "eth_requestAccounts",
  });

  const contaAtual = obterPrimeiraConta(contas);

  if (!contaAtual) {
    throw new Error("Nenhuma conta foi retornada pela MetaMask.");
  }

  return contaAtual;
}

export async function verificarValidadorApto(
  carteira?: string
): Promise<boolean> {
  try {
    const contrato = await obterContratoValidacao(false);
    const conta = carteira || (await obterContaAtualMetaMask());

    return await contrato.validadorApto(conta);
  } catch (erro) {
    throw tratarErroValidacao(erro);
  }
}

export async function consultarValidacaoProjeto(
  idProjeto: string | number | bigint,
  carteira?: string
): Promise<ResultadoConsultaValidacao> {
  try {
    const id = validarIdProjeto(idProjeto);
    const contrato = await obterContratoValidacao(false);
    const conta = carteira || (await obterContaAtualMetaMask());

    const [validadorApto, votacaoAberta, totalVotos, votacao] =
      await Promise.all([
        contrato.validadorApto(conta),
        contrato.votacaoAberta(id),
        contrato.totalVotos(id),
        contrato.votacoes(id),
      ]);

    return {
      validadorApto,
      votacaoAberta,
      totalVotos: totalVotos.toString(),
      dadosVotacao: converterDadosVotacao(votacao),
    };
  } catch (erro) {
    throw tratarErroValidacao(erro);
  }
}

export async function consultarEstadoProjetoBlockchain(
  idProjeto: string | number | bigint
): Promise<ResultadoEstadoProjetoBlockchain> {
  try {
    const id = validarIdProjeto(idProjeto);
    const contrato = await obterContratoRegistroProjetos();

    const [estado, aprovado, emitido, creditosSolicitados] = await Promise.all([
      contrato.obterEstadoProjeto(id),
      contrato.projetoAprovado(id),
      contrato.projetoEmitido(id),
      contrato.obterCreditosSolicitados(id),
    ]);

    const estadoCodigo = estado.toString();

    const statusSugerido = sugerirStatusProjeto({
      estadoCodigo,
      aprovado,
      emitido,
    });

    console.log("Estado real do projeto na blockchain:", {
      idProjeto: id.toString(),
      estadoCodigo,
      estadoTexto: descreverEstadoProjeto(estadoCodigo),
      aprovado,
      emitido,
      creditosSolicitados: creditosSolicitados.toString(),
      statusSugerido,
    });

    return {
      idProjeto: id.toString(),
      estadoCodigo,
      aprovado,
      emitido,
      creditosSolicitados: creditosSolicitados.toString(),
      statusSugerido,
    };
  } catch (erro) {
    throw tratarErroValidacao(erro);
  }
}

export async function iniciarVotacaoProjeto(
  idProjeto: string | number | bigint
): Promise<ResultadoTransacaoValidacao> {
  try {
    const id = validarIdProjeto(idProjeto);

    const estadoProjeto = await consultarEstadoProjetoBlockchain(id);

    if (estadoProjeto.estadoCodigo !== "1") {
      throw new Error(
        `Não é possível iniciar votação. Estado atual do projeto: ${descreverEstadoProjeto(
          estadoProjeto.estadoCodigo
        )} código ${estadoProjeto.estadoCodigo}. O estado necessário é Submetido código 1.`
      );
    }

    const contrato = await obterContratoValidacao(true);
    const contaAtual = await obterContaAtualMetaMask();

    const apto = await contrato.validadorApto(contaAtual);

    if (!apto) {
      throw new Error(
        `Validador não apto para iniciar votação. Conta conectada: ${contaAtual}.`
      );
    }

    await contrato.iniciarVotacao.estimateGas(id);

    const tx = await contrato.iniciarVotacao(id);

    console.log("Votação iniciada:", {
      idProjeto: id.toString(),
      contaAtual,
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return {
      hash: tx.hash,
      receipt,
    };
  } catch (erro) {
    throw tratarErroValidacao(erro);
  }
}

export async function votarProjetoValidacao(params: {
  idProjeto: string | number | bigint;
  aprovar: boolean;
  creditosSugeridos: string | number | bigint;
}): Promise<ResultadoTransacaoValidacao> {
  try {
    const id = validarIdProjeto(params.idProjeto);
    const voto = params.aprovar ? VotoProjeto.Aprovar : VotoProjeto.Rejeitar;

    const creditosSugeridos = params.aprovar
      ? validarCreditosSugeridos(params.creditosSugeridos)
      : 0n;

    const contrato = await obterContratoValidacao(true);
    const contaAtual = await obterContaAtualMetaMask();

    const apto = await contrato.validadorApto(contaAtual);

    if (!apto) {
      throw new Error(
        `Validador não apto para votar. Conta conectada: ${contaAtual}.`
      );
    }

    await contrato.votarProjeto.estimateGas(id, voto, creditosSugeridos);

    const tx = await contrato.votarProjeto(id, voto, creditosSugeridos);

    console.log("Voto enviado:", {
      idProjeto: id.toString(),
      contaAtual,
      voto,
      creditosSugeridos: creditosSugeridos.toString(),
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return {
      hash: tx.hash,
      receipt,
    };
  } catch (erro) {
    throw tratarErroValidacao(erro);
  }
}

export async function encerrarVotacaoProjeto(
  idProjeto: string | number | bigint
): Promise<ResultadoTransacaoValidacao> {
  try {
    const id = validarIdProjeto(idProjeto);
    const contrato = await obterContratoValidacao(true);

    await contrato.encerrarVotacao.estimateGas(id);

    const tx = await contrato.encerrarVotacao(id);

    console.log("Votação encerrada:", {
      idProjeto: id.toString(),
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return {
      hash: tx.hash,
      receipt,
    };
  } catch (erro) {
    throw tratarErroValidacao(erro);
  }
}