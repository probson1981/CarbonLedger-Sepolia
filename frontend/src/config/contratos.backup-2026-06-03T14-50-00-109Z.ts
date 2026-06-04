/**
 * @file contratos.ts
 * @author Patrício Alves
 *
 * @notice
 * Arquivo gerado automaticamente pelo script scripts/deploy_local.ts.
 *
 * @dev
 * Este arquivo centraliza os endereços dos contratos do CarbonLedger
 * por rede.
 *
 * Atenção:
 * - A seção localhost é sobrescrita a cada deploy local.
 * - A seção sepolia deve ser atualizada após deploy em testnet.
 */

import type { NomeRedeSuportada } from "./redes";

/**
 * @notice
 * Estrutura com os endereços dos contratos usados pelo frontend.
 */
export interface EnderecosContratos {
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
  AdaptadorOraculoChainlink: string;
}

/**
 * @notice
 * Tipo auxiliar para permitir buscar contratos usando nome lógico da rede
 * ou o chainId retornado pela MetaMask.
 */
export type IdentificadorRede = NomeRedeSuportada | string | number | bigint;

/**
 * @notice
 * Endereço vazio usado enquanto determinado contrato ainda não foi implantado.
 */
export const ENDERECO_NAO_CONFIGURADO =
  "0x0000000000000000000000000000000000000000";

/**
 * @notice
 * Endereços dos contratos por rede.
 */
export const ENDERECOS_CONTRATOS: Record<
  NomeRedeSuportada,
  EnderecosContratos
> = {
  localhost: {
    TokenImpactoCarbono: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    CreditoCarbonoToken: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
    CertificadoCompensacaoNFT: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
    RegistroOrganizacoes: "0x9A676e781A523b5d0C0e43731313A708CB607508",
    TesourariaCarbono: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
    RegistroProjetosCarbono: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
    ValidacaoProjetos: "0x0000000000000000000000000000000000000000",
    MercadoCarbono: "0x0000000000000000000000000000000000000000",
    RegistroAposentadorias: "0x0000000000000000000000000000000000000000",
    StakingCarbono: "0x0000000000000000000000000000000000000000",
    GovernancaCarbono: "0x0000000000000000000000000000000000000000",
    AdaptadorOraculoChainlink: "0x0000000000000000000000000000000000000000",
  },

  sepolia: {
    TokenImpactoCarbono: ENDERECO_NAO_CONFIGURADO,
    CreditoCarbonoToken: ENDERECO_NAO_CONFIGURADO,
    CertificadoCompensacaoNFT: ENDERECO_NAO_CONFIGURADO,
    RegistroOrganizacoes: ENDERECO_NAO_CONFIGURADO,
    TesourariaCarbono: ENDERECO_NAO_CONFIGURADO,
    RegistroProjetosCarbono: ENDERECO_NAO_CONFIGURADO,
    ValidacaoProjetos: ENDERECO_NAO_CONFIGURADO,
    MercadoCarbono: ENDERECO_NAO_CONFIGURADO,
    RegistroAposentadorias: ENDERECO_NAO_CONFIGURADO,
    StakingCarbono: ENDERECO_NAO_CONFIGURADO,
    GovernancaCarbono: ENDERECO_NAO_CONFIGURADO,
    AdaptadorOraculoChainlink: ENDERECO_NAO_CONFIGURADO,
  },
};

/**
 * @notice
 * Converte o identificador da rede para o nome lógico usado no frontend.
 *
 * Aceita:
 * - "localhost"
 * - "sepolia"
 * - "31337"
 * - 31337
 * - "0x7a69"
 * - "11155111"
 * - 11155111
 * - "0xaa36a7"
 */
export function resolverNomeRede(
  identificadorRede: IdentificadorRede
): NomeRedeSuportada {
  const valor = String(identificadorRede).trim().toLowerCase();

  if (valor === "localhost" || valor === "31337" || valor === "0x7a69") {
    return "localhost";
  }

  if (valor === "sepolia" || valor === "11155111" || valor === "0xaa36a7") {
    return "sepolia";
  }

  throw new Error(
    `Rede não suportada pelo frontend: ${String(identificadorRede)}`
  );
}

/**
 * @notice
 * Retorna todos os endereços configurados para uma rede.
 *
 * @param identificadorRede Nome lógico da rede ou chainId.
 *
 * @returns Endereços dos contratos da rede escolhida.
 */
export function obterEnderecosContratos(
  identificadorRede: IdentificadorRede
): EnderecosContratos {
  const nomeRede = resolverNomeRede(identificadorRede);

  return ENDERECOS_CONTRATOS[nomeRede];
}

/**
 * @notice
 * Retorna o endereço de um contrato específico.
 *
 * @param identificadorRede Nome lógico da rede ou chainId.
 * @param nomeContrato Nome do contrato desejado.
 *
 * @returns Endereço do contrato.
 */
export function obterEnderecoContrato(
  identificadorRede: IdentificadorRede,
  nomeContrato: keyof EnderecosContratos
): string {
  const nomeRede = resolverNomeRede(identificadorRede);

  const endereco = ENDERECOS_CONTRATOS[nomeRede][nomeContrato];

  if (!endereco || endereco === ENDERECO_NAO_CONFIGURADO) {
    throw new Error(
      `Contrato ${nomeContrato} nao configurado para a rede ${nomeRede}`
    );
  }

  return endereco;
}
