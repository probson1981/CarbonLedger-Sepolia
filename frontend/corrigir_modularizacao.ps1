$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force ".\src\types" | Out-Null
New-Item -ItemType Directory -Force ".\src\data" | Out-Null
New-Item -ItemType Directory -Force ".\src\utils" | Out-Null
New-Item -ItemType Directory -Force ".\src\components\common" | Out-Null
New-Item -ItemType Directory -Force ".\src\components\project" | Out-Null

Set-Content -LiteralPath ".\src\types\carbonledger.ts" -Encoding UTF8 -Value @'
export type PerfilUsuario =
  | "administrador"
  | "proponente"
  | "validador"
  | "comprador"
  | "governanca"
  | "nao-autenticado";

export type StatusProjeto =
  | "Pendente de validação"
  | "Em análise"
  | "Aprovado"
  | "Rejeitado"
  | "Créditos emitidos";

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
  | "Aguardando ação"
  | "Aguardando MetaMask"
  | "Transação enviada"
  | "Confirmada"
  | "Erro";

export type OperacaoWeb3 = {
  modo: "Blockchain" | "Simulação local";
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
'@

Set-Content -LiteralPath ".\src\data\usuariosDemo.ts" -Encoding UTF8 -Value @'
import type { UsuarioDemo } from "../types/carbonledger";

export const usuariosDemo: UsuarioDemo[] = [
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

export const TIPO_PROJETO_MAP: Record<string, number> = {
  "Energia Solar": 0,
  "Energia Eólica": 1,
  Reflorestamento: 2,
  "Conservação Florestal": 3,
  Biodigestor: 4,
  "Eficiência Energética": 5,
  Reciclagem: 6,
  Outro: 7,
};
'@

Set-Content -LiteralPath ".\src\utils\carbonledgerUtils.ts" -Encoding UTF8 -Value @'
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

  return "Erro desconhecido ao executar a operação.";
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
    return "Não disponível";
  }

  return new Date(timestamp * 1000).toLocaleString("pt-BR");
}

export function formatarTempoRestante(segundos: number) {
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

export function obterAnoAtual() {
  return new Date().getFullYear().toString();
}

export function sugerirIdLote(idProjetoBlockchain: string) {
  return idProjetoBlockchain;
}
'@

Set-Content -LiteralPath ".\src\components\common\Card.tsx" -Encoding UTF8 -Value @'
import type { ReactNode } from "react";

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

export default Card;
'@

Set-Content -LiteralPath ".\src\components\common\StatusOperacao.tsx" -Encoding UTF8 -Value @'
import type { OperacaoWeb3 } from "../../types/carbonledger";

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

export default StatusOperacao;
'@

Set-Content -LiteralPath ".\src\components\project\ListaProjetos.tsx" -Encoding UTF8 -Value @'
import type { ProjetoCarbono } from "../../types/carbonledger";
import { encurtarEndereco } from "../../utils/carbonledgerUtils";

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

export default ListaProjetos;
'@

Set-Content -LiteralPath ".\src\components\project\FormularioProjeto.tsx" -Encoding UTF8 -Value @'
import { useState } from "react";
import type { FormEvent } from "react";
import type { DadosNovoProjeto } from "../../types/carbonledger";

type EstadoFormularioProjeto = {
  nome: string;
  tipo: string;
  localizacao: string;
  creditosSolicitados: string;
  uriEvidencias: string;
  inicioPeriodoReferencia: string;
  fimPeriodoReferencia: string;
  descricao: string;
};

function criarValoresPadraoProjeto(): EstadoFormularioProjeto {
  const sufixo = new Date()
    .toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/:/g, "");

  return {
    nome: `Projeto Solar 1MW Teste ${sufixo}`,
    tipo: "Energia Solar",
    localizacao: "Fortaleza/CE",
    creditosSolicitados: "10000",
    uriEvidencias:
      "ipfs://carbonledger/evidencias/projeto-solar-1mw-teste.json",
    inicioPeriodoReferencia: "2026-01-01",
    fimPeriodoReferencia: "2036-01-01",
    descricao:
      "Projeto fotovoltaico de 1 MW destinado à geração de energia renovável, com redução estimada de emissões de gases de efeito estufa. As evidências incluem dados técnicos, localização, período de referência e documentação ambiental do empreendimento.",
  };
}

function FormularioProjeto({
  onSalvar,
  onCancelar,
}: {
  onSalvar: (dados: DadosNovoProjeto) => void;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState<EstadoFormularioProjeto>(
    criarValoresPadraoProjeto
  );
  const [erro, setErro] = useState("");

  function atualizarCampo(
    campo: keyof EstadoFormularioProjeto,
    valor: string
  ) {
    setValores((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function preencherDadosTeste() {
    setValores(criarValoresPadraoProjeto());
    setErro("");
  }

  function enviarProjeto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const creditosNumericos = Number(valores.creditosSolicitados);

    if (!valores.nome.trim()) {
      setErro("Informe o nome do projeto.");
      return;
    }

    if (!valores.localizacao.trim()) {
      setErro("Informe a localização do projeto.");
      return;
    }

    if (!valores.descricao.trim()) {
      setErro("Informe uma descrição técnica resumida do projeto.");
      return;
    }

    if (!valores.uriEvidencias.trim()) {
      setErro("Informe a URI das evidências.");
      return;
    }

    if (!valores.inicioPeriodoReferencia) {
      setErro("Informe o início do período de referência.");
      return;
    }

    if (!valores.fimPeriodoReferencia) {
      setErro("Informe o fim do período de referência.");
      return;
    }

    if (
      new Date(`${valores.inicioPeriodoReferencia}T00:00:00`).getTime() >=
      new Date(`${valores.fimPeriodoReferencia}T00:00:00`).getTime()
    ) {
      setErro("O início do período deve ser anterior ao fim do período.");
      return;
    }

    if (!Number.isFinite(creditosNumericos) || creditosNumericos <= 0) {
      setErro("Informe uma quantidade de créditos solicitados maior que zero.");
      return;
    }

    onSalvar({
      nome: valores.nome.trim(),
      tipo: valores.tipo,
      localizacao: valores.localizacao.trim(),
      creditosSolicitados: creditosNumericos,
      descricao: valores.descricao.trim(),
      uriEvidencias: valores.uriEvidencias.trim(),
      inicioPeriodoReferencia: valores.inicioPeriodoReferencia,
      fimPeriodoReferencia: valores.fimPeriodoReferencia,
    });

    setErro("");
    setValores(criarValoresPadraoProjeto());
  }

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">Proponente</span>
          <h3>Novo projeto de crédito de carbono</h3>
          <p>
            Cadastre as informações iniciais do projeto para posterior análise
            pelos validadores. Os campos já vêm preenchidos com dados de teste.
          </p>
        </div>
      </div>

      {erro && <div className="alerta">{erro}</div>}

      <form onSubmit={enviarProjeto}>
        <div className="form-grid">
          <label>
            Nome do projeto
            <input
              value={valores.nome}
              onChange={(e) => atualizarCampo("nome", e.target.value)}
              placeholder="Exemplo: Usina Solar Comunitária"
            />
          </label>

          <label>
            Tipo do projeto
            <select
              value={valores.tipo}
              onChange={(e) => atualizarCampo("tipo", e.target.value)}
            >
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
              value={valores.localizacao}
              onChange={(e) => atualizarCampo("localizacao", e.target.value)}
              placeholder="Município e UF"
            />
          </label>

          <label>
            Créditos solicitados
            <input
              value={valores.creditosSolicitados}
              onChange={(e) =>
                atualizarCampo("creditosSolicitados", e.target.value)
              }
              type="number"
              min="1"
              step="1"
              placeholder="Exemplo: 120"
            />
          </label>

          <label>
            Início do período de referência
            <input
              value={valores.inicioPeriodoReferencia}
              onChange={(e) =>
                atualizarCampo("inicioPeriodoReferencia", e.target.value)
              }
              type="date"
            />
          </label>

          <label>
            Fim do período de referência
            <input
              value={valores.fimPeriodoReferencia}
              onChange={(e) =>
                atualizarCampo("fimPeriodoReferencia", e.target.value)
              }
              type="date"
            />
          </label>
        </div>

        <label className="full-field">
          URI das evidências
          <input
            value={valores.uriEvidencias}
            onChange={(e) => atualizarCampo("uriEvidencias", e.target.value)}
            placeholder="Exemplo: ipfs://carbonledger/evidencias/projeto-001.json"
          />
        </label>

        <label className="full-field">
          Descrição técnica resumida
          <textarea
            value={valores.descricao}
            onChange={(e) => atualizarCampo("descricao", e.target.value)}
            rows={5}
            placeholder="Descreva a metodologia, a fonte de redução ou remoção de emissões e a justificativa ambiental."
          />
        </label>

        <div className="form-actions">
          <button
            className="btn-secondary"
            type="button"
            onClick={preencherDadosTeste}
          >
            Recarregar dados de teste
          </button>

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

export default FormularioProjeto;
'@

Write-Host ""
Write-Host "Arquivos modularizados corrigidos com sucesso."
Write-Host "Agora rode: npm run build"