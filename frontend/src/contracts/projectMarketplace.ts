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

export type EstadoOfertaTexto =
  | "Aberta"
  | "Parcialmente vendida"
  | "Encerrada"
  | "Cancelada"
  | "Desconhecida";

export type OfertaMarketplace = {
  idOferta: string;
  vendedor: string;
  idLote: string;
  quantidadeTotal: string;
  quantidadeDisponivel: string;
  precoPorCreditoWei: string;
  precoPorCreditoETH: string;
  estadoOfertaCodigo: string;
  estadoOfertaTexto: EstadoOfertaTexto;
  dataCriacao: string;
  dataAtualizacao: string;
  disponivel: boolean;
};

export type ValoresCompraOferta = {
  idOferta: string;
  quantidade: string;
  valorTotalWei: string;
  valorTotalETH: string;
  valorTaxaWei: string;
  valorTaxaETH: string;
  valorVendedorWei: string;
  valorVendedorETH: string;
};

export type ResultadoTransacaoMarketplace = {
  hash: string;
  receipt: ethers.TransactionReceipt | null;
};

export type ResultadoCriacaoOferta = ResultadoTransacaoMarketplace & {
  idOferta: string;
  vendedor: string;
  idLote: string;
  quantidade: string;
  precoPorCreditoWei: string;
  precoPorCreditoETH: string;
};

export type ResultadoCompraOferta = ResultadoTransacaoMarketplace & {
  idOferta: string;
  comprador: string;
  vendedor: string;
  idLote: string;
  quantidade: string;
  valorTotalWei: string;
  valorTotalETH: string;
  valorTaxaWei: string;
  valorTaxaETH: string;
  valorVendedorWei: string;
  valorVendedorETH: string;
};

const ABI_CREDITO_CARBONO_TOKEN_MARKETPLACE = [
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address account, address operator) view returns (bool)",
  "function balanceOf(address account, uint256 id) view returns (uint256)",
];

const ABI_MERCADO_CARBONO = [
  "function criarOferta(uint256 idLote, uint256 quantidade, uint256 precoPorCredito) returns (uint256)",
  "function comprarCreditos(uint256 idOferta, uint256 quantidade) payable",
  "function cancelarOferta(uint256 idOferta)",
  "function ofertaDisponivel(uint256 idOferta) view returns (bool)",
  "function calcularCompra(uint256 idOferta, uint256 quantidade) view returns (uint256 valorTotal, uint256 valorTaxa, uint256 valorVendedor)",
  "function totalOfertas() view returns (uint256)",
  "function taxaMarketplaceBps() view returns (uint256)",
  "function ofertas(uint256 idOferta) view returns (uint256 idOfertaRetornado, address vendedor, uint256 idLote, uint256 quantidadeTotal, uint256 quantidadeDisponivel, uint256 precoPorCredito, uint8 estadoOferta, uint256 dataCriacao, uint256 dataAtualizacao)",
  "event OfertaCriada(uint256 indexed idOferta, address indexed vendedor, uint256 indexed idLote, uint256 quantidade, uint256 precoPorCredito)",
  "event CreditosComprados(uint256 indexed idOferta, address indexed comprador, address indexed vendedor, uint256 idLote, uint256 quantidade, uint256 valorTotal, uint256 valorTaxa, uint256 valorVendedor)",
  "event OfertaCancelada(uint256 indexed idOferta, address indexed vendedor)",
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
    throw new Error(`${nomeCampo} invÃ¡lido.`);
  }

  return convertido;
}

function converterPrecoParaWei(params: {
  precoPorCreditoWei?: string | number | bigint;
  precoPorCreditoETH?: string;
}): bigint {
  if (params.precoPorCreditoWei !== undefined) {
    return validarInteiroPositivo(
      params.precoPorCreditoWei,
      "PreÃ§o por crÃ©dito"
    );
  }

  const precoETH = params.precoPorCreditoETH?.trim();

  if (!precoETH) {
    throw new Error("Informe o preÃ§o por crÃ©dito em ETH ou em wei.");
  }

  const precoWei = ethers.parseEther(precoETH);

  if (precoWei <= 0n) {
    throw new Error("PreÃ§o por crÃ©dito invÃ¡lido.");
  }

  return precoWei;
}

function estadoOfertaParaTexto(codigo: string): EstadoOfertaTexto {
  if (codigo === "0") {
    return "Aberta";
  }

  if (codigo === "1") {
    return "Parcialmente vendida";
  }

  if (codigo === "2") {
    return "Encerrada";
  }

  if (codigo === "3") {
    return "Cancelada";
  }

  return "Desconhecida";
}

function tratarErroMarketplace(erro: unknown): Error {
  console.error("Erro bruto no marketplace:", erro);

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

  return new Error("Erro desconhecido no marketplace.");
}

async function obterProviderEChainId() {
  const ethereum = obterEthereum();

  if (!ethereum) {
    throw new Error("MetaMask nÃ£o encontrada no navegador.");
  }

  const rede = await obterRedeAtual();
  const chainIdAtual = String(rede.chainId);

  const redesPermitidas = ["31337", "11155111"];

  if (!redesPermitidas.includes(chainIdAtual)) {
    throw new Error(
      `Rede incorreta. Selecione Hardhat Localhost ou Sepolia na MetaMask. Chain ID atual: ${chainIdAtual}`
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
      ABI_CREDITO_CARBONO_TOKEN_MARKETPLACE,
      signer
    );
  }

  return new ethers.Contract(
    enderecoCreditoCarbonoToken,
    ABI_CREDITO_CARBONO_TOKEN_MARKETPLACE,
    provider
  );
}

async function obterContratoMercado(comSigner: boolean) {
  const { provider, chainIdAtual } = await obterProviderEChainId();

  const enderecoMercadoCarbono = obterEnderecoContrato(
    chainIdAtual,
    "MercadoCarbono"
  );

  if (comSigner) {
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();

    return new ethers.Contract(
      enderecoMercadoCarbono,
      ABI_MERCADO_CARBONO,
      signer
    );
  }

  return new ethers.Contract(
    enderecoMercadoCarbono,
    ABI_MERCADO_CARBONO,
    provider
  );
}

async function obterEnderecoMercadoCarbono(): Promise<string> {
  const { chainIdAtual } = await obterProviderEChainId();

  return obterEnderecoContrato(chainIdAtual, "MercadoCarbono");
}

function converterOferta(params: {
  oferta: unknown;
  disponivel: boolean;
}): OfertaMarketplace {
  const valores = params.oferta as Array<unknown>;

  const idOferta = BigInt(String(valores[0]));
  const vendedor = String(valores[1]);
  const idLote = BigInt(String(valores[2]));
  const quantidadeTotal = BigInt(String(valores[3]));
  const quantidadeDisponivel = BigInt(String(valores[4]));
  const precoPorCredito = BigInt(String(valores[5]));
  const estadoOferta = BigInt(String(valores[6]));
  const dataCriacao = BigInt(String(valores[7]));
  const dataAtualizacao = BigInt(String(valores[8]));

  const estadoOfertaCodigo = estadoOferta.toString();

  return {
    idOferta: idOferta.toString(),
    vendedor,
    idLote: idLote.toString(),
    quantidadeTotal: quantidadeTotal.toString(),
    quantidadeDisponivel: quantidadeDisponivel.toString(),
    precoPorCreditoWei: precoPorCredito.toString(),
    precoPorCreditoETH: ethers.formatEther(precoPorCredito),
    estadoOfertaCodigo,
    estadoOfertaTexto: estadoOfertaParaTexto(estadoOfertaCodigo),
    dataCriacao: dataCriacao.toString(),
    dataAtualizacao: dataAtualizacao.toString(),
    disponivel: params.disponivel,
  };
}

function extrairEventoOfertaCriada(params: {
  receipt: ethers.TransactionReceipt | null;
  contratoMercado: ethers.Contract;
  fallback: {
    idLote: bigint;
    quantidade: bigint;
    precoPorCredito: bigint;
  };
}): ResultadoCriacaoOferta {
  if (!params.receipt) {
    throw new Error("Recibo da transaÃ§Ã£o nÃ£o disponÃ­vel.");
  }

  for (const log of params.receipt.logs) {
    try {
      const evento = params.contratoMercado.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });

      if (!evento || evento.name !== "OfertaCriada") {
        continue;
      }

      return {
        hash: params.receipt.hash,
        receipt: params.receipt,
        idOferta: evento.args.idOferta.toString(),
        vendedor: String(evento.args.vendedor),
        idLote: evento.args.idLote.toString(),
        quantidade: evento.args.quantidade.toString(),
        precoPorCreditoWei: evento.args.precoPorCredito.toString(),
        precoPorCreditoETH: ethers.formatEther(evento.args.precoPorCredito),
      };
    } catch {
      continue;
    }
  }

  throw new Error("NÃ£o foi possÃ­vel localizar o evento OfertaCriada no recibo.");
}

function extrairEventoCreditosComprados(params: {
  receipt: ethers.TransactionReceipt | null;
  contratoMercado: ethers.Contract;
}): ResultadoCompraOferta {
  if (!params.receipt) {
    throw new Error("Recibo da transaÃ§Ã£o nÃ£o disponÃ­vel.");
  }

  for (const log of params.receipt.logs) {
    try {
      const evento = params.contratoMercado.interface.parseLog({
        topics: log.topics,
        data: log.data,
      });

      if (!evento || evento.name !== "CreditosComprados") {
        continue;
      }

      return {
        hash: params.receipt.hash,
        receipt: params.receipt,
        idOferta: evento.args.idOferta.toString(),
        comprador: String(evento.args.comprador),
        vendedor: String(evento.args.vendedor),
        idLote: evento.args.idLote.toString(),
        quantidade: evento.args.quantidade.toString(),
        valorTotalWei: evento.args.valorTotal.toString(),
        valorTotalETH: ethers.formatEther(evento.args.valorTotal),
        valorTaxaWei: evento.args.valorTaxa.toString(),
        valorTaxaETH: ethers.formatEther(evento.args.valorTaxa),
        valorVendedorWei: evento.args.valorVendedor.toString(),
        valorVendedorETH: ethers.formatEther(evento.args.valorVendedor),
      };
    } catch {
      continue;
    }
  }

  throw new Error(
    "NÃ£o foi possÃ­vel localizar o evento CreditosComprados no recibo."
  );
}

export async function obterContaAtualMetaMask(): Promise<string> {
  const ethereum = obterEthereum();

  if (!ethereum) {
    throw new Error("MetaMask nÃ£o encontrada no navegador.");
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

export async function verificarMarketplaceAprovado(params: {
  carteira?: string;
} = {}): Promise<boolean> {
  try {
    const carteira = params.carteira || (await obterContaAtualMetaMask());
    const enderecoMercadoCarbono = await obterEnderecoMercadoCarbono();
    const contratoCredito = await obterContratoCredito(false);

    return await contratoCredito.isApprovedForAll(
      carteira,
      enderecoMercadoCarbono
    );
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function aprovarMarketplaceParaCreditos(
  aprovado = true
): Promise<ResultadoTransacaoMarketplace> {
  try {
    const enderecoMercadoCarbono = await obterEnderecoMercadoCarbono();
    const contratoCredito = await obterContratoCredito(true);

    const tx = await contratoCredito.setApprovalForAll(
      enderecoMercadoCarbono,
      aprovado
    );

    console.log("AprovaÃ§Ã£o do marketplace enviada:", {
      marketplace: enderecoMercadoCarbono,
      aprovado,
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return {
      hash: tx.hash,
      receipt,
    };
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function consultarSaldoCreditoMarketplace(params: {
  carteira?: string;
  idLote: string | number | bigint;
}): Promise<string> {
  try {
    const carteira = params.carteira || (await obterContaAtualMetaMask());
    const idLote = validarInteiroPositivo(params.idLote, "ID do lote");
    const contratoCredito = await obterContratoCredito(false);

    const saldo = await contratoCredito.balanceOf(carteira, idLote);

    return saldo.toString();
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function criarOfertaCreditos(params: {
  idLote: string | number | bigint;
  quantidade: string | number | bigint;
  precoPorCreditoWei?: string | number | bigint;
  precoPorCreditoETH?: string;
}): Promise<ResultadoCriacaoOferta> {
  try {
    const idLote = validarInteiroPositivo(params.idLote, "ID do lote");
    const quantidade = validarInteiroPositivo(
      params.quantidade,
      "Quantidade"
    );
    const precoPorCredito = converterPrecoParaWei({
      precoPorCreditoWei: params.precoPorCreditoWei,
      precoPorCreditoETH: params.precoPorCreditoETH,
    });

    const conta = await obterContaAtualMetaMask();
    const aprovado = await verificarMarketplaceAprovado({
      carteira: conta,
    });

    if (!aprovado) {
      throw new Error(
        "Marketplace nÃ£o aprovado. Execute a aprovaÃ§Ã£o ERC-1155 antes de criar a oferta."
      );
    }

    const saldo = await consultarSaldoCreditoMarketplace({
      carteira: conta,
      idLote,
    });

    if (BigInt(saldo) < quantidade) {
      throw new Error(
        `Saldo insuficiente no lote ${idLote.toString()}. Saldo: ${saldo}. Quantidade ofertada: ${quantidade.toString()}.`
      );
    }

    const contratoMercado = await obterContratoMercado(true);

    const tx = await contratoMercado.criarOferta(
      idLote,
      quantidade,
      precoPorCredito
    );

    console.log("CriaÃ§Ã£o de oferta enviada:", {
      idLote: idLote.toString(),
      quantidade: quantidade.toString(),
      precoPorCreditoWei: precoPorCredito.toString(),
      precoPorCreditoETH: ethers.formatEther(precoPorCredito),
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return extrairEventoOfertaCriada({
      receipt,
      contratoMercado,
      fallback: {
        idLote,
        quantidade,
        precoPorCredito,
      },
    });
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function consultarOferta(
  idOferta: string | number | bigint
): Promise<OfertaMarketplace> {
  try {
    const id = validarInteiroPositivo(idOferta, "ID da oferta");
    const contratoMercado = await obterContratoMercado(false);

    const [oferta, disponivel] = await Promise.all([
      contratoMercado.ofertas(id),
      contratoMercado.ofertaDisponivel(id),
    ]);

    const ofertaConvertida = converterOferta({
      oferta,
      disponivel: Boolean(disponivel),
    });

    if (ofertaConvertida.idOferta === "0") {
      throw new Error("Oferta inexistente.");
    }

    return ofertaConvertida;
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function listarOfertas(params: {
  apenasDisponiveis?: boolean;
  limite?: number;
} = {}): Promise<OfertaMarketplace[]> {
  try {
    const contratoMercado = await obterContratoMercado(false);

    const total = await contratoMercado.totalOfertas();
    const totalNumero = Number(total);

    if (!Number.isFinite(totalNumero) || totalNumero <= 0) {
      return [];
    }

    const limite = params.limite && params.limite > 0 ? params.limite : 50;
    const inicio = Math.max(1, totalNumero - limite + 1);

    const consultas: Promise<OfertaMarketplace>[] = [];

    for (let id = totalNumero; id >= inicio; id--) {
      consultas.push(consultarOferta(id));
    }

    const ofertas = await Promise.all(consultas);

    if (params.apenasDisponiveis) {
      return ofertas.filter((oferta) => oferta.disponivel);
    }

    return ofertas;
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function calcularCompraOferta(params: {
  idOferta: string | number | bigint;
  quantidade: string | number | bigint;
}): Promise<ValoresCompraOferta> {
  try {
    const idOferta = validarInteiroPositivo(
      params.idOferta,
      "ID da oferta"
    );
    const quantidade = validarInteiroPositivo(
      params.quantidade,
      "Quantidade"
    );

    const contratoMercado = await obterContratoMercado(false);

    const [valorTotal, valorTaxa, valorVendedor] =
      await contratoMercado.calcularCompra(idOferta, quantidade);

    return {
      idOferta: idOferta.toString(),
      quantidade: quantidade.toString(),
      valorTotalWei: valorTotal.toString(),
      valorTotalETH: ethers.formatEther(valorTotal),
      valorTaxaWei: valorTaxa.toString(),
      valorTaxaETH: ethers.formatEther(valorTaxa),
      valorVendedorWei: valorVendedor.toString(),
      valorVendedorETH: ethers.formatEther(valorVendedor),
    };
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function comprarCreditosOferta(params: {
  idOferta: string | number | bigint;
  quantidade: string | number | bigint;
}): Promise<ResultadoCompraOferta> {
  try {
    const idOferta = validarInteiroPositivo(
      params.idOferta,
      "ID da oferta"
    );
    const quantidade = validarInteiroPositivo(
      params.quantidade,
      "Quantidade"
    );

    const valores = await calcularCompraOferta({
      idOferta,
      quantidade,
    });

    const contratoMercado = await obterContratoMercado(true);

    const tx = await contratoMercado.comprarCreditos(idOferta, quantidade, {
      value: BigInt(valores.valorTotalWei),
    });

    console.log("Compra de crÃ©ditos enviada:", {
      idOferta: idOferta.toString(),
      quantidade: quantidade.toString(),
      valorTotalWei: valores.valorTotalWei,
      valorTotalETH: valores.valorTotalETH,
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return extrairEventoCreditosComprados({
      receipt,
      contratoMercado,
    });
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function cancelarOfertaCreditos(
  idOferta: string | number | bigint
): Promise<ResultadoTransacaoMarketplace> {
  try {
    const id = validarInteiroPositivo(idOferta, "ID da oferta");
    const contratoMercado = await obterContratoMercado(true);

    const tx = await contratoMercado.cancelarOferta(id);

    console.log("Cancelamento de oferta enviado:", {
      idOferta: id.toString(),
      hash: tx.hash,
    });

    const receipt = await tx.wait();

    return {
      hash: tx.hash,
      receipt,
    };
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}

export async function consultarTaxaMarketplaceBps(): Promise<string> {
  try {
    const contratoMercado = await obterContratoMercado(false);

    const taxa = await contratoMercado.taxaMarketplaceBps();

    return taxa.toString();
  } catch (erro) {
    throw tratarErroMarketplace(erro);
  }
}
