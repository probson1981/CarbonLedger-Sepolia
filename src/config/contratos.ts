/**
 * @file contratos.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
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
    TokenImpactoCarbono: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    CreditoCarbonoToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    CertificadoCompensacaoNFT: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    RegistroOrganizacoes: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    TesourariaCarbono: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    RegistroProjetosCarbono: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
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
 * Retorna todos os endereços configurados para uma rede.
 */
export function obterEnderecosContratos(
  nomeRede: NomeRedeSuportada
): EnderecosContratos {
  return ENDERECOS_CONTRATOS[nomeRede];
}

/**
 * @notice
 * Retorna o endereço de um contrato específico.
 */
export function obterEnderecoContrato(
  nomeRede: NomeRedeSuportada,
  nomeContrato: keyof EnderecosContratos
): string {
  const endereco = ENDERECOS_CONTRATOS[nomeRede][nomeContrato];

  if (!endereco || endereco === ENDERECO_NAO_CONFIGURADO) {
    throw new Error(
      `Contrato ${nomeContrato} nao configurado para a rede ${nomeRede}`
    );
  }

  return endereco;
}
