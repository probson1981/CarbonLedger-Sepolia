/**
 * @file TokenImpactoCarbono.test.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Arquivo de testes automatizados do contrato TokenImpactoCarbono.
 *
 * @dev
 * Este teste valida o comportamento básico do token ERC-20 utilizado
 * no protocolo CarbonLedger.
 *
 * O contrato testado representa o token utilitário da plataforma,
 * usado para recompensas, staking, governança e demais interações
 * econômicas do protocolo.
 *
 * Testes contemplados:
 * 1. Implantação correta do token;
 * 2. Verificação de nome, símbolo e suprimento inicial;
 * 3. Emissão adicional de tokens pelo dono do contrato;
 * 4. Bloqueio de emissão para endereço zero;
 * 5. Bloqueio de emissão com quantidade zero;
 * 6. Bloqueio de emissão por usuário não autorizado.
 */

import { expect } from "chai";
import { network } from "hardhat";

/**
 * @dev
 * No Hardhat 3, a conexão com a rede de testes local é feita por meio
 * de network.connect().
 *
 * A constante ethers será usada para:
 * - obter contas de teste;
 * - converter valores para unidades com 18 casas decimais;
 * - implantar contratos;
 * - interagir com os contratos implantados.
 */
const { ethers } = await network.connect();

/**
 * @title Testes do contrato TokenImpactoCarbono
 *
 * @dev
 * O bloco describe agrupa todos os testes relacionados ao contrato
 * TokenImpactoCarbono.
 */
describe("TokenImpactoCarbono", function () {
  /**
   * @notice Implanta uma nova instância do contrato TokenImpactoCarbono.
   *
   * @dev
   * Esta função auxiliar evita repetição de código nos testes.
   * Cada teste recebe uma implantação limpa do contrato.
   *
   * @return token Instância implantada do contrato TokenImpactoCarbono.
   * @return dono Conta que implantou o contrato e recebe o suprimento inicial.
   * @return usuario Conta comum utilizada para testar permissões.
   * @return suprimentoInicial Quantidade inicial de tokens emitida na implantação.
   */
  async function implantarToken() {
    /**
     * @dev
     * Obtém duas contas de teste fornecidas automaticamente pela rede local
     * do Hardhat.
     *
     * dono: conta que implanta o contrato.
     * usuario: conta comum usada para testar restrições de acesso.
     */
    const [dono, usuario] = await ethers.getSigners();

    /**
     * @dev
     * Define o suprimento inicial do token.
     *
     * Como o ERC-20 utiliza 18 casas decimais por padrão, parseUnits converte
     * "1000000" para o valor inteiro correspondente em wei do token.
     */
    const suprimentoInicial = ethers.parseUnits("1000000", 18);

    /**
     * @dev
     * Obtém a fábrica do contrato TokenImpactoCarbono.
     * A fábrica é usada para implantar novas instâncias do contrato.
     */
    const TokenImpactoCarbono = await ethers.getContractFactory(
      "TokenImpactoCarbono"
    );

    /**
     * @dev
     * Implanta o contrato passando o suprimento inicial como argumento
     * do construtor.
     */
    const token = await TokenImpactoCarbono.deploy(suprimentoInicial);

    /**
     * @dev
     * Retorna os objetos necessários para os testes.
     */
    return {
      token,
      dono,
      usuario,
      suprimentoInicial,
    };
  }

  /**
   * @notice Verifica se o token é implantado com os dados corretos.
   *
   * @dev
   * Este teste confirma:
   * - nome do token;
   * - símbolo do token;
   * - suprimento total;
   * - saldo inicial do dono do contrato.
   */
  it("Deve implantar com nome, simbolo e suprimento inicial corretos", async function () {
    const { token, dono, suprimentoInicial } = await implantarToken();

    /**
     * @dev
     * Confere o nome público do token ERC-20.
     */
    expect(await token.name()).to.equal("Token Impacto Carbono");

    /**
     * @dev
     * Confere o símbolo público do token ERC-20.
     */
    expect(await token.symbol()).to.equal("TIC");

    /**
     * @dev
     * Confere se o suprimento total emitido é igual ao suprimento inicial.
     */
    expect(await token.totalSupply()).to.equal(suprimentoInicial);

    /**
     * @dev
     * Confere se todo o suprimento inicial foi atribuído ao dono.
     */
    expect(await token.balanceOf(dono.address)).to.equal(suprimentoInicial);
  });

  /**
   * @notice Verifica se o dono do contrato consegue emitir novos tokens.
   *
   * @dev
   * A função emitirTokens deve ser restrita ao owner.
   * Como o dono implantou o contrato, ele deve conseguir emitir novos tokens.
   */
  it("Deve permitir que o dono emita novos tokens", async function () {
    const { token, usuario } = await implantarToken();

    /**
     * @dev
     * Define a quantidade de novos tokens a serem emitidos.
     */
    const quantidade = ethers.parseUnits("500", 18);

    /**
     * @dev
     * Emite novos tokens para a conta usuario.
     */
    await token.emitirTokens(usuario.address, quantidade);

    /**
     * @dev
     * Confere se o saldo do usuário recebeu exatamente a quantidade emitida.
     */
    expect(await token.balanceOf(usuario.address)).to.equal(quantidade);
  });

  /**
   * @notice Verifica se o contrato bloqueia emissão para endereço zero.
   *
   * @dev
   * Endereço zero representa um endereço inválido.
   * O contrato deve rejeitar qualquer tentativa de emissão para esse endereço.
   */
  it("Nao deve permitir emissao para endereco zero", async function () {
    const { token } = await implantarToken();

    const quantidade = ethers.parseUnits("500", 18);

    /**
     * @dev
     * Espera que a chamada reverta com a mensagem definida no contrato.
     */
    await expect(
      token.emitirTokens(ethers.ZeroAddress, quantidade)
    ).to.be.revertedWith("Destinatario invalido");
  });

  /**
   * @notice Verifica se o contrato bloqueia emissão com quantidade zero.
   *
   * @dev
   * A emissão de zero tokens não altera o estado do contrato e deve ser
   * considerada uma operação inválida.
   */
  it("Nao deve permitir emissao com quantidade zero", async function () {
    const { token, usuario } = await implantarToken();

    /**
     * @dev
     * Espera que a chamada reverta porque a quantidade informada é zero.
     */
    await expect(token.emitirTokens(usuario.address, 0)).to.be.revertedWith(
      "Quantidade invalida"
    );
  });

  /**
   * @notice Verifica se uma conta comum não consegue emitir tokens.
   *
   * @dev
   * A função emitirTokens possui modificador onlyOwner.
   * Portanto, qualquer conta diferente do dono deve ser bloqueada.
   */
  it("Nao deve permitir que outro usuario emita tokens", async function () {
    const { token, usuario } = await implantarToken();

    const quantidade = ethers.parseUnits("100", 18);

    /**
     * @dev
     * Conecta o contrato à conta usuario e tenta emitir tokens.
     * Como usuario não é o dono, a chamada deve reverter com erro
     * customizado da OpenZeppelin.
     */
    await expect(
      token.connect(usuario).emitirTokens(usuario.address, quantidade)
    )
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(usuario.address);
  });
});
