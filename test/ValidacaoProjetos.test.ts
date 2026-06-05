/**
 * @file ValidacaoProjetos.test.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Testes automatizados do contrato ValidacaoProjetos.
 *
 * @dev
 * Este arquivo testa o fluxo de votação técnica dos projetos ambientais
 * no protocolo CarbonLedger.
 *
 * Contratos envolvidos:
 *
 * 1. TokenImpactoCarbono;
 * 2. TesourariaCarbono;
 * 3. RegistroOrganizacoes;
 * 4. RegistroProjetosCarbono;
 * 5. ValidacaoProjetos.
 *
 * Testes contemplados:
 *
 * 1. Implantação correta;
 * 2. Início de votação por validador apto;
 * 3. Bloqueio de votação por não validador;
 * 4. Registro de votos de aprovação;
 * 5. Registro de votos de rejeição;
 * 6. Bloqueio de voto duplicado;
 * 7. Encerramento de votação com aprovação;
 * 8. Encerramento de votação com rejeição;
 * 9. Bloqueio de encerramento antes do prazo;
 * 10. Alteração de parâmetros administrativos.
 */

import { expect } from "chai";
import { network } from "hardhat";

/**
 * @dev
 * Conecta o ambiente Hardhat 3 e disponibiliza o ethers.
 *
 * Observação:
 * O Hardhat 3 pode emitir aviso de depreciação sobre network.connect().
 * Esse aviso não impede a execução dos testes.
 */
const { ethers } = await network.connect();

describe("ValidacaoProjetos", function () {
  const TipoOrganizacao = {
    Nenhum: 0,
    Proponente: 1,
    Validador: 2,
    Comprador: 3,
    Administrador: 4,
  };

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

  const EstadoProjeto = {
    Rascunho: 0n,
    Submetido: 1n,
    EmVotacao: 2n,
    Aprovado: 3n,
    Rejeitado: 4n,
    Emitido: 5n,
    Suspenso: 6n,
    Revogado: 7n,
  };

  const Voto = {
    Nenhum: 0n,
    Aprovar: 1n,
    Rejeitar: 2n,
  };

  /**
   * @notice Avança o tempo da blockchain local.
   *
   * @dev
   * Necessário para encerrar votações cujo prazo já terminou.
   *
   * @param segundos Quantidade de segundos a avançar.
   */
  async function avancarTempo(segundos: number) {
    await ethers.provider.send("evm_increaseTime", [segundos]);
    await ethers.provider.send("evm_mine", []);
  }

  /**
   * @notice Implanta todo o ambiente necessário para testar a validação.
   *
   * @dev
   * A função cria os contratos necessários, cadastra os agentes principais
   * e autoriza o contrato ValidacaoProjetos no RegistroProjetosCarbono.
   */
  async function implantarAmbienteValidacao() {
    const [
      dono,
      proponente,
      validador1,
      validador2,
      comprador,
      usuarioComum,
    ] = await ethers.getSigners();

    /**
     * @dev
     * Implanta o token ERC-20 TIC.
     */
    const TokenImpactoCarbono = await ethers.getContractFactory(
      "TokenImpactoCarbono"
    );

    const token = await TokenImpactoCarbono.deploy(
      ethers.parseUnits("1000000", 18)
    );

    /**
     * @dev
     * Implanta a tesouraria do protocolo.
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
     * Implanta o registro de projetos de carbono.
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
     * Implanta o contrato de validação dos projetos.
     */
    const ValidacaoProjetos = await ethers.getContractFactory(
      "ValidacaoProjetos"
    );

    const validacao = await ValidacaoProjetos.deploy(
      await registroOrganizacoes.getAddress(),
      await registroProjetos.getAddress()
    );

    /**
     * @dev
     * Autoriza o contrato ValidacaoProjetos a alterar estados dos projetos.
     *
     * Sem esta autorização, as chamadas marcarEmVotacao e
     * registrarResultadoValidacao seriam rejeitadas pelo RegistroProjetosCarbono.
     */
    await registroProjetos.autorizarContrato(
      await validacao.getAddress(),
      true
    );

    /**
     * @dev
     * Cadastra o proponente.
     */
    await registroOrganizacoes.cadastrarOrganizacao(
      proponente.address,
      "Usina Solar Boa Energia",
      "CNPJ-001",
      "ipfs://carbonledger/proponente.json",
      TipoOrganizacao.Proponente
    );

    /**
     * @dev
     * Cadastra o primeiro validador.
     */
    await registroOrganizacoes.cadastrarOrganizacao(
      validador1.address,
      "Validador Ambiental 1",
      "VAL-001",
      "ipfs://carbonledger/validador-1.json",
      TipoOrganizacao.Validador
    );

    /**
     * @dev
     * Cadastra o segundo validador.
     */
    await registroOrganizacoes.cadastrarOrganizacao(
      validador2.address,
      "Validador Ambiental 2",
      "VAL-002",
      "ipfs://carbonledger/validador-2.json",
      TipoOrganizacao.Validador
    );

    /**
     * @dev
     * Cadastra o comprador.
     */
    await registroOrganizacoes.cadastrarOrganizacao(
      comprador.address,
      "Comprador Industrial",
      "COMP-001",
      "ipfs://carbonledger/comprador.json",
      TipoOrganizacao.Comprador
    );

    /**
     * @dev
     * Define um prazo curto, mas suficiente para permitir várias transações
     * de votação antes do encerramento.
     *
     * Antes estava 1 segundo, o que causava falhas com "Prazo encerrado".
     */
    await validacao.alterarParametrosVotacao(1000, 2);

    return {
      token,
      tesouraria,
      registroOrganizacoes,
      registroProjetos,
      validacao,
      dono,
      proponente,
      validador1,
      validador2,
      comprador,
      usuarioComum,
    };
  }

  /**
   * @notice Dados padrão para cadastro de projeto.
   */
  function dadosProjetoPadrao() {
    return {
      nomeProjeto: "Projeto Solar Ceara 2026",
      descricao: "Usina solar para geracao renovavel e reducao de emissoes",
      localizacao: "Fortaleza, Ceara, Brasil",
      tipoProjeto: TipoProjeto.Solar,
      creditosSolicitados: 7000,
      uriEvidencias: "ipfs://carbonledger/projeto-solar-2026.json",
      inicioPeriodoReferencia: 1767225600,
      fimPeriodoReferencia: 1798761600,
    };
  }

  /**
   * @notice Implanta ambiente e cadastra um projeto padrão.
   */
  async function implantarComProjetoSubmetido() {
    const ambiente = await implantarAmbienteValidacao();
    const dados = dadosProjetoPadrao();

    const taxa = await ambiente.registroProjetos.taxaSubmissaoProjeto();

    await ambiente.registroProjetos
      .connect(ambiente.proponente)
      .cadastrarProjeto(
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

  it("Deve implantar com enderecos corretos", async function () {
    const { validacao, registroOrganizacoes, registroProjetos, dono } =
      await implantarAmbienteValidacao();

    expect(await validacao.owner()).to.equal(dono.address);

    expect(await validacao.registroOrganizacoes()).to.equal(
      await registroOrganizacoes.getAddress()
    );

    expect(await validacao.registroProjetosCarbono()).to.equal(
      await registroProjetos.getAddress()
    );

    expect(await validacao.prazoVotacao()).to.equal(1000n);
    expect(await validacao.quorumMinimo()).to.equal(2n);
  });

  it("Deve reconhecer validador apto pelo cadastro", async function () {
    const { validacao, validador1, usuarioComum } =
      await implantarAmbienteValidacao();

    expect(await validacao.validadorApto(validador1.address)).to.equal(true);
    expect(await validacao.validadorApto(usuarioComum.address)).to.equal(false);
  });

  it("Deve iniciar votacao por validador apto", async function () {
    const { validacao, registroProjetos, validador1, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    const votacao = await validacao.votacoes(idProjeto);

    expect(votacao.idProjeto).to.equal(1n);
    expect(votacao.encerrada).to.equal(false);

    expect(await registroProjetos.obterEstadoProjeto(idProjeto)).to.equal(
      EstadoProjeto.EmVotacao
    );
  });

  it("Nao deve iniciar votacao por usuario nao validador", async function () {
    const { validacao, usuarioComum, idProjeto } =
      await implantarComProjetoSubmetido();

    await expect(
      validacao.connect(usuarioComum).iniciarVotacao(idProjeto)
    ).to.be.revertedWith("Validador nao apto");
  });

  it("Nao deve iniciar votacao duplicada para o mesmo projeto", async function () {
    const { validacao, validador1, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await expect(
      validacao.connect(validador1).iniciarVotacao(idProjeto)
    ).to.be.revertedWith("Votacao ja iniciada");
  });

  it("Deve registrar votos de aprovacao", async function () {
    const { validacao, validador1, validador2, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await validacao
      .connect(validador1)
      .votarProjeto(idProjeto, Voto.Aprovar, 6000);

    await validacao
      .connect(validador2)
      .votarProjeto(idProjeto, Voto.Aprovar, 5000);

    const votacao = await validacao.votacoes(idProjeto);

    expect(votacao.votosAprovacao).to.equal(2n);
    expect(votacao.votosRejeicao).to.equal(0n);
    expect(votacao.somaCreditosSugeridos).to.equal(11000n);
    expect(votacao.quantidadeSugestoes).to.equal(2n);

    expect(await validacao.votos(idProjeto, validador1.address)).to.equal(
      Voto.Aprovar
    );
  });

  it("Deve registrar votos de rejeicao", async function () {
    const { validacao, validador1, validador2, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await validacao
      .connect(validador1)
      .votarProjeto(idProjeto, Voto.Rejeitar, 0);

    await validacao
      .connect(validador2)
      .votarProjeto(idProjeto, Voto.Rejeitar, 0);

    const votacao = await validacao.votacoes(idProjeto);

    expect(votacao.votosAprovacao).to.equal(0n);
    expect(votacao.votosRejeicao).to.equal(2n);
  });

  it("Nao deve permitir voto duplicado", async function () {
    const { validacao, validador1, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await validacao
      .connect(validador1)
      .votarProjeto(idProjeto, Voto.Aprovar, 6000);

    await expect(
      validacao
        .connect(validador1)
        .votarProjeto(idProjeto, Voto.Aprovar, 6000)
    ).to.be.revertedWith("Validador ja votou");
  });

  it("Nao deve permitir sugestao acima dos creditos solicitados", async function () {
    const { validacao, validador1, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await expect(
      validacao
        .connect(validador1)
        .votarProjeto(idProjeto, Voto.Aprovar, 8000)
    ).to.be.revertedWith("Sugestao acima do solicitado");
  });

  it("Nao deve permitir rejeicao com creditos sugeridos", async function () {
    const { validacao, validador1, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await expect(
      validacao
        .connect(validador1)
        .votarProjeto(idProjeto, Voto.Rejeitar, 100)
    ).to.be.revertedWith("Rejeicao nao deve sugerir creditos");
  });

  it("Nao deve encerrar votacao antes do prazo", async function () {
    const { validacao, validador1, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await expect(validacao.encerrarVotacao(idProjeto)).to.be.revertedWith(
      "Votacao ainda aberta"
    );
  });

  it("Deve encerrar votacao com aprovacao", async function () {
    const { validacao, registroProjetos, validador1, validador2, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await validacao
      .connect(validador1)
      .votarProjeto(idProjeto, Voto.Aprovar, 6000);

    await validacao
      .connect(validador2)
      .votarProjeto(idProjeto, Voto.Aprovar, 5000);

    await avancarTempo(1001);

    await validacao.encerrarVotacao(idProjeto);

    const votacao = await validacao.votacoes(idProjeto);
    const projeto = await registroProjetos.projetos(idProjeto);

    expect(votacao.encerrada).to.equal(true);
    expect(votacao.aprovado).to.equal(true);
    expect(votacao.creditosAprovados).to.equal(5500n);

    expect(projeto.estadoProjeto).to.equal(EstadoProjeto.Aprovado);
    expect(projeto.creditosAprovados).to.equal(5500n);
  });

  it("Deve encerrar votacao com rejeicao por maioria contraria", async function () {
    const { validacao, registroProjetos, validador1, validador2, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await validacao
      .connect(validador1)
      .votarProjeto(idProjeto, Voto.Rejeitar, 0);

    await validacao
      .connect(validador2)
      .votarProjeto(idProjeto, Voto.Rejeitar, 0);

    await avancarTempo(1001);

    await validacao.encerrarVotacao(idProjeto);

    const votacao = await validacao.votacoes(idProjeto);
    const projeto = await registroProjetos.projetos(idProjeto);

    expect(votacao.encerrada).to.equal(true);
    expect(votacao.aprovado).to.equal(false);
    expect(votacao.creditosAprovados).to.equal(0n);

    expect(projeto.estadoProjeto).to.equal(EstadoProjeto.Rejeitado);
    expect(projeto.creditosAprovados).to.equal(0n);
  });

  it("Deve rejeitar se nao atingir quorum minimo", async function () {
    const { validacao, registroProjetos, validador1, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await validacao
      .connect(validador1)
      .votarProjeto(idProjeto, Voto.Aprovar, 6000);

    await avancarTempo(1001);

    await validacao.encerrarVotacao(idProjeto);

    const votacao = await validacao.votacoes(idProjeto);
    const projeto = await registroProjetos.projetos(idProjeto);

    expect(votacao.aprovado).to.equal(false);
    expect(projeto.estadoProjeto).to.equal(EstadoProjeto.Rejeitado);
  });

  it("Nao deve encerrar votacao duas vezes", async function () {
    const { validacao, validador1, validador2, idProjeto } =
      await implantarComProjetoSubmetido();

    await validacao.connect(validador1).iniciarVotacao(idProjeto);

    await validacao
      .connect(validador1)
      .votarProjeto(idProjeto, Voto.Aprovar, 6000);

    await validacao
      .connect(validador2)
      .votarProjeto(idProjeto, Voto.Aprovar, 5000);

    await avancarTempo(1001);

    await validacao.encerrarVotacao(idProjeto);

    await expect(validacao.encerrarVotacao(idProjeto)).to.be.revertedWith(
      "Votacao ja encerrada"
    );
  });

  it("Deve alterar parametros de votacao", async function () {
    const { validacao } = await implantarAmbienteValidacao();

    await validacao.alterarParametrosVotacao(10, 3);

    expect(await validacao.prazoVotacao()).to.equal(10n);
    expect(await validacao.quorumMinimo()).to.equal(3n);
  });

  it("Nao deve permitir usuario comum alterar parametros", async function () {
    const { validacao, usuarioComum } = await implantarAmbienteValidacao();

    await expect(
      validacao.connect(usuarioComum).alterarParametrosVotacao(10, 3)
    )
      .to.be.revertedWithCustomError(validacao, "OwnableUnauthorizedAccount")
      .withArgs(usuarioComum.address);
  });

  it("Deve configurar exigencia de stake minimo", async function () {
    const { validacao, usuarioComum } = await implantarAmbienteValidacao();

    const stakeMinimo = ethers.parseUnits("1000", 18);

    /**
     * @dev
     * Aqui usamos usuarioComum apenas como endereço simulado de staking.
     *
     * A chamada saldoEmStake só será usada em cenário real quando
     * validadorApto for chamado com a exigência de stake ativada.
     */
    await validacao.configurarStakeValidador(
      usuarioComum.address,
      true,
      stakeMinimo
    );

    expect(await validacao.exigirStakeMinimo()).to.equal(true);
    expect(await validacao.stakeMinimoValidador()).to.equal(stakeMinimo);
  });

  it("Nao deve configurar stake obrigatorio com endereco invalido", async function () {
    const { validacao } = await implantarAmbienteValidacao();

    await expect(
      validacao.configurarStakeValidador(
        ethers.ZeroAddress,
        true,
        ethers.parseUnits("1000", 18)
      )
    ).to.be.revertedWith("Staking invalido");
  });
});
