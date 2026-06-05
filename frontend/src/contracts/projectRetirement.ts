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

export type TaxaAposentadoria = {
  taxaWei: string;
  taxaETH: string;
};

export type AposentadoriaCarbono = {
  idAposentadoria: string;
  comprador: string;
  idLote: string;
  quantidade: string;
  motivo: string;
  uriRelatorio: string;
  dataAposentadoria: string;
  idCertificado: string;
};

export type CertificadoCompensacao = {
  idCertificado: string;
  idAposentadoria: string;
  beneficiario: string;
  quantidadeCompensada: string;
  descricao: string;
  uriCertificado: string;
  tokenURI: string;
  dataEmissao: string;
  donoAtual: string;
};

export type ResultadoTransacaoAposentadoria = {
  hash: string;
  receipt: ethers.TransactionReceipt | null;
};

export type ResultadoAposentadoria = ResultadoTransacaoAposentadoria & {
  idAposentadoria: string;
  comprador: string;
  idLote: string;
  quantidade: string;
  idCertificado: string;
};

export type ResumoAposentadoriasComprador = {
  comprador: string;
  totalCompensado: string;
  aposentadorias: AposentadoriaCarbono[];
  certificados: CertificadoCompensacao[];
};

const ABI_REGISTRO_APOSENTADORIAS = [
  "function taxaAposentadoria() view returns (uint256)",
  "function totalAposentadorias() view returns (uint256)",
  "function aposentadorias(uint256 idAposentadoria) view returns (uint256 idAposentadoriaRetornado, address comprador, uint256 idLote, uint256 quantidade, string motivo, string uriRelatorio, uint256 dataAposentadoria, uint256 idCertificado)",
  "function aposentadoriaExiste(uint256 idAposentadoria) view returns (bool)",
  "function totalCompensadoPorComprador(address comprador) view returns (uint256)",
  "function totalAposentadoPorLote(uint256 idLote) view returns (uint256)",
  "function aposentarCreditos(uint256 idLote, uint256 quantidade, string motivo, string uriRelatorio, string uriCertificado) payable returns (uint256)",
  "event CreditosAposentados(uint256 indexed idAposentadoria, address indexed comprador, uint256 indexed idLote, uint256 quantidade, uint256 idCertificado)",
];

const ABI_CERTIFICADO_COMPENSACAO_NFT = [
  "function totalCertificados() view returns (uint256)",
  "function certificados(uint256 idCertificado) view returns (uint256 idCertificadoRetornado, uint256 idAposentadoria, address beneficiario, uint256 quantidadeCompensada, string descricao, string uriCertificado, uint256 dataEmissao)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
  "event CertificadoEmitido(uint256 indexed idCertificado, uint256 indexed idAposentadoria, address indexed beneficiario, uint256 quantidadeCompensada, string uriCertificado)",
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

function validarTextoObrigatorio(valor: string, nomeCampo: string): string {
  const texto = valor.trim();

  if (!texto) {
    throw new Error(`${nomeCampo} obrigatório.`);
  }

  return texto;
}

function tratarErroAposentadoria(erro: unknown): Error {
  console.error("Erro bruto na aposentadoria:", erro);

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

  return new Error("Erro desconhecido na aposentadoria de créditos.");
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

async function obterContratoRegistroAposentadorias(comSigner: boolean) {
  const { provider, chainIdAtual } = await obterProviderEChainId();

  const enderecoRegistroAposentadorias = obterEnderecoContrato(
    chainIdAtual,
    "RegistroAposentadorias"
  );

  if (comSigner) {
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();

    return new ethers.Contract(
      enderecoRegistroAposentadorias,
      ABI_REGISTRO_APOSENTADORIAS,
      signer
    );
  }

  return new ethers.Contract(
    enderecoRegistroAposentadorias,
    ABI_REGISTRO_APOSENTADORIAS,
    provider
  );
}

async function obterContratoCertificadoCompensacaoNFT(comSigner: boolean) {
  const { provider, chainIdAtual } = await obterProviderEChainId();

  const enderecoCertificadoCompensacaoNFT = obterEnderecoContrato(
    chainIdAtual,
    "CertificadoCompensacaoNFT"
  );

  if (comSigner) {
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();

    return new ethers.Contract(
      enderecoCertificadoCompensacaoNFT,
      ABI_CERTIFICADO_COMPENSACAO_NFT,
      signer
    );
  }

  return new ethers.Contract(
    enderecoCertificadoCompensacaoNFT,
    ABI_CERTIFICADO_COMPENSACAO_NFT,
    provider
  );
}

function converterAposentadoria(valor: unknown): AposentadoriaCarbono {
  const dados = valor as Array<unknown>;

  const idAposentadoria = BigInt(String(dados[0]));
  const comprador = String(dados[1]);
  const idLote = BigInt(String(dados[2]));
  const quantidade = BigInt(String(dados[3]));
  const motivo = String(dados[4]);
  const uriRelatorio = String(dados[5]);
  const dataAposentadoria = BigInt(String(dados[6]));
  const idCertificado = BigInt(String(dados[7]));

  return {
    idAposentadoria: idAposentadoria.toString(),
    comprador,
    idLote: idLote.toString(),
    quantidade: quantidade.toString(),
    motivo,
    uriRelatorio,
    dataAposentadoria: dataAposentadoria.toString(),
    idCertificado: idCertificado.toString(),
  };
}

async function converterCertificado(
  valor: unknown
): Promise<CertificadoCompensacao> {
  const dados = valor as Array<unknown>;

  const idCertificado = BigInt(String(dados[0]));
  const idAposentadoria = BigInt(String(dados[1]));
  const beneficiario = String(dados[2]);
  const quantidadeCompensada = BigInt(String(dados[3]));
  const descricao = String(dados[4]);
  const uriCertificado = String(dados[5]);
  const dataEmissao = BigInt(String(dados[6]));

  const contratoCertificado = await obterContratoCertificadoCompensacaoNFT(
    false
  );

  const [tokenURI, donoAtual] = await Promise.all([
    contratoCertificado.tokenURI(idCertificado),
    contratoCertificado.ownerOf(idCertificado),
  ]);

  return {
    idCertificado: idCertificado.toString(),
    idAposentadoria: idAposentadoria.toString(),
    beneficiario,
    quantidadeCompensada: quantidadeCompensada.toString(),
    descricao,
    uriCertificado,
    tokenURI: String(tokenURI),
    dataEmissao: dataEmissao.toString(),
    donoAtual: String(donoAtual),
  };
}

function extrairEventoCreditosAposentados(params: {
  hash: string;
  receipt: ethers.TransactionReceipt | null;
  contratoRegistroAposentadorias: ethers.Contract;
}): ResultadoAposentadoria {
  if (!params.receipt) {
    throw new Error("Recibo da transação não disponível.");
  }

  for (const log of params.receipt.logs) {
    try {
      const evento = params.contratoRegistroAposentadorias.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });

      if (!evento || evento.name !== "CreditosAposentados") {
        continue;
      }

      return {
        hash: params.hash,
        receipt: params.receipt,
        idAposentadoria: evento.args.idAposentadoria.toString(),
        comprador: String(evento.args.comprador),
        idLote: evento.args.idLote.toString(),
        quantidade: evento.args.quantidade.toString(),
        idCertificado: evento.args.idCertificado.toString(),
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    "Não foi possível localizar o evento CreditosAposentados no recibo."
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

export async function consultarTaxaAposentadoria(): Promise<TaxaAposentadoria> {
  try {
    const contratoRegistroAposentadorias =
      await obterContratoRegistroAposentadorias(false);

    const taxa = await contratoRegistroAposentadorias.taxaAposentadoria();

    return {
      taxaWei: taxa.toString(),
      taxaETH: ethers.formatEther(taxa),
    };
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function aposentarCreditosCarbono(params: {
  idLote: string | number | bigint;
  quantidade: string | number | bigint;
  motivo: string;
  uriRelatorio: string;
  uriCertificado: string;
}): Promise<ResultadoAposentadoria> {
  try {
    const idLote = validarInteiroPositivo(params.idLote, "ID do lote");
    const quantidade = validarInteiroPositivo(
      params.quantidade,
      "Quantidade"
    );
    const motivo = validarTextoObrigatorio(params.motivo, "Motivo");
    const uriRelatorio = validarTextoObrigatorio(
      params.uriRelatorio,
      "Relatório"
    );
    const uriCertificado = validarTextoObrigatorio(
      params.uriCertificado,
      "Certificado"
    );

    const contratoRegistroAposentadorias =
      await obterContratoRegistroAposentadorias(true);

    const taxa = await contratoRegistroAposentadorias.taxaAposentadoria();

    const tx = await contratoRegistroAposentadorias.aposentarCreditos(
      idLote,
      quantidade,
      motivo,
      uriRelatorio,
      uriCertificado,
      {
        value: taxa,
      }
    );

    console.log("Aposentadoria enviada:", {
      idLote: idLote.toString(),
      quantidade: quantidade.toString(),
      motivo,
      uriRelatorio,
      uriCertificado,
      taxaWei: taxa.toString(),
      taxaETH: ethers.formatEther(taxa),
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return extrairEventoCreditosAposentados({
      hash: tx.hash,
      receipt,
      contratoRegistroAposentadorias,
    });
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function consultarAposentadoria(
  idAposentadoria: string | number | bigint
): Promise<AposentadoriaCarbono> {
  try {
    const id = validarInteiroPositivo(
      idAposentadoria,
      "ID da aposentadoria"
    );

    const contratoRegistroAposentadorias =
      await obterContratoRegistroAposentadorias(false);

    const existe = await contratoRegistroAposentadorias.aposentadoriaExiste(id);

    if (!existe) {
      throw new Error("Aposentadoria inexistente.");
    }

    const dados = await contratoRegistroAposentadorias.aposentadorias(id);

    return converterAposentadoria(dados);
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function consultarCertificado(
  idCertificado: string | number | bigint
): Promise<CertificadoCompensacao> {
  try {
    const id = validarInteiroPositivo(idCertificado, "ID do certificado");

    const contratoCertificado = await obterContratoCertificadoCompensacaoNFT(
      false
    );

    const dados = await contratoCertificado.certificados(id);

    const idRetornado = BigInt(String(dados[0]));

    if (idRetornado === 0n) {
      throw new Error("Certificado inexistente.");
    }

    return await converterCertificado(dados);
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function consultarTotalCompensadoComprador(
  carteira?: string
): Promise<string> {
  try {
    const comprador = carteira || (await obterContaAtualMetaMask());

    const contratoRegistroAposentadorias =
      await obterContratoRegistroAposentadorias(false);

    const total =
      await contratoRegistroAposentadorias.totalCompensadoPorComprador(
        comprador
      );

    return total.toString();
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function consultarTotalAposentadoPorLote(
  idLote: string | number | bigint
): Promise<string> {
  try {
    const id = validarInteiroPositivo(idLote, "ID do lote");

    const contratoRegistroAposentadorias =
      await obterContratoRegistroAposentadorias(false);

    const total = await contratoRegistroAposentadorias.totalAposentadoPorLote(
      id
    );

    return total.toString();
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function listarAposentadoriasDoComprador(params: {
  carteira?: string;
  limite?: number;
} = {}): Promise<AposentadoriaCarbono[]> {
  try {
    const comprador = (params.carteira || (await obterContaAtualMetaMask()))
      .trim()
      .toLowerCase();

    const contratoRegistroAposentadorias =
      await obterContratoRegistroAposentadorias(false);

    const total = await contratoRegistroAposentadorias.totalAposentadorias();
    const totalNumero = Number(total);

    if (!Number.isFinite(totalNumero) || totalNumero <= 0) {
      return [];
    }

    const limite = params.limite && params.limite > 0 ? params.limite : 50;
    const aposentadorias: AposentadoriaCarbono[] = [];

    for (
      let id = totalNumero;
      id >= 1 && aposentadorias.length < limite;
      id--
    ) {
      const dados = await contratoRegistroAposentadorias.aposentadorias(id);
      const aposentadoria = converterAposentadoria(dados);

      if (aposentadoria.idAposentadoria === "0") {
        continue;
      }

      if (aposentadoria.comprador.toLowerCase() === comprador) {
        aposentadorias.push(aposentadoria);
      }
    }

    return aposentadorias;
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function listarCertificadosDoBeneficiario(params: {
  carteira?: string;
  limite?: number;
} = {}): Promise<CertificadoCompensacao[]> {
  try {
    const beneficiario = (params.carteira || (await obterContaAtualMetaMask()))
      .trim()
      .toLowerCase();

    const contratoCertificado = await obterContratoCertificadoCompensacaoNFT(
      false
    );

    const total = await contratoCertificado.totalCertificados();
    const totalNumero = Number(total);

    if (!Number.isFinite(totalNumero) || totalNumero <= 0) {
      return [];
    }

    const limite = params.limite && params.limite > 0 ? params.limite : 50;
    const certificados: CertificadoCompensacao[] = [];

    for (
      let id = totalNumero;
      id >= 1 && certificados.length < limite;
      id--
    ) {
      try {
        const donoAtual = String(await contratoCertificado.ownerOf(id));

        if (donoAtual.toLowerCase() !== beneficiario) {
          continue;
        }

        const dados = await contratoCertificado.certificados(id);
        const certificado = await converterCertificado(dados);

        certificados.push(certificado);
      } catch {
        continue;
      }
    }

    return certificados;
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}

export async function consultarResumoAposentadoriasComprador(params: {
  carteira?: string;
  limite?: number;
} = {}): Promise<ResumoAposentadoriasComprador> {
  try {
    const comprador = params.carteira || (await obterContaAtualMetaMask());

    const [totalCompensado, aposentadorias, certificados] = await Promise.all([
      consultarTotalCompensadoComprador(comprador),
      listarAposentadoriasDoComprador({
        carteira: comprador,
        limite: params.limite,
      }),
      listarCertificadosDoBeneficiario({
        carteira: comprador,
        limite: params.limite,
      }),
    ]);

    return {
      comprador,
      totalCompensado,
      aposentadorias,
      certificados,
    };
  } catch (erro) {
    throw tratarErroAposentadoria(erro);
  }
}