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
  | "emissao-creditos";

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
                    {item.usuario} / {item.senha}
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
            <p>Criar ofertas no marketplace após aprovação e emissão dos créditos.</p>
            <button className="btn-secondary" type="button">
              Criar oferta
            </button>
          </Card>

          <Card titulo="Vendas">
            <p>Acompanhar créditos vendidos e ofertas abertas.</p>
            <button className="btn-secondary" type="button">
              Ver vendas
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
      <div className="grid">
        <Card titulo="Marketplace">
          <p>Comprar créditos de carbono ofertados por proponentes.</p>
          <button className="btn-primary" type="button">
            Comprar créditos
          </button>
        </Card>

        <Card titulo="Meus Créditos">
          <p>Consultar créditos adquiridos e disponíveis para aposentadoria.</p>
          <button className="btn-secondary" type="button">
            Ver saldo
          </button>
        </Card>

        <Card titulo="Aposentar Créditos">
          <p>Queimar créditos, registrar compensação e emitir certificado NFT.</p>
          <button className="btn-primary" type="button">
            Aposentar
          </button>
        </Card>

        <Card titulo="Certificados">
          <p>Consultar NFTs de compensação emitidos em nome da organização.</p>
          <button className="btn-secondary" type="button">
            Ver certificados
          </button>
        </Card>
      </div>
    );
  }

  return null;
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