/**
 * @file RegistroOrganizacoes.test.ts
 * @author Patrício Alves
 * @notice Testes automatizados do contrato RegistroOrganizacoes.
 *
 * @dev
 * Este arquivo testa a camada cadastral do protocolo CarbonLedger.
 *
 * O contrato RegistroOrganizacoes é responsável por cadastrar e controlar
 * os agentes do sistema:
 *
 * 1. Proponentes;
 * 2. Validadores;
 * 3. Compradores;
 * 4. Administradores.
 *
 * Testes contemplados:
 *
 * 1. Implantação do contrato;
 * 2. Cadastro de organização;
 * 3. Bloqueio de carteira inválida;
 * 4. Bloqueio de cadastro duplicado;
 * 5. Bloqueio de tipo inválido;
 * 6. Bloqueio de cadastro por usuário não autorizado;
 * 7. Atualização de organização;
 * 8. Ativação e desativação;
 * 9. Verificação dos papéis cadastrais;
 * 10. Consulta de carteiras cadastradas.
 */

import { expect } from "chai";
import { network } from "hardhat";

/**
 * @dev
 * Conecta o ambiente de testes do Hardhat 3 e disponibiliza o ethers.
 */
const { ethers } = await network.connect();

/**
 * @title Testes do contrato RegistroOrganizacoes
 *
 * @dev
 * Este conjunto de testes valida a lógica cadastral do protocolo.
 */
describe("RegistroOrganizacoes", function () {
  /**
   * @notice Enum auxiliar usado nos testes.
   *
   * @dev
   * Os valores devem seguir a mesma ordem definida no contrato Solidity:
   *
   * Nenhum = 0
   * Proponente = 1
   * Validador = 2
   * Comprador = 3
   * Administrador = 4
   */
  const TipoOrganizacao = {
    Nenhum: 0,
    Proponente: 1,
    Validador: 2,
    Comprador: 3,
    Administrador: 4,
  };

  /**
   * @notice Implanta uma instância limpa do contrato para cada teste.
   *
   * @dev
   * Essa função evita repetição de código nos testes.
   *
   * @return registro Contrato RegistroOrganizacoes implantado.
   * @return dono Conta que implantou o contrato.
   * @return proponente Conta usada como proponente.
   * @return validador Conta usada como validador.
   * @return comprador Conta usada como comprador.
   * @return usuarioComum Conta sem permissão administrativa.
   */
  async function implantarRegistroOrganizacoes() {
    /**
     * @dev
     * Obtém contas locais da rede de teste do Hardhat.
     */
    const [dono, proponente, validador, comprador, usuarioComum] =
      await ethers.getSigners();

    /**
     * @dev
     * Obtém a fábrica do contrato RegistroOrganizacoes.
     */
    const RegistroOrganizacoes = await ethers.getContractFactory(
      "RegistroOrganizacoes"
    );

    /**
     * @dev
     * Implanta o contrato.
     */
    const registro = await RegistroOrganizacoes.deploy();

    return {
      registro,
      dono,
      proponente,
      validador,
      comprador,
      usuarioComum,
    };
  }

  /**
   * @notice Verifica se o contrato é implantado corretamente.
   */
  it("Deve implantar o contrato com owner correto", async function () {
    const { registro, dono } = await implantarRegistroOrganizacoes();

    expect(await registro.owner()).to.equal(dono.address);
    expect(await registro.totalOrganizacoes()).to.equal(0n);
    expect(await registro.quantidadeCarteirasCadastradas()).to.equal(0n);
  });

  /**
   * @notice Verifica se o dono consegue cadastrar uma organização proponente.
   */
  it("Deve cadastrar uma organizacao proponente", async function () {
    const { registro, proponente } = await implantarRegistroOrganizacoes();

    const nome = "Usina Solar Boa Energia";
    const documento = "CNPJ-001";
    const uriDocumentos = "ipfs://carbonledger/organizacao-1.json";

    await registro.cadastrarOrganizacao(
      proponente.address,
      nome,
      documento,
      uriDocumentos,
      TipoOrganizacao.Proponente
    );

    /**
     * @dev
     * Confere contadores.
     */
    expect(await registro.totalOrganizacoes()).to.equal(1n);
    expect(await registro.quantidadeCarteirasCadastradas()).to.equal(1n);

    /**
     * @dev
     * Confere se a carteira foi marcada como cadastrada.
     */
    expect(await registro.organizacaoCadastrada(proponente.address)).to.equal(
      true
    );

    /**
     * @dev
     * Confere os dados cadastrados.
     */
    const organizacao = await registro.organizacoes(proponente.address);

    expect(organizacao.carteira).to.equal(proponente.address);
    expect(organizacao.nome).to.equal(nome);
    expect(organizacao.documento).to.equal(documento);
    expect(organizacao.uriDocumentos).to.equal(uriDocumentos);
    expect(organizacao.tipoOrganizacao).to.equal(TipoOrganizacao.Proponente);
    expect(organizacao.ativa).to.equal(true);
    expect(organizacao.dataCadastro).to.be.greaterThan(0n);
    expect(organizacao.dataAtualizacao).to.be.greaterThan(0n);

    /**
     * @dev
     * Confere a função auxiliar de papel cadastral.
     */
    expect(await registro.ehProponente(proponente.address)).to.equal(true);
    expect(await registro.ehValidador(proponente.address)).to.equal(false);
    expect(await registro.ehComprador(proponente.address)).to.equal(false);
  });

  /**
   * @notice Verifica se o contrato bloqueia cadastro para endereço zero.
   */
  it("Nao deve permitir cadastro com carteira invalida", async function () {
    const { registro } = await implantarRegistroOrganizacoes();

    await expect(
      registro.cadastrarOrganizacao(
        ethers.ZeroAddress,
        "Organizacao Invalida",
        "DOC-000",
        "ipfs://carbonledger/invalido.json",
        TipoOrganizacao.Proponente
      )
    ).to.be.revertedWith("Carteira invalida");
  });

  /**
   * @notice Verifica se o contrato bloqueia cadastro com nome vazio.
   */
  it("Nao deve permitir cadastro com nome vazio", async function () {
    const { registro, proponente } = await implantarRegistroOrganizacoes();

    await expect(
      registro.cadastrarOrganizacao(
        proponente.address,
        "",
        "DOC-001",
        "ipfs://carbonledger/organizacao-1.json",
        TipoOrganizacao.Proponente
      )
    ).to.be.revertedWith("Nome obrigatorio");
  });

  /**
   * @notice Verifica se o contrato bloqueia cadastro com tipo Nenhum.
   */
  it("Nao deve permitir cadastro com tipo invalido", async function () {
    const { registro, proponente } = await implantarRegistroOrganizacoes();

    await expect(
      registro.cadastrarOrganizacao(
        proponente.address,
        "Organizacao Sem Tipo",
        "DOC-001",
        "ipfs://carbonledger/organizacao-1.json",
        TipoOrganizacao.Nenhum
      )
    ).to.be.revertedWith("Tipo invalido");
  });

  /**
   * @notice Verifica se o contrato impede cadastro duplicado.
   */
  it("Nao deve permitir cadastro duplicado da mesma carteira", async function () {
    const { registro, proponente } = await implantarRegistroOrganizacoes();

    await registro.cadastrarOrganizacao(
      proponente.address,
      "Usina Solar Boa Energia",
      "CNPJ-001",
      "ipfs://carbonledger/organizacao-1.json",
      TipoOrganizacao.Proponente
    );

    await expect(
      registro.cadastrarOrganizacao(
        proponente.address,
        "Usina Solar Boa Energia Repetida",
        "CNPJ-001",
        "ipfs://carbonledger/organizacao-1b.json",
        TipoOrganizacao.Proponente
      )
    ).to.be.revertedWith("Organizacao ja cadastrada");
  });

  /**
   * @notice Verifica se usuário comum não consegue cadastrar organização.
   *
   * @dev
   * A função cadastrarOrganizacao é protegida por onlyOwner.
   */
  it("Nao deve permitir cadastro por usuario comum", async function () {
    const { registro, proponente, usuarioComum } =
      await implantarRegistroOrganizacoes();

    await expect(
      registro
        .connect(usuarioComum)
        .cadastrarOrganizacao(
          proponente.address,
          "Usina Solar Boa Energia",
          "CNPJ-001",
          "ipfs://carbonledger/organizacao-1.json",
          TipoOrganizacao.Proponente
        )
    )
      .to.be.revertedWithCustomError(registro, "OwnableUnauthorizedAccount")
      .withArgs(usuarioComum.address);
  });

  /**
   * @notice Verifica se o dono consegue atualizar uma organização.
   */
  it("Deve atualizar uma organizacao cadastrada", async function () {
    const { registro, proponente } = await implantarRegistroOrganizacoes();

    await registro.cadastrarOrganizacao(
      proponente.address,
      "Usina Solar Boa Energia",
      "CNPJ-001",
      "ipfs://carbonledger/organizacao-1.json",
      TipoOrganizacao.Proponente
    );

    await registro.atualizarOrganizacao(
      proponente.address,
      "Compradora Verde Ltda",
      "CNPJ-002",
      "ipfs://carbonledger/organizacao-2.json",
      TipoOrganizacao.Comprador
    );

    const organizacao = await registro.organizacoes(proponente.address);

    expect(organizacao.nome).to.equal("Compradora Verde Ltda");
    expect(organizacao.documento).to.equal("CNPJ-002");
    expect(organizacao.uriDocumentos).to.equal(
      "ipfs://carbonledger/organizacao-2.json"
    );
    expect(organizacao.tipoOrganizacao).to.equal(TipoOrganizacao.Comprador);

    /**
     * @dev
     * Depois da atualização, a carteira deixa de ser proponente
     * e passa a ser compradora.
     */
    expect(await registro.ehProponente(proponente.address)).to.equal(false);
    expect(await registro.ehComprador(proponente.address)).to.equal(true);
  });

  /**
   * @notice Verifica se não é possível atualizar organização inexistente.
   */
  it("Nao deve permitir atualizar organizacao inexistente", async function () {
    const { registro, proponente } = await implantarRegistroOrganizacoes();

    await expect(
      registro.atualizarOrganizacao(
        proponente.address,
        "Organizacao Inexistente",
        "DOC-000",
        "ipfs://carbonledger/inexistente.json",
        TipoOrganizacao.Proponente
      )
    ).to.be.revertedWith("Organizacao inexistente");
  });

  /**
   * @notice Verifica se é possível desativar uma organização.
   */
  it("Deve desativar uma organizacao", async function () {
    const { registro, validador } = await implantarRegistroOrganizacoes();

    await registro.cadastrarOrganizacao(
      validador.address,
      "Validador Tecnico Ambiental",
      "VAL-001",
      "ipfs://carbonledger/validador-1.json",
      TipoOrganizacao.Validador
    );

    expect(await registro.ehValidador(validador.address)).to.equal(true);
    expect(await registro.organizacaoAtiva(validador.address)).to.equal(true);

    await registro.desativarOrganizacao(validador.address);

    expect(await registro.ehValidador(validador.address)).to.equal(false);
    expect(await registro.organizacaoAtiva(validador.address)).to.equal(false);
  });

  /**
   * @notice Verifica se é possível reativar uma organização.
   */
  it("Deve reativar uma organizacao", async function () {
    const { registro, comprador } = await implantarRegistroOrganizacoes();

    await registro.cadastrarOrganizacao(
      comprador.address,
      "Comprador Carbono Neutro",
      "COM-001",
      "ipfs://carbonledger/comprador-1.json",
      TipoOrganizacao.Comprador
    );

    await registro.desativarOrganizacao(comprador.address);

    expect(await registro.ehComprador(comprador.address)).to.equal(false);

    await registro.ativarOrganizacao(comprador.address);

    expect(await registro.ehComprador(comprador.address)).to.equal(true);
    expect(await registro.organizacaoAtiva(comprador.address)).to.equal(true);
  });

  /**
   * @notice Verifica se o contrato identifica corretamente cada tipo de organização.
   */
  it("Deve identificar corretamente proponente, validador, comprador e administrador", async function () {
    const { registro, proponente, validador, comprador, usuarioComum } =
      await implantarRegistroOrganizacoes();

    await registro.cadastrarOrganizacao(
      proponente.address,
      "Projeto Solar",
      "PROP-001",
      "ipfs://carbonledger/proponente.json",
      TipoOrganizacao.Proponente
    );

    await registro.cadastrarOrganizacao(
      validador.address,
      "Validador Ambiental",
      "VAL-001",
      "ipfs://carbonledger/validador.json",
      TipoOrganizacao.Validador
    );

    await registro.cadastrarOrganizacao(
      comprador.address,
      "Comprador Industrial",
      "COMP-001",
      "ipfs://carbonledger/comprador.json",
      TipoOrganizacao.Comprador
    );

    await registro.cadastrarOrganizacao(
      usuarioComum.address,
      "Administrador do Protocolo",
      "ADM-001",
      "ipfs://carbonledger/administrador.json",
      TipoOrganizacao.Administrador
    );

    expect(await registro.ehProponente(proponente.address)).to.equal(true);
    expect(await registro.ehValidador(validador.address)).to.equal(true);
    expect(await registro.ehComprador(comprador.address)).to.equal(true);
    expect(await registro.ehAdministrador(usuarioComum.address)).to.equal(true);
  });

  /**
   * @notice Verifica se a função obterTipoOrganizacao retorna o tipo correto.
   */
  it("Deve retornar o tipo da organizacao", async function () {
    const { registro, comprador } = await implantarRegistroOrganizacoes();

    await registro.cadastrarOrganizacao(
      comprador.address,
      "Comprador Industrial",
      "COMP-001",
      "ipfs://carbonledger/comprador.json",
      TipoOrganizacao.Comprador
    );

    expect(await registro.obterTipoOrganizacao(comprador.address)).to.equal(
      TipoOrganizacao.Comprador
    );
  });

  /**
   * @notice Verifica se obterTipoOrganizacao falha para carteira inexistente.
   */
  it("Nao deve retornar tipo de organizacao inexistente", async function () {
    const { registro, comprador } = await implantarRegistroOrganizacoes();

    await expect(
      registro.obterTipoOrganizacao(comprador.address)
    ).to.be.revertedWith("Organizacao inexistente");
  });

  /**
   * @notice Verifica se a lista de carteiras cadastradas funciona corretamente.
   */
  it("Deve listar carteiras cadastradas por indice", async function () {
    const { registro, proponente, validador, comprador } =
      await implantarRegistroOrganizacoes();

    await registro.cadastrarOrganizacao(
      proponente.address,
      "Projeto Solar",
      "PROP-001",
      "ipfs://carbonledger/proponente.json",
      TipoOrganizacao.Proponente
    );

    await registro.cadastrarOrganizacao(
      validador.address,
      "Validador Ambiental",
      "VAL-001",
      "ipfs://carbonledger/validador.json",
      TipoOrganizacao.Validador
    );

    await registro.cadastrarOrganizacao(
      comprador.address,
      "Comprador Industrial",
      "COMP-001",
      "ipfs://carbonledger/comprador.json",
      TipoOrganizacao.Comprador
    );

    expect(await registro.quantidadeCarteirasCadastradas()).to.equal(3n);
    expect(await registro.obterCarteiraPorIndice(0)).to.equal(
      proponente.address
    );
    expect(await registro.obterCarteiraPorIndice(1)).to.equal(
      validador.address
    );
    expect(await registro.obterCarteiraPorIndice(2)).to.equal(
      comprador.address
    );
  });

  /**
   * @notice Verifica se o contrato bloqueia consulta por índice inválido.
   */
  it("Nao deve permitir consulta por indice invalido", async function () {
    const { registro } = await implantarRegistroOrganizacoes();

    await expect(registro.obterCarteiraPorIndice(0)).to.be.revertedWith(
      "Indice invalido"
    );
  });
});
