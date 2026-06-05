/**
 * @file RegistroAposentadorias.test.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Testes automatizados do contrato RegistroAposentadorias.
 *
 * @dev
 * Este arquivo testa a etapa de aposentadoria dos créditos de carbono
 * no protocolo CarbonLedger.
 *
 * A aposentadoria é a baixa definitiva dos créditos. Após aposentados,
 * os créditos são queimados no ERC-1155 e não podem mais circular.
 *
 * Contratos envolvidos:
 *
 * 1. TokenImpactoCarbono;
 * 2. TesourariaCarbono;
 * 3. RegistroOrganizacoes;
 * 4. CreditoCarbonoToken;
 * 5. CertificadoCompensacaoNFT;
 * 6. RegistroAposentadorias.
 *
 * Testes contemplados:
 *
 * 1. Implantação correta;
 * 2. Autorização do RegistroAposentadorias nos contratos de crédito e certificado;
 * 3. Aposentadoria de créditos por comprador ativo;
 * 4. Queima dos créditos ERC-1155;
 * 5. Emissão do certificado NFT ERC-721;
 * 6. Registro da taxa na tesouraria;
 * 7. Bloqueio por usuário não comprador;
 * 8. Bloqueio por saldo insuficiente;
 * 9. Bloqueio por taxa insuficiente;
 * 10. Bloqueios por campos inválidos;
 * 11. Alteração administrativa da taxa de aposentadoria;
 * 12. Atualização dos contratos integrados.
 */

import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("RegistroAposentadorias", function () {
  const TipoOrganizacao = {
    Nenhum: 0,
    Proponente: 1,
    Validador: 2,
    Comprador: 3,
    Administrador: 4,
  };

  /**
   * @notice Implanta todos os contratos necessários para testar a aposentadoria.
   *
   * @dev
   * O comprador recebe créditos ERC-1155 antes dos testes, simulando uma compra
   * já realizada no marketplace.
   */
  async function implantarAmbienteAposentadoria() {
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
     * Implanta o certificado NFT ERC-721.
     */
    const CertificadoCompensacaoNFT = await ethers.getContractFactory(
      "CertificadoCompensacaoNFT"
    );

    const certificado = await CertificadoCompensacaoNFT.deploy();

    /**
     * @dev
     * Implanta o registro de aposentadorias.
     */
    const RegistroAposentadorias = await ethers.getContractFactory(
      "RegistroAposentadorias"
    );

    const registroAposentadorias = await RegistroAposentadorias.deploy(
      await registroOrganizacoes.getAddress(),
      await creditoCarbonoToken.getAddress(),
      await certificado.getAddress(),
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
     * Transfere parte dos créditos ao comprador, simulando uma compra
     * já realizada no marketplace.
     */
    await creditoCarbonoToken
      .connect(proponente)
      .safeTransferFrom(
        proponente.address,
        comprador.address,
        idLote,
        1000,
        "0x"
      );

    /**
     * @dev
     * Autoriza o RegistroAposentadorias a queimar créditos.
     */
    await creditoCarbonoToken.autorizarContrato(
      await registroAposentadorias.getAddress(),
      true
    );

    /**
     * @dev
     * Autoriza o RegistroAposentadorias a emitir certificados.
     */
    await certificado.autorizarContrato(
      await registroAposentadorias.getAddress(),
      true
    );

    return {
      token,
      tesouraria,
      registroOrganizacoes,
      creditoCarbonoToken,
      certificado,
      registroAposentadorias,
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
   * @notice Dados padrão de aposentadoria.
   */
  function dadosAposentadoriaPadrao() {
    return {
      quantidade: 500,
      motivo: "Compensacao das emissoes corporativas do ano de 2026",
      uriRelatorio: "ipfs://carbonledger/relatorio-aposentadoria-1.json",
      uriCertificado: "ipfs://carbonledger/certificado-aposentadoria-1.json",
    };
  }

  it("Deve implantar com contratos e parametros corretos", async function () {
    const {
      registroAposentadorias,
      registroOrganizacoes,
      creditoCarbonoToken,
      certificado,
      tesouraria,
      dono,
    } = await implantarAmbienteAposentadoria();

    expect(await registroAposentadorias.owner()).to.equal(dono.address);

    expect(await registroAposentadorias.registroOrganizacoes()).to.equal(
      await registroOrganizacoes.getAddress()
    );

    expect(await registroAposentadorias.creditoCarbonoToken()).to.equal(
      await creditoCarbonoToken.getAddress()
    );

    expect(await registroAposentadorias.certificadoCompensacaoNFT()).to.equal(
      await certificado.getAddress()
    );

    expect(await registroAposentadorias.tesourariaCarbono()).to.equal(
      await tesouraria.getAddress()
    );

    expect(await registroAposentadorias.totalAposentadorias()).to.equal(0n);
    expect(await registroAposentadorias.taxaAposentadoria()).to.equal(
      ethers.parseEther("0.0005")
    );
  });

  it("Nao deve implantar com enderecos invalidos", async function () {
    const {
      registroOrganizacoes,
      creditoCarbonoToken,
      certificado,
      tesouraria,
    } = await implantarAmbienteAposentadoria();

    const RegistroAposentadorias = await ethers.getContractFactory(
      "RegistroAposentadorias"
    );

    await expect(
      RegistroAposentadorias.deploy(
        ethers.ZeroAddress,
        await creditoCarbonoToken.getAddress(),
        await certificado.getAddress(),
        await tesouraria.getAddress()
      )
    ).to.be.revertedWith("Registro organizacoes invalido");

    await expect(
      RegistroAposentadorias.deploy(
        await registroOrganizacoes.getAddress(),
        ethers.ZeroAddress,
        await certificado.getAddress(),
        await tesouraria.getAddress()
      )
    ).to.be.revertedWith("Token de credito invalido");

    await expect(
      RegistroAposentadorias.deploy(
        await registroOrganizacoes.getAddress(),
        await creditoCarbonoToken.getAddress(),
        ethers.ZeroAddress,
        await tesouraria.getAddress()
      )
    ).to.be.revertedWith("Certificado invalido");

    await expect(
      RegistroAposentadorias.deploy(
        await registroOrganizacoes.getAddress(),
        await creditoCarbonoToken.getAddress(),
        await certificado.getAddress(),
        ethers.ZeroAddress
      )
    ).to.be.revertedWith("Tesouraria invalida");
  });

  it("Deve aposentar creditos, queimar ERC1155, registrar taxa e emitir certificado", async function () {
    const {
      registroAposentadorias,
      creditoCarbonoToken,
      certificado,
      tesouraria,
      comprador,
      idLote,
    } = await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await registroAposentadorias
      .connect(comprador)
      .aposentarCreditos(
        idLote,
        dados.quantidade,
        dados.motivo,
        dados.uriRelatorio,
        dados.uriCertificado,
        { value: taxa }
      );

    /**
     * @dev
     * O comprador possuía 1000 créditos e aposentou 500.
     */
    expect(await creditoCarbonoToken.balanceOf(comprador.address, idLote)).to.equal(
      500n
    );

    /**
     * @dev
     * A tesouraria deve receber a taxa de aposentadoria.
     */
    expect(await tesouraria.saldoETH()).to.equal(taxa);
    expect(await tesouraria.totalETHRecebido()).to.equal(taxa);

    /**
     * @dev
     * A aposentadoria deve ter sido registrada.
     */
    expect(await registroAposentadorias.totalAposentadorias()).to.equal(1n);
    expect(
      await registroAposentadorias.aposentadoriaExiste(1)
    ).to.equal(true);

    const aposentadoria = await registroAposentadorias.aposentadorias(1);

    expect(aposentadoria.idAposentadoria).to.equal(1n);
    expect(aposentadoria.comprador).to.equal(comprador.address);
    expect(aposentadoria.idLote).to.equal(BigInt(idLote));
    expect(aposentadoria.quantidade).to.equal(BigInt(dados.quantidade));
    expect(aposentadoria.motivo).to.equal(dados.motivo);
    expect(aposentadoria.uriRelatorio).to.equal(dados.uriRelatorio);
    expect(aposentadoria.idCertificado).to.equal(1n);
    expect(aposentadoria.dataAposentadoria).to.be.greaterThan(0n);

    /**
     * @dev
     * Os totais de compensação devem ser atualizados.
     */
    expect(
      await registroAposentadorias.totalCompensadoPorComprador(
        comprador.address
      )
    ).to.equal(BigInt(dados.quantidade));

    expect(
      await registroAposentadorias.totalAposentadoPorLote(idLote)
    ).to.equal(BigInt(dados.quantidade));

    /**
     * @dev
     * O certificado NFT deve ter sido emitido para o comprador.
     */
    expect(await certificado.ownerOf(1)).to.equal(comprador.address);
    expect(await certificado.tokenURI(1)).to.equal(dados.uriCertificado);
    expect(await certificado.totalCertificados()).to.equal(1n);
  });

  it("Deve devolver pagamento excedente ao comprador", async function () {
    const { registroAposentadorias, comprador, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();
    const excedente = ethers.parseEther("0.001");

    const saldoContratoAntes = await ethers.provider.getBalance(
      await registroAposentadorias.getAddress()
    );

    await registroAposentadorias
      .connect(comprador)
      .aposentarCreditos(
        idLote,
        dados.quantidade,
        dados.motivo,
        dados.uriRelatorio,
        dados.uriCertificado,
        { value: taxa + excedente }
      );

    const saldoContratoDepois = await ethers.provider.getBalance(
      await registroAposentadorias.getAddress()
    );

    /**
     * @dev
     * O contrato não deve reter ETH após enviar a taxa à tesouraria
     * e devolver o excedente.
     */
    expect(saldoContratoDepois).to.equal(saldoContratoAntes);
  });

  it("Nao deve permitir aposentadoria por usuario que nao seja comprador ativo", async function () {
    const { registroAposentadorias, usuarioComum, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await expect(
      registroAposentadorias
        .connect(usuarioComum)
        .aposentarCreditos(
          idLote,
          dados.quantidade,
          dados.motivo,
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Somente comprador ativo");
  });

  it("Nao deve permitir aposentadoria com lote invalido", async function () {
    const { registroAposentadorias, comprador } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          0,
          dados.quantidade,
          dados.motivo,
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Lote invalido");
  });

  it("Nao deve permitir aposentadoria com quantidade invalida", async function () {
    const { registroAposentadorias, comprador, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          0,
          dados.motivo,
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Quantidade invalida");
  });

  it("Nao deve permitir aposentadoria sem motivo", async function () {
    const { registroAposentadorias, comprador, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          dados.quantidade,
          "",
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Motivo obrigatorio");
  });

  it("Nao deve permitir aposentadoria sem relatorio", async function () {
    const { registroAposentadorias, comprador, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          dados.quantidade,
          dados.motivo,
          "",
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Relatorio obrigatorio");
  });

  it("Nao deve permitir aposentadoria sem certificado", async function () {
    const { registroAposentadorias, comprador, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          dados.quantidade,
          dados.motivo,
          dados.uriRelatorio,
          "",
          { value: taxa }
        )
    ).to.be.revertedWith("Certificado obrigatorio");
  });

  it("Nao deve permitir aposentadoria com taxa insuficiente", async function () {
    const { registroAposentadorias, comprador, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          dados.quantidade,
          dados.motivo,
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: ethers.parseEther("0.0001") }
        )
    ).to.be.revertedWith("Taxa insuficiente");
  });

  it("Nao deve permitir aposentadoria acima do saldo", async function () {
    const { registroAposentadorias, comprador, idLote } =
      await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          2000,
          dados.motivo,
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Saldo insuficiente");
  });

  it("Nao deve aposentar se contrato nao estiver autorizado a queimar creditos", async function () {
    const {
      registroAposentadorias,
      creditoCarbonoToken,
      comprador,
      idLote,
    } = await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await creditoCarbonoToken.autorizarContrato(
      await registroAposentadorias.getAddress(),
      false
    );

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          dados.quantidade,
          dados.motivo,
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  it("Nao deve aposentar se contrato nao estiver autorizado a emitir certificado", async function () {
    const {
      registroAposentadorias,
      certificado,
      comprador,
      idLote,
    } = await implantarAmbienteAposentadoria();

    const dados = dadosAposentadoriaPadrao();
    const taxa = await registroAposentadorias.taxaAposentadoria();

    await certificado.autorizarContrato(
      await registroAposentadorias.getAddress(),
      false
    );

    await expect(
      registroAposentadorias
        .connect(comprador)
        .aposentarCreditos(
          idLote,
          dados.quantidade,
          dados.motivo,
          dados.uriRelatorio,
          dados.uriCertificado,
          { value: taxa }
        )
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  it("Deve alterar taxa de aposentadoria", async function () {
    const { registroAposentadorias } = await implantarAmbienteAposentadoria();

    const novaTaxa = ethers.parseEther("0.001");

    await registroAposentadorias.alterarTaxaAposentadoria(novaTaxa);

    expect(await registroAposentadorias.taxaAposentadoria()).to.equal(
      novaTaxa
    );
  });

  it("Nao deve permitir usuario comum alterar taxa de aposentadoria", async function () {
    const { registroAposentadorias, usuarioComum } =
      await implantarAmbienteAposentadoria();

    await expect(
      registroAposentadorias
        .connect(usuarioComum)
        .alterarTaxaAposentadoria(ethers.parseEther("0.001"))
    )
      .to.be.revertedWithCustomError(
        registroAposentadorias,
        "OwnableUnauthorizedAccount"
      )
      .withArgs(usuarioComum.address);
  });

  it("Deve atualizar contratos integrados", async function () {
    const {
      registroAposentadorias,
      registroOrganizacoes,
      creditoCarbonoToken,
      certificado,
      tesouraria,
    } = await implantarAmbienteAposentadoria();

    await registroAposentadorias.atualizarContratos(
      await registroOrganizacoes.getAddress(),
      await creditoCarbonoToken.getAddress(),
      await certificado.getAddress(),
      await tesouraria.getAddress()
    );

    expect(await registroAposentadorias.registroOrganizacoes()).to.equal(
      await registroOrganizacoes.getAddress()
    );

    expect(await registroAposentadorias.creditoCarbonoToken()).to.equal(
      await creditoCarbonoToken.getAddress()
    );

    expect(await registroAposentadorias.certificadoCompensacaoNFT()).to.equal(
      await certificado.getAddress()
    );

    expect(await registroAposentadorias.tesourariaCarbono()).to.equal(
      await tesouraria.getAddress()
    );
  });
});
