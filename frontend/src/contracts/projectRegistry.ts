import { ethers } from "ethers";
import { obterRedeAtual } from "../config/redes";
import { obterEnderecoContrato } from "../config/contratos";

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const ABI_REGISTRO_PROJETOS_CARBONO = [
  "function cadastrarProjeto(string nomeProjeto, string descricao, string localizacao, uint8 tipoProjeto, uint256 creditosSolicitados, string uriEvidencias, uint256 inicioPeriodoReferencia, uint256 fimPeriodoReferencia) payable",
];

export type DadosCadastroProjeto = {
  nomeProjeto: string;
  descricao: string;
  localizacao: string;
  tipoProjeto: string | number;
  creditosSolicitados: string | number | bigint;
  uriEvidencias: string;
  inicioPeriodoReferencia: string | number | Date;
  fimPeriodoReferencia: string | number | Date;
};

function converterParaTimestampSegundos(valor: string | number | Date): bigint {
  if (typeof valor === "number") {
    return BigInt(valor);
  }

  if (valor instanceof Date) {
    return BigInt(Math.floor(valor.getTime() / 1000));
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    throw new Error(`Data inválida: ${valor}`);
  }

  return BigInt(Math.floor(data.getTime() / 1000));
}

function validarDadosProjeto(dados: DadosCadastroProjeto) {
  const nomeProjeto = dados.nomeProjeto.trim();
  const descricao = dados.descricao.trim();
  const localizacao = dados.localizacao.trim();
  const uriEvidencias = dados.uriEvidencias.trim();

  if (!nomeProjeto) {
    throw new Error("Informe o nome do projeto.");
  }

  if (!descricao) {
    throw new Error("Informe a descrição do projeto.");
  }

  if (!localizacao) {
    throw new Error("Informe a localização do projeto.");
  }

  const tipoProjeto = Number(dados.tipoProjeto);

  if (!Number.isInteger(tipoProjeto) || tipoProjeto < 0) {
    throw new Error("Tipo de projeto inválido.");
  }

  const creditosSolicitados = BigInt(dados.creditosSolicitados);

  if (creditosSolicitados <= 0n) {
    throw new Error(
      "A quantidade de créditos solicitados deve ser maior que zero."
    );
  }

  if (!uriEvidencias) {
    throw new Error("Informe a URI das evidências.");
  }

  const inicio = converterParaTimestampSegundos(
    dados.inicioPeriodoReferencia
  );

  const fim = converterParaTimestampSegundos(
    dados.fimPeriodoReferencia
  );

  if (fim <= inicio) {
    throw new Error("A data final deve ser posterior à data inicial.");
  }
}

function tratarErroContrato(erro: unknown): Error {
  console.error("Erro bruto ao cadastrar projeto:", erro);

  if (erro instanceof Error) {
    return erro;
  }

  return new Error("Erro desconhecido ao cadastrar projeto.");
}

export async function cadastrarProjetoCarbono(dados: DadosCadastroProjeto) {
  try {
    validarDadosProjeto(dados);

    if (!window.ethereum) {
      throw new Error("MetaMask não encontrada no navegador.");
    }

    const rede = await obterRedeAtual();
    const chainIdAtual = String(rede.chainId);

    if (chainIdAtual !== "31337") {
      throw new Error(
        `Rede incorreta. Selecione Hardhat Localhost na MetaMask. Chain ID atual: ${chainIdAtual}`
      );
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const enderecoCarteira = await signer.getAddress();

    const enderecoRegistroProjetos = obterEnderecoContrato(
      chainIdAtual,
      "RegistroProjetosCarbono"
    );

    const contrato = new ethers.Contract(
      enderecoRegistroProjetos,
      ABI_REGISTRO_PROJETOS_CARBONO,
      signer
    );

    const nomeProjeto = dados.nomeProjeto.trim();
    const descricao = dados.descricao.trim();
    const localizacao = dados.localizacao.trim();
    const tipoProjeto = Number(dados.tipoProjeto);
    const creditosSolicitados = BigInt(dados.creditosSolicitados);
    const uriEvidencias = dados.uriEvidencias.trim();

    const inicioPeriodoReferencia = converterParaTimestampSegundos(
      dados.inicioPeriodoReferencia
    );

    const fimPeriodoReferencia = converterParaTimestampSegundos(
      dados.fimPeriodoReferencia
    );

    const taxaSubmissao = ethers.parseEther("0.001");

    console.log("### CARBONLEDGER PROJECT_REGISTRY NOVO ###", {
      taxaSubmissaoETH: ethers.formatEther(taxaSubmissao),
      taxaSubmissaoWei: taxaSubmissao.toString(),
    });

    console.log("Enviando cadastro de projeto:", {
      rede: chainIdAtual,
      contrato: enderecoRegistroProjetos,
      carteira: enderecoCarteira,
      nomeProjeto,
      descricao,
      localizacao,
      tipoProjeto,
      creditosSolicitados: creditosSolicitados.toString(),
      uriEvidencias,
      inicioPeriodoReferencia: inicioPeriodoReferencia.toString(),
      fimPeriodoReferencia: fimPeriodoReferencia.toString(),
      taxaSubmissaoETH: ethers.formatEther(taxaSubmissao),
    });

    const tx = await contrato.cadastrarProjeto(
      nomeProjeto,
      descricao,
      localizacao,
      tipoProjeto,
      creditosSolicitados,
      uriEvidencias,
      inicioPeriodoReferencia,
      fimPeriodoReferencia,
      {
        value: taxaSubmissao,
      }
    );

    console.log("Transação enviada:", tx.hash);

    const receipt = await tx.wait();

    console.log("Transação confirmada:", receipt);

    return {
      hash: tx.hash,
      receipt,
    };
  } catch (erro) {
    throw tratarErroContrato(erro);
  }
}