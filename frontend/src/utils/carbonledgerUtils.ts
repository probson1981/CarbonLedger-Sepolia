import type {
  EthereumProviderComEventos,
  ProjetoCarbono,
  UsuarioDemo,
} from "../types/carbonledger";

export function obterEthereum(): EthereumProviderComEventos | undefined {
  return (window as typeof window & {
    ethereum?: EthereumProviderComEventos;
  }).ethereum;
}

export function carregarProjetosSalvos(): ProjetoCarbono[] {
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

export function gerarIdProjeto() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `projeto-${Date.now()}`;
}

export function encurtarEndereco(endereco: string) {
  if (!endereco) {
    return "";
  }

  return `${endereco.slice(0, 6)}...${endereco.slice(-4)}`;
}

export function formatarErro(erro: unknown) {
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

  return "Erro desconhecido ao executar a opera\u00e7\u00e3o.";
}

export function converterChainIdParaDecimal(chainIdHex: unknown): string {
  if (typeof chainIdHex !== "string") {
    return "";
  }

  try {
    return BigInt(chainIdHex).toString();
  } catch {
    return "";
  }
}

export function obterPrimeiraConta(contas: unknown): string {
  if (Array.isArray(contas) && typeof contas[0] === "string") {
    return contas[0];
  }

  return "";
}

export function normalizarUsuario(valor: string): string {
  return valor.trim().toLowerCase();
}

export function normalizarSenha(valor: string): string {
  return valor.trim();
}

export function autenticarUsuario(
  usuarios: UsuarioDemo[],
  usuarioInformado: string,
  senhaInformada: string
): UsuarioDemo | undefined {
  const usuarioNormalizado = normalizarUsuario(usuarioInformado);
  const senhaNormalizada = normalizarSenha(senhaInformada);

  return usuarios.find(
    (item) =>
      normalizarUsuario(item.usuario) === usuarioNormalizado &&
      item.senha === senhaNormalizada
  );
}

export function formatarDataHoraUnix(timestampTexto: string) {
  const timestamp = Number(timestampTexto);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "N\u00e3o dispon\u00edvel";
  }

  return new Date(timestamp * 1000).toLocaleString("pt-BR");
}

export function formatarTempoRestante(segundos: number) {
  if (!Number.isFinite(segundos) || segundos <= 0) {
    return "Encerr\u00e1vel agora";
  }

  const minutos = Math.floor(segundos / 60);
  const restoSegundos = segundos % 60;

  if (minutos <= 0) {
    return `${restoSegundos}s`;
  }

  return `${minutos}min ${restoSegundos}s`;
}

export function obterAnoAtual() {
  return new Date().getFullYear().toString();
}

export function sugerirIdLote(idProjetoBlockchain: string) {
  return idProjetoBlockchain;
}