import type { ProjetoCarbono } from "../../types/carbonledger";
import { encurtarEndereco } from "../../utils/carbonledgerUtils";

function ListaProjetos({ projetos }: { projetos: ProjetoCarbono[] }) {
  return (
    <section className="form-card">
      <div className="section-title">
        <div>
          <span className="badge">PROJETOS</span>
          <h3>{"Meus projetos cadastrados"}</h3>
          <p>
            {
              "Projetos submetidos pelo proponente e seus respectivos estados de valida\u00e7\u00e3o."
            }
          </p>
        </div>
      </div>

      {projetos.length === 0 ? (
        <div className="empty-state">
          {"Nenhum projeto cadastrado por este proponente."}
        </div>
      ) : (
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
                <th>{"Transa\u00e7\u00e3o"}</th>
                <th>{"Cadastro"}</th>
              </tr>
            </thead>

            <tbody>
              {projetos.map((projeto) => (
                <tr key={projeto.id}>
                  <td>{projeto.idProjetoBlockchain ?? "N\u00e3o capturado"}</td>

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
                      <span>{"N\u00e3o dispon\u00edvel"}</span>
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