import type { OperacaoWeb3 } from "../../types/carbonledger";

function StatusOperacao({ operacao }: { operacao: OperacaoWeb3 }) {
  return (
    <section className="status-operacao">
      <div className="section-title">
        <div>
          <span className="badge">WEB3</span>
          <h3>{"Status da opera\u00e7\u00e3o"}</h3>
          <p>
            {
              "Acompanhamento da submiss\u00e3o do projeto na blockchain."
            }
          </p>
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
          <strong>
            {operacao.contrato || "N\u00e3o configurado"}
          </strong>
        </div>

        <div>
          <span>Conta</span>
          <strong>{operacao.conta || "N\u00e3o conectada"}</strong>
        </div>

        <div>
          <span>Rede</span>
          <strong>{operacao.rede || "N\u00e3o identificada"}</strong>
        </div>

        <div>
          <span>{"Hash da transa\u00e7\u00e3o"}</span>
          <strong>{operacao.hash || "Ainda n\u00e3o gerado"}</strong>
        </div>
      </div>

      <div className="status-message">{operacao.mensagem}</div>
    </section>
  );
}

export default StatusOperacao;