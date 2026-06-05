export type PerfilUsuario =
  | "administrador"
  | "proponente"
  | "validador"
  | "comprador"
  | "governanca"
  | "nao-autenticado";

export type StatusProjeto =
  | "Pendente de valida\u00e7\u00e3o"
  | "Em an\u00e1lise"
  | "Aprovado"
  | "Rejeitado"
  | "Cr\u00e9ditos emitidos";

export type AcaoPainel =
  | "inicio"
  | "novo-projeto"
  | "meus-projetos"
  | "validacao-projetos"
  | "emissao-creditos"
  | "ofertar-creditos"
  | "comprar-creditos"
  | "aposentar-creditos"
  | "certificados";

export type StatusOperacaoWeb3 =
  | "Aguardando a\u00e7\u00e3o"
  | "Aguardando MetaMask"
  | "Transa\u00e7\u00e3o enviada"
  | "Confirmada"
  | "Erro";

export type OperacaoWeb3 = {
  modo: "Blockchain" | "Simula\u00e7\u00e3o local";
  status: StatusOperacaoWeb3;
  contrato: string;
  conta: string;
  rede: string;
  hash: string;
  mensagem: string;
};

export type UsuarioDemo = {
  usuario: string;
  senha: string;
  nome: string;
  perfil: PerfilUsuario;
};

export type ProjetoCarbono = {
  id: string;
  idProjetoBlockchain?: string;
  proponente: string;
  nome: string;
  tipo: string;
  localizacao: string;
  creditosSolicitados: number;
  descricao: string;
  uriEvidencias: string;
  inicioPeriodoReferencia: string;
  fimPeriodoReferencia: string;
  status: StatusProjeto;
  criadoEm: string;
  hashTransacao?: string;
};

export type DadosNovoProjeto = {
  nome: string;
  tipo: string;
  localizacao: string;
  creditosSolicitados: number;
  descricao: string;
  uriEvidencias: string;
  inicioPeriodoReferencia: string;
  fimPeriodoReferencia: string;
};

export type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

export type EthereumProviderComEventos = EthereumProvider & {
  on?: (evento: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (
    evento: string,
    callback: (...args: unknown[]) => void
  ) => void;
};

export type OpcoesSincronizacao = {
  mostrarMensagem?: boolean;
};

export type DadosVotacaoTela = {
  idProjeto: string;
  inicioVotacao: string;
  fimVotacao: string;
  votosAprovacao: string;
  votosRejeicao: string;
  somaCreditosSugeridos: string;
  quantidadeSugestoes: string;
  encerrada: boolean;
  aprovado: boolean;
  creditosAprovados: string;
  tempoRestanteSegundos: number;
  podeEncerrar: boolean;
};

export type ResultadoValidacaoTela = {
  validadorApto: boolean;
  votacaoAberta: boolean;
  totalVotos: string;
  dadosVotacao: DadosVotacaoTela | null;
};

export type ResumoProjetoEmissaoTela = {
  idProjeto: string;
  proponente: string;
  creditosAprovados: string;
  aprovado: boolean;
  emitido: boolean;
};

export type LoteCreditoTela = {
  idProjeto: string;
  quantidadeEmitida: string;
  quantidadeAposentada: string;
  anoReferencia: string;
  ativo: boolean;
  loteEmitido: boolean;
};

export type LoteCreditoCompradorTela = {
  idLote: string;
  saldoComprador: string;
  totalOfertadoMarketplace: string;
  quantidadeDisponivelMarketplace: string;
  quantidadeOfertas: number;
  ultimoPrecoPorCreditoETH: string;
  totalAposentadoNoLote: string;
  estados: string;
  possuiSaldo: boolean;
};
