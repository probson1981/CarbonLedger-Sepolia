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

export type ResultadoEmissaoCreditos = {
  hash: string;
  receipt: ethers.TransactionReceipt | null;
  idProjeto: string;
  idLote: string;
  anoReferencia: string;
};

export type DadosLoteCredito = {
  idProjeto: string;
  quantidadeEmitida: string;
  quantidadeAposentada: string;
  anoReferencia: string;
  ativo: boolean;
  loteEmitido: boolean;
};

const ABI_CREDITO_CARBONO_TOKEN = [
  "function emitirCreditosDeProjetoAprovado(address enderecoRegistroProjetos, uint256 idProjeto, uint256 idLote, uint256 anoReferencia)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
  "function loteAtivo(uint256 idLote) view returns (bool)",
  "function loteEmitido(uint256 idLote) view returns (bool)",
  "function lotesCredito(uint256 idLote) view returns (uint256 idProjeto, uint256 quantidadeEmitida, uint256 quantidadeAposentada, uint256 anoReferencia, bool ativo)",
];

const ABI_REGISTRO_PROJETOS_CARBONO = [
  "function obterProponente(uint256 idProjeto) view returns (address)",
  "function obterCreditosAprovados(uint256 idProjeto) view returns (uint256)",
  "function projetoAprovado(uint256 idProjeto) view returns (bool)",
  "function projetoEmitido(uint256 idProjeto) view returns (bool)",
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

function validarInteiroPositivo(
  valor: string | number | bigint,
  nomeCampo: string
): bigint {
  const convertido = BigInt(valor);

  if (convertido <= 0n) {
    throw new Error(`${nomeCampo} inválido.`);
  }

  return convertido;
}

function tratarErroEmissao(erro: unknown): Error {
  console.error("Erro bruto na emissão de créditos:", erro);

  if (
    typeof erro === "object" &&
    erro !== null &&
    "reason" in erro &&
    typeof erro.reason === "string"
  ) {
    return new Error(erro.reason);
  }

  if (
    typeof erro === "object" &&
    erro !== null &&
    "shortMessage" in erro &&
    typeof erro.shortMessage === "string"
  ) {
    return new Error(erro.shortMessage);
  }

  if (erro instanceof Error) {
    return erro;
  }

  return new Error("Erro desconhecido na emissão de créditos.");
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

async function obterContratoCredito(comSigner: boolean) {
  const { provider, chainIdAtual } = await obterProviderEChainId();

  const enderecoCreditoCarbonoToken = obterEnderecoContrato(
    chainIdAtual,
    "CreditoCarbonoToken"
  );

  if (comSigner) {
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();

    return new ethers.Contract(
      enderecoCreditoCarbonoToken,
      ABI_CREDITO_CARBONO_TOKEN,
      signer
    );
  }

  return new ethers.Contract(
    enderecoCreditoCarbonoToken,
    ABI_CREDITO_CARBONO_TOKEN,
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

export async function consultarResumoProjetoParaEmissao(
  idProjeto: string | number | bigint
) {
  try {
    const id = validarInteiroPositivo(idProjeto, "ID do projeto");
    const contratoRegistro = await obterContratoRegistroProjetos();

    const [proponente, creditosAprovados, aprovado, emitido] =
      await Promise.all([
        contratoRegistro.obterProponente(id),
        contratoRegistro.obterCreditosAprovados(id),
        contratoRegistro.projetoAprovado(id),
        contratoRegistro.projetoEmitido(id),
      ]);

    return {
      idProjeto: id.toString(),
      proponente: String(proponente),
      creditosAprovados: creditosAprovados.toString(),
      aprovado: Boolean(aprovado),
      emitido: Boolean(emitido),
    };
  } catch (erro) {
    throw tratarErroEmissao(erro);
  }
}

export async function emitirCreditosProjetoAprovado(params: {
  idProjeto: string | number | bigint;
  anoReferencia: string | number | bigint;
  idLote?: string | number | bigint;
}): Promise<ResultadoEmissaoCreditos> {
  try {
    const idProjeto = validarInteiroPositivo(
      params.idProjeto,
      "ID do projeto"
    );

    const idLote = params.idLote
      ? validarInteiroPositivo(params.idLote, "ID do lote")
      : idProjeto;

    const anoReferencia = validarInteiroPositivo(
      params.anoReferencia,
      "Ano de referência"
    );

    const { chainIdAtual } = await obterProviderEChainId();

    const enderecoRegistroProjetos = obterEnderecoContrato(
      chainIdAtual,
      "RegistroProjetosCarbono"
    );

    const contratoCredito = await obterContratoCredito(true);

    const tx = await contratoCredito.emitirCreditosDeProjetoAprovado(
      enderecoRegistroProjetos,
      idProjeto,
      idLote,
      anoReferencia
    );

    console.log("Emissão de créditos enviada:", {
      idProjeto: idProjeto.toString(),
      idLote: idLote.toString(),
      anoReferencia: anoReferencia.toString(),
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    console.log("Emissão de créditos confirmada:", {
      idProjeto: idProjeto.toString(),
      idLote: idLote.toString(),
      anoReferencia: anoReferencia.toString(),
      hash: tx.hash,
      receipt,
    });

    return {
      hash: tx.hash,
      receipt,
      idProjeto: idProjeto.toString(),
      idLote: idLote.toString(),
      anoReferencia: anoReferencia.toString(),
    };
  } catch (erro) {
    throw tratarErroEmissao(erro);
  }
}

export async function consultarLoteCredito(
  idLote: string | number | bigint
): Promise<DadosLoteCredito> {
  try {
    const id = validarInteiroPositivo(idLote, "ID do lote");
    const contratoCredito = await obterContratoCredito(false);

    const [lote, emitido] = await Promise.all([
      contratoCredito.lotesCredito(id),
      contratoCredito.loteEmitido(id),
    ]);

    return {
      idProjeto: lote[0].toString(),
      quantidadeEmitida: lote[1].toString(),
      quantidadeAposentada: lote[2].toString(),
      anoReferencia: lote[3].toString(),
      ativo: Boolean(lote[4]),
      loteEmitido: Boolean(emitido),
    };
  } catch (erro) {
    throw tratarErroEmissao(erro);
  }
}

export async function consultarSaldoLote(params: {
  carteira: string;
  idLote: string | number | bigint;
}): Promise<string> {
  try {
    const id = validarInteiroPositivo(params.idLote, "ID do lote");
    const contratoCredito = await obterContratoCredito(false);

    const saldo = await contratoCredito.balanceOf(params.carteira, id);

    return saldo.toString();
  } catch (erro) {
    throw tratarErroEmissao(erro);
  }
}