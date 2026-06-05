// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file TokenImpactoCarbono.sol
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @title TokenImpactoCarbono
 *
 * @notice
 * Token ERC-20 utilitário do protocolo CarbonLedger.
 *
 * @dev
 * Este contrato representa o token interno da plataforma CarbonLedger,
 * podendo ser utilizado para:
 *
 * - recompensas de staking;
 * - participação em governança;
 * - pagamento de taxas internas;
 * - incentivos para validadores;
 * - operações auxiliares do ecossistema.
 *
 * O contrato utiliza implementações da OpenZeppelin:
 *
 * - ERC20: padrão de token fungível;
 * - Ownable: controle de acesso baseado em proprietário.
 *
 * A função de emissão adicional de tokens é restrita ao dono do contrato.
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenImpactoCarbono
 *
 * @notice
 * Implementa o token ERC-20 do protocolo CarbonLedger.
 *
 * @dev
 * O token é criado com nome "Token Impacto Carbono" e símbolo "TIC".
 * O suprimento inicial é definido no momento da implantação do contrato
 * e enviado integralmente para a carteira que realiza o deploy.
 */
contract TokenImpactoCarbono is ERC20, Ownable {
    /**
     * @notice
     * Cria o token ERC-20 do protocolo CarbonLedger.
     *
     * @dev
     * O construtor inicializa o token com nome e símbolo fixos.
     * Em seguida, emite o suprimento inicial para o endereço que implantou
     * o contrato.
     *
     * O modificador Ownable(msg.sender) define o implantador como dono
     * inicial do contrato.
     *
     * @param suprimentoInicial Quantidade inicial de tokens a ser emitida.
     */
    constructor(uint256 suprimentoInicial)
        ERC20("Token Impacto Carbono", "TIC")
        Ownable(msg.sender)
    {
        /*
         * Emite o suprimento inicial para o dono do contrato.
         *
         * Observação:
         * Como o ERC-20 usa 18 casas decimais por padrão, recomenda-se
         * passar o valor já convertido no script de deploy, por exemplo:
         *
         * ethers.parseUnits("1000000", 18)
         */
        _mint(msg.sender, suprimentoInicial);
    }

    /**
     * @notice
     * Emite novos tokens para um destinatário.
     *
     * @dev
     * Esta função só pode ser chamada pelo dono do contrato.
     *
     * Regras aplicadas:
     *
     * - o destinatário não pode ser o endereço zero;
     * - a quantidade deve ser maior que zero;
     * - apenas o owner pode emitir novos tokens.
     *
     * @param destinatario Endereço que receberá os novos tokens.
     * @param quantidade Quantidade de tokens a ser emitida.
     */
    function emitirTokens(
        address destinatario,
        uint256 quantidade
    ) external onlyOwner {
        /*
         * Impede emissão para o endereço zero.
         *
         * O endereço zero é inválido para recebimento normal de tokens
         * e poderia representar perda definitiva dos ativos emitidos.
         */
        require(destinatario != address(0), "Destinatario invalido");

        /*
         * Impede emissão com quantidade igual a zero.
         *
         * Essa verificação evita chamadas sem efeito prático e melhora
         * a clareza das regras de negócio do contrato.
         */
        require(quantidade > 0, "Quantidade invalida");

        /*
         * Emite a quantidade informada de tokens para o destinatário.
         *
         * A função interna _mint é herdada do contrato ERC20 da OpenZeppelin.
         */
        _mint(destinatario, quantidade);
    }
}
