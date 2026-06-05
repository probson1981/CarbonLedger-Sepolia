/**
 * @file GovernancaCarbono.test.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Testes automatizados do contrato GovernancaCarbono.
 *
 * @dev
 * Este arquivo testa a DAO simplificada do protocolo CarbonLedger.
 *
 * A GovernancaCarbono permite:
 *
 * 1. Criar propostas;
 * 2. Votar propostas com peso baseado em saldo de TIC;
 * 3. Encerrar votação após prazo;
 * 4. Verificar quórum;
 * 5. Executar chamada em contrato alvo;
 * 6. Cancelar propostas;
 * 7. Alterar parâmetros administrativos.
 *
 * Contratos envolvidos:
 *
 * 1. TokenImpactoCarbono;
 * 2. GovernancaCarbono;
 * 3. TesourariaCarbono;
 * 4. RegistroOrganizacoes;
 * 5. CreditoCarbonoToken;
 * 6. MercadoCarbono.
 */

import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("GovernancaCarbono", function () {
  /**
   * @notice Enum auxiliar para o estado das propostas.
   *
   * @dev
   * Deve seguir a ordem do enum EstadoProposta no contrato Solidity.
   */
  const EstadoProposta = {
    Ativa: 0n,
    Aprovada: 1n,
    Rejeitada: 2n,
    Executada: 3n,
    Cancelada: 4n,
  };

  /**
   * @notice Avança o tempo da blockchain local.
   *
   * @param segundos Quantidade de segundos a avançar.
   */
  async function avancarTempo(segundos: number) {
    await ethers.provider.send("evm_increaseTime", [segundos]);
    await ethers.provider.send("evm_mine", []);
  }

  /**
   * @notice Implanta o ambiente básico da governança.
   *
   * @dev
   * Cria o token TIC, a governança e distribui tokens entre participantes.
   */
  async function implantarAmbienteGovernanca() {
    const [
      dono,
      proponente,
      votante1,
      votante2,
      votanteContra,
      usuarioSemToken,
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
     * Implanta o contrato de governança.
     */
    const GovernancaCarbono = await ethers.getContractFactory(
      "GovernancaCarbono"
    );

    const governanca = await GovernancaCarbono.deploy(
      await token.getAddress()
    );

    /**
     * @dev
     * Reduz o prazo da votação para facilitar os testes.
     *
     * Quórum: 1000 TIC.
     * Saldo mínimo para propor: 100 TIC.
     */
    await governanca.alterarParametrosGovernanca(
      1000,
      ethers.parseUnits("1000", 18),
      ethers.parseUnits("100", 18)
    );

    /**
     * @dev
     * Distribui tokens para os participantes.
     */
    await token.transfer(proponente.address, ethers.parseUnits("2000", 18));
    await token.transfer(votante1.address, ethers.parseUnits("800", 18));
    await token.transfer(votante2.address, ethers.parseUnits("700", 18));
    await token.transfer(votanteContra.address, ethers.parseUnits("500", 18));

    return {
      token,
      governanca,
      dono,
      proponente,
      votante1,
      votante2,
      votanteContra,
      usuarioSemToken,
    };
  }

  /**
   * @notice Implanta ambiente com um contrato MercadoCarbono como alvo.
   *
   * @dev
   * O objetivo é testar execução real de proposta aprovada.
   *
   * A proposta executará:
   *
   * MercadoCarbono.alterarTaxaMarketplace(500)
   *
   * Para isso funcionar, a propriedade do MercadoCarbono é transferida
   * para a GovernancaCarbono.
   */
  async function implantarAmbienteComMercadoAlvo() {
    const ambiente = await implantarAmbienteGovernanca();

    /**
     * @dev
     * Implanta a tesouraria.
     */
    const TesourariaCarbono = await ethers.getContractFactory(
      "TesourariaCarbono"
    );

    const tesouraria = await TesourariaCarbono.deploy(
      await ambiente.token.getAddress()
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
     * Implanta o token ERC-1155 dos créditos de carbono.
     */
    const CreditoCarbonoToken = await ethers.getContractFactory(
      "CreditoCarbonoToken"
    );

    const creditoCarbonoToken = await CreditoCarbonoToken.deploy(
      "ipfs://carbonledger/creditos/{id}.json"
    );

    /**
     * @dev
     * Implanta o marketplace.
     */
    const MercadoCarbono = await ethers.getContractFactory("MercadoCarbono");

    const mercado = await MercadoCarbono.deploy(
      await creditoCarbonoToken.getAddress(),
      await registroOrganizacoes.getAddress(),
      await tesouraria.getAddress()
    );

    /**
     * @dev
     * Transfere o ownership do marketplace para a governança.
     *
     * Sem isso, a proposta aprovada não conseguiria chamar funções onlyOwner.
     */
    await mercado.transferOwnership(await ambiente.governanca.getAddress());

    return {
      ...ambiente,
      tesouraria,
      registroOrganizacoes,
      creditoCarbonoToken,
      mercado,
    };
  }

  /**
   * @notice Cria uma proposta padrão para alterar a taxa do marketplace.
   */
  async function criarPropostaAlterarTaxaMarketplace() {
    const ambiente = await implantarAmbienteComMercadoAlvo();

    const dadosExecucao = ambiente.mercado.interface.encodeFunctionData(
      "alterarTaxaMarketplace",
      [500]
    );

    await ambiente.governanca
      .connect(ambiente.proponente)
      .criarProposta(
        await ambiente.mercado.getAddress(),
        0,
        dadosExecucao,
        "Alterar taxa do marketplace para 5%"
      );

    return {
      ...ambiente,
      dadosExecucao,
      idProposta: 1,
    };
  }

  it("Deve implantar com token e parametros iniciais corretos", async function () {
    const { token, governanca, dono } = await implantarAmbienteGovernanca();

    expect(await governanca.owner()).to.equal(dono.address);

    expect(await governanca.tokenImpactoCarbono()).to.equal(
      await token.getAddress()
    );

    expect(await governanca.prazoVotacaoPadrao()).to.equal(1000n);
    expect(await governanca.quorumMinimo()).to.equal(
      ethers.parseUnits("1000", 18)
    );
    expect(await governanca.saldoMinimoParaPropor()).to.equal(
      ethers.parseUnits("100", 18)
    );
    expect(await governanca.totalPropostas()).to.equal(0n);
  });

  it("Nao deve implantar com token invalido", async function () {
    const GovernancaCarbono = await ethers.getContractFactory(
      "GovernancaCarbono"
    );

    await expect(
      GovernancaCarbono.deploy(ethers.ZeroAddress)
    ).to.be.revertedWith("Token TIC invalido");
  });

  it("Deve atualizar token de governanca", async function () {
    const { governanca } = await implantarAmbienteGovernanca();

    const TokenImpactoCarbono = await ethers.getContractFactory(
      "TokenImpactoCarbono"
    );

    const novoToken = await TokenImpactoCarbono.deploy(
      ethers.parseUnits("500000", 18)
    );

    await governanca.atualizarTokenGovernanca(await novoToken.getAddress());

    expect(await governanca.tokenImpactoCarbono()).to.equal(
      await novoToken.getAddress()
    );
  });

  it("Nao deve atualizar token de governanca para endereco zero", async function () {
    const { governanca } = await implantarAmbienteGovernanca();

    await expect(
      governanca.atualizarTokenGovernanca(ethers.ZeroAddress)
    ).to.be.revertedWith("Token TIC invalido");
  });

  it("Deve alterar parametros de governanca", async function () {
    const { governanca } = await implantarAmbienteGovernanca();

    const novoPrazo = 2000;
    const novoQuorum = ethers.parseUnits("1500", 18);
    const novoSaldoMinimo = ethers.parseUnits("200", 18);

    await governanca.alterarParametrosGovernanca(
      novoPrazo,
      novoQuorum,
      novoSaldoMinimo
    );

    expect(await governanca.prazoVotacaoPadrao()).to.equal(BigInt(novoPrazo));
    expect(await governanca.quorumMinimo()).to.equal(novoQuorum);
    expect(await governanca.saldoMinimoParaPropor()).to.equal(novoSaldoMinimo);
  });

  it("Nao deve permitir usuario comum alterar parametros", async function () {
    const { governanca, usuarioSemToken } = await implantarAmbienteGovernanca();

    await expect(
      governanca
        .connect(usuarioSemToken)
        .alterarParametrosGovernanca(
          2000,
          ethers.parseUnits("1500", 18),
          ethers.parseUnits("200", 18)
        )
    )
      .to.be.revertedWithCustomError(governanca, "OwnableUnauthorizedAccount")
      .withArgs(usuarioSemToken.address);
  });

  it("Nao deve aceitar parametros invalidos de governanca", async function () {
    const { governanca } = await implantarAmbienteGovernanca();

    await expect(
      governanca.alterarParametrosGovernanca(
        0,
        ethers.parseUnits("1000", 18),
        ethers.parseUnits("100", 18)
      )
    ).to.be.revertedWith("Prazo invalido");

    await expect(
      governanca.alterarParametrosGovernanca(
        1000,
        0,
        ethers.parseUnits("100", 18)
      )
    ).to.be.revertedWith("Quorum invalido");
  });

  it("Deve criar proposta", async function () {
    const { governanca, mercado, proponente, dadosExecucao } =
      await criarPropostaAlterarTaxaMarketplace();

    expect(await governanca.totalPropostas()).to.equal(1n);

    const proposta = await governanca.propostas(1);

    expect(proposta.idProposta).to.equal(1n);
    expect(proposta.proponente).to.equal(proponente.address);
    expect(proposta.contratoAlvo).to.equal(await mercado.getAddress());
    expect(proposta.valorETH).to.equal(0n);
    expect(proposta.dadosExecucao).to.equal(dadosExecucao);
    expect(proposta.descricao).to.equal("Alterar taxa do marketplace para 5%");
    expect(proposta.votosFavor).to.equal(0n);
    expect(proposta.votosContra).to.equal(0n);
    expect(proposta.executada).to.equal(false);
    expect(proposta.cancelada).to.equal(false);

    expect(await governanca.estadoProposta(1)).to.equal(EstadoProposta.Ativa);
  });

  it("Nao deve criar proposta sem saldo minimo", async function () {
    const { governanca, mercado, usuarioSemToken } =
      await implantarAmbienteComMercadoAlvo();

    const dadosExecucao = mercado.interface.encodeFunctionData(
      "alterarTaxaMarketplace",
      [500]
    );

    await expect(
      governanca
        .connect(usuarioSemToken)
        .criarProposta(
          await mercado.getAddress(),
          0,
          dadosExecucao,
          "Tentativa sem saldo"
        )
    ).to.be.revertedWith("Saldo insuficiente para propor");
  });

  it("Nao deve criar proposta com dados invalidos", async function () {
    const { governanca, mercado, proponente } =
      await implantarAmbienteComMercadoAlvo();

    const dadosExecucao = mercado.interface.encodeFunctionData(
      "alterarTaxaMarketplace",
      [500]
    );

    await expect(
      governanca
        .connect(proponente)
        .criarProposta(
          ethers.ZeroAddress,
          0,
          dadosExecucao,
          "Contrato alvo invalido"
        )
    ).to.be.revertedWith("Contrato alvo invalido");

    await expect(
      governanca
        .connect(proponente)
        .criarProposta(await mercado.getAddress(), 0, "0x", "Dados vazios")
    ).to.be.revertedWith("Dados obrigatorios");

    await expect(
      governanca
        .connect(proponente)
        .criarProposta(await mercado.getAddress(), 0, dadosExecucao, "")
    ).to.be.revertedWith("Descricao obrigatoria");
  });

  it("Deve registrar votos favoraveis e contrarios", async function () {
    const { governanca, votante1, votanteContra, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(votante1).votar(idProposta, true);
    await governanca.connect(votanteContra).votar(idProposta, false);

    const proposta = await governanca.propostas(idProposta);

    expect(proposta.votosFavor).to.equal(ethers.parseUnits("800", 18));
    expect(proposta.votosContra).to.equal(ethers.parseUnits("500", 18));

    expect(await governanca.jaVotou(idProposta, votante1.address)).to.equal(
      true
    );
    expect(
      await governanca.votoFavoravel(idProposta, votante1.address)
    ).to.equal(true);
    expect(await governanca.pesoDoVoto(idProposta, votante1.address)).to.equal(
      ethers.parseUnits("800", 18)
    );

    expect(await governanca.totalVotos(idProposta)).to.equal(
      ethers.parseUnits("1300", 18)
    );
  });

  it("Nao deve permitir voto duplicado", async function () {
    const { governanca, votante1, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(votante1).votar(idProposta, true);

    await expect(
      governanca.connect(votante1).votar(idProposta, true)
    ).to.be.revertedWith("Carteira ja votou");
  });

  it("Nao deve permitir voto sem poder de voto", async function () {
    const { governanca, usuarioSemToken, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await expect(
      governanca.connect(usuarioSemToken).votar(idProposta, true)
    ).to.be.revertedWith("Sem poder de voto");
  });

  it("Nao deve permitir votar em proposta inexistente", async function () {
    const { governanca, votante1 } = await implantarAmbienteGovernanca();

    await expect(
      governanca.connect(votante1).votar(999, true)
    ).to.be.revertedWith("Proposta inexistente");
  });

  it("Nao deve executar proposta antes do fim da votacao", async function () {
    const { governanca, votante1, votante2, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(votante1).votar(idProposta, true);
    await governanca.connect(votante2).votar(idProposta, true);

    await expect(
      governanca.executarProposta(idProposta)
    ).to.be.revertedWith("Votacao ainda aberta");
  });

  it("Deve aprovar e executar proposta aprovada", async function () {
    const { governanca, mercado, votante1, votante2, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(votante1).votar(idProposta, true);
    await governanca.connect(votante2).votar(idProposta, true);

    await avancarTempo(1001);

    expect(await governanca.estadoProposta(idProposta)).to.equal(
      EstadoProposta.Aprovada
    );

    expect(await governanca.propostaAprovada(idProposta)).to.equal(true);

    await governanca.executarProposta(idProposta);

    expect(await mercado.taxaMarketplaceBps()).to.equal(500n);
    expect(await governanca.estadoProposta(idProposta)).to.equal(
      EstadoProposta.Executada
    );

    const proposta = await governanca.propostas(idProposta);
    expect(proposta.executada).to.equal(true);
  });

  it("Nao deve executar proposta duas vezes", async function () {
    const { governanca, votante1, votante2, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(votante1).votar(idProposta, true);
    await governanca.connect(votante2).votar(idProposta, true);

    await avancarTempo(1001);

    await governanca.executarProposta(idProposta);

    await expect(
      governanca.executarProposta(idProposta)
    ).to.be.revertedWith("Proposta ja executada");
  });

  it("Deve rejeitar proposta sem quorum minimo", async function () {
    const { governanca, votanteContra, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    /**
     * @dev
     * VotanteContra possui 500 TIC, abaixo do quórum mínimo de 1000 TIC.
     */
    await governanca.connect(votanteContra).votar(idProposta, true);

    await avancarTempo(1001);

    expect(await governanca.estadoProposta(idProposta)).to.equal(
      EstadoProposta.Rejeitada
    );

    await expect(
      governanca.executarProposta(idProposta)
    ).to.be.revertedWith("Quorum nao atingido");
  });

  it("Deve rejeitar proposta com maioria contraria", async function () {
    const { governanca, votante1, votante2, votanteContra, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(votante1).votar(idProposta, false);
    await governanca.connect(votante2).votar(idProposta, false);
    await governanca.connect(votanteContra).votar(idProposta, true);

    await avancarTempo(1001);

    expect(await governanca.estadoProposta(idProposta)).to.equal(
      EstadoProposta.Rejeitada
    );

    await expect(
      governanca.executarProposta(idProposta)
    ).to.be.revertedWith("Proposta rejeitada");
  });

  it("Deve cancelar proposta pelo proponente", async function () {
    const { governanca, proponente, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(proponente).cancelarProposta(idProposta);

    expect(await governanca.estadoProposta(idProposta)).to.equal(
      EstadoProposta.Cancelada
    );

    const proposta = await governanca.propostas(idProposta);
    expect(proposta.cancelada).to.equal(true);
  });

  it("Deve cancelar proposta pelo owner", async function () {
    const { governanca, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.cancelarProposta(idProposta);

    expect(await governanca.estadoProposta(idProposta)).to.equal(
      EstadoProposta.Cancelada
    );
  });

  it("Nao deve cancelar proposta por usuario sem permissao", async function () {
    const { governanca, votante1, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await expect(
      governanca.connect(votante1).cancelarProposta(idProposta)
    ).to.be.revertedWith("Sem permissao");
  });

  it("Nao deve votar em proposta cancelada", async function () {
    const { governanca, proponente, votante1, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(proponente).cancelarProposta(idProposta);

    await expect(
      governanca.connect(votante1).votar(idProposta, true)
    ).to.be.revertedWith("Proposta cancelada");
  });

  it("Nao deve executar proposta cancelada", async function () {
    const { governanca, proponente, votante1, votante2, idProposta } =
      await criarPropostaAlterarTaxaMarketplace();

    await governanca.connect(votante1).votar(idProposta, true);
    await governanca.connect(votante2).votar(idProposta, true);

    await governanca.connect(proponente).cancelarProposta(idProposta);

    await avancarTempo(1001);

    await expect(
      governanca.executarProposta(idProposta)
    ).to.be.revertedWith("Proposta cancelada");
  });

  it("Nao deve executar proposta com chamada falha", async function () {
    const { governanca, mercado, proponente, votante1, votante2 } =
      await implantarAmbienteComMercadoAlvo();

    /**
     * @dev
     * A função alterarTaxaMarketplace rejeita taxas acima de 2000 bps.
     * Logo, a execução deve falhar.
     */
    const dadosExecucaoFalha = mercado.interface.encodeFunctionData(
      "alterarTaxaMarketplace",
      [3000]
    );

    await governanca
      .connect(proponente)
      .criarProposta(
        await mercado.getAddress(),
        0,
        dadosExecucaoFalha,
        "Tentativa de taxa acima do limite"
      );

    const idProposta = 1;

    await governanca.connect(votante1).votar(idProposta, true);
    await governanca.connect(votante2).votar(idProposta, true);

    await avancarTempo(1001);

    await expect(
      governanca.executarProposta(idProposta)
    ).to.be.revertedWith("Falha ao executar proposta");
  });

  it("Deve receber ETH diretamente", async function () {
    const { governanca, dono } = await implantarAmbienteGovernanca();

    const valor = ethers.parseEther("1");

    await dono.sendTransaction({
      to: await governanca.getAddress(),
      value: valor,
    });

    expect(
      await ethers.provider.getBalance(await governanca.getAddress())
    ).to.equal(valor);
  });
}); 
