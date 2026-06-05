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

function obterEthereum(): EthereumProvider | undefined {
  return (window as WindowComEthereum).ethereum;
}

const ABI_REGISTRO_PROJETOS_CARBONO = [
  "function cadastrarProjeto(string nomeProjeto, string descricao, string localizacao, uint8 tipoProjeto, uint256 creditosSolicitados, string uriEvidencias, uint256 inicioPeriodoReferencia, uint256 fimPeriodoReferencia) payable",
  "function taxaSubmissaoProjeto() view returns (uint256)",
  "event ProjetoCadastrado(uint256 indexed idProjeto, address indexed proponente, bytes32 indexed hashProjeto, uint256 creditosSolicitados)",
];

const interfaceRegistroProjetos = new ethers.Interface(
  ABI_REGISTRO_PROJETOS_CARBONO
);

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

export type ResultadoCadastroProjeto = {
  hash: string;
  receipt: ethers.TransactionReceipt;
  idProjetoBlockchain: string;
  proponenteBlockchain: string;
  hashProjetoBlockchain: string;
  creditosSolicitadosBlockchain: string;
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

  const fim = converterParaTimestampSegundos(dados.fimPeriodoReferencia);

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

function obterValorBigInt(valor: unknown): bigint {
  if (typeof valor === "bigint") {
    return valor;
  }

  if (typeof valor === "number") {
    return BigInt(valor);
  }

  if (typeof valor === "string") {
    return BigInt(valor);
  }

  if (
    typeof valor === "object" &&
    valor !== null &&
    "toString" in valor &&
    typeof valor.toString === "function"
  ) {
    return BigInt(valor.toString());
  }

  return 0n;
}

function extrairProjetoCadastradoDoRecibo(params: {
  receipt: ethers.TransactionReceipt;
  enderecoRegistroProjetos: string;
}) {
  const { receipt, enderecoRegistroProjetos } = params;
  const enderecoNormalizado = enderecoRegistroProjetos.toLowerCase();

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== enderecoNormalizado) {
      continue;
    }

    try {
      const evento = interfaceRegistroProjetos.parseLog({
        topics: log.topics,
        data: log.data,
      });

      if (!evento || evento.name !== "ProjetoCadastrado") {
        continue;
      }

      return {
        idProjetoBlockchain: evento.args.idProjeto.toString(),
        proponenteBlockchain: String(evento.args.proponente),
        hashProjetoBlockchain: String(evento.args.hashProjeto),
        creditosSolicitadosBlockchain:
          evento.args.creditosSolicitados.toString(),
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    "Não foi possível localizar o evento ProjetoCadastrado no recibo da transação."
  );
}

export async function cadastrarProjetoCarbono(
  dados: DadosCadastroProjeto
): Promise<ResultadoCadastroProjeto> {
  try {
    validarDadosProjeto(dados);

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
    const taxaSubmissaoContrato = await contrato.taxaSubmissaoProjeto();

    console.log("### CARBONLEDGER PROJECT_REGISTRY NOVO ###", {
      taxaSubmissaoETH: ethers.formatEther(taxaSubmissao),
      taxaSubmissaoWei: taxaSubmissao.toString(),
      taxaSubmissaoContratoETH: ethers.formatEther(taxaSubmissaoContrato),
      taxaSubmissaoContratoWei: taxaSubmissaoContrato.toString(),
    });

    if (taxaSubmissaoContrato !== taxaSubmissao) {
      throw new Error(
        `Taxa divergente entre frontend e contrato. Frontend: ${ethers.formatEther(
          taxaSubmissao
        )} ETH. Contrato: ${ethers.formatEther(taxaSubmissaoContrato)} ETH.`
      );
    }

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
      taxaSubmissaoHex: ethers.toBeHex(taxaSubmissao),
    });

    const txRequest = await contrato.cadastrarProjeto.populateTransaction(
      nomeProjeto,
      descricao,
      localizacao,
      tipoProjeto,
      creditosSolicitados,
      uriEvidencias,
      inicioPeriodoReferencia,
      fimPeriodoReferencia
    );

    txRequest.to = enderecoRegistroProjetos;
    txRequest.value = taxaSubmissao;

    const valorPreparado = obterValorBigInt(txRequest.value);

    console.log("Transação preparada antes da MetaMask:", {
      to: txRequest.to,
      from: enderecoCarteira,
      valueETH: ethers.formatEther(valorPreparado),
      valueWei: valorPreparado.toString(),
      valueHex: ethers.toBeHex(valorPreparado),
      dataInicio: String(txRequest.data ?? "").slice(0, 18),
    });

    if (valorPreparado !== taxaSubmissao) {
      throw new Error(
        `Valor preparado incorreto. Esperado: ${ethers.formatEther(
          taxaSubmissao
        )} ETH. Preparado: ${ethers.formatEther(valorPreparado)} ETH.`
      );
    }

    const tx = await signer.sendTransaction(txRequest);

    console.log("Transação enviada:", tx.hash);

    if (tx.value !== taxaSubmissao) {
      throw new Error(
        `Valor enviado incorreto. Esperado: ${ethers.formatEther(
          taxaSubmissao
        )} ETH. Enviado: ${ethers.formatEther(tx.value)} ETH.`
      );
    }

    console.log("Transação enviada com valor confirmado:", {
      hash: tx.hash,
      valueETH: ethers.formatEther(tx.value),
      valueWei: tx.value.toString(),
      valueHex: ethers.toBeHex(tx.value),
    });

    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error("A transação foi enviada, mas o recibo não foi retornado.");
    }

    const dadosEvento = extrairProjetoCadastradoDoRecibo({
      receipt,
      enderecoRegistroProjetos,
    });

    console.log("Projeto cadastrado na blockchain:", {
      hash: tx.hash,
      idProjetoBlockchain: dadosEvento.idProjetoBlockchain,
      proponenteBlockchain: dadosEvento.proponenteBlockchain,
      hashProjetoBlockchain: dadosEvento.hashProjetoBlockchain,
      creditosSolicitadosBlockchain:
        dadosEvento.creditosSolicitadosBlockchain,
    });

    console.log("Transação confirmada:", receipt);

    return {
      hash: tx.hash,
      receipt,
      ...dadosEvento,
    };
  } catch (erro) {
    throw tratarErroContrato(erro);
  }
}