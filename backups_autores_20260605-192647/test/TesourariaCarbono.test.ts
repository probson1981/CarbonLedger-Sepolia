/**
 * @file TesourariaCarbono.test.ts
 * @author Patrício Alves
 * @notice Testes automatizados do contrato TesourariaCarbono.
 *
 * @dev
 * Este arquivo testa a tesouraria central do protocolo CarbonLedger.
 *
 * A TesourariaCarbono é responsável por:
 *
 * 1. Receber ETH de taxas e emolumentos;
 * 2. Receber tokens TIC;
 * 3. Guardar reservas do protocolo;
 * 4. Enviar ETH por ordem do owner;
 * 5. Enviar TIC por ordem do owner;
 * 6. Permitir pagamentos por contratos autorizados;
 * 7. Registrar totais recebidos e enviados;
 * 8. Separar a camada financeira das regras de negócio.
 */

import { expect } from "chai";
import { network } from "hardhat";

/**
 * @dev
 * Conecta o ambiente Hardhat 3 e disponibiliza o ethers.
 */
const { ethers } = await network.connect();

/**
 * @title Testes do contrato TesourariaCarbono
 */
describe("TesourariaCarbono", function () {
  /**
   * @notice Implanta TokenImpactoCarbono e TesourariaCarbono.
   *
   * @dev
   * A tesouraria depende do endereço do token TIC.
   */
  async function implantarTesourariaCarbono() {
    const [dono, usuario, destinatario, contratoAutorizado, outroUsuario] =
      await ethers.getSigners();

    /**
     * @dev
     * Implanta o token ERC-20 utilitário do protocolo.
     */
    const suprimentoInicial = ethers.parseUnits("1000000", 18);

    const TokenImpactoCarbono = await ethers.getContractFactory(
      "TokenImpactoCarbono"
    );

    const token = await TokenImpactoCarbono.deploy(suprimentoInicial);

    /**
     * @dev
     * Implanta a tesouraria apontando para o endereço do token TIC.
     */
    const TesourariaCarbono = await ethers.getContractFactory(
      "TesourariaCarbono"
    );

    const tesouraria = await TesourariaCarbono.deploy(await token.getAddress());

    return {
      token,
      tesouraria,
      dono,
      usuario,
      destinatario,
      contratoAutorizado,
      outroUsuario,
      suprimentoInicial,
    };
  }

  /**
   * @notice Verifica se a tesouraria é implantada corretamente.
   */
  it("Deve implantar com owner e token TIC corretos", async function () {
    const { token, tesouraria, dono } = await implantarTesourariaCarbono();

    expect(await tesouraria.owner()).to.equal(dono.address);
    expect(await tesouraria.tokenImpactoCarbono()).to.equal(
      await token.getAddress()
    );

    expect(await tesouraria.totalETHRecebido()).to.equal(0n);
    expect(await tesouraria.totalETHEnviado()).to.equal(0n);
    expect(await tesouraria.totalTICRecebido()).to.equal(0n);
    expect(await tesouraria.totalTICEnviado()).to.equal(0n);
  });

  /**
   * @notice Verifica se o construtor bloqueia token inválido.
   */
  it("Nao deve implantar com token TIC invalido", async function () {
    const TesourariaCarbono = await ethers.getContractFactory(
      "TesourariaCarbono"
    );

    await expect(
      TesourariaCarbono.deploy(ethers.ZeroAddress)
    ).to.be.revertedWith("Token TIC invalido");
  });

  /**
   * @notice Verifica se a tesouraria recebe ETH diretamente.
   *
   * @dev
   * Isso aciona a função receive().
   */
  it("Deve receber ETH diretamente", async function () {
    const { tesouraria, usuario } = await implantarTesourariaCarbono();

    const valor = ethers.parseEther("1");

    await usuario.sendTransaction({
      to: await tesouraria.getAddress(),
      value: valor,
    });

    expect(await tesouraria.saldoETH()).to.equal(valor);
    expect(await tesouraria.totalETHRecebido()).to.equal(valor);
  });

  /**
   * @notice Verifica se a função receberTaxaETH registra emolumento em ETH.
   */
  it("Deve receber taxa em ETH com origem informada", async function () {
    const { tesouraria, usuario } = await implantarTesourariaCarbono();

    const valor = ethers.parseEther("0.25");

    await tesouraria
      .connect(usuario)
      .receberTaxaETH("taxa de submissao de projeto", { value: valor });

    expect(await tesouraria.saldoETH()).to.equal(valor);
    expect(await tesouraria.totalETHRecebido()).to.equal(valor);
  });

  /**
   * @notice Verifica se a função receberTaxaETH bloqueia valor zero.
   */
  it("Nao deve receber taxa ETH com valor zero", async function () {
    const { tesouraria } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.receberTaxaETH("taxa de marketplace", { value: 0 })
    ).to.be.revertedWith("Valor invalido");
  });

  /**
   * @notice Verifica se a função receberTaxaETH exige origem.
   */
  it("Nao deve receber taxa ETH sem origem", async function () {
    const { tesouraria } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.receberTaxaETH("", { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Origem obrigatoria");
  });

  /**
   * @notice Verifica depósito de tokens TIC na tesouraria.
   *
   * @dev
   * Antes de depositar, o usuário precisa aprovar a tesouraria.
   */
  it("Deve depositar TIC na tesouraria", async function () {
    const { token, tesouraria, dono } = await implantarTesourariaCarbono();

    const quantidade = ethers.parseUnits("1000", 18);

    await token.approve(await tesouraria.getAddress(), quantidade);

    await tesouraria.depositarTIC(
      quantidade,
      "reserva inicial de recompensas"
    );

    expect(await tesouraria.saldoTIC()).to.equal(quantidade);
    expect(await tesouraria.totalTICRecebido()).to.equal(quantidade);
    expect(await token.balanceOf(await tesouraria.getAddress())).to.equal(
      quantidade
    );

    /**
     * @dev
     * Confere que o dono perdeu a quantidade depositada.
     */
    expect(await token.balanceOf(dono.address)).to.equal(
      ethers.parseUnits("999000", 18)
    );
  });

  /**
   * @notice Verifica bloqueio de depósito TIC com quantidade zero.
   */
  it("Nao deve depositar TIC com quantidade zero", async function () {
    const { tesouraria } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.depositarTIC(0, "deposito invalido")
    ).to.be.revertedWith("Quantidade invalida");
  });

  /**
   * @notice Verifica bloqueio de depósito TIC sem origem.
   */
  it("Nao deve depositar TIC sem origem", async function () {
    const { tesouraria } = await implantarTesourariaCarbono();

    const quantidade = ethers.parseUnits("1000", 18);

    await expect(tesouraria.depositarTIC(quantidade, "")).to.be.revertedWith(
      "Origem obrigatoria"
    );
  });

  /**
   * @notice Verifica se o owner consegue autorizar um contrato.
   */
  it("Deve autorizar contrato", async function () {
    const { tesouraria, contratoAutorizado } =
      await implantarTesourariaCarbono();

    await tesouraria.autorizarContrato(contratoAutorizado.address, true);

    expect(
      await tesouraria.contratosAutorizados(contratoAutorizado.address)
    ).to.equal(true);
  });

  /**
   * @notice Verifica se o owner consegue remover autorização.
   */
  it("Deve remover autorizacao de contrato", async function () {
    const { tesouraria, contratoAutorizado } =
      await implantarTesourariaCarbono();

    await tesouraria.autorizarContrato(contratoAutorizado.address, true);
    await tesouraria.autorizarContrato(contratoAutorizado.address, false);

    expect(
      await tesouraria.contratosAutorizados(contratoAutorizado.address)
    ).to.equal(false);
  });

  /**
   * @notice Verifica bloqueio de autorização para endereço zero.
   */
  it("Nao deve autorizar contrato invalido", async function () {
    const { tesouraria } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.autorizarContrato(ethers.ZeroAddress, true)
    ).to.be.revertedWith("Contrato invalido");
  });

  /**
   * @notice Verifica se usuário comum não consegue autorizar contratos.
   */
  it("Nao deve permitir que usuario comum autorize contrato", async function () {
    const { tesouraria, usuario, contratoAutorizado } =
      await implantarTesourariaCarbono();

    await expect(
      tesouraria
        .connect(usuario)
        .autorizarContrato(contratoAutorizado.address, true)
    )
      .to.be.revertedWithCustomError(tesouraria, "OwnableUnauthorizedAccount")
      .withArgs(usuario.address);
  });

  /**
   * @notice Verifica atualização do endereço do token TIC.
   */
  it("Deve atualizar token TIC", async function () {
    const { tesouraria } = await implantarTesourariaCarbono();

    const novoSuprimento = ethers.parseUnits("500000", 18);

    const TokenImpactoCarbono = await ethers.getContractFactory(
      "TokenImpactoCarbono"
    );

    const novoToken = await TokenImpactoCarbono.deploy(novoSuprimento);

    await tesouraria.atualizarTokenImpactoCarbono(await novoToken.getAddress());

    expect(await tesouraria.tokenImpactoCarbono()).to.equal(
      await novoToken.getAddress()
    );
  });

  /**
   * @notice Verifica bloqueio de atualização para token inválido.
   */
  it("Nao deve atualizar para token TIC invalido", async function () {
    const { tesouraria } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.atualizarTokenImpactoCarbono(ethers.ZeroAddress)
    ).to.be.revertedWith("Token TIC invalido");
  });

  /**
   * @notice Verifica envio de ETH pelo owner.
   */
  it("Deve enviar ETH pelo owner", async function () {
    const { tesouraria, usuario, destinatario } =
      await implantarTesourariaCarbono();

    const valorDeposito = ethers.parseEther("1");
    const valorEnvio = ethers.parseEther("0.4");

    await usuario.sendTransaction({
      to: await tesouraria.getAddress(),
      value: valorDeposito,
    });

    const saldoAntesDestinatario = await ethers.provider.getBalance(
      destinatario.address
    );

    await tesouraria.enviarETH(
      destinatario.address,
      valorEnvio,
      "saque administrativo"
    );

    const saldoDepoisDestinatario = await ethers.provider.getBalance(
      destinatario.address
    );

    expect(saldoDepoisDestinatario - saldoAntesDestinatario).to.equal(
      valorEnvio
    );

    expect(await tesouraria.saldoETH()).to.equal(valorDeposito - valorEnvio);
    expect(await tesouraria.totalETHEnviado()).to.equal(valorEnvio);
  });

  /**
   * @notice Verifica envio de ETH por contrato autorizado.
   */
  it("Deve enviar ETH por contrato autorizado", async function () {
    const { tesouraria, usuario, destinatario, contratoAutorizado } =
      await implantarTesourariaCarbono();

    const valorDeposito = ethers.parseEther("1");
    const valorEnvio = ethers.parseEther("0.2");

    await usuario.sendTransaction({
      to: await tesouraria.getAddress(),
      value: valorDeposito,
    });

    await tesouraria.autorizarContrato(contratoAutorizado.address, true);

    const saldoAntesDestinatario = await ethers.provider.getBalance(
      destinatario.address
    );

    await tesouraria
      .connect(contratoAutorizado)
      .enviarETHAutorizado(
        destinatario.address,
        valorEnvio,
        "pagamento autorizado"
      );

    const saldoDepoisDestinatario = await ethers.provider.getBalance(
      destinatario.address
    );

    expect(saldoDepoisDestinatario - saldoAntesDestinatario).to.equal(
      valorEnvio
    );

    expect(await tesouraria.saldoETH()).to.equal(valorDeposito - valorEnvio);
    expect(await tesouraria.totalETHEnviado()).to.equal(valorEnvio);
  });

  /**
   * @notice Verifica bloqueio de envio ETH por contrato não autorizado.
   */
  it("Nao deve enviar ETH por contrato nao autorizado", async function () {
    const { tesouraria, usuario, destinatario } =
      await implantarTesourariaCarbono();

    await usuario.sendTransaction({
      to: await tesouraria.getAddress(),
      value: ethers.parseEther("1"),
    });

    await expect(
      tesouraria
        .connect(usuario)
        .enviarETHAutorizado(
          destinatario.address,
          ethers.parseEther("0.1"),
          "tentativa nao autorizada"
        )
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  /**
   * @notice Verifica bloqueio de envio ETH com saldo insuficiente.
   */
  it("Nao deve enviar ETH acima do saldo", async function () {
    const { tesouraria, destinatario } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.enviarETH(
        destinatario.address,
        ethers.parseEther("1"),
        "saque sem saldo"
      )
    ).to.be.revertedWith("Saldo ETH insuficiente");
  });

  /**
   * @notice Verifica envio de TIC pelo owner.
   */
  it("Deve enviar TIC pelo owner", async function () {
    const { token, tesouraria, destinatario } =
      await implantarTesourariaCarbono();

    const quantidadeDeposito = ethers.parseUnits("1000", 18);
    const quantidadeEnvio = ethers.parseUnits("250", 18);

    await token.approve(await tesouraria.getAddress(), quantidadeDeposito);

    await tesouraria.depositarTIC(
      quantidadeDeposito,
      "reserva de recompensas"
    );

    await tesouraria.enviarTIC(
      destinatario.address,
      quantidadeEnvio,
      "recompensa manual"
    );

    expect(await token.balanceOf(destinatario.address)).to.equal(
      quantidadeEnvio
    );

    expect(await tesouraria.saldoTIC()).to.equal(
      quantidadeDeposito - quantidadeEnvio
    );

    expect(await tesouraria.totalTICEnviado()).to.equal(quantidadeEnvio);
  });

  /**
   * @notice Verifica envio de TIC por contrato autorizado.
   */
  it("Deve enviar TIC por contrato autorizado", async function () {
    const { token, tesouraria, destinatario, contratoAutorizado } =
      await implantarTesourariaCarbono();

    const quantidadeDeposito = ethers.parseUnits("1000", 18);
    const quantidadeEnvio = ethers.parseUnits("300", 18);

    await token.approve(await tesouraria.getAddress(), quantidadeDeposito);

    await tesouraria.depositarTIC(
      quantidadeDeposito,
      "reserva de staking"
    );

    await tesouraria.autorizarContrato(contratoAutorizado.address, true);

    await tesouraria
      .connect(contratoAutorizado)
      .enviarTICAutorizado(
        destinatario.address,
        quantidadeEnvio,
        "recompensa de staking"
      );

    expect(await token.balanceOf(destinatario.address)).to.equal(
      quantidadeEnvio
    );

    expect(await tesouraria.saldoTIC()).to.equal(
      quantidadeDeposito - quantidadeEnvio
    );

    expect(await tesouraria.totalTICEnviado()).to.equal(quantidadeEnvio);
  });

  /**
   * @notice Verifica bloqueio de envio TIC por contrato não autorizado.
   */
  it("Nao deve enviar TIC por contrato nao autorizado", async function () {
    const { token, tesouraria, usuario, destinatario } =
      await implantarTesourariaCarbono();

    const quantidadeDeposito = ethers.parseUnits("1000", 18);

    await token.approve(await tesouraria.getAddress(), quantidadeDeposito);

    await tesouraria.depositarTIC(
      quantidadeDeposito,
      "reserva de recompensas"
    );

    await expect(
      tesouraria
        .connect(usuario)
        .enviarTICAutorizado(
          destinatario.address,
          ethers.parseUnits("100", 18),
          "tentativa nao autorizada"
        )
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  /**
   * @notice Verifica bloqueio de envio TIC com saldo insuficiente.
   */
  it("Nao deve enviar TIC acima do saldo", async function () {
    const { tesouraria, destinatario } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.enviarTIC(
        destinatario.address,
        ethers.parseUnits("1", 18),
        "saque sem saldo"
      )
    ).to.be.revertedWith("Saldo TIC insuficiente");
  });

  /**
   * @notice Verifica bloqueio de envio para destinatário inválido.
   */
  it("Nao deve enviar ETH ou TIC para destinatario invalido", async function () {
    const { token, tesouraria } = await implantarTesourariaCarbono();

    await expect(
      tesouraria.enviarETH(
        ethers.ZeroAddress,
        ethers.parseEther("0.1"),
        "destino invalido"
      )
    ).to.be.revertedWith("Destinatario invalido");

    const quantidadeDeposito = ethers.parseUnits("1000", 18);

    await token.approve(await tesouraria.getAddress(), quantidadeDeposito);

    await tesouraria.depositarTIC(
      quantidadeDeposito,
      "reserva de recompensas"
    );

    await expect(
      tesouraria.enviarTIC(
        ethers.ZeroAddress,
        ethers.parseUnits("100", 18),
        "destino invalido"
      )
    ).to.be.revertedWith("Destinatario invalido");
  });

  /**
   * @notice Verifica bloqueio de envio com finalidade vazia.
   */
  it("Nao deve enviar ETH ou TIC sem finalidade", async function () {
    const { token, tesouraria, destinatario, usuario } =
      await implantarTesourariaCarbono();

    await usuario.sendTransaction({
      to: await tesouraria.getAddress(),
      value: ethers.parseEther("1"),
    });

    await expect(
      tesouraria.enviarETH(destinatario.address, ethers.parseEther("0.1"), "")
    ).to.be.revertedWith("Finalidade obrigatoria");

    const quantidadeDeposito = ethers.parseUnits("1000", 18);

    await token.approve(await tesouraria.getAddress(), quantidadeDeposito);

    await tesouraria.depositarTIC(
      quantidadeDeposito,
      "reserva de recompensas"
    );

    await expect(
      tesouraria.enviarTIC(destinatario.address, ethers.parseUnits("100", 18), "")
    ).to.be.revertedWith("Finalidade obrigatoria");
  });
});