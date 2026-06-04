/**
 * @file contratos.ts
 * @author Patrício Alves
 *
 * @notice
 * Arquivo gerado automaticamente pelo script scripts/deploy_local.ts.
 */

import type { NomeRedeSuportada } from "./redes";

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
  MockPriceFeedChainlink: string;
  AdaptadorOraculoChainlink: string;
}

export type IdentificadorRede = NomeRedeSuportada | string | number | bigint;

export const ENDERECO_NAO_CONFIGURADO =
  "0x0000000000000000000000000000000000000000";

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
    ValidacaoProjetos: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    MercadoCarbono: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    RegistroAposentadorias: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    StakingCarbono: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    GovernancaCarbono: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    MockPriceFeedChainlink: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    AdaptadorOraculoChainlink: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
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
    MockPriceFeedChainlink: ENDERECO_NAO_CONFIGURADO,
    AdaptadorOraculoChainlink: ENDERECO_NAO_CONFIGURADO,
  },
};

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

export function obterEnderecosContratos(
  identificadorRede: IdentificadorRede
): EnderecosContratos {
  const nomeRede = resolverNomeRede(identificadorRede);

  return ENDERECOS_CONTRATOS[nomeRede];
}

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
