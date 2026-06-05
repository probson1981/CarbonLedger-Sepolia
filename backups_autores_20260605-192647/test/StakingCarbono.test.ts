/**
 * @file StakingCarbono.test.ts
 * @author Patrício Alves
 * @notice Testes automatizados do contrato StakingCarbono.
 *
 * @dev
 * Este arquivo testa o contrato de staking do protocolo CarbonLedger.
 *
 * O StakingCarbono permite que participantes depositem tokens TIC,
 * fiquem com saldo bloqueado e recebam recompensas pagas pela TesourariaCarbono.
 *
 * Contratos envolvidos:
 *
 * 1. TokenImpactoCarbono;
 * 2. TesourariaCarbono;
 * 3. StakingCarbono.
 *
 * Testes contemplados:
 *
 * 1. Implantação correta;
 * 2. Depósito de stake;
 * 3. Bloqueio de depósito inválido;
 * 4. Bloqueio de saque antes do período mínimo;
 * 5. Saque após período mínimo;
 * 6. Saque parcial;
 * 7. Cálculo de recompensa pendente;
 * 8. Resgate de recompensa pela tesouraria;
 * 9. Bloqueio de recompensa sem saldo;
 * 10. Verificação de stake mínimo de validador;
 * 11. Alteração de parâmetros administrativos;
 * 12. Atualização dos contratos integrados.
 */

import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("StakingCarbono", function () {
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
   * @notice Implanta TokenImpactoCarbono, TesourariaCarbono e StakingCarbono.
   *
   * @dev
   * Também transfere tokens TIC para o participante e deposita reserva de TIC
   * na tesouraria para pagamento de recompensas.
   */
  async function implantarAmbienteStaking() {
    const [dono, participante, validador, destinatario, usuarioComum] =
      await ethers.getSigners();

    /**
     * @dev
     * Implanta o token ERC-20 TIC.
     */
    const TokenImpactoCarbono = await ethers.getContractFactory(
      "TokenImpactoCarbono"
    );

    const suprimentoInicial = ethers.parseUnits("1000000", 18);

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
     * Implanta o contrato de staking.
     */
    const StakingCarbono = await ethers.getContractFactory("StakingCarbono");

    const staking = await StakingCarbono.deploy(
      await token.getAddress(),
      await tesouraria.getAddress()
    );

    /**
     * @dev
     * Autoriza o StakingCarbono a solicitar pagamentos em TIC da tesouraria.
     */
    await tesouraria.autorizarContrato(await staking.getAddress(), true);

    /**
     * @dev
     * Envia TIC para participantes que farão staking.
     */
    await token.transfer(participante.address, ethers.parseUnits("20000", 18));
    await token.transfer(validador.address, ethers.parseUnits("20000", 18));

    /**
     * @dev
     * Deposita TIC na tesouraria para formar reserva de recompensas.
     */
    const reservaTesouraria = ethers.parseUnits("100000", 18);

    await token.approve(await tesouraria.getAddress(), reservaTesouraria);

    await tesouraria.depositarTIC(
      reservaTesouraria,
      "reserva inicial de recompensas de staking"
    );

    return {
      token,
      tesouraria,
      staking,
      dono,
      participante,
      validador,
      destinatario,
      usuarioComum,
      suprimentoInicial,
      reservaTesouraria,
    };
  }

  it("Deve implantar com parametros iniciais corretos", async function () {
    const { token, tesouraria, staking, dono } =
      await implantarAmbienteStaking();

    expect(await staking.owner()).to.equal(dono.address);

    expect(await staking.tokenImpactoCarbono()).to.equal(
      await token.getAddress()
    );

    expect(await staking.tesourariaCarbono()).to.equal(
      await tesouraria.getAddress()
    );

    expect(await staking.stakeMinimoValidador()).to.equal(
      ethers.parseUnits("1000", 18)
    );

    expect(await staking.periodoMinimoBloqueio()).to.equal(24n * 60n * 60n);
    expect(await staking.taxaRecompensaAnualBps()).to.equal(500n);
    expect(await staking.totalEmStake()).to.equal(0n);
  });

  it("Nao deve implantar com token ou tesouraria invalidos", async function () {
    const { token, tesouraria } = await implantarAmbienteStaking();

    const StakingCarbono = await ethers.getContractFactory("StakingCarbono");

    await expect(
      StakingCarbono.deploy(ethers.ZeroAddress, await tesouraria.getAddress())
    ).to.be.revertedWith("Token TIC invalido");

    await expect(
      StakingCarbono.deploy(await token.getAddress(), ethers.ZeroAddress)
    ).to.be.revertedWith("Tesouraria invalida");
  });

  it("Deve depositar stake", async function () {
    const { token, staking, participante } = await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("1000", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidade);

    await staking.connect(participante).depositarStake(quantidade);

    expect(await staking.saldoEmStake(participante.address)).to.equal(
      quantidade
    );

    expect(await staking.totalEmStake()).to.equal(quantidade);

    expect(await token.balanceOf(await staking.getAddress())).to.equal(
      quantidade
    );

    expect(
      await staking.dataInicioStake(participante.address)
    ).to.be.greaterThan(0n);

    expect(
      await staking.dataUltimoCalculo(participante.address)
    ).to.be.greaterThan(0n);
  });

  it("Nao deve depositar stake com quantidade zero", async function () {
    const { staking, participante } = await implantarAmbienteStaking();

    await expect(
      staking.connect(participante).depositarStake(0)
    ).to.be.revertedWith("Quantidade invalida");
  });

  it("Nao deve depositar sem aprovacao suficiente", async function () {
    const { token, staking, participante } = await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("1000", 18);

    await expect(staking.connect(participante).depositarStake(quantidade))
      .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
      .withArgs(await staking.getAddress(), 0n, quantidade);
  });

  it("Deve reconhecer stake minimo de validador", async function () {
    const { token, staking, validador } = await implantarAmbienteStaking();

    const stakeMinimo = await staking.stakeMinimoValidador();

    expect(
      await staking.possuiStakeMinimoValidador(validador.address)
    ).to.equal(false);

    await token
      .connect(validador)
      .approve(await staking.getAddress(), stakeMinimo);

    await staking.connect(validador).depositarStake(stakeMinimo);

    expect(
      await staking.possuiStakeMinimoValidador(validador.address)
    ).to.equal(true);

    expect(await staking.saldoEmStake(validador.address)).to.equal(
      stakeMinimo
    );
  });

  it("Nao deve sacar antes do periodo minimo", async function () {
    const { token, staking, participante } = await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("1000", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidade);

    await staking.connect(participante).depositarStake(quantidade);

    await expect(
      staking.connect(participante).sacarStake(quantidade)
    ).to.be.revertedWith("Periodo minimo nao atingido");
  });

  it("Deve sacar stake apos periodo minimo", async function () {
    const { token, staking, participante } = await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("1000", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidade);

    await staking.connect(participante).depositarStake(quantidade);

    await avancarTempo(24 * 60 * 60 + 1);

    const saldoAntes = await token.balanceOf(participante.address);

    await staking.connect(participante).sacarStake(quantidade);

    const saldoDepois = await token.balanceOf(participante.address);

    expect(saldoDepois - saldoAntes).to.equal(quantidade);
    expect(await staking.saldoEmStake(participante.address)).to.equal(0n);
    expect(await staking.totalEmStake()).to.equal(0n);
    expect(await token.balanceOf(await staking.getAddress())).to.equal(0n);
  });

  it("Deve permitir saque parcial", async function () {
    const { token, staking, participante } = await implantarAmbienteStaking();

    const quantidadeDeposito = ethers.parseUnits("2000", 18);
    const quantidadeSaque = ethers.parseUnits("500", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidadeDeposito);

    await staking.connect(participante).depositarStake(quantidadeDeposito);

    await avancarTempo(24 * 60 * 60 + 1);

    await staking.connect(participante).sacarStake(quantidadeSaque);

    expect(await staking.saldoEmStake(participante.address)).to.equal(
      quantidadeDeposito - quantidadeSaque
    );

    expect(await staking.totalEmStake()).to.equal(
      quantidadeDeposito - quantidadeSaque
    );
  });

  it("Nao deve sacar com quantidade zero", async function () {
    const { staking, participante } = await implantarAmbienteStaking();

    await expect(
      staking.connect(participante).sacarStake(0)
    ).to.be.revertedWith("Quantidade invalida");
  });

  it("Nao deve sacar acima do saldo em stake", async function () {
    const { token, staking, participante } = await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("1000", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidade);

    await staking.connect(participante).depositarStake(quantidade);

    await avancarTempo(24 * 60 * 60 + 1);

    await expect(
      staking
        .connect(participante)
        .sacarStake(ethers.parseUnits("2000", 18))
    ).to.be.revertedWith("Saldo em stake insuficiente");
  });

  it("Deve calcular recompensa pendente apos passagem do tempo", async function () {
    const { token, staking, participante } = await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("10000", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidade);

    await staking.connect(participante).depositarStake(quantidade);

    await avancarTempo(30 * 24 * 60 * 60);

    const recompensa = await staking.calcularRecompensaPendente(
      participante.address
    );

    expect(recompensa).to.be.greaterThan(0n);
  });

  it("Deve resgatar recompensa em TIC pela tesouraria", async function () {
    const { token, tesouraria, staking, participante } =
      await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("10000", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidade);

    await staking.connect(participante).depositarStake(quantidade);

    await avancarTempo(30 * 24 * 60 * 60);

    const recompensaPendente = await staking.calcularRecompensaPendente(
      participante.address
    );

    expect(recompensaPendente).to.be.greaterThan(0n);

    const saldoAntesParticipante = await token.balanceOf(participante.address);
    const saldoAntesTesouraria = await tesouraria.saldoTIC();

    await staking.connect(participante).resgatarRecompensa();

    const saldoDepoisParticipante = await token.balanceOf(participante.address);
    const saldoDepoisTesouraria = await tesouraria.saldoTIC();

    const valorRecebidoParticipante =
      saldoDepoisParticipante - saldoAntesParticipante;

    const valorDebitadoTesouraria =
      saldoAntesTesouraria - saldoDepoisTesouraria;

    /**
     * @dev
     * A recompensa pode aumentar levemente entre a consulta e a transação,
     * porque a blockchain local minera novo bloco e o timestamp avança.
     *
     * Por isso, não comparamos igualdade exata contra recompensaPendente.
     */
    expect(valorRecebidoParticipante).to.be.greaterThan(0n);

    /**
     * @dev
     * O valor recebido pelo participante deve ser exatamente igual
     * ao valor debitado da tesouraria.
     */
    expect(valorRecebidoParticipante).to.equal(valorDebitadoTesouraria);

    expect(await staking.recompensasAcumuladas(participante.address)).to.equal(
      0n
    );
  });

  it("Nao deve resgatar recompensa sem recompensa acumulada", async function () {
    const { staking, usuarioComum } = await implantarAmbienteStaking();

    await expect(
      staking.connect(usuarioComum).resgatarRecompensa()
    ).to.be.revertedWith("Sem recompensa");
  });

  it("Nao deve resgatar recompensa se staking nao estiver autorizado na tesouraria", async function () {
    const { token, tesouraria, staking, participante } =
      await implantarAmbienteStaking();

    const quantidade = ethers.parseUnits("10000", 18);

    await token
      .connect(participante)
      .approve(await staking.getAddress(), quantidade);

    await staking.connect(participante).depositarStake(quantidade);

    await avancarTempo(30 * 24 * 60 * 60);

    await tesouraria.autorizarContrato(await staking.getAddress(), false);

    await expect(
      staking.connect(participante).resgatarRecompensa()
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  it("Deve alterar parametros de staking", async function () {
    const { staking } = await implantarAmbienteStaking();

    const novoStakeMinimo = ethers.parseUnits("2000", 18);
    const novoPeriodo = 2 * 24 * 60 * 60;
    const novaTaxa = 1000;

    await staking.alterarParametrosStaking(
      novoStakeMinimo,
      novoPeriodo,
      novaTaxa
    );

    expect(await staking.stakeMinimoValidador()).to.equal(novoStakeMinimo);
    expect(await staking.periodoMinimoBloqueio()).to.equal(BigInt(novoPeriodo));
    expect(await staking.taxaRecompensaAnualBps()).to.equal(BigInt(novaTaxa));
  });

  it("Nao deve permitir usuario comum alterar parametros de staking", async function () {
    const { staking, usuarioComum } = await implantarAmbienteStaking();

    await expect(
      staking
        .connect(usuarioComum)
        .alterarParametrosStaking(
          ethers.parseUnits("2000", 18),
          2 * 24 * 60 * 60,
          1000
        )
    )
      .to.be.revertedWithCustomError(staking, "OwnableUnauthorizedAccount")
      .withArgs(usuarioComum.address);
  });

  it("Nao deve aceitar parametros invalidos de staking", async function () {
    const { staking } = await implantarAmbienteStaking();

    await expect(
      staking.alterarParametrosStaking(0, 1, 1000)
    ).to.be.revertedWith("Stake minimo invalido");

    await expect(
      staking.alterarParametrosStaking(
        ethers.parseUnits("1000", 18),
        1,
        6000
      )
    ).to.be.revertedWith("Recompensa acima do limite");
  });

  it("Deve atualizar contratos integrados", async function () {
    const { token, tesouraria, staking } = await implantarAmbienteStaking();

    await staking.atualizarContratos(
      await token.getAddress(),
      await tesouraria.getAddress()
    );

    expect(await staking.tokenImpactoCarbono()).to.equal(
      await token.getAddress()
    );

    expect(await staking.tesourariaCarbono()).to.equal(
      await tesouraria.getAddress()
    );
  });

  it("Nao deve atualizar contratos com enderecos invalidos", async function () {
    const { token, tesouraria, staking } = await implantarAmbienteStaking();

    await expect(
      staking.atualizarContratos(
        ethers.ZeroAddress,
        await tesouraria.getAddress()
      )
    ).to.be.revertedWith("Token TIC invalido");

    await expect(
      staking.atualizarContratos(await token.getAddress(), ethers.ZeroAddress)
    ).to.be.revertedWith("Tesouraria invalida");
  });
});