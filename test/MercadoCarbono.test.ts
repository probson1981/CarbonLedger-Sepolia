/**
 * @file MercadoCarbono.test.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Testes automatizados do contrato MercadoCarbono.
 *
 * @dev
 * Este arquivo testa o marketplace de créditos de carbono do protocolo
 * CarbonLedger.
 *
 * Contratos envolvidos:
 *
 * 1. TokenImpactoCarbono;
 * 2. TesourariaCarbono;
 * 3. RegistroOrganizacoes;
 * 4. CreditoCarbonoToken;
 * 5. MercadoCarbono.
 *
 * Testes contemplados:
 *
 * 1. Implantação correta do marketplace;
 * 2. Criação de oferta por vendedor cadastrado;
 * 3. Bloqueio de oferta sem saldo;
 * 4. Bloqueio de oferta sem aprovação ERC-1155;
 * 5. Compra parcial de créditos;
 * 6. Compra total de créditos;
 * 7. Cálculo da taxa de marketplace;
 * 8. Envio da taxa para a tesouraria;
 * 9. Envio do valor líquido ao vendedor;
 * 10. Cancelamento de oferta;
 * 11. Bloqueios de compra inválida.
 */

import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MercadoCarbono", function () {
  const TipoOrganizacao = {
    Nenhum: 0,
    Proponente: 1,
    Validador: 2,
    Comprador: 3,
    Administrador: 4,
  };

  const EstadoOferta = {
    Aberta: 0n,
    ParcialmenteVendida: 1n,
    Encerrada: 2n,
    Cancelada: 3n,
  };

  /**
   * @notice Implanta o ambiente necessário para testar o marketplace.
   *
   * @dev
   * O proponente recebe créditos ERC-1155 e aprova o MercadoCarbono
   * para movimentá-los.
   */
  async function implantarAmbienteMercado() {
    const [
      dono,
      proponente,
      comprador,
      comprador2,
      usuarioComum,
      outroUsuario,
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
     * Cadastra organizações.
     */
    await registroOrganizacoes.cadastrarOrganizacao(
      proponente.address,
      "Usina Solar Boa Energia",
      "CNPJ-001",
      "ipfs://carbonledger/proponente.json",
      TipoOrganizacao.Proponente
    );

    await registroOrganizacoes.cadastrarOrganizacao(
      comprador.address,
      "Comprador Industrial",
      "COMP-001",
      "ipfs://carbonledger/comprador.json",
      TipoOrganizacao.Comprador
    );

    await registroOrganizacoes.cadastrarOrganizacao(
      comprador2.address,
      "Comprador Comercial",
      "COMP-002",
      "ipfs://carbonledger/comprador-2.json",
      TipoOrganizacao.Comprador
    );

    /**
     * @dev
     * Emite créditos de carbono para o proponente.
     */
    const idLote = 1;
    const idProjeto = 101;
    const quantidadeEmitida = 7000;
    const anoReferencia = 2026;

    await creditoCarbonoToken.emitirCreditos(
      proponente.address,
      idLote,
      idProjeto,
      quantidadeEmitida,
      anoReferencia
    );

    /**
     * @dev
     * Aprova o marketplace para movimentar os créditos do proponente.
     */
    await creditoCarbonoToken
      .connect(proponente)
      .setApprovalForAll(await mercado.getAddress(), true);

    return {
      token,
      tesouraria,
      registroOrganizacoes,
      creditoCarbonoToken,
      mercado,
      dono,
      proponente,
      comprador,
      comprador2,
      usuarioComum,
      outroUsuario,
      idLote,
      idProjeto,
      quantidadeEmitida,
      anoReferencia,
    };
  }

  /**
   * @notice Cria uma oferta padrão para uso em testes.
   */
  async function implantarComOfertaPadrao() {
    const ambiente = await implantarAmbienteMercado();

    const quantidadeOferta = 1000n;
    const precoPorCredito = ethers.parseEther("0.001");

    await ambiente.mercado
      .connect(ambiente.proponente)
      .criarOferta(
        ambiente.idLote,
        quantidadeOferta,
        precoPorCredito
      );

    return {
      ...ambiente,
      idOferta: 1,
      quantidadeOferta,
      precoPorCredito,
    };
  }

  it("Deve implantar com contratos e parametros corretos", async function () {
    const {
      mercado,
      creditoCarbonoToken,
      registroOrganizacoes,
      tesouraria,
      dono,
    } = await implantarAmbienteMercado();

    expect(await mercado.owner()).to.equal(dono.address);

    expect(await mercado.creditoCarbonoToken()).to.equal(
      await creditoCarbonoToken.getAddress()
    );

    expect(await mercado.registroOrganizacoes()).to.equal(
      await registroOrganizacoes.getAddress()
    );

    expect(await mercado.tesourariaCarbono()).to.equal(
      await tesouraria.getAddress()
    );

    expect(await mercado.taxaMarketplaceBps()).to.equal(300n);
    expect(await mercado.BASE_BPS()).to.equal(10000n);
    expect(await mercado.totalOfertas()).to.equal(0n);
  });

  it("Deve criar oferta de creditos", async function () {
    const { mercado, proponente, idLote } = await implantarAmbienteMercado();

    const quantidade = 1000n;
    const precoPorCredito = ethers.parseEther("0.001");

    await mercado
      .connect(proponente)
      .criarOferta(idLote, quantidade, precoPorCredito);

    expect(await mercado.totalOfertas()).to.equal(1n);

    const oferta = await mercado.ofertas(1);

    expect(oferta.idOferta).to.equal(1n);
    expect(oferta.vendedor).to.equal(proponente.address);
    expect(oferta.idLote).to.equal(BigInt(idLote));
    expect(oferta.quantidadeTotal).to.equal(quantidade);
    expect(oferta.quantidadeDisponivel).to.equal(quantidade);
    expect(oferta.precoPorCredito).to.equal(precoPorCredito);
    expect(oferta.estadoOferta).to.equal(EstadoOferta.Aberta);

    expect(await mercado.ofertaDisponivel(1)).to.equal(true);
  });

  it("Nao deve criar oferta com lote, quantidade ou preco invalidos", async function () {
    const { mercado, proponente, idLote } = await implantarAmbienteMercado();

    await expect(
      mercado.connect(proponente).criarOferta(0, 1000, ethers.parseEther("0.001"))
    ).to.be.revertedWith("Lote invalido");

    await expect(
      mercado.connect(proponente).criarOferta(idLote, 0, ethers.parseEther("0.001"))
    ).to.be.revertedWith("Quantidade invalida");

    await expect(
      mercado.connect(proponente).criarOferta(idLote, 1000, 0)
    ).to.be.revertedWith("Preco invalido");
  });

  it("Nao deve criar oferta por vendedor nao cadastrado", async function () {
    const { mercado, usuarioComum, idLote } = await implantarAmbienteMercado();

    await expect(
      mercado
        .connect(usuarioComum)
        .criarOferta(idLote, 1000, ethers.parseEther("0.001"))
    ).to.be.revertedWith("Vendedor nao cadastrado ou inativo");
  });

  it("Nao deve criar oferta sem saldo suficiente", async function () {
    const { mercado, proponente, idLote } = await implantarAmbienteMercado();

    await expect(
      mercado
        .connect(proponente)
        .criarOferta(idLote, 8000, ethers.parseEther("0.001"))
    ).to.be.revertedWith("Saldo insuficiente");
  });

  it("Nao deve criar oferta sem aprovacao do marketplace", async function () {
    const { mercado, creditoCarbonoToken, proponente, idLote } =
      await implantarAmbienteMercado();

    await creditoCarbonoToken
      .connect(proponente)
      .setApprovalForAll(await mercado.getAddress(), false);

    await expect(
      mercado
        .connect(proponente)
        .criarOferta(idLote, 1000, ethers.parseEther("0.001"))
    ).to.be.revertedWith("Marketplace nao aprovado");
  });

  it("Deve calcular compra corretamente", async function () {
    const { mercado, idOferta } = await implantarComOfertaPadrao();

    const quantidadeCompra = 100n;

    const [valorTotal, valorTaxa, valorVendedor] =
      await mercado.calcularCompra(idOferta, quantidadeCompra);

    expect(valorTotal).to.equal(ethers.parseEther("0.1"));
    expect(valorTaxa).to.equal(ethers.parseEther("0.003"));
    expect(valorVendedor).to.equal(ethers.parseEther("0.097"));
  });

  it("Deve comprar creditos parcialmente e enviar taxa para a tesouraria", async function () {
    const {
      mercado,
      tesouraria,
      creditoCarbonoToken,
      proponente,
      comprador,
      idLote,
      idOferta,
    } = await implantarComOfertaPadrao();

    const quantidadeCompra = 100n;
    const valorTotal = ethers.parseEther("0.1");
    const valorTaxa = ethers.parseEther("0.003");
    const valorVendedor = ethers.parseEther("0.097");

    const saldoAntesVendedor = await ethers.provider.getBalance(
      proponente.address
    );

    await mercado
      .connect(comprador)
      .comprarCreditos(idOferta, quantidadeCompra, { value: valorTotal });

    const saldoDepoisVendedor = await ethers.provider.getBalance(
      proponente.address
    );

    /**
     * @dev
     * O vendedor não paga gas nessa transação, portanto o aumento de saldo
     * deve ser exatamente o valor líquido.
     */
    expect(saldoDepoisVendedor - saldoAntesVendedor).to.equal(valorVendedor);

    expect(await tesouraria.saldoETH()).to.equal(valorTaxa);
    expect(await tesouraria.totalETHRecebido()).to.equal(valorTaxa);

    expect(await creditoCarbonoToken.balanceOf(comprador.address, idLote)).to.equal(
      quantidadeCompra
    );

    expect(await creditoCarbonoToken.balanceOf(proponente.address, idLote)).to.equal(
      6900n
    );

    const oferta = await mercado.ofertas(idOferta);

    expect(oferta.quantidadeDisponivel).to.equal(900n);
    expect(oferta.estadoOferta).to.equal(EstadoOferta.ParcialmenteVendida);
  });

  it("Deve comprar todos os creditos e encerrar oferta", async function () {
    const {
      mercado,
      creditoCarbonoToken,
      comprador,
      idLote,
      idOferta,
      quantidadeOferta,
    } = await implantarComOfertaPadrao();

    const valorTotal = ethers.parseEther("1");

    await mercado
      .connect(comprador)
      .comprarCreditos(idOferta, quantidadeOferta, { value: valorTotal });

    const oferta = await mercado.ofertas(idOferta);

    expect(oferta.quantidadeDisponivel).to.equal(0n);
    expect(oferta.estadoOferta).to.equal(EstadoOferta.Encerrada);
    expect(await mercado.ofertaDisponivel(idOferta)).to.equal(false);

    expect(await creditoCarbonoToken.balanceOf(comprador.address, idLote)).to.equal(
      quantidadeOferta
    );
  });

  it("Deve devolver pagamento excedente ao comprador", async function () {
    const { mercado, comprador, idOferta } = await implantarComOfertaPadrao();

    const quantidadeCompra = 100n;
    const valorTotal = ethers.parseEther("0.1");
    const valorExcedente = ethers.parseEther("0.05");
    const pagamento = valorTotal + valorExcedente;

    const saldoContratoAntes = await ethers.provider.getBalance(
      await mercado.getAddress()
    );

    await mercado
      .connect(comprador)
      .comprarCreditos(idOferta, quantidadeCompra, { value: pagamento });

    const saldoContratoDepois = await ethers.provider.getBalance(
      await mercado.getAddress()
    );

    /**
     * @dev
     * O marketplace não deve reter saldo após pagar vendedor,
     * enviar taxa e devolver excedente.
     */
    expect(saldoContratoDepois).to.equal(saldoContratoAntes);
  });

  it("Nao deve permitir compra por usuario que nao seja comprador ativo", async function () {
    const { mercado, usuarioComum, idOferta } = await implantarComOfertaPadrao();

    await expect(
      mercado
        .connect(usuarioComum)
        .comprarCreditos(idOferta, 100, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Somente comprador ativo");
  });

  it("Nao deve permitir compra com quantidade invalida", async function () {
    const { mercado, comprador, idOferta } = await implantarComOfertaPadrao();

    await expect(
      mercado
        .connect(comprador)
        .comprarCreditos(idOferta, 0, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Quantidade invalida");
  });

  it("Nao deve permitir compra de oferta inexistente", async function () {
    const { mercado, comprador } = await implantarComOfertaPadrao();

    await expect(
      mercado
        .connect(comprador)
        .comprarCreditos(999, 100, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Oferta inexistente");
  });

  it("Nao deve permitir compra acima da quantidade disponivel", async function () {
    const { mercado, comprador, idOferta } = await implantarComOfertaPadrao();

    await expect(
      mercado
        .connect(comprador)
        .comprarCreditos(idOferta, 2000, { value: ethers.parseEther("2") })
    ).to.be.revertedWith("Quantidade indisponivel");
  });

  it("Nao deve permitir compra com pagamento insuficiente", async function () {
    const { mercado, comprador, idOferta } = await implantarComOfertaPadrao();

    await expect(
      mercado
        .connect(comprador)
        .comprarCreditos(idOferta, 100, { value: ethers.parseEther("0.05") })
    ).to.be.revertedWith("Pagamento insuficiente");
  });

  it("Nao deve permitir compra se marketplace perder aprovacao", async function () {
    const {
      mercado,
      creditoCarbonoToken,
      proponente,
      comprador,
      idOferta,
    } = await implantarComOfertaPadrao();

    await creditoCarbonoToken
      .connect(proponente)
      .setApprovalForAll(await mercado.getAddress(), false);

    await expect(
      mercado
        .connect(comprador)
        .comprarCreditos(idOferta, 100, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Marketplace nao aprovado");
  });

  it("Deve cancelar oferta pelo vendedor", async function () {
    const { mercado, proponente, idOferta } = await implantarComOfertaPadrao();

    await mercado.connect(proponente).cancelarOferta(idOferta);

    const oferta = await mercado.ofertas(idOferta);

    expect(oferta.estadoOferta).to.equal(EstadoOferta.Cancelada);
    expect(await mercado.ofertaDisponivel(idOferta)).to.equal(false);
  });

  it("Nao deve cancelar oferta por usuario que nao seja vendedor", async function () {
    const { mercado, comprador, idOferta } = await implantarComOfertaPadrao();

    await expect(
      mercado.connect(comprador).cancelarOferta(idOferta)
    ).to.be.revertedWith("Somente vendedor");
  });

  it("Nao deve comprar oferta cancelada", async function () {
    const { mercado, proponente, comprador, idOferta } =
      await implantarComOfertaPadrao();

    await mercado.connect(proponente).cancelarOferta(idOferta);

    await expect(
      mercado
        .connect(comprador)
        .comprarCreditos(idOferta, 100, { value: ethers.parseEther("0.1") })
    ).to.be.revertedWith("Oferta indisponivel");
  });

  it("Deve alterar taxa de marketplace", async function () {
    const { mercado } = await implantarAmbienteMercado();

    await mercado.alterarTaxaMarketplace(500);

    expect(await mercado.taxaMarketplaceBps()).to.equal(500n);
  });

  it("Nao deve permitir taxa de marketplace acima do limite", async function () {
    const { mercado } = await implantarAmbienteMercado();

    await expect(mercado.alterarTaxaMarketplace(3000)).to.be.revertedWith(
      "Taxa acima do limite"
    );
  });

  it("Nao deve permitir usuario comum alterar taxa", async function () {
    const { mercado, usuarioComum } = await implantarAmbienteMercado();

    await expect(mercado.connect(usuarioComum).alterarTaxaMarketplace(500))
      .to.be.revertedWithCustomError(mercado, "OwnableUnauthorizedAccount")
      .withArgs(usuarioComum.address);
  });

  it("Deve atualizar contratos integrados", async function () {
    const {
      mercado,
      creditoCarbonoToken,
      registroOrganizacoes,
      tesouraria,
    } = await implantarAmbienteMercado();

    await mercado.atualizarContratos(
      await creditoCarbonoToken.getAddress(),
      await registroOrganizacoes.getAddress(),
      await tesouraria.getAddress()
    );

    expect(await mercado.creditoCarbonoToken()).to.equal(
      await creditoCarbonoToken.getAddress()
    );

    expect(await mercado.registroOrganizacoes()).to.equal(
      await registroOrganizacoes.getAddress()
    );

    expect(await mercado.tesourariaCarbono()).to.equal(
      await tesouraria.getAddress()
    );
  });
});
