/**
 * @file RegistroProjetosCarbono.test.ts
 * @author Patrício Alves
 * @notice Testes automatizados do contrato RegistroProjetosCarbono.
 *
 * @dev
 * Este arquivo testa o cadastro, controle de estado, cobrança de emolumento
 * e validação básica de projetos ambientais no protocolo CarbonLedger.
 *
 * Contratos envolvidos no teste:
 *
 * 1. TokenImpactoCarbono;
 * 2. TesourariaCarbono;
 * 3. RegistroOrganizacoes;
 * 4. RegistroProjetosCarbono.
 *
 * Testes contemplados:
 *
 * 1. Implantação correta do contrato;
 * 2. Cadastro de projeto por proponente ativo;
 * 3. Cobrança da taxa de submissão;
 * 4. Bloqueio de cadastro por não proponente;
 * 5. Bloqueio por taxa insuficiente;
 * 6. Bloqueio de projeto duplicado;
 * 7. Alteração de taxa e prazo;
 * 8. Autorização de contrato externo;
 * 9. Marcação do projeto como EmVotacao;
 * 10. Registro de aprovação;
 * 11. Registro de rejeição;
 * 12. Reenvio de projeto rejeitado;
 * 13. Marcação de créditos emitidos;
 * 14. Suspensão e revogação de projeto.
 */

import { expect } from "chai";
import { network } from "hardhat";

/**
 * @dev
 * Conecta o ambiente Hardhat 3 e disponibiliza o ethers.
 */
const { ethers } = await network.connect();

describe("RegistroProjetosCarbono", function () {
  /**
   * @notice Enum auxiliar do contrato RegistroOrganizacoes.
   */
  const TipoOrganizacao = {
    Nenhum: 0,
    Proponente: 1,
    Validador: 2,
    Comprador: 3,
    Administrador: 4,
  };

  /**
   * @notice Enum auxiliar do contrato RegistroProjetosCarbono.
   */
  const TipoProjeto = {
    Solar: 0,
    Eolico: 1,
    Reflorestamento: 2,
    ConservacaoFlorestal: 3,
    Biodigestor: 4,
    EficienciaEnergetica: 5,
    Reciclagem: 6,
    Outro: 7,
  };

  /**
   * @notice Enum auxiliar dos estados do projeto.
   */
  const EstadoProjeto = {
    Rascunho: 0,
    Submetido: 1,
    EmVotacao: 2,
    Aprovado: 3,
    Rejeitado: 4,
    Emitido: 5,
    Suspenso: 6,
    Revogado: 7,
  };

  /**
   * @notice Implanta os contratos necessários para testar RegistroProjetosCarbono.
   *
   * @dev
   * O RegistroProjetosCarbono depende de:
   *
   * - RegistroOrganizacoes;
   * - TesourariaCarbono.
   *
   * A TesourariaCarbono, por sua vez, depende do TokenImpactoCarbono.
   */
  async function implantarAmbienteProjetos() {
    const [
      dono,
      proponente,
      validador,
      comprador,
      usuarioComum,
      contratoAutorizado,
    ] = await ethers.getSigners();

    /**
     * @dev
     * Implanta o token TIC.
     */
    const suprimentoInicial = ethers.parseUnits("1000000", 18);

    const TokenImpactoCarbono = await ethers.getContractFactory(
      "TokenImpactoCarbono"
    );

    const token = await TokenImpactoCarbono.deploy(suprimentoInicial);

    /**
     * @dev
     * Implanta a tesouraria.
     */
    const TesourariaCarbono = await ethers.getContractFactory(
      "TesourariaCarbono"
    );

    const tesouraria = await TesourariaCarbono.deploy(
      await token.getAddress()
    );

    /**
     * @dev
     * Implanta o registro de organizações.
     */
    const RegistroOrganizacoes = await ethers.getContractFactory(
      "RegistroOrganizacoes"
    );

    const registroOrganizacoes = await RegistroOrganizacoes.deploy();

    /**
     * @dev
     * Implanta o registro de projetos.
     */
    const RegistroProjetosCarbono = await ethers.getContractFactory(
      "RegistroProjetosCarbono"
    );

    const registroProjetos = await RegistroProjetosCarbono.deploy(
      await registroOrganizacoes.getAddress(),
      await tesouraria.getAddress()
    );

    /**
     * @dev
     * Cadastra os agentes básicos do teste.
     */
    await registroOrganizacoes.cadastrarOrganizacao(
      proponente.address,
      "Usina Solar Boa Energia",
      "CNPJ-001",
      "ipfs://carbonledger/organizacao-proponente.json",
      TipoOrganizacao.Proponente
    );

    await registroOrganizacoes.cadastrarOrganizacao(
      validador.address,
      "Validador Ambiental",
      "VAL-001",
      "ipfs://carbonledger/organizacao-validador.json",
      TipoOrganizacao.Validador
    );

    await registroOrganizacoes.cadastrarOrganizacao(
      comprador.address,
      "Comprador Industrial",
      "COMP-001",
      "ipfs://carbonledger/organizacao-comprador.json",
      TipoOrganizacao.Comprador
    );

    return {
      token,
      tesouraria,
      registroOrganizacoes,
      registroProjetos,
      dono,
      proponente,
      validador,
      comprador,
      usuarioComum,
      contratoAutorizado,
    };
  }

  /**
   * @notice Dados padrão usados para cadastrar projeto.
   */
  function dadosProjetoPadrao() {
    return {
      nomeProjeto: "Projeto Solar Ceara 2026",
      descricao: "Usina solar para geracao renovavel e reducao de emissoes",
      localizacao: "Fortaleza, Ceara, Brasil",
      tipoProjeto: TipoProjeto.Solar,
      creditosSolicitados: 7000,
      uriEvidencias: "ipfs://carbonledger/projeto-solar-2026.json",
      inicioPeriodoReferencia: 1767225600, // 2026-01-01
      fimPeriodoReferencia: 1798761600, // 2027-01-01
    };
  }

  /**
   * @notice Função auxiliar para cadastrar um projeto padrão.
   */
  async function cadastrarProjetoPadrao() {
    const ambiente = await implantarAmbienteProjetos();
    const dados = dadosProjetoPadrao();
    const taxa = await ambiente.registroProjetos.taxaSubmissaoProjeto();

    await ambiente.registroProjetos.connect(ambiente.proponente).cadastrarProjeto(
      dados.nomeProjeto,
      dados.descricao,
      dados.localizacao,
      dados.tipoProjeto,
      dados.creditosSolicitados,
      dados.uriEvidencias,
      dados.inicioPeriodoReferencia,
      dados.fimPeriodoReferencia,
      { value: taxa }
    );

    return {
      ...ambiente,
      dados,
      taxa,
      idProjeto: 1,
    };
  }

  /**
   * @notice Verifica se o contrato é implantado com endereços e parâmetros corretos.
   */
  it("Deve implantar com registros e tesouraria corretos", async function () {
    const { registroProjetos, registroOrganizacoes, tesouraria, dono } =
      await implantarAmbienteProjetos();

    expect(await registroProjetos.owner()).to.equal(dono.address);

    expect(await registroProjetos.registroOrganizacoes()).to.equal(
      await registroOrganizacoes.getAddress()
    );

    expect(await registroProjetos.tesourariaCarbono()).to.equal(
      await tesouraria.getAddress()
    );

    expect(await registroProjetos.totalProjetos()).to.equal(0n);
    expect(await registroProjetos.taxaSubmissaoProjeto()).to.equal(
      ethers.parseEther("0.001")
    );
    expect(await registroProjetos.prazoReenvioProjeto()).to.equal(30n * 24n * 60n * 60n);
  });

  /**
   * @notice Verifica bloqueio de implantação com RegistroOrganizacoes inválido.
   */
  it("Nao deve implantar com RegistroOrganizacoes invalido", async function () {
    const { tesouraria } = await implantarAmbienteProjetos();

    const RegistroProjetosCarbono = await ethers.getContractFactory(
      "RegistroProjetosCarbono"
    );

    await expect(
      RegistroProjetosCarbono.deploy(
        ethers.ZeroAddress,
        await tesouraria.getAddress()
      )
    ).to.be.revertedWith("Registro organizacoes invalido");
  });

  /**
   * @notice Verifica bloqueio de implantação com Tesouraria inválida.
   */
  it("Nao deve implantar com Tesouraria invalida", async function () {
    const { registroOrganizacoes } = await implantarAmbienteProjetos();

    const RegistroProjetosCarbono = await ethers.getContractFactory(
      "RegistroProjetosCarbono"
    );

    await expect(
      RegistroProjetosCarbono.deploy(
        await registroOrganizacoes.getAddress(),
        ethers.ZeroAddress
      )
    ).to.be.revertedWith("Tesouraria invalida");
  });

  /**
   * @notice Verifica se um proponente ativo consegue cadastrar projeto.
   */
  it("Deve cadastrar projeto por proponente ativo", async function () {
    const { registroProjetos, tesouraria, proponente, dados, taxa, idProjeto } =
      await cadastrarProjetoPadrao();

    expect(await registroProjetos.totalProjetos()).to.equal(1n);

    const projeto = await registroProjetos.projetos(idProjeto);

    expect(projeto.idProjeto).to.equal(idProjeto);
    expect(projeto.proponente).to.equal(proponente.address);
    expect(projeto.nomeProjeto).to.equal(dados.nomeProjeto);
    expect(projeto.descricao).to.equal(dados.descricao);
    expect(projeto.localizacao).to.equal(dados.localizacao);
    expect(projeto.tipoProjeto).to.equal(dados.tipoProjeto);
    expect(projeto.creditosSolicitados).to.equal(dados.creditosSolicitados);
    expect(projeto.creditosAprovados).to.equal(0n);
    expect(projeto.uriEvidencias).to.equal(dados.uriEvidencias);
    expect(projeto.estadoProjeto).to.equal(EstadoProjeto.Submetido);
    expect(projeto.inicioPeriodoReferencia).to.equal(
      dados.inicioPeriodoReferencia
    );
    expect(projeto.fimPeriodoReferencia).to.equal(dados.fimPeriodoReferencia);
    expect(projeto.dataSubmissao).to.be.greaterThan(0n);

    /**
     * @dev
     * Confere se a taxa foi enviada para a tesouraria.
     */
    expect(await tesouraria.saldoETH()).to.equal(taxa);
    expect(await tesouraria.totalETHRecebido()).to.equal(taxa);
  });

  /**
   * @notice Verifica se usuário não proponente não consegue cadastrar projeto.
   */
  it("Nao deve permitir cadastro por usuario nao proponente", async function () {
    const { registroProjetos, usuarioComum } = await implantarAmbienteProjetos();
    const dados = dadosProjetoPadrao();
    const taxa = await registroProjetos.taxaSubmissaoProjeto();

    await expect(
      registroProjetos.connect(usuarioComum).cadastrarProjeto(
        dados.nomeProjeto,
        dados.descricao,
        dados.localizacao,
        dados.tipoProjeto,
        dados.creditosSolicitados,
        dados.uriEvidencias,
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("Somente proponente ativo");
  });

  /**
   * @notice Verifica bloqueio de taxa insuficiente.
   */
  it("Nao deve permitir cadastro com taxa insuficiente", async function () {
    const { registroProjetos, proponente } = await implantarAmbienteProjetos();
    const dados = dadosProjetoPadrao();

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        dados.nomeProjeto,
        dados.descricao,
        dados.localizacao,
        dados.tipoProjeto,
        dados.creditosSolicitados,
        dados.uriEvidencias,
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: ethers.parseEther("0.0001") }
      )
    ).to.be.revertedWith("Taxa insuficiente");
  });

  /**
   * @notice Verifica bloqueio de campos obrigatórios.
   */
  it("Nao deve permitir cadastro com campos obrigatorios vazios ou invalidos", async function () {
    const { registroProjetos, proponente } = await implantarAmbienteProjetos();
    const dados = dadosProjetoPadrao();
    const taxa = await registroProjetos.taxaSubmissaoProjeto();

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        "",
        dados.descricao,
        dados.localizacao,
        dados.tipoProjeto,
        dados.creditosSolicitados,
        dados.uriEvidencias,
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("Nome obrigatorio");

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        dados.nomeProjeto,
        "",
        dados.localizacao,
        dados.tipoProjeto,
        dados.creditosSolicitados,
        dados.uriEvidencias,
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("Descricao obrigatoria");

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        dados.nomeProjeto,
        dados.descricao,
        "",
        dados.tipoProjeto,
        dados.creditosSolicitados,
        dados.uriEvidencias,
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("Localizacao obrigatoria");

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        dados.nomeProjeto,
        dados.descricao,
        dados.localizacao,
        dados.tipoProjeto,
        dados.creditosSolicitados,
        "",
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("URI obrigatoria");

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        dados.nomeProjeto,
        dados.descricao,
        dados.localizacao,
        dados.tipoProjeto,
        0,
        dados.uriEvidencias,
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("Creditos invalidos");

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        dados.nomeProjeto,
        dados.descricao,
        dados.localizacao,
        dados.tipoProjeto,
        dados.creditosSolicitados,
        dados.uriEvidencias,
        dados.fimPeriodoReferencia,
        dados.inicioPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("Periodo invalido");
  });

  /**
   * @notice Verifica se o contrato impede duplicidade do mesmo projeto.
   */
  it("Nao deve permitir projeto duplicado", async function () {
    const { registroProjetos, proponente, dados, taxa } =
      await cadastrarProjetoPadrao();

    await expect(
      registroProjetos.connect(proponente).cadastrarProjeto(
        dados.nomeProjeto,
        dados.descricao,
        dados.localizacao,
        dados.tipoProjeto,
        dados.creditosSolicitados,
        "ipfs://carbonledger/outra-uri.json",
        dados.inicioPeriodoReferencia,
        dados.fimPeriodoReferencia,
        { value: taxa }
      )
    ).to.be.revertedWith("Projeto ja cadastrado");
  });

  /**
   * @notice Verifica alteração da taxa de submissão.
   */
  it("Deve alterar taxa de submissao", async function () {
    const { registroProjetos } = await implantarAmbienteProjetos();

    const novaTaxa = ethers.parseEther("0.002");

    await registroProjetos.alterarTaxaSubmissaoProjeto(novaTaxa);

    expect(await registroProjetos.taxaSubmissaoProjeto()).to.equal(novaTaxa);
  });

  /**
   * @notice Verifica alteração do prazo de reenvio.
   */
  it("Deve alterar prazo de reenvio", async function () {
    const { registroProjetos } = await implantarAmbienteProjetos();

    await registroProjetos.alterarPrazoReenvioProjeto(0);

    expect(await registroProjetos.prazoReenvioProjeto()).to.equal(0n);
  });

  /**
   * @notice Verifica se usuário comum não altera parâmetros administrativos.
   */
  it("Nao deve permitir que usuario comum altere parametros", async function () {
    const { registroProjetos, usuarioComum } = await implantarAmbienteProjetos();

    await expect(
      registroProjetos
        .connect(usuarioComum)
        .alterarTaxaSubmissaoProjeto(ethers.parseEther("0.002"))
    )
      .to.be.revertedWithCustomError(registroProjetos, "OwnableUnauthorizedAccount")
      .withArgs(usuarioComum.address);

    await expect(
      registroProjetos.connect(usuarioComum).alterarPrazoReenvioProjeto(0)
    )
      .to.be.revertedWithCustomError(registroProjetos, "OwnableUnauthorizedAccount")
      .withArgs(usuarioComum.address);
  });

  /**
   * @notice Verifica autorização de contrato externo.
   */
  it("Deve autorizar contrato externo", async function () {
    const { registroProjetos, contratoAutorizado } =
      await implantarAmbienteProjetos();

    await registroProjetos.autorizarContrato(contratoAutorizado.address, true);

    expect(
      await registroProjetos.contratosAutorizados(contratoAutorizado.address)
    ).to.equal(true);
  });

  /**
   * @notice Verifica marcação do projeto como EmVotacao por contrato autorizado.
   */
  it("Deve marcar projeto como EmVotacao", async function () {
    const { registroProjetos, contratoAutorizado, idProjeto } =
      await cadastrarProjetoPadrao();

    await registroProjetos.autorizarContrato(contratoAutorizado.address, true);

    await registroProjetos
      .connect(contratoAutorizado)
      .marcarEmVotacao(idProjeto);

    expect(await registroProjetos.obterEstadoProjeto(idProjeto)).to.equal(
      EstadoProjeto.EmVotacao
    );
  });

  /**
   * @notice Verifica bloqueio de marcação EmVotacao por não autorizado.
   */
  it("Nao deve marcar EmVotacao por endereco nao autorizado", async function () {
    const { registroProjetos, usuarioComum, idProjeto } =
      await cadastrarProjetoPadrao();

    await expect(
      registroProjetos.connect(usuarioComum).marcarEmVotacao(idProjeto)
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  /**
   * @notice Verifica aprovação de projeto por contrato autorizado.
   */
  it("Deve registrar aprovacao de projeto", async function () {
    const { registroProjetos, contratoAutorizado, idProjeto } =
      await cadastrarProjetoPadrao();

    await registroProjetos.autorizarContrato(contratoAutorizado.address, true);

    await registroProjetos
      .connect(contratoAutorizado)
      .marcarEmVotacao(idProjeto);

    await registroProjetos
      .connect(contratoAutorizado)
      .registrarResultadoValidacao(idProjeto, true, 6000);

    const projeto = await registroProjetos.projetos(idProjeto);

    expect(projeto.estadoProjeto).to.equal(EstadoProjeto.Aprovado);
    expect(projeto.creditosAprovados).to.equal(6000n);
    expect(await registroProjetos.projetoAprovado(idProjeto)).to.equal(true);
  });

  /**
   * @notice Verifica bloqueio de aprovação acima do solicitado.
   */
  it("Nao deve aprovar creditos acima do solicitado", async function () {
    const { registroProjetos, contratoAutorizado, idProjeto } =
      await cadastrarProjetoPadrao();

    await registroProjetos.autorizarContrato(contratoAutorizado.address, true);

    await registroProjetos
      .connect(contratoAutorizado)
      .marcarEmVotacao(idProjeto);

    await expect(
      registroProjetos
        .connect(contratoAutorizado)
        .registrarResultadoValidacao(idProjeto, true, 8000)
    ).to.be.revertedWith("Aprovado acima do solicitado");
  });

  /**
   * @notice Verifica rejeição de projeto por contrato autorizado.
   */
  it("Deve registrar rejeicao de projeto", async function () {
    const { registroProjetos, contratoAutorizado, idProjeto } =
      await cadastrarProjetoPadrao();

    await registroProjetos.autorizarContrato(contratoAutorizado.address, true);

    await registroProjetos
      .connect(contratoAutorizado)
      .marcarEmVotacao(idProjeto);

    await registroProjetos
      .connect(contratoAutorizado)
      .registrarResultadoValidacao(idProjeto, false, 0);

    const projeto = await registroProjetos.projetos(idProjeto);

    expect(projeto.estadoProjeto).to.equal(EstadoProjeto.Rejeitado);
    expect(projeto.creditosAprovados).to.equal(0n);
    expect(projeto.dataUltimaRejeicao).to.be.greaterThan(0n);
  });

  /**
   * @notice Verifica reenvio de projeto rejeitado.
   */
  it("Deve reenviar projeto rejeitado apos prazo configurado", async function () {
    const { registroProjetos, contratoAutorizado, proponente, taxa, idProjeto } =
      await cadastrarProjetoPadrao();

    await registroProjetos.autorizarContrato(contratoAutorizado.address, true);

    await registroProjetos
      .connect(contratoAutorizado)
      .marcarEmVotacao(idProjeto);

    await registroProjetos
      .connect(contratoAutorizado)
      .registrarResultadoValidacao(idProjeto, false, 0);

    /**
     * @dev
     * Para simplificar o teste, o prazo é reduzido para zero.
     */
    await registroProjetos.alterarPrazoReenvioProjeto(0);

    await registroProjetos.connect(proponente).reenviarProjeto(
      idProjeto,
      "Descricao corrigida com novas evidencias",
      6500,
      "ipfs://carbonledger/projeto-reenviado.json",
      { value: taxa }
    );

    const projeto = await registroProjetos.projetos(idProjeto);

    expect(projeto.estadoProjeto).to.equal(EstadoProjeto.Submetido);
    expect(projeto.creditosSolicitados).to.equal(6500n);
    expect(projeto.creditosAprovados).to.equal(0n);
    expect(projeto.uriEvidencias).to.equal(
      "ipfs://carbonledger/projeto-reenviado.json"
    );
  });

  /**
   * @notice Verifica marcação de créditos emitidos.
   */
  it("Deve marcar creditos como emitidos", async function () {
    const { registroProjetos, contratoAutorizado, idProjeto } =
      await cadastrarProjetoPadrao();

    await registroProjetos.autorizarContrato(contratoAutorizado.address, true);

    await registroProjetos
      .connect(contratoAutorizado)
      .marcarEmVotacao(idProjeto);

    await registroProjetos
      .connect(contratoAutorizado)
      .registrarResultadoValidacao(idProjeto, true, 6000);

    await registroProjetos
      .connect(contratoAutorizado)
      .marcarCreditosEmitidos(idProjeto);

    expect(await registroProjetos.obterEstadoProjeto(idProjeto)).to.equal(
      EstadoProjeto.Emitido
    );

    expect(await registroProjetos.projetoEmitido(idProjeto)).to.equal(true);
  });

  /**
   * @notice Verifica suspensão de projeto.
   */
  it("Deve suspender projeto", async function () {
    const { registroProjetos, idProjeto } = await cadastrarProjetoPadrao();

    await registroProjetos.suspenderProjeto(idProjeto);

    expect(await registroProjetos.obterEstadoProjeto(idProjeto)).to.equal(
      EstadoProjeto.Suspenso
    );
  });

  /**
   * @notice Verifica revogação de projeto.
   */
  it("Deve revogar projeto", async function () {
    const { registroProjetos, idProjeto } = await cadastrarProjetoPadrao();

    await registroProjetos.revogarProjeto(idProjeto);

    expect(await registroProjetos.obterEstadoProjeto(idProjeto)).to.equal(
      EstadoProjeto.Revogado
    );
  });
});