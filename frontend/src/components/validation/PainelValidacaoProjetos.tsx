import { useEffect, useMemo, useState } from "react";
import {
  consultarEstadoProjetoBlockchain,
  consultarValidacaoProjeto,
  encerrarVotacaoProjeto,
  iniciarVotacaoProjeto,
  votarProjetoValidacao,
} from "../../contracts/projectValidation";
import type {
  ProjetoCarbono,
  ResultadoValidacaoTela,
  StatusProjeto,
} from "../../types/carbonledger";
import {
  formatarDataHoraUnix,
  formatarErro,
  formatarTempoRestante,
  obterEthereum,
  obterPrimeiraConta,
} from "../../utils/carbonledgerUtils";

const STATUS_PENDENTE: StatusProjeto = "Pendente de valida\u00e7\u00e3o";
const STATUS_ANALISE: StatusProjeto = "Em an\u00e1lise";
const STATUS_APROVADO: StatusProjeto = "Aprovado";
const STATUS_REJEITADO: StatusProjeto = "Rejeitado";
const STATUS_CREDITOS_EMITIDOS: StatusProjeto = "Cr\u00e9ditos emitidos";

function erroIndicaVotacaoInexistente(erro: unknown) {
  const mensagem = formatarErro(erro).toLowerCase();

  return (
    mensagem.includes("votacao inexistente") ||
    mensagem.includes("vota\u00e7\u00e3o inexistente")
  );
}

function erroIndicaVotacaoJaIniciada(erro: unknown) {
  const mensagem = formatarErro(erro).toLowerCase();

  return (
    mensagem.includes("votacao ja iniciada") ||
    mensagem.includes("vota\u00e7\u00e3o j\u00e1 iniciada") ||
    mensagem.includes("ja iniciada") ||
    mensagem.includes("j\u00e1 iniciada")
  );
}

function statusSugeridoEhStatusProjeto(status: string): status is StatusProjeto {
  return (
    status === STATUS_PENDENTE ||
    status === STATUS_ANALISE ||
    status === STATUS_APROVADO ||
    status === STATUS_REJEITADO ||
    status === STATUS_CREDITOS_EMITIDOS
  );
}

async function solicitarContaMetaMask() {
  const ethereum = obterEthereum();

  if (!ethereum) {
    throw new Error("MetaMask n\u00e3o encontrada.");
  }

  const contas = await ethereum.request({
    method: "eth_requestAccounts",
  });

  const contaAtual = obterPrimeiraConta(contas);

  if (!contaAtual) {
    throw new Error("Nenhuma conta foi retornada pela MetaMask.");
  }

  return contaAtual;
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
  const [sincronizandoTodos, setSincronizandoTodos] = useState(false);
  const [mensagemValidacao, setMensagemValidacao] = useState("");
  const [resultadoConsulta, setResultadoConsulta] =
    useState<ResultadoValidacaoTela | null>(null);
  const [votacaoExiste, setVotacaoExiste] = useState<boolean | null>(null);
  const [agoraSegundos, setAgoraSegundos] = useState(() =>
    Math.floor(Date.now() / 1000)
  );

  const projetosComIdBlockchain = useMemo(
    () => projetos.filter((projeto) => Boolean(projeto.idProjetoBlockchain)),
    [projetos]
  );

  const idsProjetosComIdBlockchain = useMemo(
    () =>
      projetosComIdBlockchain
        .map((projeto) => projeto.idProjetoBlockchain)
        .filter(Boolean)
        .join("|"),
    [projetosComIdBlockchain]
  );

  const projetosAcompanhaveis = projetosComIdBlockchain.filter(
    (projeto) => projeto.status !== STATUS_CREDITOS_EMITIDOS
  );

  const projetosPendentes = projetosAcompanhaveis.filter(
    (projeto) => projeto.status === STATUS_PENDENTE
  );

  const projetosEmAnalise = projetosAcompanhaveis.filter(
    (projeto) => projeto.status === STATUS_ANALISE
  );

  const projetosAprovados = projetosAcompanhaveis.filter(
    (projeto) => projeto.status === STATUS_APROVADO
  );

  const projetosRejeitados = projetosAcompanhaveis.filter(
    (projeto) => projeto.status === STATUS_REJEITADO
  );

  const projetoSelecionado = projetosAcompanhaveis.find(
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

  const podeIniciarVotacao =
    projetoSelecionado?.status === STATUS_ANALISE && votacaoExiste !== true;

  const podeVotar =
    Boolean(projetoSelecionado) &&
    resultadoConsulta?.votacaoAberta === true &&
    votacaoExiste === true;

  const podeEncerrar =
    Boolean(resultadoConsulta?.dadosVotacao) &&
    resultadoConsulta?.dadosVotacao?.encerrada === false &&
    tempoRestanteTela <= 0 &&
    votacaoExiste === true;

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAgoraSegundos(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    if (!idsProjetosComIdBlockchain) {
      return;
    }

    void sincronizarTodosProjetos(false);
  }, [idsProjetosComIdBlockchain]);

  function selecionarProjeto(projeto: ProjetoCarbono) {
    setProjetoSelecionadoId(projeto.id);
    setResultadoConsulta(null);
    setVotacaoExiste(null);

    setMensagemValidacao(
      `Projeto ${projeto.idProjetoBlockchain} selecionado. Status local: ${projeto.status}. Clique em Verificar aptid\u00e3o ou Sincronizar status para consultar o estado real na blockchain.`
    );
  }

  async function sincronizarTodosProjetos(mostrarMensagem = true) {
    if (projetosComIdBlockchain.length === 0) {
      if (mostrarMensagem) {
        setMensagemValidacao(
          "Nenhum projeto com ID blockchain dispon\u00edvel para sincronizar."
        );
      }

      return;
    }

    try {
      setSincronizandoTodos(true);

      if (mostrarMensagem) {
        setMensagemValidacao(
          "Sincronizando todos os projetos com a blockchain..."
        );
      }

      let atualizados = 0;
      let ignorados = 0;
      let erros = 0;

      for (const projeto of projetosComIdBlockchain) {
        if (!projeto.idProjetoBlockchain) {
          ignorados += 1;
          continue;
        }

        try {
          const estadoReal = await consultarEstadoProjetoBlockchain(
            projeto.idProjetoBlockchain
          );

          let statusFinal: StatusProjeto | null = null;

          try {
            const consulta = await consultarValidacaoProjeto(
              projeto.idProjetoBlockchain
            );

            if (consulta.dadosVotacao) {
              statusFinal = consulta.dadosVotacao.encerrada
                ? consulta.dadosVotacao.aprovado
                  ? STATUS_APROVADO
                  : STATUS_REJEITADO
                : STATUS_ANALISE;
            }
          } catch (erroConsulta) {
            if (erroIndicaVotacaoInexistente(erroConsulta)) {
              if (estadoReal.emitido) {
                statusFinal = STATUS_CREDITOS_EMITIDOS;
              } else if (estadoReal.aprovado) {
                statusFinal = STATUS_APROVADO;
              } else if (
                statusSugeridoEhStatusProjeto(estadoReal.statusSugerido)
              ) {
                statusFinal = estadoReal.statusSugerido;
              } else {
                statusFinal = projeto.status;
              }
            } else {
              throw erroConsulta;
            }
          }

          if (
            !statusFinal &&
            statusSugeridoEhStatusProjeto(estadoReal.statusSugerido)
          ) {
            statusFinal = estadoReal.statusSugerido;
          }

          if (statusFinal) {
            onAtualizarStatusProjeto(projeto.idProjetoBlockchain, statusFinal);
            atualizados += 1;
          } else {
            ignorados += 1;
          }
        } catch (erro) {
          console.error(
            `Erro ao sincronizar projeto ${projeto.idProjetoBlockchain}:`,
            erro
          );

          erros += 1;
        }
      }

      if (mostrarMensagem) {
        setMensagemValidacao(
          `Sincroniza\u00e7\u00e3o conclu\u00edda. Projetos atualizados: ${atualizados}. Ignorados: ${ignorados}. Erros: ${erros}.`
        );
      }
    } finally {
      setSincronizandoTodos(false);
    }
  }

  async function consultarProjeto() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain v\u00e1lido.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemValidacao("Consultando valida\u00e7\u00e3o do projeto...");

      const consulta = await consultarValidacaoProjeto(idProjetoBlockchain);

      setResultadoConsulta(consulta);
      setVotacaoExiste(true);

      if (consulta.dadosVotacao) {
        if (consulta.dadosVotacao.encerrada) {
          onAtualizarStatusProjeto(
            idProjetoBlockchain,
            consulta.dadosVotacao.aprovado ? STATUS_APROVADO : STATUS_REJEITADO
          );
        } else {
          onAtualizarStatusProjeto(idProjetoBlockchain, STATUS_ANALISE);
        }
      }

      const tempoTexto = consulta.dadosVotacao
        ? formatarTempoRestante(consulta.dadosVotacao.tempoRestanteSegundos)
        : "vota\u00e7\u00e3o ainda n\u00e3o iniciada";

      setMensagemValidacao(
        `Consulta conclu\u00edda. Validador apto: ${
          consulta.validadorApto ? "sim" : "n\u00e3o"
        }. Vota\u00e7\u00e3o aberta: ${
          consulta.votacaoAberta ? "sim" : "n\u00e3o"
        }. Total de votos: ${
          consulta.totalVotos
        }. Tempo restante: ${tempoTexto}.`
      );
    } catch (erro) {
      if (erroIndicaVotacaoInexistente(erro)) {
        setResultadoConsulta(null);
        setVotacaoExiste(false);

        setMensagemValidacao(
          "Este projeto est\u00e1 em an\u00e1lise, mas ainda n\u00e3o possui vota\u00e7\u00e3o criada na blockchain. Clique em Iniciar vota\u00e7\u00e3o antes de aprovar ou rejeitar."
        );

        return;
      }

      setMensagemValidacao(`Erro na consulta: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function sincronizarStatusProjetoSelecionado() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain v\u00e1lido.");
      return;
    }

    try {
      setExecutando(true);
      setMensagemValidacao(
        "Consultando estado real do projeto na blockchain..."
      );

      const estadoReal = await consultarEstadoProjetoBlockchain(
        idProjetoBlockchain
      );

      if (estadoReal.emitido) {
        onAtualizarStatusProjeto(idProjetoBlockchain, STATUS_CREDITOS_EMITIDOS);
      } else if (estadoReal.aprovado) {
        onAtualizarStatusProjeto(idProjetoBlockchain, STATUS_APROVADO);
      } else if (statusSugeridoEhStatusProjeto(estadoReal.statusSugerido)) {
        onAtualizarStatusProjeto(idProjetoBlockchain, estadoReal.statusSugerido);
      }

      await consultarProjeto();
    } catch (erro) {
      setMensagemValidacao(`Erro ao sincronizar status: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function iniciarVotacaoSelecionada() {
    if (!idProjetoBlockchain || !projetoSelecionado) {
      setMensagemValidacao("Selecione um projeto com ID blockchain v\u00e1lido.");
      return;
    }

    if (projetoSelecionado.status !== STATUS_ANALISE) {
      setMensagemValidacao(
        "A vota\u00e7\u00e3o s\u00f3 pode ser iniciada para projetos com status Em an\u00e1lise."
      );
      return;
    }

    if (votacaoExiste === true) {
      setMensagemValidacao(
        "A vota\u00e7\u00e3o deste projeto j\u00e1 existe. Clique em Verificar aptid\u00e3o e depois aprove ou rejeite."
      );
      return;
    }

    try {
      setExecutando(true);
      setMensagemValidacao(
        "Abrindo a MetaMask para confirmar a conta do validador..."
      );

      await solicitarContaMetaMask();

      setMensagemValidacao(
        "Solicitando in\u00edcio da vota\u00e7\u00e3o. Confirme a transa\u00e7\u00e3o na MetaMask..."
      );

      const resultado = await iniciarVotacaoProjeto(idProjetoBlockchain);

      setVotacaoExiste(true);
      onAtualizarStatusProjeto(idProjetoBlockchain, STATUS_ANALISE);

      setMensagemValidacao(
        `Vota\u00e7\u00e3o iniciada para o projeto ${idProjetoBlockchain}. Hash: ${resultado.hash}. Agora clique em Verificar aptid\u00e3o e depois aprove ou rejeite.`
      );

      await consultarProjeto();
    } catch (erro) {
      if (erroIndicaVotacaoJaIniciada(erro)) {
        setVotacaoExiste(true);
        onAtualizarStatusProjeto(idProjetoBlockchain, STATUS_ANALISE);

        setMensagemValidacao(
          "A vota\u00e7\u00e3o j\u00e1 estava iniciada na blockchain. Clique em Verificar aptid\u00e3o para atualizar os dados e votar."
        );

        return;
      }

      if (erroIndicaVotacaoInexistente(erro)) {
        setVotacaoExiste(false);
      }

      setMensagemValidacao(
        `Erro ao iniciar vota\u00e7\u00e3o: ${formatarErro(erro)}`
      );
    } finally {
      setExecutando(false);
    }
  }

  async function aprovarProjetoSelecionado() {
    if (!projetoSelecionado || !idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain v\u00e1lido.");
      return;
    }

    if (!podeVotar) {
      setMensagemValidacao(
        "A vota\u00e7\u00e3o ainda n\u00e3o est\u00e1 aberta para este projeto. Primeiro clique em Iniciar vota\u00e7\u00e3o e depois em Verificar aptid\u00e3o."
      );
      return;
    }

    try {
      setExecutando(true);

      setMensagemValidacao(
        `Aprovando projeto ${idProjetoBlockchain} com ${projetoSelecionado.creditosSolicitados} cr\u00e9ditos.`
      );

      const resultado = await votarProjetoValidacao({
        idProjeto: idProjetoBlockchain,
        aprovar: true,
        creditosSugeridos: projetoSelecionado.creditosSolicitados,
      });

      onAtualizarStatusProjeto(idProjetoBlockchain, STATUS_ANALISE);

      setMensagemValidacao(
        `Voto de aprova\u00e7\u00e3o enviado. Hash: ${resultado.hash}. Aguarde o prazo terminar para encerrar a vota\u00e7\u00e3o.`
      );

      await consultarProjeto();
    } catch (erro) {
      if (erroIndicaVotacaoInexistente(erro)) {
        setResultadoConsulta(null);
        setVotacaoExiste(false);

        setMensagemValidacao(
          "Erro ao aprovar projeto: a vota\u00e7\u00e3o ainda n\u00e3o existe na blockchain. Clique em Iniciar vota\u00e7\u00e3o antes de votar."
        );

        return;
      }

      setMensagemValidacao(`Erro ao aprovar projeto: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function rejeitarProjetoSelecionado() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain v\u00e1lido.");
      return;
    }

    if (!podeVotar) {
      setMensagemValidacao(
        "A vota\u00e7\u00e3o ainda n\u00e3o est\u00e1 aberta para este projeto. Primeiro clique em Iniciar vota\u00e7\u00e3o e depois em Verificar aptid\u00e3o."
      );
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

      onAtualizarStatusProjeto(idProjetoBlockchain, STATUS_ANALISE);

      setMensagemValidacao(
        `Voto de rejei\u00e7\u00e3o enviado. Hash: ${resultado.hash}. Aguarde o prazo terminar para encerrar a vota\u00e7\u00e3o.`
      );

      await consultarProjeto();
    } catch (erro) {
      if (erroIndicaVotacaoInexistente(erro)) {
        setResultadoConsulta(null);
        setVotacaoExiste(false);

        setMensagemValidacao(
          "Erro ao rejeitar projeto: a vota\u00e7\u00e3o ainda n\u00e3o existe na blockchain. Clique em Iniciar vota\u00e7\u00e3o antes de votar."
        );

        return;
      }

      setMensagemValidacao(`Erro ao rejeitar projeto: ${formatarErro(erro)}`);
    } finally {
      setExecutando(false);
    }
  }

  async function encerrarVotacaoSelecionada() {
    if (!idProjetoBlockchain) {
      setMensagemValidacao("Selecione um projeto com ID blockchain v\u00e1lido.");
      return;
    }

    if (!podeEncerrar) {
      setMensagemValidacao(
        "A vota\u00e7\u00e3o ainda n\u00e3o pode ser encerrada. Consulte o projeto e aguarde o tempo restante chegar a zero."
      );
      return;
    }

    try {
      setExecutando(true);

      setMensagemValidacao(
        `Encerrando vota\u00e7\u00e3o do projeto ${idProjetoBlockchain}...`
      );

      const resultado = await encerrarVotacaoProjeto(idProjetoBlockchain);

      const estadoReal = await consultarEstadoProjetoBlockchain(
        idProjetoBlockchain
      );

      if (estadoReal.statusSugerido !== "Desconhecido") {
        onAtualizarStatusProjeto(
          idProjetoBlockchain,
          statusSugeridoEhStatusProjeto(estadoReal.statusSugerido)
            ? estadoReal.statusSugerido
            : estadoReal.aprovado
            ? STATUS_APROVADO
            : STATUS_REJEITADO
        );
      }

      setMensagemValidacao(
        `Vota\u00e7\u00e3o encerrada. Hash: ${resultado.hash}. Estado na blockchain: ${estadoReal.estadoCodigo}. Aprovado: ${
          estadoReal.aprovado ? "sim" : "n\u00e3o"
        }. Status atualizado: ${estadoReal.statusSugerido}.`
      );

      await consultarProjeto();
    } catch (erro) {
      setMensagemValidacao(
        `Erro ao encerrar vota\u00e7\u00e3o: ${formatarErro(
          erro
        )}. Se a mensagem indicar vota\u00e7\u00e3o ainda aberta, aguarde o fim do prazo exibido na tela.`
      );
    } finally {
      setExecutando(false);
    }
  }

  function renderizarTabelaProjetos(lista: ProjetoCarbono[]) {
    if (lista.length === 0) {
      return (
        <div className="empty-state">
          {"Nenhum projeto encontrado nesta categoria."}
        </div>
      );
    }

    return (
      <div className="projetos-table-wrap">
        <table className="projetos-table">
          <thead>
            <tr>
              <th>{"ID blockchain"}</th>
              <th>{"Projeto"}</th>
              <th>{"Tipo"}</th>
              <th>{"Localiza\u00e7\u00e3o"}</th>
              <th>{"Cr\u00e9ditos"}</th>
              <th>{"Status"}</th>
              <th>{"A\u00e7\u00e3o"}</th>
            </tr>
          </thead>

          <tbody>
            {lista.map((projeto) => (
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
                    {"Selecionar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">{"VALIDA\u00c7\u00c3O MVP"}</span>
          <h3>{"Projetos para valida\u00e7\u00e3o e acompanhamento"}</h3>
          <p>
            {
              "A vota\u00e7\u00e3o deve ser iniciada apenas para projetos com status Em an\u00e1lise. Depois disso, o validador pode votar e, ao final do prazo, encerrar a vota\u00e7\u00e3o."
            }
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn-primary"
          type="button"
          disabled={executando || sincronizandoTodos}
          onClick={() => void sincronizarTodosProjetos(true)}
        >
          {sincronizandoTodos
            ? "Sincronizando..."
            : "Sincronizar todos os projetos"}
        </button>
      </div>

      {projetosAcompanhaveis.length === 0 ? (
        <div className="empty-state">
          {"Nenhum projeto com ID blockchain dispon\u00edvel para acompanhamento."}
        </div>
      ) : (
        <>
          <div className="section-title">
            <div>
              <span className="badge">{"Todos"}</span>
              <h3>{"Todos os projetos acompanh\u00e1veis"}</h3>
              <p>
                {
                  "Lista geral dos projetos com ID blockchain, exceto aqueles que j\u00e1 tiveram cr\u00e9ditos emitidos."
                }
              </p>
            </div>
          </div>

          {renderizarTabelaProjetos(projetosAcompanhaveis)}

          <div className="section-title">
            <div>
              <span className="badge">{"Pendentes"}</span>
              <h3>{"Projetos pendentes de valida\u00e7\u00e3o"}</h3>
              <p>
                {
                  "Projetos cadastrados que ainda n\u00e3o est\u00e3o em an\u00e1lise. A vota\u00e7\u00e3o n\u00e3o deve ser iniciada aqui."
                }
              </p>
            </div>
          </div>

          {renderizarTabelaProjetos(projetosPendentes)}

          <div className="section-title">
            <div>
              <span className="badge">{"Em an\u00e1lise"}</span>
              <h3>{"Projetos em an\u00e1lise"}</h3>
              <p>
                {
                  "Projetos aptos para abertura de vota\u00e7\u00e3o, voto e posterior encerramento."
                }
              </p>
            </div>
          </div>

          {renderizarTabelaProjetos(projetosEmAnalise)}

          <div className="section-title">
            <div>
              <span className="badge">{"Aprovados"}</span>
              <h3>{"Projetos aprovados"}</h3>
              <p>{"Projetos que j\u00e1 passaram pela vota\u00e7\u00e3o."}</p>
            </div>
          </div>

          {renderizarTabelaProjetos(projetosAprovados)}

          <div className="section-title">
            <div>
              <span className="badge">{"Rejeitados"}</span>
              <h3>{"Projetos rejeitados"}</h3>
              <p>{"Projetos que j\u00e1 passaram pela vota\u00e7\u00e3o."}</p>
            </div>
          </div>

          {renderizarTabelaProjetos(projetosRejeitados)}

          {projetoSelecionado && (
            <div className="status-operacao">
              <div className="section-title">
                <div>
                  <span className="badge">{"Projeto selecionado"}</span>
                  <h3>{projetoSelecionado.nome}</h3>
                  <p>
                    {`ID blockchain: ${projetoSelecionado.idProjetoBlockchain} | Cr\u00e9ditos solicitados: ${projetoSelecionado.creditosSolicitados} | Status local: ${projetoSelecionado.status}`}
                  </p>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando || sincronizandoTodos}
                  onClick={() => void consultarProjeto()}
                >
                  {"Verificar aptid\u00e3o"}
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando || sincronizandoTodos}
                  onClick={() => void sincronizarStatusProjetoSelecionado()}
                >
                  {"Sincronizar status"}
                </button>

                <button
                  className="btn-primary"
                  type="button"
                  disabled={
                    executando ||
                    sincronizandoTodos ||
                    !podeIniciarVotacao
                  }
                  onClick={() => void iniciarVotacaoSelecionada()}
                >
                  {"Iniciar vota\u00e7\u00e3o"}
                </button>

                <button
                  className="btn-primary"
                  type="button"
                  disabled={executando || sincronizandoTodos || !podeVotar}
                  onClick={() => void aprovarProjetoSelecionado()}
                >
                  {"Aprovar"}
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando || sincronizandoTodos || !podeVotar}
                  onClick={() => void rejeitarProjetoSelecionado()}
                >
                  {"Rejeitar"}
                </button>

                <button
                  className="btn-secondary"
                  type="button"
                  disabled={executando || sincronizandoTodos || !podeEncerrar}
                  onClick={() => void encerrarVotacaoSelecionada()}
                >
                  {"Encerrar vota\u00e7\u00e3o"}
                </button>
              </div>

              <div className="status-grid">
                <div>
                  <span>{"Vota\u00e7\u00e3o existe?"}</span>
                  <strong>
                    {votacaoExiste === null
                      ? "N\u00e3o verificado"
                      : votacaoExiste
                      ? "Sim"
                      : "N\u00e3o"}
                  </strong>
                </div>

                <div>
                  <span>{"Status local"}</span>
                  <strong>{projetoSelecionado.status}</strong>
                </div>
              </div>

              {resultadoConsulta && (
                <div className="status-grid">
                  <div>
                    <span>{"Validador apto"}</span>
                    <strong>
                      {resultadoConsulta.validadorApto ? "Sim" : "N\u00e3o"}
                    </strong>
                  </div>

                  <div>
                    <span>{"Vota\u00e7\u00e3o aberta"}</span>
                    <strong>
                      {resultadoConsulta.votacaoAberta ? "Sim" : "N\u00e3o"}
                    </strong>
                  </div>

                  <div>
                    <span>{"Total de votos"}</span>
                    <strong>{resultadoConsulta.totalVotos}</strong>
                  </div>

                  {resultadoConsulta.dadosVotacao && (
                    <>
                      <div>
                        <span>{"In\u00edcio da vota\u00e7\u00e3o"}</span>
                        <strong>
                          {formatarDataHoraUnix(
                            resultadoConsulta.dadosVotacao.inicioVotacao
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>{"Fim da vota\u00e7\u00e3o"}</span>
                        <strong>
                          {formatarDataHoraUnix(
                            resultadoConsulta.dadosVotacao.fimVotacao
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>{"Tempo restante"}</span>
                        <strong>{formatarTempoRestante(tempoRestanteTela)}</strong>
                      </div>

                      <div>
                        <span>{"Pode encerrar?"}</span>
                        <strong>
                          {resultadoConsulta.dadosVotacao.encerrada
                            ? "J\u00e1 encerrada"
                            : tempoRestanteTela <= 0
                            ? "Sim"
                            : "Ainda n\u00e3o"}
                        </strong>
                      </div>

                      <div>
                        <span>{"Votos de aprova\u00e7\u00e3o"}</span>
                        <strong>
                          {resultadoConsulta.dadosVotacao.votosAprovacao}
                        </strong>
                      </div>

                      <div>
                        <span>{"Votos de rejei\u00e7\u00e3o"}</span>
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

export default PainelValidacaoProjetos;