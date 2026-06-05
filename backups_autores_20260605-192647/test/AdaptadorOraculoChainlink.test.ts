/**
 * @file AdaptadorOraculoChainlink.test.ts
 * @author Patrício Alves
 * @notice Testes automatizados do contrato AdaptadorOraculoChainlink.
 *
 * @dev
 * Este arquivo testa o adaptador de oráculo do protocolo CarbonLedger.
 *
 * Como a rede local Hardhat não possui Price Feed real da Chainlink,
 * os testes usam o contrato MockPriceFeedChainlink.
 *
 * Contratos envolvidos:
 *
 * 1. MockPriceFeedChainlink;
 * 2. AdaptadorOraculoChainlink.
 *
 * Testes contemplados:
 *
 * 1. Implantação correta;
 * 2. Bloqueio de price feed inválido;
 * 3. Consulta do preço bruto;
 * 4. Normalização do preço para 18 casas decimais;
 * 5. Conversão de wei para USD com 18 casas;
 * 6. Conversão de USD com 18 casas para wei;
 * 7. Consulta da descrição, versão e casas decimais;
 * 8. Atualização administrativa do price feed;
 * 9. Bloqueio de atualização por usuário comum;
 * 10. Bloqueio de preço inválido;
 * 11. Bloqueio de preço não atualizado;
 * 12. Bloqueio de rodada inválida.
 */

import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("AdaptadorOraculoChainlink", function () {
  /**
   * @notice Implanta mock e adaptador com preço padrão.
   *
   * @dev
   * Preço padrão:
   *
   * 3000 USD por ETH, com 8 casas decimais.
   *
   * Representação:
   *
   * 3000_00000000
   */
  async function implantarAmbienteOraculo() {
    const [dono, usuarioComum] = await ethers.getSigners();

    const casasDecimais = 8;
    const descricao = "ETH / USD";
    const versao = 1;
    const precoInicial = 3000_00000000n;

    const MockPriceFeedChainlink = await ethers.getContractFactory(
      "MockPriceFeedChainlink"
    );

    const mockFeed = await MockPriceFeedChainlink.deploy(
      casasDecimais,
      descricao,
      versao,
      precoInicial
    );

    const AdaptadorOraculoChainlink = await ethers.getContractFactory(
      "AdaptadorOraculoChainlink"
    );

    const adaptador = await AdaptadorOraculoChainlink.deploy(
      await mockFeed.getAddress()
    );

    return {
      mockFeed,
      adaptador,
      dono,
      usuarioComum,
      casasDecimais,
      descricao,
      versao,
      precoInicial,
    };
  }

  it("Deve implantar com price feed correto", async function () {
    const { mockFeed, adaptador, dono } = await implantarAmbienteOraculo();

    expect(await adaptador.owner()).to.equal(dono.address);

    expect(await adaptador.enderecoPriceFeed()).to.equal(
      await mockFeed.getAddress()
    );
  });

  it("Nao deve implantar com price feed invalido", async function () {
    const AdaptadorOraculoChainlink = await ethers.getContractFactory(
      "AdaptadorOraculoChainlink"
    );

    await expect(
      AdaptadorOraculoChainlink.deploy(ethers.ZeroAddress)
    ).to.be.revertedWith("Price feed invalido");
  });

  it("Deve consultar preco atual bruto do oraculo", async function () {
    const { adaptador, precoInicial, casasDecimais } =
      await implantarAmbienteOraculo();

    const [roundId, preco, decimals, atualizadoEm, answeredInRound] =
      await adaptador.obterPrecoAtual();

    expect(roundId).to.equal(1n);
    expect(preco).to.equal(precoInicial);
    expect(decimals).to.equal(BigInt(casasDecimais));
    expect(atualizadoEm).to.be.greaterThan(0n);
    expect(answeredInRound).to.equal(1n);
  });

  it("Deve normalizar preco para 18 casas decimais", async function () {
    const { adaptador } = await implantarAmbienteOraculo();

    const precoNormalizado = await adaptador.obterPrecoNormalizado18();

    expect(precoNormalizado).to.equal(ethers.parseUnits("3000", 18));
  });

  it("Deve converter wei para USD com 18 casas decimais", async function () {
    const { adaptador } = await implantarAmbienteOraculo();

    const valorWei = ethers.parseEther("2");

    const valorUSD18 = await adaptador.converterWeiParaUSD18(valorWei);

    expect(valorUSD18).to.equal(ethers.parseUnits("6000", 18));
  });

  it("Deve converter USD com 18 casas decimais para wei", async function () {
    const { adaptador } = await implantarAmbienteOraculo();

    const valorUSD18 = ethers.parseUnits("1500", 18);

    const valorWei = await adaptador.converterUSD18ParaWei(valorUSD18);

    expect(valorWei).to.equal(ethers.parseEther("0.5"));
  });

  it("Nao deve converter valores zero", async function () {
    const { adaptador } = await implantarAmbienteOraculo();

    await expect(
      adaptador.converterWeiParaUSD18(0)
    ).to.be.revertedWith("Valor invalido");

    await expect(
      adaptador.converterUSD18ParaWei(0)
    ).to.be.revertedWith("Valor invalido");
  });

  it("Deve retornar descricao, versao e casas decimais do feed", async function () {
    const { adaptador, descricao, versao, casasDecimais } =
      await implantarAmbienteOraculo();

    expect(await adaptador.descricaoFeed()).to.equal(descricao);
    expect(await adaptador.versaoFeed()).to.equal(BigInt(versao));
    expect(await adaptador.casasDecimaisFeed()).to.equal(
      BigInt(casasDecimais)
    );
  });

  it("Deve atualizar price feed", async function () {
    const { adaptador } = await implantarAmbienteOraculo();

    const MockPriceFeedChainlink = await ethers.getContractFactory(
      "MockPriceFeedChainlink"
    );

    const novoFeed = await MockPriceFeedChainlink.deploy(
      8,
      "ETH / USD Novo",
      2,
      3500_00000000n
    );

    await adaptador.atualizarPriceFeed(await novoFeed.getAddress());

    expect(await adaptador.enderecoPriceFeed()).to.equal(
      await novoFeed.getAddress()
    );

    expect(await adaptador.descricaoFeed()).to.equal("ETH / USD Novo");

    expect(await adaptador.obterPrecoNormalizado18()).to.equal(
      ethers.parseUnits("3500", 18)
    );
  });

  it("Nao deve atualizar price feed para endereco zero", async function () {
    const { adaptador } = await implantarAmbienteOraculo();

    await expect(
      adaptador.atualizarPriceFeed(ethers.ZeroAddress)
    ).to.be.revertedWith("Price feed invalido");
  });

  it("Nao deve permitir usuario comum atualizar price feed", async function () {
    const { adaptador, usuarioComum } = await implantarAmbienteOraculo();

    await expect(
      adaptador
        .connect(usuarioComum)
        .atualizarPriceFeed(ethers.ZeroAddress)
    )
      .to.be.revertedWithCustomError(adaptador, "OwnableUnauthorizedAccount")
      .withArgs(usuarioComum.address);
  });

  it("Nao deve aceitar preco invalido do oraculo", async function () {
    const { mockFeed, adaptador } = await implantarAmbienteOraculo();

    const bloco = await ethers.provider.getBlock("latest");
    const timestampAtual = bloco?.timestamp ?? 1;

    await mockFeed.atualizarResposta(-1n, timestampAtual, 2);

    await expect(adaptador.obterPrecoAtual()).to.be.revertedWith(
      "Preco invalido"
    );
  });

  it("Nao deve aceitar preco nao atualizado", async function () {
    const { mockFeed, adaptador } = await implantarAmbienteOraculo();

    await mockFeed.atualizarResposta(3000_00000000n, 0, 2);

    await expect(adaptador.obterPrecoAtual()).to.be.revertedWith(
      "Preco nao atualizado"
    );
  });

  it("Nao deve aceitar rodada invalida", async function () {
    const { mockFeed, adaptador } = await implantarAmbienteOraculo();

    const bloco = await ethers.provider.getBlock("latest");
    const timestampAtual = bloco?.timestamp ?? 1;

    /**
     * @dev
     * Após atualizarResposta, o idRodada interno passa de 1 para 2.
     * Aqui forçamos answeredInRound igual a 1, menor que roundId 2.
     */
    await mockFeed.atualizarResposta(3000_00000000n, timestampAtual, 1);

    await expect(adaptador.obterPrecoAtual()).to.be.revertedWith(
      "Rodada invalida"
    );
  });
});