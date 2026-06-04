/**
 * @file blockchain.ts
 * @author Patrício Alves
 *
 * @notice
 * Funções auxiliares para conexão do frontend com os contratos do CarbonLedger.
 *
 * @dev
 * Este arquivo usa:
 *
 * - MetaMask como provider;
 * - ethers v6;
 * - config/redes.ts para detectar a rede;
 * - config/contratos.ts para buscar o endereço;
 * - contracts.generated.ts apenas para obter as ABIs.
 *
 * Importante:
 * Este arquivo não deve usar DEPLOYMENTS de contracts.generated.ts,
 * pois os endereços oficiais do frontend ficam em contratos.ts.
 */

import { ethers, type InterfaceAbi } from "ethers";
import { ABIS } from "./contracts.generated";
import { obterRedeAtual } from "./redes";
import {
  obterEnderecoContrato,
  type EnderecosContratos,
} from "./contratos";

/**
 * @notice
 * Tipo mínimo do provider Ethereum injetado pelo MetaMask.
 */
export type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

/**
 * @notice
 * Nome dos contratos aceitos pelo frontend.
 *
 * @dev
 * Usa apenas contratos que existem ao mesmo tempo:
 *
 * - em ABIS, para obter a ABI;
 * - em EnderecosContratos, para obter o endereço.
 *
 * Isso evita tentar instanciar contratos presentes na ABI,
 * mas ausentes no arquivo contratos.ts.
 */
export type ContractName = Extract<keyof typeof ABIS, keyof EnderecosContratos>;

/**
 * @notice
 * Obtém o provider do MetaMask.
 */
export function obterProviderMetaMask(ethereum: EthereumProvider) {
  return new ethers.BrowserProvider(ethereum as never);
}

/**
 * @notice
 * Obtém o endereço de um contrato pela rede atual.
 *
 * @param contractName Nome do contrato.
 *
 * @returns Endereço do contrato na rede atual.
 */
export async function getContractAddress(
  contractName: ContractName
): Promise<string> {
  const { chainId } = await obterRedeAtual();

  const chainIdAtual = String(chainId);

  return obterEnderecoContrato(chainIdAtual, contractName);
}

/**
 * @notice
 * Obtém uma instância conectada de contrato já implantado.
 *
 * @param ethereum Provider Ethereum injetado pelo MetaMask.
 * @param contractName Nome do contrato.
 *
 * @returns Provider, signer, contrato, conta, chainId e endereço.
 */
export async function getDeployedContract(
  ethereum: EthereumProvider,
  contractName: ContractName
) {
  const provider = obterProviderMetaMask(ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const account = await signer.getAddress();

  const { chainId } = await obterRedeAtual();
  const chainIdAtual = String(chainId);

  const address = obterEnderecoContrato(chainIdAtual, contractName);

  const abi = ABIS[contractName] as InterfaceAbi | undefined;

  if (!abi) {
    throw new Error(`ABI nao encontrada para o contrato ${String(contractName)}`);
  }

  const contract = new ethers.Contract(address, abi, signer);

  return {
    provider,
    signer,
    contract,
    account,
    chainId: chainIdAtual,
    address,
  };
}