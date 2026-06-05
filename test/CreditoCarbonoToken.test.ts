/**
 * @file CreditoCarbonoToken.test.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Testes automatizados do contrato CreditoCarbonoToken.
 *
 * @dev
 * Este arquivo testa o token ERC-1155 responsável por representar
 * lotes de créditos de carbono no protocolo CarbonLedger.
 *
 * Testes contemplados:
 *
 * 1. Implantação do contrato com URI base;
 * 2. Emissão de lote de créditos de carbono;
 * 3. Bloqueio de emissão para endereço inválido;
 * 4. Bloqueio de lote duplicado;
 * 5. Restrição de emissão apenas ao dono;
 * 6. Autorização de contrato para queima;
 * 7. Queima de créditos por contrato autorizado;
 * 8. Bloqueio de queima por endereço não autorizado.
 */

import { expect } from "chai";
import { network } from "hardhat";

/**
 * @dev
 * Conecta o ambiente de testes do Hardhat 3 e disponibiliza o ethers.
 */
const { ethers } = await network.connect();

/**
 * @title Testes do contrato CreditoCarbonoToken
 *
 * @dev
 * O contrato CreditoCarbonoToken representa os créditos de carbono
 * por meio do padrão ERC-1155.
 */
describe("CreditoCarbonoToken", function () {
  /**
   * @notice Implanta uma instância limpa do contrato para cada teste.
   *
   * @dev
   * A função auxiliar evita repetição de código.
   *
   * @return token Contrato CreditoCarbonoToken implantado.
   * @return dono Conta que implanta o contrato.
   * @return proponente Conta que receberá créditos de carbono.
   * @return comprador Conta comum usada nos testes.
   * @return contratoAutorizado Conta usada para simular um contrato autorizado.
   * @return uriBase URI base dos metadados ERC-1155.
   */
  async function implantarCreditoCarbonoToken() {
    /**
     * @dev
     * Obtém contas locais fornecidas pelo Hardhat.
     */
    const [dono, proponente, comprador, contratoAutorizado] =
      await ethers.getSigners();

    /**
     * @dev
     * URI base simulada para os metadados dos lotes.
     *
     * Em produção, essa URI poderia apontar para IPFS.
     */
    const uriBase = "ipfs://carbonledger/{id}.json";

    /**
     * @dev
     * Obtém a fábrica do contrato.
     */
    const CreditoCarbonoToken = await ethers.getContractFactory(
      "CreditoCarbonoToken"
    );

    /**
     * @dev
     * Implanta o contrato passando a URI base.
     */
    const token = await CreditoCarbonoToken.deploy(uriBase);

    return {
      token,
      dono,
      proponente,
      comprador,
      contratoAutorizado,
      uriBase,
    };
  }

  /**
   * @notice Verifica se o contrato foi implantado com a URI base correta.
   */
  it("Deve implantar com URI base correta", async function () {
    const { token, uriBase } = await implantarCreditoCarbonoToken();

    /**
     * @dev
     * No ERC-1155, a função uri(id) retorna a URI base configurada.
     */
    expect(await token.uri(1)).to.equal(uriBase);
  });

  /**
   * @notice Verifica se o dono consegue emitir um lote de créditos.
   *
   * @dev
   * Após a emissão:
   * - o destinatário deve receber o saldo;
   * - o lote deve ficar registrado;
   * - o lote deve estar marcado como emitido;
   * - o lote deve estar ativo.
   */
  it("Deve permitir que o dono emita um lote de creditos", async function () {
    const { token, proponente } = await implantarCreditoCarbonoToken();

    const idLote = 1;
    const idProjeto = 101;
    const quantidade = 7000;
    const anoReferencia = 2026;

    await token.emitirCreditos(
      proponente.address,
      idLote,
      idProjeto,
      quantidade,
      anoReferencia
    );

    /**
     * @dev
     * Confere saldo ERC-1155 do proponente no lote emitido.
     */
    expect(await token.balanceOf(proponente.address, idLote)).to.equal(
      quantidade
    );

    /**
     * @dev
     * Confere se o lote foi marcado como emitido.
     */
    expect(await token.loteEmitido(idLote)).to.equal(true);

    /**
     * @dev
     * Confere dados registrados do lote.
     */
    const lote = await token.lotesCredito(idLote);

    expect(lote.idProjeto).to.equal(idProjeto);
    expect(lote.quantidadeEmitida).to.equal(quantidade);
    expect(lote.quantidadeAposentada).to.equal(0);
    expect(lote.anoReferencia).to.equal(anoReferencia);
    expect(lote.ativo).to.equal(true);
  });

  /**
   * @notice Verifica se o contrato bloqueia emissão para endereço zero.
   */
  it("Nao deve permitir emissao para endereco zero", async function () {
    const { token } = await implantarCreditoCarbonoToken();

    await expect(
      token.emitirCreditos(ethers.ZeroAddress, 1, 101, 7000, 2026)
    ).to.be.revertedWith("Destinatario invalido");
  });

  /**
   * @notice Verifica se o contrato bloqueia emissão com idLote inválido.
   */
  it("Nao deve permitir emissao com lote invalido", async function () {
    const { token, proponente } = await implantarCreditoCarbonoToken();

    await expect(
      token.emitirCreditos(proponente.address, 0, 101, 7000, 2026)
    ).to.be.revertedWith("Lote invalido");
  });

  /**
   * @notice Verifica se o contrato bloqueia emissão com idProjeto inválido.
   */
  it("Nao deve permitir emissao com projeto invalido", async function () {
    const { token, proponente } = await implantarCreditoCarbonoToken();

    await expect(
      token.emitirCreditos(proponente.address, 1, 0, 7000, 2026)
    ).to.be.revertedWith("Projeto invalido");
  });

  /**
   * @notice Verifica se o contrato bloqueia emissão com quantidade zero.
   */
  it("Nao deve permitir emissao com quantidade zero", async function () {
    const { token, proponente } = await implantarCreditoCarbonoToken();

    await expect(
      token.emitirCreditos(proponente.address, 1, 101, 0, 2026)
    ).to.be.revertedWith("Quantidade invalida");
  });

  /**
   * @notice Verifica se o contrato bloqueia emissão com ano inválido.
   */
  it("Nao deve permitir emissao com ano invalido", async function () {
    const { token, proponente } = await implantarCreditoCarbonoToken();

    await expect(
      token.emitirCreditos(proponente.address, 1, 101, 7000, 0)
    ).to.be.revertedWith("Ano invalido");
  });

  /**
   * @notice Verifica se o contrato impede emissão duplicada do mesmo lote.
   */
  it("Nao deve permitir emissao duplicada do mesmo lote", async function () {
    const { token, proponente } = await implantarCreditoCarbonoToken();

    await token.emitirCreditos(proponente.address, 1, 101, 7000, 2026);

    await expect(
      token.emitirCreditos(proponente.address, 1, 101, 7000, 2026)
    ).to.be.revertedWith("Lote ja emitido");
  });

  /**
   * @notice Verifica se apenas o dono consegue emitir créditos.
   *
   * @dev
   * A função emitirCreditos usa onlyOwner.
   */
  it("Nao deve permitir que usuario comum emita creditos", async function () {
    const { token, comprador, proponente } =
      await implantarCreditoCarbonoToken();

    await expect(
      token
        .connect(comprador)
        .emitirCreditos(proponente.address, 1, 101, 7000, 2026)
    )
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(comprador.address);
  });

  /**
   * @notice Verifica se o dono consegue autorizar outro contrato.
   *
   * @dev
   * No projeto final, o contrato autorizado será o RegistroAposentadorias.
   */
  it("Deve permitir que o dono autorize contrato para queima", async function () {
    const { token, contratoAutorizado } =
      await implantarCreditoCarbonoToken();

    await token.autorizarContrato(contratoAutorizado.address, true);

    expect(await token.contratosAutorizados(contratoAutorizado.address)).to.equal(
      true
    );
  });

  /**
   * @notice Verifica se um contrato autorizado consegue queimar créditos.
   *
   * @dev
   * A queima representa a aposentadoria do crédito de carbono.
   */
  it("Deve permitir que contrato autorizado queime creditos", async function () {
    const { token, proponente, contratoAutorizado } =
      await implantarCreditoCarbonoToken();

    const idLote = 1;
    const idProjeto = 101;
    const quantidadeEmitida = 7000;
    const quantidadeQueimada = 500;
    const anoReferencia = 2026;

    /**
     * @dev
     * Primeiro, o dono emite créditos para o proponente.
     */
    await token.emitirCreditos(
      proponente.address,
      idLote,
      idProjeto,
      quantidadeEmitida,
      anoReferencia
    );

    /**
     * @dev
     * Autoriza a conta contratoAutorizado a simular o contrato
     * RegistroAposentadorias.
     */
    await token.autorizarContrato(contratoAutorizado.address, true);

    /**
     * @dev
     * A conta autorizada queima créditos da carteira do proponente.
     */
    await token
      .connect(contratoAutorizado)
      .queimarCreditos(proponente.address, idLote, quantidadeQueimada);

    /**
     * @dev
     * Confere se o saldo foi reduzido.
     */
    expect(await token.balanceOf(proponente.address, idLote)).to.equal(
      quantidadeEmitida - quantidadeQueimada
    );

    /**
     * @dev
     * Confere se a quantidade aposentada foi registrada no lote.
     */
    const lote = await token.lotesCredito(idLote);

    expect(lote.quantidadeAposentada).to.equal(quantidadeQueimada);
  });

  /**
   * @notice Verifica se endereço não autorizado é bloqueado ao tentar queimar.
   */
  it("Nao deve permitir que endereco nao autorizado queime creditos", async function () {
    const { token, proponente, comprador } =
      await implantarCreditoCarbonoToken();

    await token.emitirCreditos(proponente.address, 1, 101, 7000, 2026);

    await expect(
      token.connect(comprador).queimarCreditos(proponente.address, 1, 100)
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  /**
   * @notice Verifica se a queima falha quando o saldo é insuficiente.
   */
  it("Nao deve permitir queima acima do saldo disponivel", async function () {
    const { token, proponente, contratoAutorizado } =
      await implantarCreditoCarbonoToken();

    await token.emitirCreditos(proponente.address, 1, 101, 7000, 2026);
    await token.autorizarContrato(contratoAutorizado.address, true);

    await expect(
      token.connect(contratoAutorizado).queimarCreditos(
        proponente.address,
        1,
        8000
      )
    ).to.be.revertedWith("Saldo insuficiente");
  });
});
