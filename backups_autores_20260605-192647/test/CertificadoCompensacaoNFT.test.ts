/**
 * @file CertificadoCompensacaoNFT.test.ts
 * @author Patrício Alves
 * @notice Testes automatizados do contrato CertificadoCompensacaoNFT.
 *
 * @dev
 * Este arquivo testa o contrato ERC-721 responsável por emitir
 * certificados digitais de compensação de carbono no protocolo CarbonLedger.
 *
 * O certificado NFT não representa crédito de carbono negociável.
 * Ele representa o comprovante digital de que determinada quantidade
 * de créditos foi aposentada.
 *
 * Testes contemplados:
 *
 * 1. Implantação correta do contrato;
 * 2. Autorização de contrato emissor;
 * 3. Emissão de certificado por contrato autorizado;
 * 4. Bloqueio de emissão por endereço não autorizado;
 * 5. Bloqueio de certificado para beneficiário inválido;
 * 6. Bloqueio de aposentadoria inválida;
 * 7. Bloqueio de quantidade inválida;
 * 8. Bloqueio de descrição vazia;
 * 9. Bloqueio de URI vazia;
 * 10. Consulta da tokenURI do certificado.
 */

import { expect } from "chai";
import { network } from "hardhat";

/**
 * @dev
 * Conecta o ambiente Hardhat 3 e disponibiliza o objeto ethers.
 */
const { ethers } = await network.connect();

/**
 * @title Testes do contrato CertificadoCompensacaoNFT
 *
 * @dev
 * O contrato testado emite NFTs ERC-721 que funcionam como certificados
 * únicos de compensação ambiental.
 */
describe("CertificadoCompensacaoNFT", function () {
  /**
   * @notice Implanta uma nova instância do contrato para cada teste.
   *
   * @dev
   * A função auxiliar evita repetição e garante que cada teste comece
   * com um contrato limpo.
   *
   * @return certificado Contrato CertificadoCompensacaoNFT implantado.
   * @return dono Conta que implanta o contrato.
   * @return beneficiario Conta que receberá o certificado.
   * @return contratoAutorizado Conta usada para simular o RegistroAposentadorias.
   * @return usuarioComum Conta sem permissão de emissão.
   */
  async function implantarCertificadoCompensacaoNFT() {
    /**
     * @dev
     * Obtém contas locais do ambiente de teste.
     *
     * dono: proprietário do contrato.
     * beneficiario: empresa ou organização que receberá o NFT.
     * contratoAutorizado: simula o contrato RegistroAposentadorias.
     * usuarioComum: simula uma conta não autorizada.
     */
    const [dono, beneficiario, contratoAutorizado, usuarioComum] =
      await ethers.getSigners();

    /**
     * @dev
     * Obtém a fábrica do contrato ERC-721.
     */
    const CertificadoCompensacaoNFT = await ethers.getContractFactory(
      "CertificadoCompensacaoNFT"
    );

    /**
     * @dev
     * Implanta o contrato.
     */
    const certificado = await CertificadoCompensacaoNFT.deploy();

    return {
      certificado,
      dono,
      beneficiario,
      contratoAutorizado,
      usuarioComum,
    };
  }

  /**
   * @notice Verifica se o contrato é implantado com nome e símbolo corretos.
   */
  it("Deve implantar com nome e simbolo corretos", async function () {
    const { certificado } = await implantarCertificadoCompensacaoNFT();

    expect(await certificado.name()).to.equal(
      "Certificado de Compensacao CarbonLedger"
    );

    expect(await certificado.symbol()).to.equal("CCLC");
  });

  /**
   * @notice Verifica se o dono consegue autorizar um contrato emissor.
   *
   * @dev
   * No fluxo final, o contrato autorizado será o RegistroAposentadorias.
   */
  it("Deve permitir que o dono autorize contrato emissor", async function () {
    const { certificado, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    await certificado.autorizarContrato(contratoAutorizado.address, true);

    expect(
      await certificado.contratosAutorizados(contratoAutorizado.address)
    ).to.equal(true);
  });

  /**
   * @notice Verifica se uma conta comum não consegue autorizar contratos.
   *
   * @dev
   * A função autorizarContrato é protegida por onlyOwner.
   */
  it("Nao deve permitir que usuario comum autorize contrato emissor", async function () {
    const { certificado, contratoAutorizado, usuarioComum } =
      await implantarCertificadoCompensacaoNFT();

    await expect(
      certificado
        .connect(usuarioComum)
        .autorizarContrato(contratoAutorizado.address, true)
    )
      .to.be.revertedWithCustomError(
        certificado,
        "OwnableUnauthorizedAccount"
      )
      .withArgs(usuarioComum.address);
  });

  /**
   * @notice Verifica se um contrato autorizado consegue emitir certificado.
   *
   * @dev
   * Após a emissão:
   *
   * - o beneficiário deve ser dono do NFT;
   * - o total de certificados deve aumentar;
   * - os dados do certificado devem ficar registrados;
   * - a tokenURI deve retornar a URI informada.
   */
  it("Deve permitir que contrato autorizado emita certificado", async function () {
    const { certificado, beneficiario, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    const idAposentadoria = 1;
    const quantidadeCompensada = 500;
    const descricao = "Compensacao de 500 tCO2e pela aposentadoria de creditos";
    const uriCertificado = "ipfs://carbonledger/certificado-1.json";

    /**
     * @dev
     * Autoriza a conta contratoAutorizado a emitir certificados.
     */
    await certificado.autorizarContrato(contratoAutorizado.address, true);

    /**
     * @dev
     * Emite o certificado usando a conta autorizada.
     */
    await certificado
      .connect(contratoAutorizado)
      .emitirCertificado(
        beneficiario.address,
        idAposentadoria,
        quantidadeCompensada,
        descricao,
        uriCertificado
      );

    const idCertificado = 1;

    /**
     * @dev
     * Confere se o beneficiário recebeu o NFT.
     */
    expect(await certificado.ownerOf(idCertificado)).to.equal(
      beneficiario.address
    );

    /**
     * @dev
     * Confere o contador total de certificados.
     */
    expect(await certificado.totalCertificados()).to.equal(1);

    /**
     * @dev
     * Confere os dados registrados no mapping certificados.
     */
    const dadosCertificado = await certificado.certificados(idCertificado);

    expect(dadosCertificado.idCertificado).to.equal(idCertificado);
    expect(dadosCertificado.idAposentadoria).to.equal(idAposentadoria);
    expect(dadosCertificado.beneficiario).to.equal(beneficiario.address);
    expect(dadosCertificado.quantidadeCompensada).to.equal(
      quantidadeCompensada
    );
    expect(dadosCertificado.descricao).to.equal(descricao);
    expect(dadosCertificado.uriCertificado).to.equal(uriCertificado);

    /**
     * @dev
     * Confere a URI pública do NFT.
     */
    expect(await certificado.tokenURI(idCertificado)).to.equal(uriCertificado);
  });

  /**
   * @notice Verifica se endereço não autorizado é bloqueado ao emitir certificado.
   */
  it("Nao deve permitir emissao por endereco nao autorizado", async function () {
    const { certificado, beneficiario, usuarioComum } =
      await implantarCertificadoCompensacaoNFT();

    await expect(
      certificado
        .connect(usuarioComum)
        .emitirCertificado(
          beneficiario.address,
          1,
          500,
          "Compensacao de carbono",
          "ipfs://carbonledger/certificado-1.json"
        )
    ).to.be.revertedWith("Contrato nao autorizado");
  });

  /**
   * @notice Verifica se o contrato bloqueia certificado para endereço zero.
   */
  it("Nao deve permitir emissao para beneficiario invalido", async function () {
    const { certificado, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    await certificado.autorizarContrato(contratoAutorizado.address, true);

    await expect(
      certificado
        .connect(contratoAutorizado)
        .emitirCertificado(
          ethers.ZeroAddress,
          1,
          500,
          "Compensacao de carbono",
          "ipfs://carbonledger/certificado-1.json"
        )
    ).to.be.revertedWith("Beneficiario invalido");
  });

  /**
   * @notice Verifica se o contrato bloqueia id de aposentadoria inválido.
   */
  it("Nao deve permitir emissao com aposentadoria invalida", async function () {
    const { certificado, beneficiario, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    await certificado.autorizarContrato(contratoAutorizado.address, true);

    await expect(
      certificado
        .connect(contratoAutorizado)
        .emitirCertificado(
          beneficiario.address,
          0,
          500,
          "Compensacao de carbono",
          "ipfs://carbonledger/certificado-1.json"
        )
    ).to.be.revertedWith("Aposentadoria invalida");
  });

  /**
   * @notice Verifica se o contrato bloqueia quantidade compensada igual a zero.
   */
  it("Nao deve permitir emissao com quantidade invalida", async function () {
    const { certificado, beneficiario, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    await certificado.autorizarContrato(contratoAutorizado.address, true);

    await expect(
      certificado
        .connect(contratoAutorizado)
        .emitirCertificado(
          beneficiario.address,
          1,
          0,
          "Compensacao de carbono",
          "ipfs://carbonledger/certificado-1.json"
        )
    ).to.be.revertedWith("Quantidade invalida");
  });

  /**
   * @notice Verifica se o contrato bloqueia descrição vazia.
   */
  it("Nao deve permitir emissao com descricao vazia", async function () {
    const { certificado, beneficiario, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    await certificado.autorizarContrato(contratoAutorizado.address, true);

    await expect(
      certificado
        .connect(contratoAutorizado)
        .emitirCertificado(
          beneficiario.address,
          1,
          500,
          "",
          "ipfs://carbonledger/certificado-1.json"
        )
    ).to.be.revertedWith("Descricao obrigatoria");
  });

  /**
   * @notice Verifica se o contrato bloqueia URI vazia.
   */
  it("Nao deve permitir emissao com URI vazia", async function () {
    const { certificado, beneficiario, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    await certificado.autorizarContrato(contratoAutorizado.address, true);

    await expect(
      certificado
        .connect(contratoAutorizado)
        .emitirCertificado(
          beneficiario.address,
          1,
          500,
          "Compensacao de carbono",
          ""
        )
    ).to.be.revertedWith("URI obrigatoria");
  });

  /**
   * @notice Verifica se é possível emitir mais de um certificado.
   *
   * @dev
   * Cada emissão deve gerar um NFT com tokenId diferente.
   */
  it("Deve emitir certificados sequenciais", async function () {
    const { certificado, beneficiario, contratoAutorizado } =
      await implantarCertificadoCompensacaoNFT();

    await certificado.autorizarContrato(contratoAutorizado.address, true);

    await certificado
      .connect(contratoAutorizado)
      .emitirCertificado(
        beneficiario.address,
        1,
        500,
        "Primeira compensacao",
        "ipfs://carbonledger/certificado-1.json"
      );

    await certificado
      .connect(contratoAutorizado)
      .emitirCertificado(
        beneficiario.address,
        2,
        800,
        "Segunda compensacao",
        "ipfs://carbonledger/certificado-2.json"
      );

    expect(await certificado.totalCertificados()).to.equal(2);

    expect(await certificado.ownerOf(1)).to.equal(beneficiario.address);
    expect(await certificado.ownerOf(2)).to.equal(beneficiario.address);

    expect(await certificado.tokenURI(1)).to.equal(
      "ipfs://carbonledger/certificado-1.json"
    );

    expect(await certificado.tokenURI(2)).to.equal(
      "ipfs://carbonledger/certificado-2.json"
    );
  });
});