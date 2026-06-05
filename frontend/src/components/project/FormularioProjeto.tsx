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
      "Projeto fotovoltaico de 1 MW destinado \u00e0 gera\u00e7\u00e3o de energia renov\u00e1vel, com redu\u00e7\u00e3o estimada de emiss\u00f5es de gases de efeito estufa. As evid\u00eancias incluem dados t\u00e9cnicos, localiza\u00e7\u00e3o, per\u00edodo de refer\u00eancia e documenta\u00e7\u00e3o ambiental do empreendimento.",
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
      setErro("Informe a localiza\u00e7\u00e3o do projeto.");
      return;
    }

    if (!valores.descricao.trim()) {
      setErro("Informe uma descri\u00e7\u00e3o t\u00e9cnica resumida do projeto.");
      return;
    }

    if (!valores.uriEvidencias.trim()) {
      setErro("Informe a URI das evid\u00eancias.");
      return;
    }

    if (!valores.inicioPeriodoReferencia) {
      setErro("Informe o in\u00edcio do per\u00edodo de refer\u00eancia.");
      return;
    }

    if (!valores.fimPeriodoReferencia) {
      setErro("Informe o fim do per\u00edodo de refer\u00eancia.");
      return;
    }

    if (
      new Date(`${valores.inicioPeriodoReferencia}T00:00:00`).getTime() >=
      new Date(`${valores.fimPeriodoReferencia}T00:00:00`).getTime()
    ) {
      setErro(
        "O in\u00edcio do per\u00edodo deve ser anterior ao fim do per\u00edodo."
      );
      return;
    }

    if (!Number.isFinite(creditosNumericos) || creditosNumericos <= 0) {
      setErro("Informe uma quantidade de cr\u00e9ditos solicitados maior que zero.");
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
          <span className="badge">PROPONENTE</span>
          <h3>{"Novo projeto de cr\u00e9dito de carbono"}</h3>
          <p>
            {
              "Cadastre as informa\u00e7\u00f5es iniciais do projeto para posterior an\u00e1lise pelos validadores. Os campos j\u00e1 v\u00eam preenchidos com dados de teste."
            }
          </p>
        </div>
      </div>

      {erro && <div className="alerta">{erro}</div>}

      <form onSubmit={enviarProjeto}>
        <div className="form-grid">
          <label>
            {"Nome do projeto"}
            <input
              value={valores.nome}
              onChange={(e) => atualizarCampo("nome", e.target.value)}
              placeholder="Exemplo: Usina Solar Comunit\u00e1ria"
            />
          </label>

          <label>
            {"Tipo do projeto"}
            <select
              value={valores.tipo}
              onChange={(e) => atualizarCampo("tipo", e.target.value)}
            >
              <option>Energia Solar</option>
              <option>{"Energia E\u00f3lica"}</option>
              <option>Reflorestamento</option>
              <option>{"Conserva\u00e7\u00e3o Florestal"}</option>
              <option>Biodigestor</option>
              <option>{"Efici\u00eancia Energ\u00e9tica"}</option>
              <option>Reciclagem</option>
              <option>Outro</option>
            </select>
          </label>

          <label>
            {"Localiza\u00e7\u00e3o"}
            <input
              value={valores.localizacao}
              onChange={(e) => atualizarCampo("localizacao", e.target.value)}
              placeholder={"Munic\u00edpio e UF"}
            />
          </label>

          <label>
            {"Cr\u00e9ditos solicitados"}
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
            {"In\u00edcio do per\u00edodo de refer\u00eancia"}
            <input
              value={valores.inicioPeriodoReferencia}
              onChange={(e) =>
                atualizarCampo("inicioPeriodoReferencia", e.target.value)
              }
              type="date"
            />
          </label>

          <label>
            {"Fim do per\u00edodo de refer\u00eancia"}
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
          {"URI das evid\u00eancias"}
          <input
            value={valores.uriEvidencias}
            onChange={(e) => atualizarCampo("uriEvidencias", e.target.value)}
            placeholder="Exemplo: ipfs://carbonledger/evidencias/projeto-001.json"
          />
        </label>

        <label className="full-field">
          {"Descri\u00e7\u00e3o t\u00e9cnica resumida"}
          <textarea
            value={valores.descricao}
            onChange={(e) => atualizarCampo("descricao", e.target.value)}
            rows={5}
            placeholder={
              "Descreva a metodologia, a fonte de redu\u00e7\u00e3o ou remo\u00e7\u00e3o de emiss\u00f5es e a justificativa ambiental."
            }
          />
        </label>

        <div className="form-actions">
          <button
            className="btn-secondary"
            type="button"
            onClick={preencherDadosTeste}
          >
            {"Recarregar dados de teste"}
          </button>

          <button className="btn-secondary" type="button" onClick={onCancelar}>
            {"Cancelar"}
          </button>

          <button className="btn-primary" type="submit">
            {"Enviar para valida\u00e7\u00e3o"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default FormularioProjeto;