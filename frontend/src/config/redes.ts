/**
 * @file redes.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 *
 * @notice
 * Configuração centralizada das redes suportadas pelo frontend CarbonLedger.
 *
 * @dev
 * Este arquivo lê a rede diretamente do MetaMask usando eth_chainId.
 * Isso evita o problema de o frontend continuar exibindo a rede antiga
 * depois que o usuário troca de Sepolia para Hardhat Localhost.
 */

import { BrowserProvider } from "ethers";

/**
 * @notice
 * Redes lógicas suportadas pelo frontend.
 */
export type NomeRedeSuportada = "localhost" | "sepolia";

/**
 * @notice
 * Configuração de uma rede suportada.
 */
export interface ConfiguracaoRede {
  nome: NomeRedeSuportada;
  chainId: number;
  nomeExibicao: string;
  rpcLocal?: string;
  explorer?: string;
}

/**
 * @notice
 * Tipo local para representar o provedor Ethereum injetado pelo MetaMask.
 *
 * @dev
 * O método request é usado para chamadas EIP-1193.
 * O método on é usado para escutar mudanças de rede e de conta.
 */
type ProvedorEthereum = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;

  on?: (evento: string, callback: (...args: unknown[]) => void) => void;

  removeListener?: (
    evento: string,
    callback: (...args: unknown[]) => void
  ) => void;
};

/**
 * @notice
 * Tipo local para acessar window.ethereum sem alterar globalmente
 * a interface Window.
 */
type JanelaComEthereum = Window & {
  ethereum?: ProvedorEthereum;
};

/**
 * @notice
 * Redes aceitas pelo CarbonLedger.
 */
export const REDES_SUPORTADAS: Record<number, ConfiguracaoRede> = {
  31337: {
    nome: "localhost",
    chainId: 31337,
    nomeExibicao: "Hardhat Localhost",
    rpcLocal: "http://127.0.0.1:8545",
  },

  1337: {
    nome: "localhost",
    chainId: 1337,
    nomeExibicao: "Localhost 8545",
    rpcLocal: "http://127.0.0.1:8545",
  },

  11155111: {
    nome: "sepolia",
    chainId: 11155111,
    nomeExibicao: "Sepolia",
    explorer: "https://sepolia.etherscan.io",
  },
};

/**
 * @notice
 * Obtém o objeto ethereum do MetaMask.
 *
 * @returns Provedor Ethereum injetado pelo MetaMask.
 */
export function obterEthereum(): ProvedorEthereum {
  const janela = window as JanelaComEthereum;

  if (!janela.ethereum) {
    throw new Error("MetaMask nao encontrado. Instale ou habilite o MetaMask.");
  }

  return janela.ethereum;
}

/**
 * @notice
 * Verifica se o MetaMask está disponível.
 *
 * @returns Verdadeiro se o MetaMask estiver disponível.
 */
export function metamaskDisponivel(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const janela = window as JanelaComEthereum;

  return Boolean(janela.ethereum);
}

/**
 * @notice
 * Cria provider ethers conectado ao MetaMask.
 *
 * @returns BrowserProvider do ethers.
 */
export function obterProviderMetamask(): BrowserProvider {
  const ethereum = obterEthereum();

  return new BrowserProvider(ethereum);
}

/**
 * @notice
 * Conecta a carteira do usuário.
 *
 * @returns Lista de contas conectadas.
 */
export async function conectarCarteira(): Promise<string[]> {
  const ethereum = obterEthereum();

  const contas = await ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!Array.isArray(contas)) {
    throw new Error("Resposta invalida do MetaMask ao conectar carteira.");
  }

  return contas as string[];
}

/**
 * @notice
 * Lê o chainId diretamente do MetaMask.
 *
 * @dev
 * O MetaMask retorna chainId em hexadecimal.
 *
 * Exemplos:
 *
 * Sepolia:
 * 0xaa36a7
 *
 * Hardhat Localhost:
 * 0x7a69
 *
 * @returns Chain ID convertido para número decimal.
 */
export async function obterChainIdAtual(): Promise<number> {
  const ethereum = obterEthereum();

  const chainIdHex = await ethereum.request({
    method: "eth_chainId",
  });

  if (typeof chainIdHex !== "string") {
    throw new Error("Chain ID retornado pelo MetaMask e invalido.");
  }

  return Number.parseInt(chainIdHex, 16);
}

/**
 * @notice
 * Obtém a rede atual selecionada no MetaMask.
 *
 * @returns Provider, chainId e configuração da rede atual.
 */
export async function obterRedeAtual(): Promise<{
  provider: BrowserProvider;
  chainId: number;
  configuracao: ConfiguracaoRede;
}> {
  const provider = obterProviderMetamask();
  const chainId = await obterChainIdAtual();

  const configuracao = REDES_SUPORTADAS[chainId];

  if (!configuracao) {
    throw new Error(
      `Rede nao suportada pelo frontend. Chain ID detectado: ${chainId}`
    );
  }

  return {
    provider,
    chainId,
    configuracao,
  };
}

/**
 * @notice
 * Retorna o nome lógico da rede atual.
 *
 * @returns Nome lógico da rede.
 */
export async function obterNomeRedeAtual(): Promise<NomeRedeSuportada> {
  const { configuracao } = await obterRedeAtual();

  return configuracao.nome;
}

/**
 * @notice
 * Formata descrição da rede atual.
 *
 * @returns Texto amigável da rede atual.
 */
export async function obterDescricaoRedeAtual(): Promise<string> {
  const { chainId, configuracao } = await obterRedeAtual();

  return `${configuracao.nomeExibicao} - Chain ID ${chainId}`;
}

/**
 * @notice
 * Registra ouvintes para mudanças de rede e conta no MetaMask.
 *
 * @dev
 * Quando o usuário troca de rede ou conta, recarregamos a página
 * para evitar que o frontend continue usando estado antigo.
 */
export function observarMudancasMetamask(): void {
  if (!metamaskDisponivel()) {
    return;
  }

  const ethereum = obterEthereum();

  if (typeof ethereum.on !== "function") {
    return;
  }

  ethereum.on("chainChanged", () => {
    window.location.reload();
  });

  ethereum.on("accountsChanged", () => {
    window.location.reload();
  });
}
