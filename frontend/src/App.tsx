import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { cadastrarProjetoCarbono } from "./contracts/projectRegistry";
import {
  consultarEstadoProjetoBlockchain,
  consultarValidacaoProjeto,
  encerrarVotacaoProjeto,
  iniciarVotacaoProjeto,
  votarProjetoValidacao,
} from "./contracts/projectValidation";
import {
  consultarLoteCredito,
  consultarResumoProjetoParaEmissao,
  consultarSaldoLote,
  emitirCreditosProjetoAprovado,
} from "./contracts/projectCredit";
import {
  aprovarMarketplaceParaCreditos,
  calcularCompraOferta,
  cancelarOfertaCreditos,
  comprarCreditosOferta,
  consultarSaldoCreditoMarketplace,
  criarOfertaCreditos,
  listarOfertas,
  verificarMarketplaceAprovado,
  type OfertaMarketplace,
  type ValoresCompraOferta,
} from "./contracts/projectMarketplace";
import {
  aposentarCreditosCarbono,
  consultarResumoAposentadoriasComprador,
  consultarTaxaAposentadoria,
  consultarTotalAposentadoPorLote,
  type ResumoAposentadoriasComprador,
  type TaxaAposentadoria,
} from "./contracts/projectRetirement";
import "./App.css";

type PerfilUsuario =
  | "administrador"
  | "proponente"
  | "validador"
  | "comprador"
  | "governanca"
  | "nao-autenticado";

type StatusProjeto =
  | "Pendente de validação"
  | "Em análise"
  | "Aprovado"
  | "Rejeitado"
  | "Créditos emitidos";

type AcaoPainel =
  | "inicio"
  | "novo-projeto"
  | "meus-projetos"
  | "validacao-projetos"
  | "emissao-creditos"
  | "ofertar-creditos"
  | "comprar-creditos"
  | "aposentar-creditos"
  | "certificados";

type StatusOperacaoWeb3 =
  | "Aguardando ação"
  | "Aguardando MetaMask"
  | "Transação enviada"
  | "Confirmada"
  | "Erro";

type OperacaoWeb3 = {
  modo: "Blockchain" | "Simulação local";
  status: StatusOperacaoWeb3;
  contrato: string;
  conta: string;
  rede: string;
  hash: string;
  mensagem: string;
};

type UsuarioDemo = {
  usuario: string;
  senha: string;
  nome: string;
  perfil: PerfilUsuario;
};

type ProjetoCarbono = {
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

type DadosNovoProjeto = {
  nome: string;
  tipo: string;
  localizacao: string;
  creditosSolicitados: number;
  descricao: string;
  uriEvidencias: string;
  inicioPeriodoReferencia: string;
  fimPeriodoReferencia: string;
};

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[] | Record<string, unknown>;
  }) => Promise<unknown>;
};

type EthereumProviderComEventos = EthereumProvider & {
  on?: (evento: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (
    evento: string,
    callback: (...args: unknown[]) => void
  ) => void;
};

type OpcoesSincronizacao = {
  mostrarMensagem?: boolean;
};

type DadosVotacaoTela = {
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

type ResultadoValidacaoTela = {
  validadorApto: boolean;
  votacaoAberta: boolean;
  totalVotos: string;
  dadosVotacao: DadosVotacaoTela | null;
};

type ResumoProjetoEmissaoTela = {
  idProjeto: string;
  proponente: string;
  creditosAprovados: string;
  aprovado: boolean;
  emitido: boolean;
};

type LoteCreditoTela = {
  idProjeto: string;
  quantidadeEmitida: string;
  quantidadeAposentada: string;
  anoReferencia: string;
  ativo: boolean;
  loteEmitido: boolean;
};

type LoteCreditoCompradorTela = {
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

function obterEthereum(): EthereumProviderComEventos | undefined {
  return (window as typeof window & {
    ethereum?: EthereumProviderComEventos;
  }).ethereum;
}

const usuariosDemo: UsuarioDemo[] = [
  {
    usuario: "admin",
    senha: "admin123",
    nome: "Administrador do Sistema",
    perfil: "administrador",
  },
  {
    usuario: "proponente1",
    senha: "prop123",
    nome: "Proponente Solar Nordeste",
    perfil: "proponente",
  },
  {
    usuario: "proponente2",
    senha: "prop456",
    nome: "Proponente BioCarbono Ceará",
    perfil: "proponente",
  },
  {
    usuario: "validador1",
    senha: "val123",
    nome: "Validador Ambiental 1",
    perfil: "validador",
  },
  {
    usuario: "validador2",
    senha: "val456",
    nome: "Validador Ambiental 2",
    perfil: "validador",
  },
  {
    usuario: "comprador1",
    senha: "comp123",
    nome: "Comprador Industrial 1",
    perfil: "comprador",
  },
  {
    usuario: "comprador2",
    senha: "comp456",
    nome: "Comprador Corporativo 2",
    perfil: "comprador",
  },
];

const TIPO_PROJETO_MAP: Record<string, number> = {
  "Energia Solar": 0,
  "Energia Eólica": 1,
  Reflorestamento: 2,
  "Conservação Florestal": 3,
  Biodigestor: 4,
  "Eficiência Energética": 5,
  Reciclagem: 6,
  Outro: 7,
};

function carregarProjetosSalvos(): ProjetoCarbono[] {
  try {
    const dados = localStorage.getItem("carbonledger_projetos");

    if (!dados) {
      return [];
    }

    const projetos = JSON.parse(dados);

    if (!Array.isArray(projetos)) {
      return [];
    }

    return projetos;
  } catch {
    return [];
  }
}

function gerarIdProjeto() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `projeto-${Date.now()}`;
}

function encurtarEndereco(endereco: string) {
  if (!endereco) {
    return "";
  }

  return `${endereco.slice(0, 6)}...${endereco.slice(-4)}`;
}

function formatarErro(erro: unknown) {
  if (
    typeof erro === "object" &&
    erro !== null &&
    "reason" in erro &&
    typeof erro.reason === "string"
  ) {
    return erro.reason;
  }

  if (
    typeof erro === "object" &&
    erro !== null &&
    "shortMessage" in erro &&
    typeof erro.shortMessage === "string"
  ) {
    return erro.shortMessage;
  }

  if (erro instanceof Error) {
    return erro.message;
  }

  if (
    typeof erro === "object" &&
    erro !== null &&
    "message" in erro &&
    typeof erro.message === "string"
  ) {
    return erro.message;
  }

  return "Erro desconhecido ao executar a operação.";
}

function converterChainIdParaDecimal(chainIdHex: unknown): string {
  if (typeof chainIdHex !== "string") {
    return "";
  }

  try {
    return BigInt(chainIdHex).toString();
  } catch {
    return "";
  }
}

function obterPrimeiraConta(contas: unknown): string {
  if (Array.isArray(contas) && typeof contas[0] === "string") {
    return contas[0];
  }

  return "";
}

function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase();
}

function normalizarSenha(valor: string): string {
  return valor.trim();
}

function autenticarUsuario(
  usuarioInformado: string,
  senhaInformada: string
): UsuarioDemo | undefined {
  const usuarioNormalizado = normalizarUsuario(usuarioInformado);
  const senhaNormalizada = normalizarSenha(senhaInformada);

  return usuariosDemo.find(
    (item) =>
      normalizarUsuario(item.usuario) === usuarioNormalizado &&
      item.senha === senhaNormalizada
  );
}

function formatarDataHoraUnix(timestampTexto: string) {
  const timestamp = Number(timestampTexto);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "Não disponível";
  }

  return new Date(timestamp * 1000).toLocaleString("pt-BR");
}

function formatarTempoRestante(segundos: number) {
  if (!Number.isFinite(segundos) || segundos <= 0) {
    return "Encerrável agora";
  }

  const minutos = Math.floor(segundos / 60);
  const restoSegundos = segundos % 60;

  if (minutos <= 0) {
    return `${restoSegundos}s`;
  }

  return `${minutos}min ${restoSegundos}s`;
}

function obterAnoAtual() {
  return new Date().getFullYear().toString();
}

function sugerirIdLote(idProjetoBlockchain: string) {
  return idProjetoBlockchain;
}

function App() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioDemo | null>(null);
  const [enderecoCarteira, setEnderecoCarteira] = useState("");
  const [chainId, setChainId] = useState("");
  const [acaoPainel, setAcaoPainel] = useState<AcaoPainel>("inicio");
  const [sincronizandoCarteira, setSincronizandoCarteira] = useState(false);
  const [projetos, setProjetos] = useState<ProjetoCarbono[]>(
    carregarProjetosSalvos
  );

  const [operacaoWeb3, setOperacaoWeb3] = useState<OperacaoWeb3>({
    modo: "Blockchain",
    status: "Aguardando ação",
    contrato: "Automático por rede",
    conta: "",
    rede: "",
    hash: "",
    mensagem: "Nenhuma operação executada.",
  });

  const limparEstadoCarteira = useCallback((mensagemOperacao: string) => {
    setEnderecoCarteira("");
    setChainId("");

    setOperacaoWeb3((atual) => ({
      ...atual,
      conta: "",
      rede: "",
      status: "Aguardando ação",
      mensagem: mensagemOperacao,
    }));
  }, []);

  const sincronizarCarteiraComMetaMask = useCallback(
    async (opcoes: OpcoesSincronizacao = {}) => {
      const ethereum = obterEthereum();

      setSincronizandoCarteira(true);

      if (!ethereum) {
        limparEstadoCarteira("MetaMask não encontrada.");

        if (opcoes.mostrarMensagem) {
          setMensagem("MetaMask não encontrada. Instale ou habilite a extensão.");
        }

        setSincronizandoCarteira(false);
        return;
      }

      try {
        const contas = await ethereum.request({
          method: "eth_accounts",
        });

        const contaAtual = obterPrimeiraConta(contas);

        if (!contaAtual) {
          limparEstadoCarteira(
            "Nenhuma conta MetaMask está conectada ao site."
          );

          if (opcoes.mostrarMensagem) {
            setMensagem(
              "Nenhuma conta MetaMask está conectada ao site. Clique em Conectar MetaMask."
            );
          }

          setSincronizandoCarteira(false);
          return;
        }

        const rede = await ethereum.request({
          method: "eth_chainId",
        });

        const chainIdDecimal = converterChainIdParaDecimal(rede);

        if (!chainIdDecimal) {
          limparEstadoCarteira("Não foi possível identificar a rede.");

          if (opcoes.mostrarMensagem) {
            setMensagem("Não foi possível identificar a rede da MetaMask.");
          }

          setSincronizandoCarteira(false);
          return;
        }

        setEnderecoCarteira(contaAtual);
        setChainId(chainIdDecimal);

        setOperacaoWeb3((atual) => ({
          ...atual,
          conta: contaAtual,
          rede: chainIdDecimal,
          mensagem: "Carteira sincronizada com a MetaMask.",
        }));

        if (opcoes.mostrarMensagem) {
          setMensagem(
            `Carteira sincronizada: ${encurtarEndereco(
              contaAtual
            )}. Rede: ${chainIdDecimal}.`
          );
        }
      } catch (erro) {
        console.error("Erro ao sincronizar carteira:", erro);

        limparEstadoCarteira("Não foi possível sincronizar a carteira.");

        if (opcoes.mostrarMensagem) {
          setMensagem(
            `Não foi possível sincronizar a carteira: ${formatarErro(erro)}`
          );
        }
      } finally {
        setSincronizandoCarteira(false);
      }
    },
    [limparEstadoCarteira]
  );

  useEffect(() => {
    localStorage.setItem("carbonledger_projetos", JSON.stringify(projetos));
  }, [projetos]);

  useEffect(() => {
    const ethereum = obterEthereum();

    if (!ethereum) {
      limparEstadoCarteira("MetaMask não encontrada.");
      return;
    }

    const ethereumComEventos = ethereum as EthereumProviderComEventos;

    void sincronizarCarteiraComMetaMask();

    const tratarMudancaContas = () => {
      void sincronizarCarteiraComMetaMask({
        mostrarMensagem: true,
      });
    };

    const tratarMudancaRede = () => {
      void sincronizarCarteiraComMetaMask({
        mostrarMensagem: true,
      });
    };

    const tratarDesconexao = () => {
      limparEstadoCarteira("Carteira desconectada.");
      setMensagem("Carteira desconectada.");
    };

    const tratarFocoJanela = () => {
      void sincronizarCarteiraComMetaMask();
    };

    const tratarVisibilidade = () => {
      if (document.visibilityState === "visible") {
        void sincronizarCarteiraComMetaMask();
      }
    };

    if (typeof ethereumComEventos.on === "function") {
      ethereumComEventos.on("accountsChanged", tratarMudancaContas);
      ethereumComEventos.on("chainChanged", tratarMudancaRede);
      ethereumComEventos.on("disconnect", tratarDesconexao);
    }

    window.addEventListener("focus", tratarFocoJanela);
    document.addEventListener("visibilitychange", tratarVisibilidade);

    return () => {
      if (typeof ethereumComEventos.removeListener === "function") {
        ethereumComEventos.removeListener(
          "accountsChanged",
          tratarMudancaContas
        );

        ethereumComEventos.removeListener("chainChanged", tratarMudancaRede);

        ethereumComEventos.removeListener("disconnect", tratarDesconexao);
      }

      window.removeEventListener("focus", tratarFocoJanela);
      document.removeEventListener("visibilitychange", tratarVisibilidade);
    };
  }, [limparEstadoCarteira, sincronizarCarteiraComMetaMask]);

  const perfilAtual: PerfilUsuario = usuarioLogado?.perfil ?? "nao-autenticado";

  const tituloPainel = useMemo(() => {
    switch (perfilAtual) {
      case "administrador":
        return "Painel Administrativo";
      case "proponente":
        return "Painel do Proponente";
      case "validador":
        return "Painel do Validador";
      case "comprador":
        return "Painel do Comprador";
      case "governanca":
        return "Painel de Governança";
      default:
        return "Acesso ao CarbonLedger";
    }
  }, [perfilAtual]);

  function atualizarStatusProjetoPorIdBlockchain(
    idProjetoBlockchain: string,
    status: StatusProjeto
  ) {
    setProjetos((listaAtual) =>
      listaAtual.map((projeto) =>
        projeto.idProjetoBlockchain === idProjetoBlockchain
          ? { ...projeto, status }
          : projeto
      )
    );
  }

  function registrarLoginBemSucedido(usuarioEncontrado: UsuarioDemo) {
    setUsuario(usuarioEncontrado.usuario);
    setSenha(usuarioEncontrado.senha);
    setUsuarioLogado(usuarioEncontrado);
    setAcaoPainel("inicio");

    void sincronizarCarteiraComMetaMask();

    setMensagem(
      `Login realizado como ${usuarioEncontrado.nome}. Conecte ou sincronize a MetaMask para continuar.`
    );
  }

  function fazerLogin(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const usuarioNormalizado = normalizarUsuario(usuario);
    const senhaNormalizada = normalizarSenha(senha);

    if (!usuarioNormalizado) {
      setMensagem("Informe o usuário de demonstração.");
      return;
    }

    if (!senhaNormalizada) {
      setMensagem("Informe a senha de demonstração.");
      return;
    }

    const encontrado = autenticarUsuario(usuarioNormalizado, senhaNormalizada);

    if (!encontrado) {
      setMensagem(
        `Usuário ou senha inválidos. Usuário informado: ${usuarioNormalizado}.`
      );
      return;
    }

    registrarLoginBemSucedido(encontrado);
  }

  function entrarComUsuarioDemo(item: UsuarioDemo) {
    registrarLoginBemSucedido(item);
  }

  async function conectarCarteira() {
    const ethereum = obterEthereum();

    limparEstadoCarteira("Solicitando conexão com a MetaMask.");

    if (!ethereum) {
      setMensagem("MetaMask não encontrada. Instale ou habilite a extensão.");
      return;
    }

    try {
      const contas = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const contaAtual = obterPrimeiraConta(contas);

      if (!contaAtual) {
        limparEstadoCarteira("Nenhuma conta foi retornada pela MetaMask.");
        setMensagem("Nenhuma conta foi retornada pela MetaMask.");
        return;
      }

      const rede = await ethereum.request({
        method: "eth_chainId",
      });

      const chainIdDecimal = converterChainIdParaDecimal(rede);

      if (!chainIdDecimal) {
        limparEstadoCarteira("Não foi possível identificar a rede.");
        setMensagem("Não foi possível identificar a rede da carteira.");
        return;
      }

      setEnderecoCarteira(contaAtual);
      setChainId(chainIdDecimal);

      setOperacaoWeb3((atual) => ({
        ...atual,
        conta: contaAtual,
        rede: chainIdDecimal,
        mensagem: "Carteira conectada com sucesso.",
      }));

      setMensagem(
        `Carteira conectada com sucesso: ${encurtarEndereco(contaAtual)}.`
      );
    } catch (erro) {
      console.error(erro);

      limparEstadoCarteira("Não foi possível conectar a carteira.");

      setMensagem(`Não foi possível conectar a carteira: ${formatarErro(erro)}`);
    }
  }

  async function cadastrarProjeto(dados: DadosNovoProjeto) {
    if (!usuarioLogado) {
      setMensagem("Faça login novamente para cadastrar o projeto.");
      return;
    }

    const ethereum = obterEthereum();

    if (!ethereum) {
      setMensagem("MetaMask não encontrada. Instale ou habilite a extensão.");

      setOperacaoWeb3({
        modo: "Blockchain",
        status: "Erro",
        contrato: "RegistroProjetosCarbono",
        conta: "",
        rede: "",
        hash: "",
        mensagem: "MetaMask não encontrada.",
      });

      return;
    }

    try {
      setMensagem("Preparando transação na blockchain...");

      setOperacaoWeb3({
        modo: "Blockchain",
        status: "Aguardando MetaMask",
        contrato: "RegistroProjetosCarbono",
        conta: enderecoCarteira || "Solicitando conta...",
        rede: chainId || "Detectando rede...",
        hash: "",
        mensagem:
          "Preparando cadastro no contrato RegistroProjetosCarbono. Taxa: 0.001 ETH.",
      });

      const contas = await ethereum.request({
        method: "eth_requestAccounts",
      });

      const contaAtual = obterPrimeiraConta(contas);

      if (!contaAtual) {
        limparEstadoCarteira("Nenhuma conta foi retornada pela MetaMask.");
        throw new Error("Nenhuma conta foi retornada pela MetaMask.");
      }

      const rede = await ethereum.request({
        method: "eth_chainId",
      });

      const chainIdDecimal = converterChainIdParaDecimal(rede);

      if (!chainIdDecimal) {
        limparEstadoCarteira("Não foi possível identificar a rede.");
        throw new Error("Não foi possível identificar a rede da carteira.");
      }

      if (chainIdDecimal !== "31337") {
        throw new Error(
          `Rede incorreta. Selecione Hardhat Localhost. Chain ID atual: ${chainIdDecimal}`
        );
      }

      setEnderecoCarteira(contaAtual);
      setChainId(chainIdDecimal);

      const tipoProjetoCodigo = TIPO_PROJETO_MAP[dados.tipo];

      if (tipoProjetoCodigo === undefined) {
        throw new Error(`Tipo de projeto inválido: ${dados.tipo}`);
      }

      setOperacaoWeb3({
        modo: "Blockchain",
        status: "Aguardando MetaMask",
        contrato: "RegistroProjetosCarbono",
        conta: contaAtual,
        rede: chainIdDecimal,
        hash: "",
        mensagem: "Confirme a transação na MetaMask. Taxa: 0.001 ETH.",
      });

      const resultado = await cadastrarProjetoCarbono({
        nomeProjeto: dados.nome,
        descricao: dados.descricao,
        localizacao: dados.localizacao,
        tipoProjeto: tipoProjetoCodigo,
        creditosSolicitados: dados.creditosSolicitados,
        uriEvidencias: dados.uriEvidencias,
        inicioPeriodoReferencia: dados.inicioPeriodoReferencia,
        fimPeriodoReferencia: dados.fimPeriodoReferencia,
      });

      setOperacaoWeb3({
        modo: "Blockchain",
        status: "Transação enviada",
        contrato: "RegistroProjetosCarbono",
        conta: contaAtual,
        rede: chainIdDecimal,
        hash: resultado.hash,
        mensagem: "Transação enviada. Aguardando confirmação do bloco.",
      });

      const novoProjeto: ProjetoCarbono = {
        id: resultado.hash || gerarIdProjeto(),
        idProjetoBlockchain: resultado.idProjetoBlockchain,
        proponente: usuarioLogado.usuario,
        nome: dados.nome,
        tipo: dados.tipo,
        localizacao: dados.localizacao,
        creditosSolicitados: dados.creditosSolicitados,
        descricao: dados.descricao,
        uriEvidencias: dados.uriEvidencias,
        inicioPeriodoReferencia: dados.inicioPeriodoReferencia,
        fimPeriodoReferencia: dados.fimPeriodoReferencia,
        status: "Pendente de validação",
        criadoEm: new Date().toLocaleString("pt-BR"),
        hashTransacao: resultado.hash,
      };

      setProjetos((listaAtual) => [novoProjeto, ...listaAtual]);
      setAcaoPainel("meus-projetos");

      setOperacaoWeb3({
        modo: "Blockchain",
        status: "Confirmada",
        contrato: "RegistroProjetosCarbono",
        conta: contaAtual,
        rede: chainIdDecimal,
        hash: resultado.hash,
        mensagem: `Projeto cadastrado na blockchain com sucesso. ID: ${resultado.idProjetoBlockchain}.`,
      });

      setMensagem(
        `Projeto cadastrado na blockchain e enviado para validação. ID: ${resultado.idProjetoBlockchain}.`
      );
    } catch (erro) {
      console.error(erro);

      setOperacaoWeb3((atual) => ({
        ...atual,
        modo: "Blockchain",
        status: "Erro",
        hash: "",
        mensagem: formatarErro(erro),
      }));

      setMensagem(`Erro ao cadastrar projeto na blockchain: ${formatarErro(erro)}`);
    }
  }

  function sair() {
    setUsuario("");
    setSenha("");
    setUsuarioLogado(null);
    setEnderecoCarteira("");
    setChainId("");
    setAcaoPainel("inicio");
    setMensagem("");

    setOperacaoWeb3({
      modo: "Blockchain",
      status: "Aguardando ação",
      contrato: "Automático por rede",
      conta: "",
      rede: "",
      hash: "",
      mensagem: "Nenhuma operação executada.",
    });
  }

  return (
    <main className="app">
      <header className="topbar">
        <div>
          <h1>CarbonLedger</h1>
          <p>
            Registro, validação e negociação de créditos de carbono em blockchain
          </p>
        </div>

        <div className="wallet-box">
          {enderecoCarteira ? (
            <>
              <strong>{encurtarEndereco(enderecoCarteira)}</strong>
              <span>Rede: {chainId || "não identificada"}</span>

              <button
                className="btn-secondary"
                type="button"
                onClick={() =>
                  void sincronizarCarteiraComMetaMask({
                    mostrarMensagem: true,
                  })
                }
                disabled={sincronizandoCarteira}
              >
                {sincronizandoCarteira
                  ? "Sincronizando..."
                  : "Sincronizar MetaMask"}
              </button>
            </>
          ) : (
            <>
              <strong>Carteira não conectada</strong>
              <span>Rede: {chainId || "não identificada"}</span>

              <button
                className="btn-primary"
                type="button"
                onClick={conectarCarteira}
                disabled={sincronizandoCarteira}
              >
                Conectar MetaMask
              </button>
            </>
          )}
        </div>
      </header>

      <section className="container">
        {!usuarioLogado ? (
          <section className="login-layout">
            <div className="hero-card">
              <span className="badge">Hackathon Web3</span>

              <h2>Mercado digital de créditos de carbono</h2>

              <p>
                Plataforma para cadastro de projetos ambientais, validação por
                agentes autorizados, emissão de créditos, marketplace,
                aposentadoria e certificação NFT.
              </p>

              <div className="metricas">
                <div className="metrica-card">
                  <strong>12</strong>
                  <span>Contratos</span>
                </div>

                <div className="metrica-card">
                  <strong>4</strong>
                  <span>Perfis</span>
                </div>

                <div className="metrica-card">
                  <strong>TIC</strong>
                  <span>Token</span>
                </div>
              </div>
            </div>

            <form className="login-card" onSubmit={fazerLogin} noValidate>
              <h2>Acesso ao sistema</h2>

              <p>Entre com um perfil de demonstração para acessar o painel.</p>

              <label htmlFor="usuario">Usuário</label>
              <input
                id="usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="admin, proponente1, validador1 ou comprador1"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
              />

              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                type="password"
                placeholder="Senha de demonstração"
                autoComplete="current-password"
              />

              <button className="btn-primary" type="submit">
                Entrar
              </button>

              <button
                className="btn-secondary"
                type="button"
                onClick={() => entrarComUsuarioDemo(usuariosDemo[1])}
              >
                Entrar como Proponente de teste
              </button>

              <div className="demo-box">
                <strong>Usuários demo</strong>

                {usuariosDemo.map((item) => (
                  <span key={item.usuario}>
                    {item.usuario} — {item.senha}
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => entrarComUsuarioDemo(item)}
                    >
                      Usar
                    </button>
                  </span>
                ))}
              </div>
            </form>
          </section>
        ) : (
          <section>
            <div className="dashboard-header">
              <div>
                <span className="badge">{usuarioLogado.perfil}</span>
                <h2>{tituloPainel}</h2>
                <p>Bem-vindo, {usuarioLogado.nome}.</p>
              </div>

              <button className="btn-secondary" type="button" onClick={sair}>
                Sair
              </button>
            </div>

            {!enderecoCarteira && (
              <div className="alerta">
                Conecte a MetaMask para liberar as ações Web3 do painel.
              </div>
            )}

            <PainelPorPerfil
              perfil={perfilAtual}
              usuarioLogado={usuarioLogado}
              projetos={projetos}
              acaoPainel={acaoPainel}
              setAcaoPainel={setAcaoPainel}
              onCadastrarProjeto={cadastrarProjeto}
              onAtualizarStatusProjeto={atualizarStatusProjetoPorIdBlockchain}
              operacaoWeb3={operacaoWeb3}
            />
          </section>
        )}

        {mensagem && <div className="mensagem">{mensagem}</div>}
      </section>
    </main>
  );
}

function PainelPorPerfil({
  perfil,
  usuarioLogado,
  projetos,
  acaoPainel,
  setAcaoPainel,
  onCadastrarProjeto,
  onAtualizarStatusProjeto,
  operacaoWeb3,
}: {
  perfil: PerfilUsuario;
  usuarioLogado: UsuarioDemo;
  projetos: ProjetoCarbono[];
  acaoPainel: AcaoPainel;
  setAcaoPainel: (acao: AcaoPainel) => void;
  onCadastrarProjeto: (dados: DadosNovoProjeto) => void;
  onAtualizarStatusProjeto: (
    idProjetoBlockchain: string,
    status: StatusProjeto
  ) => void;
  operacaoWeb3: OperacaoWeb3;
}) {
  if (perfil === "administrador") {
    return (
      <>
        <div className="grid">
          <Card titulo="Cadastro de Organizações">
            <p>Cadastrar proponentes, validadores, compradores e administradores.</p>
            <button className="btn-primary" type="button">
              Abrir cadastro
            </button>
          </Card>

          <Card titulo="Configuração do Protocolo">
            <p>Consultar contratos, taxas, tesouraria, oráculo e permissões.</p>
            <button className="btn-primary" type="button">
              Ver administração
            </button>
          </Card>

          <Card titulo="Tesouraria">
            <p>Acompanhar saldo em ETH, saldo TIC e reservas de recompensas.</p>
            <button className="btn-secondary" type="button">
              Consultar
            </button>
          </Card>

          <Card titulo="Emissão de Créditos">
            <p>
              Emitir créditos ERC-1155 para projetos aprovados e consultar lotes
              já emitidos.
            </p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setAcaoPainel("emissao-creditos")}
            >
              Emitir ou consultar créditos
            </button>
          </Card>

          <Card titulo="Oráculo">
            <p>Consultar preço ETH em dólar e dados externos do protocolo.</p>
            <button className="btn-secondary" type="button">
              Ver oráculo
            </button>
          </Card>
        </div>

        {acaoPainel === "emissao-creditos" && (
          <PainelEmissaoCreditos
            projetos={projetos}
            onAtualizarStatusProjeto={onAtualizarStatusProjeto}
          />
        )}
      </>
    );
  }

  if (perfil === "proponente") {
    const projetosDoProponente = projetos.filter(
      (projeto) => projeto.proponente === usuarioLogado.usuario
    );

    return (
      <>
        <div className="grid">
          <Card titulo="Submeter Projeto">
            <p>
              Cadastrar projeto de energia solar, reflorestamento ou outra ação
              ambiental.
            </p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setAcaoPainel("novo-projeto")}
            >
              Novo projeto
            </button>
          </Card>

          <Card titulo="Meus Projetos">
            <p>Acompanhar projetos submetidos, aprovados, rejeitados ou emitidos.</p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setAcaoPainel("meus-projetos")}
            >
              Ver projetos
            </button>
          </Card>

          <Card titulo="Ofertar Créditos">
            <p>
              Aprovar o marketplace e criar oferta de venda para créditos já
              emitidos.
            </p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setAcaoPainel("ofertar-creditos")}
            >
              Ofertar créditos
            </button>
          </Card>

          <Card titulo="Vendas">
            <p>Acompanhar créditos vendidos e ofertas abertas.</p>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setAcaoPainel("ofertar-creditos")}
            >
              Ver ofertas
            </button>
          </Card>
        </div>

        {acaoPainel === "novo-projeto" && (
          <>
            <FormularioProjeto
              onSalvar={onCadastrarProjeto}
              onCancelar={() => setAcaoPainel("inicio")}
            />

            <StatusOperacao operacao={operacaoWeb3} />
          </>
        )}

        {acaoPainel === "meus-projetos" && (
          <>
            <ListaProjetos projetos={projetosDoProponente} />
            <StatusOperacao operacao={operacaoWeb3} />
          </>
        )}

        {acaoPainel === "ofertar-creditos" && (
          <PainelOfertaCreditos projetos={projetosDoProponente} />
        )}
      </>
    );
  }

  if (perfil === "validador") {
    return (
      <>
        <div className="grid">
          <Card titulo="Staking">
            <p>
              Módulo de staking mantido no protocolo. No MVP atual, a validação
              está configurada sem staking obrigatório.
            </p>
            <button className="btn-secondary" type="button">
              Fazer staking
            </button>
          </Card>

          <Card titulo="Projetos em Análise">
            <p>Escolher projeto, iniciar votação, aprovar ou rejeitar.</p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setAcaoPainel("validacao-projetos")}
            >
              Validar projetos
            </button>
          </Card>

          <Card titulo="Recompensas">
            <p>Consultar e resgatar recompensas acumuladas pelo staking.</p>
            <button className="btn-secondary" type="button">
              Ver recompensas
            </button>
          </Card>
        </div>

        {acaoPainel === "validacao-projetos" && (
          <PainelValidacaoProjetos
            projetos={projetos}
            onAtualizarStatusProjeto={onAtualizarStatusProjeto}
          />
        )}
      </>
    );
  }

  if (perfil === "comprador") {
    return (
      <>
        <div className="grid">
          <Card titulo="Marketplace">
            <p>Comprar créditos de carbono ofertados por proponentes.</p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setAcaoPainel("comprar-creditos")}
            >
              Comprar créditos
            </button>
          </Card>

          <Card titulo="Meus Créditos">
            <p>Consultar créditos adquiridos e disponíveis para aposentadoria.</p>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setAcaoPainel("aposentar-creditos")}
            >
              Ver saldo
            </button>
          </Card>

          <Card titulo="Aposentar Créditos">
            <p>Queimar créditos, registrar compensação e emitir certificado NFT.</p>
            <button
              className="btn-primary"
              type="button"
              onClick={() => setAcaoPainel("aposentar-creditos")}
            >
              Aposentar
            </button>
          </Card>

          <Card titulo="Certificados">
            <p>Consultar NFTs de compensação emitidos em nome da organização.</p>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setAcaoPainel("certificados")}
            >
              Ver certificados
            </button>
          </Card>
        </div>

        {acaoPainel === "comprar-creditos" && <PainelCompraCreditos />}

        {(acaoPainel === "aposentar-creditos" ||
          acaoPainel === "certificados") && (
          <PainelAposentadoriaCertificados focoInicial={acaoPainel} />
        )}
      </>
    );
  }

  return null;
}

function PainelAposentadoriaCertificados({
  focoInicial,
}: {
  focoInicial: "aposentar-creditos" | "certificados";
}) {
  const [idLote, setIdLote] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState(
    "Compensação voluntária de emissões de carbono"
  );
  const [uriRelatorio, setUriRelatorio] = useState(
    "ipfs://carbonledger/relatorios/relatorio-compensacao.json"
  );
  const [uriCertificado, setUriCertificado] = useState(
    "ipfs://carbonledger/certificados/certificado-compensacao.json"
  );
  const [saldoLote, setSaldoLote] = useState("");
  const [taxaAposentadoria, setTaxaAposentadoria] =
    useState<TaxaAposentadoria | null>(null);
  const [resumo, setResumo] =
    useState<ResumoAposentadoriasComprador | null>(null);
  const [lotesCredito, setLotesCredito] = useState<LoteCreditoCompradorTela[]>(
    []
  );
  const [executando, setExecutando] = useState(false);
  const [mensagemAposentadoria, setMensagemAposentadoria] = useState("");

  const lotesAdquiridos = lotesCredito.filter((lote) => lote.possuiSaldo);
  const lotesSemSaldo = lotesCredito.filter((lote) => !lote.possuiSaldo);

  async function carregarLotesCreditoComprador(): Promise<
    LoteCreditoCompradorTela[]
  > {
    const ofertas = await listarOfertas({
      apenasDisponiveis: false,
      limite: 100,
    });

    const mapaLotes = new Map<
      string,
      {
        idLote: string;
        totalOfertadoMarketplace: bigint;
        quantidadeDisponivelMarketplace: bigint;
        quantidadeOfertas: number;
        ultimoPrecoPorCreditoETH: string;
        estados: Set<string>;
      }
    >();

    for (const oferta of ofertas) {
      const existente = mapaLotes.get(oferta.idLote);

      if (!existente) {
        mapaLotes.set(oferta.idLote, {
          idLote: oferta.idLote,
          totalOfertadoMarketplace: BigInt(oferta.quantidadeTotal),
          quantidadeDisponivelMarketplace: BigInt(
            oferta.quantidadeDisponivel
          ),
          quantidadeOfertas: 1,
          ultimoPrecoPorCreditoETH: oferta.precoPorCreditoETH,
          estados: new Set([oferta.estadoOfertaTexto]),
        });

        continue;
      }

      existente.totalOfertadoMarketplace += BigInt(oferta.quantidadeTotal);
      existente.quantidadeDisponivelMarketplace += BigInt(
        oferta.quantidadeDisponivel
      );
      existente.quantidadeOfertas += 1;
      existente.ultimoPrecoPorCreditoETH = oferta.precoPorCreditoETH;
      existente.estados.add(oferta.estadoOfertaTexto);
    }

    const lotes = Array.from(mapaLotes.values());

    const consultas = lotes.map(async (lote) => {
      const [saldoComprador, totalAposentadoNoLote] = await Promise.all([
        consultarSaldoCreditoMarketplace({
          idLote: lote.idLote,
        }),
        consultarTotalAposentadoPorLote(lote.idLote),
      ]);

      return {
        idLote: lote.idLote,
        saldoComprador,
        totalOfertadoMarketplace: lote.totalOfertadoMarketplace.toString(),
        quantidadeDisponivelMarketplace:
          lote.quantidadeDisponivelMarketplace.toString(),
        quantidadeOfertas: lote.quantidadeOfertas,
        ultimoPrecoPorCreditoETH: lote.ultimoPrecoPorCreditoETH,
        totalAposentadoNoLote,
        estados: Array.from(lote.estados).join(", "),
        possuiSaldo: BigInt(saldoComprador) > 0n,
      };
    });

    const resultado = await Promise.all(consultas);

    return resultado.sort((a, b) => Number(a.idLote) - Number(b.idLote));
  }

  async function atualizarResumo() {
    try {
      setExecutando(true);
      setMensagemAposentadoria(
        "Consultando taxa, saldos, lotes, aposentadorias e certificados..."
      );

      const [taxa, resumoAtual, lotesAtualizados] = await Promise.all([
        consultarTaxaAposentadoria(),
        consultarResumoAposentadoriasComprador({ limite: 50 }),
        carregarLotesCreditoComprador(),
      ]);

      setTaxaAposentadoria(taxa);
      setResumo(resumoAtual);
      setLotesCredito(lotesAtualizados);

      const totalComSaldo = lotesAtualizados.filter(
        (lote) => lote.possuiSaldo
      ).length;

      setMensagemAposentadoria(
        `Consulta concluída. Taxa de aposentadoria: ${taxa.taxaETH} ETH. Lotes conhecidos: ${lotesAtualizados.length}. Lotes com saldo do comprador: ${totalComSaldo}. Total compensado: ${resumoAtual.totalCompensado}.`
      );
    } catch (erro) {
      setMensagemAposentadoria(
        `Erro ao consultar resumo: ${formatarErro(erro)}`
      );
    } finally {
      setExecutando(false);
    }
  }

  async function atualizarSomenteLotes() {
    try {
      setExecutando(true);
      setMensagemAposentadoria(
        "Consultando lotes conhecidos e saldos do comprador..."
      );

      const lotesAtualizados = await carregarLotesCreditoComprador();

      setLotesCredito(lotesAtualizados);

      const totalComSaldo = lotesAtualizados.filter(
        (lote) => lote.possuiSaldo
      ).length;

      setMensagemAposentadoria(
        `Lotes atualizados. Lotes conhecidos: ${lotesAtualizados.length}. Lotes adquiridos pelo comprador: ${totalComSaldo}.`
      );
    } catch (erro) {
      setMensagemAposentadoria(
        `Erro ao consultar lotes: ${formatarErro(erro)}`
      );
    } finally {
      setExecutando(false);
    }
  }

  function selecionarLoteParaAposentadoria(lote: LoteCreditoCompradorTela) {
    setIdLote(lote.idLote);
    setSaldoLote(lote.saldoComprador);
    setQuantidade("");

    setMensagemAposentadoria(
      `Lote ${lote.idLote} selecionado para aposentadoria. Saldo disponível do comprador: ${lote.saldoComprador}.`
    );
  }

  async function consultarSaldoDoLote() {
    if (!idLote) {
      setMensagemAposentadoria("Informe o ID do lote para consultar o saldo.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemAposentadoria("Consultando saldo do comprador no lote...");

      const saldo = await consultarSaldoCreditoMarketplace({ idLote });

      setSaldoLote(saldo);

      setMensagemAposentadoria(`Saldo do comprador no lote ${idLote}: ${saldo}.`);
    } catch (erro) {
      setMensagemAposentadoria(`Erro ao consultar saldo: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function aposentarCreditosSelecionados() {
    if (!idLote) {
      setMensagemAposentadoria("Selecione ou informe o ID do lote.");
      return;
    }

    if (!quantidade || Number(quantidade) <= 0) {
      setMensagemAposentadoria("Informe uma quantidade válida para aposentadoria.");
      return;
    }

    if (saldoLote && BigInt(saldoLote) < BigInt(quantidade)) {
      setMensagemAposentadoria(
        `Saldo insuficiente no lote ${idLote}. Saldo: ${saldoLote}. Quantidade solicitada: ${quantidade}.`
      );
      return;
    }

    if (!motivo.trim()) {
      setMensagemAposentadoria("Informe o motivo da aposentadoria.");
      return;
    }

    if (!uriRelatorio.trim()) {
      setMensagemAposentadoria("Informe a URI do relatório.");
      return;
    }

    if (!uriCertificado.trim()) {
      setMensagemAposentadoria("Informe a URI do certificado.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemAposentadoria(
        "Enviando aposentadoria de créditos para a MetaMask..."
      );

      const resultado = await aposentarCreditosCarbono({
        idLote,
        quantidade,
        motivo,
        uriRelatorio,
        uriCertificado,
      });

      const [saldoAtualizado, resumoAtualizado, taxaAtualizada, lotesAtualizados] =
        await Promise.all([
          consultarSaldoCreditoMarketplace({ idLote: resultado.idLote }),
          consultarResumoAposentadoriasComprador({ limite: 50 }),
          consultarTaxaAposentadoria(),
          carregarLotesCreditoComprador(),
        ]);

      setSaldoLote(saldoAtualizado);
      setResumo(resumoAtualizado);
      setTaxaAposentadoria(taxaAtualizada);
      setLotesCredito(lotesAtualizados);

      setMensagemAposentadoria(
        `Créditos aposentados com sucesso. Hash: ${resultado.hash}. Aposentadoria: ${resultado.idAposentadoria}. Certificado NFT: ${resultado.idCertificado}. Saldo restante no lote ${resultado.idLote}: ${saldoAtualizado}.`
      );
    } catch (erro) {
      setMensagemAposentadoria(
        `Erro ao aposentar créditos: ${formatarErro(erro)}`
      );
    } finally {
      setExecutando(false);
    }
  }

  useEffect(() => {
    if (focoInicial === "certificados") {
      void atualizarResumo();
      return;
    }

    void atualizarSomenteLotes();
  }, [focoInicial]);

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">
            {focoInicial === "certificados" ? "Certificados" : "Aposentadoria"}
          </span>
          <h3>Meus créditos, aposentadoria e certificados NFT</h3>
          <p>
            Consulte os lotes existentes no marketplace, veja os créditos
            adquiridos pela carteira conectada e selecione um lote para
            aposentadoria.
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary"
          type="button"
          disabled={executando}
          onClick={() => void atualizarResumo()}
        >
          Atualizar resumo completo
        </button>

        <button
          className="btn-secondary"
          type="button"
          disabled={executando}
          onClick={() => void atualizarSomenteLotes()}
        >
          Atualizar meus créditos
        </button>
      </div>

      <div className="status-grid">
        <div>
          <span>Taxa de aposentadoria</span>
          <strong>
            {taxaAposentadoria
              ? `${taxaAposentadoria.taxaETH} ETH`
              : "Não consultada"}
          </strong>
        </div>

        <div>
          <span>Total compensado pelo comprador</span>
          <strong>{resumo?.totalCompensado ?? "Não consultado"}</strong>
        </div>

        <div>
          <span>Aposentadorias registradas</span>
          <strong>{resumo?.aposentadorias.length ?? "Não consultado"}</strong>
        </div>

        <div>
          <span>Certificados encontrados</span>
          <strong>{resumo?.certificados.length ?? "Não consultado"}</strong>
        </div>
      </div>

      <div className="section-title">
        <div>
          <span className="badge">Meus Créditos</span>
          <h3>Créditos adquiridos pelo comprador</h3>
          <p>
            Estes são os lotes nos quais a carteira conectada possui saldo
            ERC-1155 maior que zero.
          </p>
        </div>
      </div>

      {lotesAdquiridos.length === 0 ? (
        <div className="empty-state">
          Nenhum lote com saldo encontrado. Clique em Atualizar meus créditos.
          Se você acabou de comprar, confirme se a MetaMask está na conta do
          comprador e na rede Hardhat Localhost.
        </div>
      ) : (
        <div className="projetos-table-wrap">
          <table className="projetos-table">
            <thead>
              <tr>
                <th>ID lote</th>
                <th>Saldo comprador</th>
                <th>Total ofertado</th>
                <th>Disponível no mercado</th>
                <th>Preço recente</th>
                <th>Total aposentado no lote</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {lotesAdquiridos.map((lote) => (
                <tr key={lote.idLote}>
                  <td>{lote.idLote}</td>
                  <td>
                    <strong>{lote.saldoComprador}</strong>
                  </td>
                  <td>{lote.totalOfertadoMarketplace}</td>
                  <td>{lote.quantidadeDisponivelMarketplace}</td>
                  <td>{lote.ultimoPrecoPorCreditoETH} ETH</td>
                  <td>{lote.totalAposentadoNoLote}</td>
                  <td>
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={executando}
                      onClick={() => selecionarLoteParaAposentadoria(lote)}
                    >
                      Usar lote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-title">
        <div>
          <span className="badge">Lotes conhecidos</span>
          <h3>Lotes existentes no marketplace</h3>
          <p>
            Lista informativa de lotes encontrados a partir das ofertas já
            criadas no marketplace. Lotes sem saldo não podem ser aposentados por
            esta carteira.
          </p>
        </div>
      </div>

      {lotesCredito.length === 0 ? (
        <div className="empty-state">
          Nenhum lote conhecido carregado. Clique em Atualizar meus créditos.
        </div>
      ) : (
        <div className="projetos-table-wrap">
          <table className="projetos-table">
            <thead>
              <tr>
                <th>ID lote</th>
                <th>Saldo comprador</th>
                <th>Ofertas</th>
                <th>Total ofertado</th>
                <th>Disponível</th>
                <th>Preço recente</th>
                <th>Estados</th>
              </tr>
            </thead>

            <tbody>
              {lotesCredito.map((lote) => (
                <tr key={lote.idLote}>
                  <td>{lote.idLote}</td>
                  <td>
                    <strong>{lote.saldoComprador}</strong>
                  </td>
                  <td>{lote.quantidadeOfertas}</td>
                  <td>{lote.totalOfertadoMarketplace}</td>
                  <td>{lote.quantidadeDisponivelMarketplace}</td>
                  <td>{lote.ultimoPrecoPorCreditoETH} ETH</td>
                  <td>
                    <span className="status-pill">
                      {lote.possuiSaldo ? "Adquirido" : "Sem saldo"}
                    </span>
                    <span>{lote.estados}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lotesSemSaldo.length > 0 && (
        <div className="status-message">
          Existem {lotesSemSaldo.length} lote(s) conhecido(s) no marketplace sem
          saldo para a carteira conectada.
        </div>
      )}

      <div className="status-operacao">
        <div className="section-title">
          <div>
            <span className="badge">Nova aposentadoria</span>
            <h3>Aposentar créditos do comprador</h3>
            <p>
              Selecione um lote na tabela acima ou informe manualmente o ID do
              lote comprado.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <label>
            ID do lote ERC-1155
            <input
              value={idLote}
              onChange={(e) => {
                setIdLote(e.target.value);
                setSaldoLote("");
              }}
              placeholder="Exemplo: 1"
            />
          </label>

          <label>
            Quantidade a aposentar
            <input
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              type="number"
              min="1"
              step="1"
              placeholder="Exemplo: 10"
            />
          </label>

          <label>
            Saldo no lote
            <input
              value={saldoLote || "Não consultado"}
              readOnly
              aria-label="Saldo no lote"
            />
          </label>
        </div>

        <label className="full-field">
          Motivo da aposentadoria
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Exemplo: Compensação das emissões de 2026"
          />
        </label>

        <label className="full-field">
          URI do relatório de compensação
          <input
            value={uriRelatorio}
            onChange={(e) => setUriRelatorio(e.target.value)}
            placeholder="Exemplo: ipfs://.../relatorio.json"
          />
        </label>

        <label className="full-field">
          URI dos metadados do certificado NFT
          <input
            value={uriCertificado}
            onChange={(e) => setUriCertificado(e.target.value)}
            placeholder="Exemplo: ipfs://.../certificado.json"
          />
        </label>

        <div className="form-actions">
          <button
            className="btn-secondary"
            type="button"
            disabled={executando}
            onClick={() => void consultarSaldoDoLote()}
          >
            Consultar saldo no lote
          </button>

          <button
            className="btn-primary"
            type="button"
            disabled={executando}
            onClick={() => void aposentarCreditosSelecionados()}
          >
            Aposentar créditos e emitir NFT
          </button>
        </div>

        {mensagemAposentadoria && (
          <div className="status-message">{mensagemAposentadoria}</div>
        )}
      </div>

      <div className="section-title">
        <div>
          <span className="badge">Histórico</span>
          <h3>Aposentadorias do comprador</h3>
          <p>
            Registros de compensação realizados pela carteira atualmente
            conectada.
          </p>
        </div>
      </div>

      {!resumo || resumo.aposentadorias.length === 0 ? (
        <div className="empty-state">
          Nenhuma aposentadoria carregada. Clique em Atualizar resumo completo.
        </div>
      ) : (
        <div className="projetos-table-wrap">
          <table className="projetos-table">
            <thead>
              <tr>
                <th>ID aposentadoria</th>
                <th>Lote</th>
                <th>Quantidade</th>
                <th>Certificado</th>
                <th>Data</th>
                <th>Motivo</th>
              </tr>
            </thead>

            <tbody>
              {resumo.aposentadorias.map((aposentadoria) => (
                <tr key={aposentadoria.idAposentadoria}>
                  <td>{aposentadoria.idAposentadoria}</td>
                  <td>{aposentadoria.idLote}</td>
                  <td>{aposentadoria.quantidade}</td>
                  <td>{aposentadoria.idCertificado}</td>
                  <td>
                    {formatarDataHoraUnix(aposentadoria.dataAposentadoria)}
                  </td>
                  <td>
                    <strong>{aposentadoria.motivo}</strong>
                    <span>{aposentadoria.uriRelatorio}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-title">
        <div>
          <span className="badge">NFT</span>
          <h3>Certificados de compensação</h3>
          <p>
            NFTs ERC-721 emitidos para comprovar as compensações realizadas.
          </p>
        </div>
      </div>

      {!resumo || resumo.certificados.length === 0 ? (
        <div className="empty-state">
          Nenhum certificado carregado. Clique em Atualizar resumo completo.
        </div>
      ) : (
        <div className="projetos-table-wrap">
          <table className="projetos-table">
            <thead>
              <tr>
                <th>ID certificado</th>
                <th>Aposentadoria</th>
                <th>Beneficiário</th>
                <th>Quantidade</th>
                <th>Data</th>
                <th>URI</th>
              </tr>
            </thead>

            <tbody>
              {resumo.certificados.map((certificado) => (
                <tr key={certificado.idCertificado}>
                  <td>{certificado.idCertificado}</td>
                  <td>{certificado.idAposentadoria}</td>
                  <td>{encurtarEndereco(certificado.beneficiario)}</td>
                  <td>{certificado.quantidadeCompensada}</td>
                  <td>{formatarDataHoraUnix(certificado.dataEmissao)}</td>
                  <td>
                    <strong>{certificado.uriCertificado}</strong>
                    <span>{certificado.tokenURI}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PainelCompraCreditos() {
  const [ofertas, setOfertas] = useState<OfertaMarketplace[]>([]);
  const [ofertaSelecionadaId, setOfertaSelecionadaId] = useState("");
  const [quantidadeCompra, setQuantidadeCompra] = useState("");
  const [valoresCompra, setValoresCompra] =
    useState<ValoresCompraOferta | null>(null);
  const [saldoComprador, setSaldoComprador] = useState("");
  const [executando, setExecutando] = useState(false);
  const [mensagemCompra, setMensagemCompra] = useState("");

  const ofertaSelecionada = ofertas.find(
    (oferta) => oferta.idOferta === ofertaSelecionadaId
  );

  function selecionarOferta(oferta: OfertaMarketplace) {
    setOfertaSelecionadaId(oferta.idOferta);
    setQuantidadeCompra("1");
    setValoresCompra(null);
    setSaldoComprador("");

    setMensagemCompra(
      `Oferta ${oferta.idOferta} selecionada. Lote ${oferta.idLote}, disponível: ${oferta.quantidadeDisponivel}.`
    );
  }

  async function carregarOfertasDisponiveis() {
    try {
      setExecutando(true);
      setMensagemCompra("Carregando ofertas disponíveis...");

      const lista = await listarOfertas({
        apenasDisponiveis: true,
        limite: 50,
      });

      setOfertas(lista);

      setMensagemCompra(`Foram carregadas ${lista.length} oferta(s) disponível(is).`);
    } catch (erro) {
      setMensagemCompra(`Erro ao carregar ofertas: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function calcularCompraSelecionada() {
    if (!ofertaSelecionada) {
      setMensagemCompra("Selecione uma oferta.");
      return;
    }

    if (!quantidadeCompra || Number(quantidadeCompra) <= 0) {
      setMensagemCompra("Informe uma quantidade válida para compra.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemCompra("Calculando valores da compra...");

      const valores = await calcularCompraOferta({
        idOferta: ofertaSelecionada.idOferta,
        quantidade: quantidadeCompra,
      });

      setValoresCompra(valores);

      setMensagemCompra(
        `Compra calculada. Valor total: ${valores.valorTotalETH} ETH. Taxa: ${valores.valorTaxaETH} ETH. Vendedor recebe: ${valores.valorVendedorETH} ETH.`
      );
    } catch (erro) {
      setMensagemCompra(`Erro ao calcular compra: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function comprarOfertaSelecionada() {
    if (!ofertaSelecionada) {
      setMensagemCompra("Selecione uma oferta.");
      return;
    }

    if (!quantidadeCompra || Number(quantidadeCompra) <= 0) {
      setMensagemCompra("Informe uma quantidade válida para compra.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemCompra("Enviando compra para a MetaMask...");

      const resultado = await comprarCreditosOferta({
        idOferta: ofertaSelecionada.idOferta,
        quantidade: quantidadeCompra,
      });

      const saldo = await consultarSaldoCreditoMarketplace({
        idLote: resultado.idLote,
      });

      setSaldoComprador(saldo);

      setMensagemCompra(
        `Compra realizada com sucesso. Hash: ${resultado.hash}. Quantidade: ${resultado.quantidade}. Lote: ${resultado.idLote}. Valor total: ${resultado.valorTotalETH} ETH. Saldo atual do comprador no lote: ${saldo}.`
      );

      await carregarOfertasDisponiveis();
    } catch (erro) {
      setMensagemCompra(`Erro ao comprar créditos: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function consultarSaldoComprador() {
    if (!ofertaSelecionada) {
      setMensagemCompra("Selecione uma oferta para consultar o saldo do lote.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemCompra("Consultando saldo do comprador no lote...");

      const saldo = await consultarSaldoCreditoMarketplace({
        idLote: ofertaSelecionada.idLote,
      });

      setSaldoComprador(saldo);

      setMensagemCompra(
        `Saldo do comprador no lote ${ofertaSelecionada.idLote}: ${saldo}.`
      );
    } catch (erro) {
      setMensagemCompra(`Erro ao consultar saldo: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">Marketplace</span>
          <h3>Comprar créditos de carbono</h3>
          <p>
            O comprador visualiza ofertas disponíveis, calcula o valor da compra
            e adquire créditos ERC-1155 usando ETH.
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary"
          type="button"
          disabled={executando}
          onClick={() => void carregarOfertasDisponiveis()}
        >
          Atualizar ofertas disponíveis
        </button>
      </div>

      {ofertas.length === 0 ? (
        <div className="empty-state">
          Nenhuma oferta carregada. Clique em Atualizar ofertas disponíveis.
        </div>
      ) : (
        <div className="projetos-table-wrap">
          <table className="projetos-table">
            <thead>
              <tr>
                <th>ID oferta</th>
                <th>Vendedor</th>
                <th>ID lote</th>
                <th>Disponível</th>
                <th>Preço por crédito</th>
                <th>Estado</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {ofertas.map((oferta) => (
                <tr key={oferta.idOferta}>
                  <td>{oferta.idOferta}</td>
                  <td>{encurtarEndereco(oferta.vendedor)}</td>
                  <td>{oferta.idLote}</td>
                  <td>{oferta.quantidadeDisponivel}</td>
                  <td>{oferta.precoPorCreditoETH} ETH</td>
                  <td>
                    <span className="status-pill">
                      {oferta.estadoOfertaTexto}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => selecionarOferta(oferta)}
                    >
                      Selecionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ofertaSelecionada && (
        <div className="status-operacao">
          <div className="section-title">
            <div>
              <span className="badge">Oferta selecionada</span>
              <h3>Oferta {ofertaSelecionada.idOferta}</h3>
              <p>
                Lote: {ofertaSelecionada.idLote} | Disponível:{" "}
                {ofertaSelecionada.quantidadeDisponivel} | Preço:{" "}
                {ofertaSelecionada.precoPorCreditoETH} ETH por crédito
              </p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              Quantidade a comprar
              <input
                value={quantidadeCompra}
                onChange={(e) => {
                  setQuantidadeCompra(e.target.value);
                  setValoresCompra(null);
                }}
                type="number"
                min="1"
                step="1"
                placeholder="Exemplo: 10"
              />
            </label>
          </div>

          <div className="form-actions">
            <button
              className="btn-secondary"
              type="button"
              disabled={executando}
              onClick={() => void calcularCompraSelecionada()}
            >
              Calcular compra
            </button>

            <button
              className="btn-primary"
              type="button"
              disabled={executando}
              onClick={() => void comprarOfertaSelecionada()}
            >
              Comprar créditos
            </button>

            <button
              className="btn-secondary"
              type="button"
              disabled={executando}
              onClick={() => void consultarSaldoComprador()}
            >
              Consultar meu saldo no lote
            </button>
          </div>

          <div className="status-grid">
            <div>
              <span>Quantidade selecionada</span>
              <strong>{quantidadeCompra || "Não informada"}</strong>
            </div>

            <div>
              <span>Preço unitário</span>
              <strong>{ofertaSelecionada.precoPorCreditoETH} ETH</strong>
            </div>

            <div>
              <span>Saldo do comprador no lote</span>
              <strong>{saldoComprador || "Não consultado"}</strong>
            </div>

            <div>
              <span>Estado da oferta</span>
              <strong>{ofertaSelecionada.estadoOfertaTexto}</strong>
            </div>

            {valoresCompra && (
              <>
                <div>
                  <span>Valor total</span>
                  <strong>{valoresCompra.valorTotalETH} ETH</strong>
                </div>

                <div>
                  <span>Taxa marketplace</span>
                  <strong>{valoresCompra.valorTaxaETH} ETH</strong>
                </div>

                <div>
                  <span>Valor líquido ao vendedor</span>
                  <strong>{valoresCompra.valorVendedorETH} ETH</strong>
                </div>
              </>
            )}
          </div>

          {mensagemCompra && (
            <div className="status-message">{mensagemCompra}</div>
          )}
        </div>
      )}
    </section>
  );
}

function PainelOfertaCreditos({ projetos }: { projetos: ProjetoCarbono[] }) {
  const [projetoSelecionadoId, setProjetoSelecionadoId] = useState("");
  const [idLote, setIdLote] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [precoPorCreditoETH, setPrecoPorCreditoETH] = useState("0.001");
  const [saldoLote, setSaldoLote] = useState("");
  const [marketplaceAprovado, setMarketplaceAprovado] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [mensagemOferta, setMensagemOferta] = useState("");
  const [ofertas, setOfertas] = useState<OfertaMarketplace[]>([]);

  const projetosComCreditosEmitidos = projetos.filter(
    (projeto) =>
      Boolean(projeto.idProjetoBlockchain) &&
      projeto.status === "Créditos emitidos"
  );

  const projetoSelecionado = projetosComCreditosEmitidos.find(
    (projeto) => projeto.id === projetoSelecionadoId
  );

  function selecionarProjeto(projeto: ProjetoCarbono) {
    const loteSugerido = projeto.idProjetoBlockchain
      ? sugerirIdLote(projeto.idProjetoBlockchain)
      : "";

    setProjetoSelecionadoId(projeto.id);
    setIdLote(loteSugerido);
    setQuantidade("");
    setSaldoLote("");
    setMarketplaceAprovado(false);

    setMensagemOferta(
      `Projeto ${projeto.idProjetoBlockchain} selecionado para oferta.`
    );
  }

  async function consultarSaldoEAprovacao() {
    if (!idLote) {
      setMensagemOferta("Selecione um projeto ou informe o ID do lote.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemOferta("Consultando saldo e aprovação do marketplace...");

      const [saldo, aprovado] = await Promise.all([
        consultarSaldoCreditoMarketplace({ idLote }),
        verificarMarketplaceAprovado(),
      ]);

      setSaldoLote(saldo);
      setMarketplaceAprovado(aprovado);

      setMensagemOferta(
        `Consulta concluída. Saldo no lote ${idLote}: ${saldo}. Marketplace aprovado: ${
          aprovado ? "sim" : "não"
        }.`
      );
    } catch (erro) {
      setMensagemOferta(`Erro na consulta: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function aprovarMarketplace() {
    try {
      setExecutando(true);
      setMensagemOferta("Solicitando aprovação ERC-1155 na MetaMask...");

      const resultado = await aprovarMarketplaceParaCreditos(true);

      setMarketplaceAprovado(true);

      setMensagemOferta(
        `Marketplace aprovado para movimentar seus créditos. Hash: ${resultado.hash}.`
      );
    } catch (erro) {
      setMensagemOferta(`Erro ao aprovar marketplace: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function criarOfertaSelecionada() {
    if (!idLote) {
      setMensagemOferta("Informe o ID do lote.");
      return;
    }

    if (!quantidade || Number(quantidade) <= 0) {
      setMensagemOferta("Informe uma quantidade válida para oferta.");
      return;
    }

    if (!precoPorCreditoETH || Number(precoPorCreditoETH) <= 0) {
      setMensagemOferta("Informe um preço válido por crédito em ETH.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemOferta("Criando oferta no marketplace...");

      const resultado = await criarOfertaCreditos({
        idLote,
        quantidade,
        precoPorCreditoETH,
      });

      setMensagemOferta(
        `Oferta criada com sucesso. ID da oferta: ${resultado.idOferta}. Hash: ${resultado.hash}.`
      );

      await carregarOfertas();
    } catch (erro) {
      setMensagemOferta(`Erro ao criar oferta: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function carregarOfertas() {
    try {
      setExecutando(true);
      setMensagemOferta("Carregando ofertas do marketplace...");

      const lista = await listarOfertas({
        apenasDisponiveis: false,
        limite: 50,
      });

      setOfertas(lista);

      setMensagemOferta(`Foram carregadas ${lista.length} oferta(s).`);
    } catch (erro) {
      setMensagemOferta(`Erro ao carregar ofertas: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function cancelarOfertaSelecionada(idOferta: string) {
    try {
      setExecutando(true);
      setMensagemOferta(`Cancelando oferta ${idOferta}...`);

      const resultado = await cancelarOfertaCreditos(idOferta);

      setMensagemOferta(
        `Oferta ${idOferta} cancelada com sucesso. Hash: ${resultado.hash}.`
      );

      await carregarOfertas();
    } catch (erro) {
      setMensagemOferta(`Erro ao cancelar oferta: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">Marketplace</span>
          <h3>Ofertar créditos de carbono</h3>
          <p>
            O proponente seleciona um lote emitido, aprova o marketplace no
            ERC-1155 e cria uma oferta de venda.
          </p>
        </div>
      </div>

      {projetosComCreditosEmitidos.length === 0 ? (
        <div className="empty-state">
          Nenhum projeto com créditos emitidos disponível para oferta.
        </div>
      ) : (
        <>
          <div className="projetos-table-wrap">
            <table className="projetos-table">
              <thead>
                <tr>
                  <th>ID blockchain</th>
                  <th>Projeto</th>
                  <th>Tipo</th>
                  <th>Localização</th>
                  <th>Créditos</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {projetosComCreditosEmitidos.map((projeto) => (
                  <tr key={projeto.id}>
                    <td>{projeto.idProjetoBlockchain}</td>
                    <td>
                      <strong>{projeto.nome}</strong>
                      <span>{projeto.descricao}</span>
                    </td>
                    <td>{projeto.tipo}</td>
                    <td>{projeto.localizacao}</td>
                    <td>{projeto.creditosSolicitados}</td>
                    <td>
                      <span className="status-pill">{projeto.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => selecionarProjeto(projeto)}
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projetoSelecionado && (
            <div className="status-operacao">
              <div className="section-title">
                <div>
                  <span className="badge">Projeto selecionado</span>
                  <h3>{projetoSelecionado.nome}</h3>
                  <p>
                    ID blockchain: {projetoSelecionado.idProjetoBlockchain} |
                    Lote sugerido: {idLote || "não definido"}
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  ID do lote ERC-1155
                  <input
                    value={idLote}
                    onChange={(e) => setIdLote(e.target.value)}
                    placeholder="Exemplo: 1"
                  />
                </label>

                <label>
                  Quantidade a ofertar
                  <input
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Exemplo: 100"
                  />
                </label>

                <label>
                  Preço por crédito em ETH
                  <input
                    value={precoPorCreditoETH}
                    onChange={(e) => setPrecoPorCreditoETH(e.target.value)}
                    placeholder="Exemplo: 0.001"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando}
                  onClick={() => void consultarSaldoEAprovacao()}
                >
                  Consultar saldo e aprovação
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando || marketplaceAprovado}
                  onClick={() => void aprovarMarketplace()}
                >
                  Aprovar marketplace
                </button>

                <button
                  className="btn-primary"
                  type="button"
                  disabled={executando}
                  onClick={() => void criarOfertaSelecionada()}
                >
                  Criar oferta
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando}
                  onClick={() => void carregarOfertas()}
                >
                  Atualizar ofertas
                </button>
              </div>

              <div className="status-grid">
                <div>
                  <span>Saldo no lote</span>
                  <strong>{saldoLote || "Não consultado"}</strong>
                </div>

                <div>
                  <span>Marketplace aprovado?</span>
                  <strong>{marketplaceAprovado ? "Sim" : "Não"}</strong>
                </div>

                <div>
                  <span>Preço por crédito</span>
                  <strong>{precoPorCreditoETH || "Não informado"} ETH</strong>
                </div>

                <div>
                  <span>Quantidade da oferta</span>
                  <strong>{quantidade || "Não informada"}</strong>
                </div>
              </div>

              {mensagemOferta && (
                <div className="status-message">{mensagemOferta}</div>
              )}
            </div>
          )}

          <div className="section-title">
            <div>
              <span className="badge">Ofertas</span>
              <h3>Ofertas do marketplace</h3>
              <p>
                Lista das ofertas recentes. O comprador usará esta mesma base
                para comprar créditos.
              </p>
            </div>
          </div>

          {ofertas.length === 0 ? (
            <div className="empty-state">
              Nenhuma oferta carregada. Clique em Atualizar ofertas.
            </div>
          ) : (
            <div className="projetos-table-wrap">
              <table className="projetos-table">
                <thead>
                  <tr>
                    <th>ID oferta</th>
                    <th>Vendedor</th>
                    <th>ID lote</th>
                    <th>Quantidade total</th>
                    <th>Disponível</th>
                    <th>Preço</th>
                    <th>Estado</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {ofertas.map((oferta) => (
                    <tr key={oferta.idOferta}>
                      <td>{oferta.idOferta}</td>
                      <td>{encurtarEndereco(oferta.vendedor)}</td>
                      <td>{oferta.idLote}</td>
                      <td>{oferta.quantidadeTotal}</td>
                      <td>{oferta.quantidadeDisponivel}</td>
                      <td>{oferta.precoPorCreditoETH} ETH</td>
                      <td>
                        <span className="status-pill">
                          {oferta.estadoOfertaTexto}
                        </span>
                      </td>
                      <td>
                        {oferta.disponivel ? (
                          <button
                            className="btn-secondary"
                            type="button"
                            disabled={executando}
                            onClick={() =>
                              void cancelarOfertaSelecionada(oferta.idOferta)
                            }
                          >
                            Cancelar
                          </button>
                        ) : (
                          <span>Indisponível</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PainelEmissaoCreditos({
  projetos,
  onAtualizarStatusProjeto,
}: {
  projetos: ProjetoCarbono[];
  onAtualizarStatusProjeto: (
    idProjetoBlockchain: string,
    status: StatusProjeto
  ) => void;
}) {
  const [projetoSelecionadoId, setProjetoSelecionadoId] = useState("");
  const [anoReferencia, setAnoReferencia] = useState(obterAnoAtual());
  const [idLote, setIdLote] = useState("");
  const [executando, setExecutando] = useState(false);
  const [mensagemEmissao, setMensagemEmissao] = useState("");
  const [resumoEmissao, setResumoEmissao] =
    useState<ResumoProjetoEmissaoTela | null>(null);
  const [loteEmitido, setLoteEmitido] = useState<LoteCreditoTela | null>(null);
  const [saldoProponente, setSaldoProponente] = useState("");

  const projetosAguardandoEmissao = projetos.filter(
    (projeto) =>
      Boolean(projeto.idProjetoBlockchain) && projeto.status === "Aprovado"
  );

  const projetosComCreditosEmitidos = projetos.filter(
    (projeto) =>
      Boolean(projeto.idProjetoBlockchain) &&
      projeto.status === "Créditos emitidos"
  );

  const projetosAdministraveis = [
    ...projetosAguardandoEmissao,
    ...projetosComCreditosEmitidos,
  ];

  const projetoSelecionado = projetosAdministraveis.find(
    (projeto) => projeto.id === projetoSelecionadoId
  );

  const idProjetoBlockchain = projetoSelecionado?.idProjetoBlockchain ?? "";

  const projetoSelecionadoAguardandoEmissao =
    projetoSelecionado?.status === "Aprovado";

  const projetoSelecionadoJaEmitido =
    projetoSelecionado?.status === "Créditos emitidos";

  function selecionarProjetoParaEmissao(projeto: ProjetoCarbono) {
    setProjetoSelecionadoId(projeto.id);
    setResumoEmissao(null);
    setLoteEmitido(null);
    setSaldoProponente("");

    const loteSugerido = projeto.idProjetoBlockchain
      ? sugerirIdLote(projeto.idProjetoBlockchain)
      : "";

    setIdLote(loteSugerido);

    setMensagemEmissao(
      `Projeto ${projeto.idProjetoBlockchain} selecionado. Status atual: ${projeto.status}.`
    );
  }

  async function consultarProjetoParaEmissao() {
    if (!idProjetoBlockchain) {
      setMensagemEmissao("Selecione um projeto com ID blockchain.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemEmissao("Consultando projeto na blockchain...");

      const resumo = await consultarResumoProjetoParaEmissao(idProjetoBlockchain);

      setResumoEmissao(resumo);

      const loteSugerido = sugerirIdLote(idProjetoBlockchain);
      setIdLote((atual) => atual || loteSugerido);

      if (resumo.emitido) {
        onAtualizarStatusProjeto(idProjetoBlockchain, "Créditos emitidos");
      }

      setMensagemEmissao(
        `Consulta concluída. Aprovado: ${
          resumo.aprovado ? "sim" : "não"
        }. Emitido: ${resumo.emitido ? "sim" : "não"}. Créditos aprovados: ${
          resumo.creditosAprovados
        }. Proponente: ${encurtarEndereco(resumo.proponente)}.`
      );
    } catch (erro) {
      setMensagemEmissao(`Erro na consulta: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function emitirCreditosSelecionado() {
    if (!projetoSelecionado || !idProjetoBlockchain) {
      setMensagemEmissao("Selecione um projeto aprovado com ID blockchain.");
      return;
    }

    if (!projetoSelecionadoAguardandoEmissao) {
      setMensagemEmissao(
        "Este projeto não está aguardando emissão. Apenas projetos com status Aprovado podem emitir créditos."
      );
      return;
    }

    try {
      setExecutando(true);

      const loteFinal = idLote || sugerirIdLote(idProjetoBlockchain);

      setMensagemEmissao(
        `Solicitando emissão dos créditos do projeto ${idProjetoBlockchain} na MetaMask...`
      );

      const resultado = await emitirCreditosProjetoAprovado({
        idProjeto: idProjetoBlockchain,
        idLote: loteFinal,
        anoReferencia,
      });

      onAtualizarStatusProjeto(idProjetoBlockchain, "Créditos emitidos");

      const [resumoAtualizado, lote] = await Promise.all([
        consultarResumoProjetoParaEmissao(idProjetoBlockchain),
        consultarLoteCredito(resultado.idLote),
      ]);

      let saldo = "";

      if (resumoAtualizado.proponente) {
        saldo = await consultarSaldoLote({
          carteira: resumoAtualizado.proponente,
          idLote: resultado.idLote,
        });
      }

      setResumoEmissao(resumoAtualizado);
      setLoteEmitido(lote);
      setSaldoProponente(saldo);

      setMensagemEmissao(
        `Créditos emitidos com sucesso. Hash: ${resultado.hash}. Lote: ${resultado.idLote}. Ano: ${resultado.anoReferencia}.`
      );
    } catch (erro) {
      setMensagemEmissao(`Erro ao emitir créditos: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function consultarLoteSelecionado() {
    const loteFinal = idLote || idProjetoBlockchain;

    if (!loteFinal) {
      setMensagemEmissao("Informe ou selecione um ID de lote.");
      return;
    }

    try {
      setExecutando(true);

      const lote = await consultarLoteCredito(loteFinal);

      setLoteEmitido(lote);

      let saldo = "";

      const proponenteConsulta =
        resumoEmissao?.proponente ||
        (idProjetoBlockchain
          ? (await consultarResumoProjetoParaEmissao(idProjetoBlockchain))
              .proponente
          : "");

      if (proponenteConsulta) {
        saldo = await consultarSaldoLote({
          carteira: proponenteConsulta,
          idLote: loteFinal,
        });

        setSaldoProponente(saldo);
      }

      setMensagemEmissao(
        `Lote consultado. Emitido: ${
          lote.loteEmitido ? "sim" : "não"
        }. Quantidade emitida: ${lote.quantidadeEmitida}. Saldo do proponente: ${
          saldo || "não consultado"
        }.`
      );
    } catch (erro) {
      setMensagemEmissao(`Erro ao consultar lote: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">Administração</span>
          <h3>Emissão de créditos de carbono</h3>
          <p>
            Acompanhe projetos aprovados aguardando emissão e projetos que já
            tiveram créditos ERC-1155 emitidos.
          </p>
        </div>
      </div>

      {projetosAdministraveis.length === 0 ? (
        <div className="empty-state">
          Nenhum projeto aprovado ou com créditos emitidos disponível para
          acompanhamento.
        </div>
      ) : (
        <>
          <div className="section-title">
            <div>
              <span className="badge">Fila de emissão</span>
              <h3>Projetos aprovados aguardando emissão</h3>
              <p>
                Estes projetos já foram aprovados pelos validadores, mas ainda
                não tiveram o lote ERC-1155 emitido.
              </p>
            </div>
          </div>

          {projetosAguardandoEmissao.length === 0 ? (
            <div className="empty-state">
              Nenhum projeto aguardando emissão no momento.
            </div>
          ) : (
            <div className="projetos-table-wrap">
              <table className="projetos-table">
                <thead>
                  <tr>
                    <th>ID blockchain</th>
                    <th>Projeto</th>
                    <th>Tipo</th>
                    <th>Localização</th>
                    <th>Créditos solicitados</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {projetosAguardandoEmissao.map((projeto) => (
                    <tr key={projeto.id}>
                      <td>{projeto.idProjetoBlockchain}</td>
                      <td>
                        <strong>{projeto.nome}</strong>
                        <span>{projeto.descricao}</span>
                      </td>
                      <td>{projeto.tipo}</td>
                      <td>{projeto.localizacao}</td>
                      <td>{projeto.creditosSolicitados}</td>
                      <td>
                        <span className="status-pill">{projeto.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => selecionarProjetoParaEmissao(projeto)}
                        >
                          Selecionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="section-title">
            <div>
              <span className="badge">Histórico</span>
              <h3>Projetos com créditos emitidos</h3>
              <p>
                Estes projetos já tiveram lote de créditos criado. Aqui faz
                sentido consultar lote, quantidade emitida e saldo do proponente.
              </p>
            </div>
          </div>

          {projetosComCreditosEmitidos.length === 0 ? (
            <div className="empty-state">
              Nenhum projeto com créditos emitidos ainda.
            </div>
          ) : (
            <div className="projetos-table-wrap">
              <table className="projetos-table">
                <thead>
                  <tr>
                    <th>ID blockchain</th>
                    <th>Projeto</th>
                    <th>Tipo</th>
                    <th>Localização</th>
                    <th>Créditos solicitados</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {projetosComCreditosEmitidos.map((projeto) => (
                    <tr key={projeto.id}>
                      <td>{projeto.idProjetoBlockchain}</td>
                      <td>
                        <strong>{projeto.nome}</strong>
                        <span>{projeto.descricao}</span>
                      </td>
                      <td>{projeto.tipo}</td>
                      <td>{projeto.localizacao}</td>
                      <td>{projeto.creditosSolicitados}</td>
                      <td>
                        <span className="status-pill">{projeto.status}</span>
                      </td>
                      <td>
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={() => selecionarProjetoParaEmissao(projeto)}
                        >
                          Consultar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {projetoSelecionado && (
            <div className="status-operacao">
              <div className="section-title">
                <div>
                  <span className="badge">Projeto selecionado</span>
                  <h3>{projetoSelecionado.nome}</h3>
                  <p>
                    ID blockchain: {projetoSelecionado.idProjetoBlockchain} |
                    Créditos solicitados: {projetoSelecionado.creditosSolicitados} |
                    Status local: {projetoSelecionado.status}
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  ID do lote ERC-1155
                  <input
                    value={idLote}
                    onChange={(e) => setIdLote(e.target.value)}
                    placeholder="Exemplo: 1"
                  />
                </label>

                <label>
                  Ano de referência
                  <input
                    value={anoReferencia}
                    onChange={(e) => setAnoReferencia(e.target.value)}
                    placeholder="Exemplo: 2026"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando}
                  onClick={() => void consultarProjetoParaEmissao()}
                >
                  Consultar projeto
                </button>

                {projetoSelecionadoAguardandoEmissao && (
                  <button
                    className="btn-primary"
                    type="button"
                    disabled={executando || resumoEmissao?.emitido === true}
                    onClick={() => void emitirCreditosSelecionado()}
                  >
                    Emitir créditos
                  </button>
                )}

                {(projetoSelecionadoJaEmitido || resumoEmissao?.emitido) && (
                  <button
                    className="btn-secondary"
                    type="button"
                    disabled={executando}
                    onClick={() => void consultarLoteSelecionado()}
                  >
                    Consultar lote
                  </button>
                )}
              </div>

              {(resumoEmissao || loteEmitido) && (
                <div className="status-grid">
                  {resumoEmissao && (
                    <>
                      <div>
                        <span>Projeto aprovado?</span>
                        <strong>{resumoEmissao.aprovado ? "Sim" : "Não"}</strong>
                      </div>

                      <div>
                        <span>Projeto já emitido?</span>
                        <strong>{resumoEmissao.emitido ? "Sim" : "Não"}</strong>
                      </div>

                      <div>
                        <span>Créditos aprovados</span>
                        <strong>{resumoEmissao.creditosAprovados}</strong>
                      </div>

                      <div>
                        <span>Proponente</span>
                        <strong>{encurtarEndereco(resumoEmissao.proponente)}</strong>
                      </div>
                    </>
                  )}

                  {loteEmitido && (
                    <>
                      <div>
                        <span>Lote emitido?</span>
                        <strong>{loteEmitido.loteEmitido ? "Sim" : "Não"}</strong>
                      </div>

                      <div>
                        <span>Quantidade emitida</span>
                        <strong>{loteEmitido.quantidadeEmitida}</strong>
                      </div>

                      <div>
                        <span>Quantidade aposentada</span>
                        <strong>{loteEmitido.quantidadeAposentada}</strong>
                      </div>

                      <div>
                        <span>Ano do lote</span>
                        <strong>{loteEmitido.anoReferencia}</strong>
                      </div>

                      <div>
                        <span>Lote ativo?</span>
                        <strong>{loteEmitido.ativo ? "Sim" : "Não"}</strong>
                      </div>

                      <div>
                        <span>Saldo do proponente no lote</span>
                        <strong>{saldoProponente || "Não consultado"}</strong>
                      </div>
                    </>
                  )}
                </div>
              )}

              {mensagemEmissao && (
                <div className="status-message">{mensagemEmissao}</div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function PainelValidacaoProjetos({
  projetos,
  onAtualizarStatusProjeto,
}: {
  projetos: ProjetoCarbono[];
  onAtualizarStatusProjeto: (
    idProjetoBlockchain: string,
    status: StatusProjeto
  ) => void;
}) {
  const [projetoSelecionadoId, setProjetoSelecionadoId] = useState("");
  const [executando, setExecutando] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [resultadoConsulta, setResultadoConsulta] =
    useState<ResultadoValidacaoTela | null>(null);
  const [agoraSegundos, setAgoraSegundos] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgoraSegundos(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  const projetosValidaveis = projetos.filter(
    (projeto) =>
      Boolean(projeto.idProjetoBlockchain) &&
      (projeto.status === "Pendente de validação" ||
        projeto.status === "Em análise")
  );

  const projetoSelecionado = projetosValidaveis.find(
    (projeto) => projeto.id === projetoSelecionadoId
  );

  const idProjetoBlockchain = projetoSelecionado?.idProjetoBlockchain ?? "";

  const tempoRestanteTela = useMemo(() => {
    const dados = resultadoConsulta?.dadosVotacao;

    if (!dados || dados.encerrada) {
      return 0;
    }

    const fim = Number(dados.fimVotacao);

    if (!Number.isFinite(fim) || fim <= 0) {
      return 0;
    }

    return Math.max(0, fim - agoraSegundos);
  }, [resultadoConsulta, agoraSegundos]);

  async function consultarProjeto() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain válido.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemValidacao("Consultando validação do projeto...");

      const consulta = await consultarValidacaoProjeto(idProjetoBlockchain);

      setResultadoConsulta(consulta);

      const tempoTexto = consulta.dadosVotacao
        ? formatarTempoRestante(consulta.dadosVotacao.tempoRestanteSegundos)
        : "votação ainda não iniciada";

      setMensagemValidacao(
        `Consulta concluída. Validador apto: ${
          consulta.validadorApto ? "sim" : "não"
        }. Votação aberta: ${
          consulta.votacaoAberta ? "sim" : "não"
        }. Total de votos: ${
          consulta.totalVotos
        }. Tempo restante: ${tempoTexto}.`
      );
    } catch (erro) {
      setMensagemValidacao(`Erro na consulta: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function sincronizarStatusProjetoSelecionado() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain válido.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemValidacao("Consultando estado real do projeto na blockchain...");

      const estadoReal = await consultarEstadoProjetoBlockchain(
        idProjetoBlockchain
      );

      if (estadoReal.statusSugerido !== "Desconhecido") {
        onAtualizarStatusProjeto(
          idProjetoBlockchain,
          estadoReal.statusSugerido
        );
      }

      setMensagemValidacao(
        `Status sincronizado. Estado na blockchain: ${estadoReal.estadoCodigo}. Aprovado: ${
          estadoReal.aprovado ? "sim" : "não"
        }. Emitido: ${estadoReal.emitido ? "sim" : "não"}. Status: ${
          estadoReal.statusSugerido
        }.`
      );

      await consultarProjeto();
    } catch (erro) {
      setMensagemValidacao(`Erro ao sincronizar status: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function iniciarVotacaoSelecionada() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain válido.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemValidacao("Solicitando início da votação na MetaMask...");

      const resultado = await iniciarVotacaoProjeto(idProjetoBlockchain);

      onAtualizarStatusProjeto(idProjetoBlockchain, "Em análise");

      setMensagemValidacao(
        `Votação iniciada para o projeto ${idProjetoBlockchain}. Hash: ${resultado.hash}.`
      );

      await consultarProjeto();
    } catch (erro) {
      setMensagemValidacao(`Erro ao iniciar votação: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function aprovarProjetoSelecionado() {
    if (!projetoSelecionado || !idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain válido.");
      return;
    }

    try {
      setExecutando(true);

      setMensagemValidacao(
        `Aprovando projeto ${idProjetoBlockchain} com ${projetoSelecionado.creditosSolicitados} créditos.`
      );

      const resultado = await votarProjetoValidacao({
        idProjeto: idProjetoBlockchain,
        aprovar: true,
        creditosSugeridos: projetoSelecionado.creditosSolicitados,
      });

      setMensagemValidacao(
        `Voto de aprovação enviado. Hash: ${resultado.hash}. Aguarde o prazo terminar para encerrar a votação.`
      );

      await consultarProjeto();
    } catch (erro) {
      setMensagemValidacao(`Erro ao aprovar projeto: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function rejeitarProjetoSelecionado() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain válido.");
      return;
    }

    try {
      setExecutando(true);

      setMensagemValidacao(`Rejeitando projeto ${idProjetoBlockchain}.`);

      const resultado = await votarProjetoValidacao({
        idProjeto: idProjetoBlockchain,
        aprovar: false,
        creditosSugeridos: 0,
      });

      setMensagemValidacao(
        `Voto de rejeição enviado. Hash: ${resultado.hash}. Aguarde o prazo terminar para encerrar a votação.`
      );

      await consultarProjeto();
    } catch (erro) {
      setMensagemValidacao(`Erro ao rejeitar projeto: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function encerrarVotacaoSelecionada() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain válido.");
      return;
    }

    try {
      setExecutando(true);

      setMensagemValidacao(
        `Encerrando votação do projeto ${idProjetoBlockchain}...`
      );

      const resultado = await encerrarVotacaoProjeto(idProjetoBlockchain);

      const estadoReal = await consultarEstadoProjetoBlockchain(
        idProjetoBlockchain
      );

      if (estadoReal.statusSugerido !== "Desconhecido") {
        onAtualizarStatusProjeto(
          idProjetoBlockchain,
          estadoReal.statusSugerido
        );
      }

      setMensagemValidacao(
        `Votação encerrada. Hash: ${resultado.hash}. Estado na blockchain: ${estadoReal.estadoCodigo}. Aprovado: ${
          estadoReal.aprovado ? "sim" : "não"
        }. Status atualizado: ${estadoReal.statusSugerido}.`
      );

      await consultarProjeto();
    } catch (erro) {
      setMensagemValidacao(
        `Erro ao encerrar votação: ${formatarErro(
          erro
        )}. Se a mensagem indicar votação ainda aberta, aguarde o fim do prazo exibido na tela.`
      );
    } finally {
      setExecutando(false);
    }
  }

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">Validação MVP</span>
          <h3>Projetos pendentes de validação</h3>
          <p>
            Escolha um projeto cadastrado, inicie a votação, aprove ou rejeite.
            No MVP, créditos aprovados são iguais aos créditos solicitados.
          </p>
        </div>
      </div>

      {projetosValidaveis.length === 0 ? (
        <div className="empty-state">
          Nenhum projeto com ID blockchain disponível para validação.
        </div>
      ) : (
        <>
          <div className="projetos-table-wrap">
            <table className="projetos-table">
              <thead>
                <tr>
                  <th>ID blockchain</th>
                  <th>Projeto</th>
                  <th>Tipo</th>
                  <th>Localização</th>
                  <th>Créditos</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>

              <tbody>
                {projetosValidaveis.map((projeto) => (
                  <tr key={projeto.id}>
                    <td>{projeto.idProjetoBlockchain}</td>
                    <td>
                      <strong>{projeto.nome}</strong>
                      <span>{projeto.descricao}</span>
                    </td>
                    <td>{projeto.tipo}</td>
                    <td>{projeto.localizacao}</td>
                    <td>{projeto.creditosSolicitados}</td>
                    <td>
                      <span className="status-pill">{projeto.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={() => {
                          setProjetoSelecionadoId(projeto.id);
                          setResultadoConsulta(null);
                          setMensagemValidacao(
                            `Projeto ${projeto.idProjetoBlockchain} selecionado.`
                          );
                        }}
                      >
                        Selecionar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {projetoSelecionado && (
            <div className="status-operacao">
              <div className="section-title">
                <div>
                  <span className="badge">Projeto selecionado</span>
                  <h3>{projetoSelecionado.nome}</h3>
                  <p>
                    ID blockchain: {projetoSelecionado.idProjetoBlockchain} |
                    Créditos solicitados: {projetoSelecionado.creditosSolicitados}
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando}
                  onClick={() => void consultarProjeto()}
                >
                  Verificar aptidão
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando}
                  onClick={() => void sincronizarStatusProjetoSelecionado()}
                >
                  Sincronizar status
                </button>

                <button
                  className="btn-primary"
                  type="button"
                  disabled={executando}
                  onClick={() => void iniciarVotacaoSelecionada()}
                >
                  Iniciar votação
                </button>

                <button
                  className="btn-primary"
                  type="button"
                  disabled={executando}
                  onClick={() => void aprovarProjetoSelecionado()}
                >
                  Aprovar
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando}
                  onClick={() => void rejeitarProjetoSelecionado()}
                >
                  Rejeitar
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando}
                  onClick={() => void encerrarVotacaoSelecionada()}
                >
                  Encerrar votação
                </button>
              </div>

              {resultadoConsulta && (
                <div className="status-grid">
                  <div>
                    <span>Validador apto</span>
                    <strong>{resultadoConsulta.validadorApto ? "Sim" : "Não"}</strong>
                  </div>

                  <div>
                    <span>Votação aberta</span>
                    <strong>{resultadoConsulta.votacaoAberta ? "Sim" : "Não"}</strong>
                  </div>

                  <div>
                    <span>Total de votos</span>
                    <strong>{resultadoConsulta.totalVotos}</strong>
                  </div>

                  {resultadoConsulta.dadosVotacao && (
                    <>
                      <div>
                        <span>Início da votação</span>
                        <strong>
                          {formatarDataHoraUnix(
                            resultadoConsulta.dadosVotacao.inicioVotacao
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Fim da votação</span>
                        <strong>
                          {formatarDataHoraUnix(
                            resultadoConsulta.dadosVotacao.fimVotacao
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Tempo restante</span>
                        <strong>{formatarTempoRestante(tempoRestanteTela)}</strong>
                      </div>

                      <div>
                        <span>Pode encerrar?</span>
                        <strong>
                          {resultadoConsulta.dadosVotacao.encerrada
                            ? "Já encerrada"
                            : tempoRestanteTela <= 0
                            ? "Sim"
                            : "Ainda não"}
                        </strong>
                      </div>

                      <div>
                        <span>Votos de aprovação</span>
                        <strong>
                          {resultadoConsulta.dadosVotacao.votosAprovacao}
                        </strong>
                      </div>

                      <div>
                        <span>Votos de rejeição</span>
                        <strong>
                          {resultadoConsulta.dadosVotacao.votosRejeicao}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              )}

              {mensagemValidacao && (
                <div className="status-message">{mensagemValidacao}</div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function FormularioProjeto({
  onSalvar,
  onCancelar,
}: {
  onSalvar: (dados: DadosNovoProjeto) => void;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("Energia Solar");
  const [localizacao, setLocalizacao] = useState("");
  const [creditosSolicitados, setCreditosSolicitados] = useState("");
  const [uriEvidencias, setUriEvidencias] = useState("");
  const [inicioPeriodoReferencia, setInicioPeriodoReferencia] = useState("");
  const [fimPeriodoReferencia, setFimPeriodoReferencia] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");

  function enviarProjeto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const creditosNumericos = Number(creditosSolicitados);

    if (!nome.trim()) {
      setErro("Informe o nome do projeto.");
      return;
    }

    if (!localizacao.trim()) {
      setErro("Informe a localização do projeto.");
      return;
    }

    if (!descricao.trim()) {
      setErro("Informe uma descrição técnica resumida do projeto.");
      return;
    }

    if (!uriEvidencias.trim()) {
      setErro("Informe a URI das evidências.");
      return;
    }

    if (!inicioPeriodoReferencia) {
      setErro("Informe o início do período de referência.");
      return;
    }

    if (!fimPeriodoReferencia) {
      setErro("Informe o fim do período de referência.");
      return;
    }

    if (
      new Date(`${inicioPeriodoReferencia}T00:00:00`).getTime() >=
      new Date(`${fimPeriodoReferencia}T00:00:00`).getTime()
    ) {
      setErro("O início do período deve ser anterior ao fim do período.");
      return;
    }

    if (!Number.isFinite(creditosNumericos) || creditosNumericos <= 0) {
      setErro("Informe uma quantidade de créditos solicitados maior que zero.");
      return;
    }

    onSalvar({
      nome: nome.trim(),
      tipo,
      localizacao: localizacao.trim(),
      creditosSolicitados: creditosNumericos,
      descricao: descricao.trim(),
      uriEvidencias: uriEvidencias.trim(),
      inicioPeriodoReferencia,
      fimPeriodoReferencia,
    });

    setErro("");
    setNome("");
    setTipo("Energia Solar");
    setLocalizacao("");
    setCreditosSolicitados("");
    setUriEvidencias("");
    setInicioPeriodoReferencia("");
    setFimPeriodoReferencia("");
    setDescricao("");
  }

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">Proponente</span>
          <h3>Novo projeto de crédito de carbono</h3>
          <p>
            Cadastre as informações iniciais do projeto para posterior análise
            pelos validadores.
          </p>
        </div>
      </div>

      {erro && <div className="alerta">{erro}</div>}

      <form onSubmit={enviarProjeto}>
        <div className="form-grid">
          <label>
            Nome do projeto
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Exemplo: Usina Solar Comunitária"
            />
          </label>

          <label>
            Tipo do projeto
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option>Energia Solar</option>
              <option>Energia Eólica</option>
              <option>Reflorestamento</option>
              <option>Conservação Florestal</option>
              <option>Biodigestor</option>
              <option>Eficiência Energética</option>
              <option>Reciclagem</option>
              <option>Outro</option>
            </select>
          </label>

          <label>
            Localização
            <input
              value={localizacao}
              onChange={(e) => setLocalizacao(e.target.value)}
              placeholder="Município e UF"
            />
          </label>

          <label>
            Créditos solicitados
            <input
              value={creditosSolicitados}
              onChange={(e) => setCreditosSolicitados(e.target.value)}
              type="number"
              min="1"
              step="1"
              placeholder="Exemplo: 120"
            />
          </label>

          <label>
            Início do período de referência
            <input
              value={inicioPeriodoReferencia}
              onChange={(e) => setInicioPeriodoReferencia(e.target.value)}
              type="date"
            />
          </label>

          <label>
            Fim do período de referência
            <input
              value={fimPeriodoReferencia}
              onChange={(e) => setFimPeriodoReferencia(e.target.value)}
              type="date"
            />
          </label>
        </div>

        <label className="full-field">
          URI das evidências
          <input
            value={uriEvidencias}
            onChange={(e) => setUriEvidencias(e.target.value)}
            placeholder="Exemplo: ipfs://carbonledger/evidencias/projeto-001.json"
          />
        </label>

        <label className="full-field">
          Descrição técnica resumida
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={5}
            placeholder="Descreva a metodologia, a fonte de redução ou remoção de emissões e a justificativa ambiental."
          />
        </label>

        <div className="form-actions">
          <button className="btn-secondary" type="button" onClick={onCancelar}>
            Cancelar
          </button>

          <button className="btn-primary" type="submit">
            Enviar para validação
          </button>
        </div>
      </form>
    </section>
  );
}

function ListaProjetos({ projetos }: { projetos: ProjetoCarbono[] }) {
  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">Projetos</span>
          <h3>Meus projetos cadastrados</h3>
          <p>
            Projetos submetidos pelo proponente e seus respectivos estados de
            validação.
          </p>
        </div>
      </div>

      {projetos.length === 0 ? (
        <div className="empty-state">
          Nenhum projeto cadastrado por este proponente.
        </div>
      ) : (
        <div className="projetos-table-wrap">
          <table className="projetos-table">
            <thead>
              <tr>
                <th>ID blockchain</th>
                <th>Projeto</th>
                <th>Tipo</th>
                <th>Localização</th>
                <th>Créditos</th>
                <th>Status</th>
                <th>Transação</th>
                <th>Cadastro</th>
              </tr>
            </thead>

            <tbody>
              {projetos.map((projeto) => (
                <tr key={projeto.id}>
                  <td>{projeto.idProjetoBlockchain ?? "Não capturado"}</td>
                  <td>
                    <strong>{projeto.nome}</strong>
                    <span>{projeto.descricao}</span>
                  </td>
                  <td>{projeto.tipo}</td>
                  <td>{projeto.localizacao}</td>
                  <td>{projeto.creditosSolicitados}</td>
                  <td>
                    <span className="status-pill">{projeto.status}</span>
                  </td>
                  <td>
                    {projeto.hashTransacao ? (
                      <span>{encurtarEndereco(projeto.hashTransacao)}</span>
                    ) : (
                      <span>Não disponível</span>
                    )}
                  </td>
                  <td>{projeto.criadoEm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusOperacao({ operacao }: { operacao: OperacaoWeb3 }) {
  return (
    <section className="status-operacao">
      <div className="section-title">
        <div>
          <span className="badge">Web3</span>
          <h3>Status da operação</h3>
          <p>Acompanhamento da submissão do projeto na blockchain.</p>
        </div>
      </div>

      <div className="status-grid">
        <div>
          <span>Modo</span>
          <strong>{operacao.modo}</strong>
        </div>

        <div>
          <span>Status</span>
          <strong>{operacao.status}</strong>
        </div>

        <div>
          <span>Contrato</span>
          <strong>{operacao.contrato || "Não configurado"}</strong>
        </div>

        <div>
          <span>Conta</span>
          <strong>{operacao.conta || "Não conectada"}</strong>
        </div>

        <div>
          <span>Rede</span>
          <strong>{operacao.rede || "Não identificada"}</strong>
        </div>

        <div>
          <span>Hash da transação</span>
          <strong>{operacao.hash || "Ainda não gerado"}</strong>
        </div>
      </div>

      <div className="status-message">{operacao.mensagem}</div>
    </section>
  );
}

function Card({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <article className="painel">
      <h3>{titulo}</h3>
      {children}
    </article>
  );
}

export default App;