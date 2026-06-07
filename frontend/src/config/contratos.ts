/* eslint-disable */
// Arquivo gerado automaticamente.
// Não edite manualmente.
//
// Para atualizar depois de um deploy, rode:
// node scripts/sync_frontend_deployments.cjs

export type NomeRedeSuportada = "localhost" | "sepolia";

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
    TokenImpactoCarbono: "0xc43E523187fF6a0B35662d6CD769Ef2E78435406",
    CreditoCarbonoToken: "0xD589A9b0E580E99c31F20255F5daeb52D9de46a0",
    CertificadoCompensacaoNFT: "0x66ba8C9a00BB2C2C1968Fe0dbBC0C947731104A3",
    RegistroOrganizacoes: "0x8c1315184e2bF65f9276ec38469Cbf077718F2eF",
    TesourariaCarbono: "0x357CBD09E682735C62CA0F671e590E196dE3C0d1",
    RegistroProjetosCarbono: "0x601799e9316EdA4B737EAf5DEBb090260ad707ce",
    ValidacaoProjetos: "0x0Fa33841c731F0F81a41a299E6B38bC8Bae34047",
    MercadoCarbono: "0xAafBfC81E735F7FC868A95bD9A390341E8EE2b80",
    RegistroAposentadorias: "0x03af95965103fFc636cca14Ec80214Cee13961BA",
    StakingCarbono: "0xcDbE632E6D807B1f45D3Fba564Ba22346654d975",
    GovernancaCarbono: "0x3263342aAF18769cc43CF52C933b0EA21B4505fE",
    MockPriceFeedChainlink: "0xa81eC17e78b91864e6C9CFa09abE92CF14feC9Cf",
    AdaptadorOraculoChainlink: "0xd6D902FD6b6A8EadF21D48e69f58D133BCbd12Be",
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

  throw new Error(`Rede não suportada pelo frontend: ${String(identificadorRede)}`);
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
      `Contrato ${String(nomeContrato)} não configurado para a rede ${nomeRede}`
    );
  }

  return endereco;
}
