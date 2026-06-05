// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file TesourariaCarbono.sol
 * @author Patrício Alves
 * @title TesourariaCarbono
 *
 * @notice
 * Contrato responsável por funcionar como tesouraria central do protocolo
 * CarbonLedger.
 *
 * @dev
 * A TesourariaCarbono recebe, guarda e distribui recursos do protocolo.
 *
 * Ela pode receber:
 *
 * - taxas de submissão de projetos;
 * - taxas de compra e venda de créditos;
 * - taxas de aposentadoria de créditos;
 * - depósitos em ETH;
 * - depósitos em TokenImpactoCarbono, TIC.
 *
 * Ela pode pagar:
 *
 * - recompensas de staking;
 * - incentivos a validadores;
 * - valores autorizados pela governança;
 * - saques administrativos controlados.
 *
 * Este contrato separa a camada financeira das regras de negócio,
 * evitando que contratos como MercadoCarbono, RegistroProjetosCarbono
 * ou StakingCarbono concentrem recursos financeiros de forma indevida.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TesourariaCarbono
 *
 * @notice
 * Caixa financeiro do protocolo CarbonLedger.
 *
 * @dev
 * Usa:
 *
 * - Ownable para controle administrativo;
 * - ReentrancyGuard para proteção contra reentrância;
 * - SafeERC20 para movimentação segura do token TIC.
 *
 * No MVP, o owner controla a tesouraria.
 * Em etapa posterior, o owner poderá ser transferido para GovernancaCarbono.
 */
contract TesourariaCarbono is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @notice
     * Token ERC-20 utilitário do protocolo CarbonLedger.
     *
     * @dev
     * Este token será usado para reservas, recompensas e staking.
     */
    IERC20 public tokenImpactoCarbono;

    /**
     * @notice
     * Endereços autorizados a solicitar pagamentos da tesouraria.
     *
     * @dev
     * Exemplos futuros:
     *
     * - StakingCarbono;
     * - GovernancaCarbono;
     * - contratos auxiliares autorizados.
     */
    mapping(address => bool) public contratosAutorizados;

    /**
     * @notice
     * Total de ETH recebido pela tesouraria.
     */
    uint256 public totalETHRecebido;

    /**
     * @notice
     * Total de ETH enviado pela tesouraria.
     */
    uint256 public totalETHEnviado;

    /**
     * @notice
     * Total de tokens TIC recebidos pela tesouraria.
     */
    uint256 public totalTICRecebido;

    /**
     * @notice
     * Total de tokens TIC enviados pela tesouraria.
     */
    uint256 public totalTICEnviado;

    /**
     * @notice
     * Evento emitido quando a tesouraria recebe ETH.
     */
    event ETHRecebido(
        address indexed remetente,
        uint256 valor,
        string origem
    );

    /**
     * @notice
     * Evento emitido quando a tesouraria envia ETH.
     */
    event ETHEnviado(
        address indexed destinatario,
        uint256 valor,
        string finalidade
    );

    /**
     * @notice
     * Evento emitido quando a tesouraria recebe TIC.
     */
    event TICRecebido(
        address indexed remetente,
        uint256 quantidade,
        string origem
    );

    /**
     * @notice
     * Evento emitido quando a tesouraria envia TIC.
     */
    event TICEnviado(
        address indexed destinatario,
        uint256 quantidade,
        string finalidade
    );

    /**
     * @notice
     * Evento emitido quando um contrato é autorizado ou desautorizado.
     */
    event ContratoAutorizado(address indexed contrato, bool autorizado);

    /**
     * @notice
     * Evento emitido quando o endereço do token TIC é atualizado.
     */
    event TokenImpactoCarbonoAtualizado(address indexed novoToken);

    /**
     * @notice
     * Restringe uma função apenas a contratos autorizados.
     */
    modifier apenasContratoAutorizado() {
        require(contratosAutorizados[msg.sender], "Contrato nao autorizado");
        _;
    }

    /**
     * @notice
     * Inicializa a tesouraria do protocolo.
     *
     * @dev
     * O tokenImpactoCarbono é o token ERC-20 usado para reservas,
     * recompensas e staking.
     *
     * @param enderecoTokenImpactoCarbono Endereço do contrato ERC-20 TIC.
     */
    constructor(address enderecoTokenImpactoCarbono) Ownable(msg.sender) {
        require(
            enderecoTokenImpactoCarbono != address(0),
            "Token TIC invalido"
        );

        tokenImpactoCarbono = IERC20(enderecoTokenImpactoCarbono);

        emit TokenImpactoCarbonoAtualizado(enderecoTokenImpactoCarbono);
    }

    /**
     * @notice
     * Permite que a tesouraria receba ETH diretamente.
     *
     * @dev
     * Esta função é chamada quando alguém envia ETH sem chamar
     * explicitamente uma função.
     */
    receive() external payable {
        totalETHRecebido += msg.value;

        emit ETHRecebido(msg.sender, msg.value, "recebimento direto");
    }

    /**
     * @notice
     * Recebe uma taxa ou emolumento em ETH.
     *
     * @dev
     * Será usada por outros contratos do protocolo para encaminhar taxas
     * à tesouraria.
     *
     * Exemplos de origem:
     *
     * - taxa de submissao de projeto;
     * - taxa de marketplace;
     * - taxa de aposentadoria;
     * - deposito administrativo.
     *
     * @param origem Descrição resumida da origem do valor recebido.
     */
    function receberTaxaETH(string memory origem) external payable {
        require(msg.value > 0, "Valor invalido");
        require(bytes(origem).length > 0, "Origem obrigatoria");

        totalETHRecebido += msg.value;

        emit ETHRecebido(msg.sender, msg.value, origem);
    }

    /**
     * @notice
     * Deposita tokens TIC na tesouraria.
     *
     * @dev
     * O remetente deve aprovar previamente a tesouraria para movimentar
     * a quantidade informada de tokens TIC.
     *
     * @param quantidade Quantidade de TIC a depositar.
     * @param origem Descrição resumida da origem do depósito.
     */
    function depositarTIC(
        uint256 quantidade,
        string memory origem
    ) external nonReentrant {
        require(quantidade > 0, "Quantidade invalida");
        require(bytes(origem).length > 0, "Origem obrigatoria");

        tokenImpactoCarbono.safeTransferFrom(
            msg.sender,
            address(this),
            quantidade
        );

        totalTICRecebido += quantidade;

        emit TICRecebido(msg.sender, quantidade, origem);
    }

    /**
     * @notice
     * Autoriza ou remove autorização de um contrato do protocolo.
     *
     * @dev
     * Contratos autorizados poderão solicitar pagamentos controlados.
     *
     * Exemplo:
     *
     * - StakingCarbono poderá solicitar pagamento de recompensas.
     *
     * @param contrato Endereço do contrato.
     * @param autorizado Estado de autorização.
     */
    function autorizarContrato(
        address contrato,
        bool autorizado
    ) external onlyOwner {
        require(contrato != address(0), "Contrato invalido");

        contratosAutorizados[contrato] = autorizado;

        emit ContratoAutorizado(contrato, autorizado);
    }

    /**
     * @notice
     * Atualiza o endereço do token TIC.
     *
     * @dev
     * Esta função é administrativa e deve ser usada com cuidado.
     *
     * No MVP, ela ajuda caso o token seja reimplantado em ambiente local
     * ou em testnet.
     *
     * @param novoToken Endereço do novo token TIC.
     */
    function atualizarTokenImpactoCarbono(address novoToken) external onlyOwner {
        require(novoToken != address(0), "Token TIC invalido");

        tokenImpactoCarbono = IERC20(novoToken);

        emit TokenImpactoCarbonoAtualizado(novoToken);
    }

    /**
     * @notice
     * Envia ETH da tesouraria para um destinatário.
     *
     * @dev
     * Função restrita ao owner.
     *
     * Será usada para saques administrativos ou transferências autorizadas
     * em etapa inicial do MVP.
     *
     * @param destinatario Endereço que receberá ETH.
     * @param valor Valor em wei a ser enviado.
     * @param finalidade Descrição da finalidade do envio.
     */
    function enviarETH(
        address payable destinatario,
        uint256 valor,
        string memory finalidade
    ) external onlyOwner nonReentrant {
        _enviarETH(destinatario, valor, finalidade);
    }

    /**
     * @notice
     * Envia ETH por solicitação de contrato autorizado.
     *
     * @dev
     * Permite que contratos do protocolo solicitem pagamentos,
     * desde que estejam autorizados.
     *
     * @param destinatario Endereço que receberá ETH.
     * @param valor Valor em wei a ser enviado.
     * @param finalidade Descrição da finalidade do envio.
     */
    function enviarETHAutorizado(
        address payable destinatario,
        uint256 valor,
        string memory finalidade
    ) external apenasContratoAutorizado nonReentrant {
        _enviarETH(destinatario, valor, finalidade);
    }

    /**
     * @notice
     * Envia tokens TIC da tesouraria para um destinatário.
     *
     * @dev
     * Função restrita ao owner.
     *
     * @param destinatario Endereço que receberá TIC.
     * @param quantidade Quantidade de TIC a ser enviada.
     * @param finalidade Descrição da finalidade do envio.
     */
    function enviarTIC(
        address destinatario,
        uint256 quantidade,
        string memory finalidade
    ) external onlyOwner nonReentrant {
        _enviarTIC(destinatario, quantidade, finalidade);
    }

    /**
     * @notice
     * Envia tokens TIC por solicitação de contrato autorizado.
     *
     * @dev
     * Essa função será útil para o StakingCarbono pagar recompensas.
     *
     * @param destinatario Endereço que receberá TIC.
     * @param quantidade Quantidade de TIC a ser enviada.
     * @param finalidade Descrição da finalidade do envio.
     */
    function enviarTICAutorizado(
        address destinatario,
        uint256 quantidade,
        string memory finalidade
    ) external apenasContratoAutorizado nonReentrant {
        _enviarTIC(destinatario, quantidade, finalidade);
    }

    /**
     * @notice
     * Retorna o saldo atual de ETH da tesouraria.
     *
     * @return Saldo de ETH em wei.
     */
    function saldoETH() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice
     * Retorna o saldo atual de TIC da tesouraria.
     *
     * @return Saldo de TIC.
     */
    function saldoTIC() external view returns (uint256) {
        return tokenImpactoCarbono.balanceOf(address(this));
    }

    /**
     * @notice
     * Função interna para envio de ETH.
     *
     * @dev
     * Centraliza as validações e evita repetição entre envio pelo owner
     * e envio por contrato autorizado.
     *
     * @param destinatario Endereço que receberá ETH.
     * @param valor Valor em wei.
     * @param finalidade Finalidade do envio.
     */
    function _enviarETH(
        address payable destinatario,
        uint256 valor,
        string memory finalidade
    ) internal {
        require(destinatario != address(0), "Destinatario invalido");
        require(valor > 0, "Valor invalido");
        require(bytes(finalidade).length > 0, "Finalidade obrigatoria");
        require(address(this).balance >= valor, "Saldo ETH insuficiente");

        totalETHEnviado += valor;

        (bool sucesso, ) = destinatario.call{value: valor}("");
        require(sucesso, "Falha ao enviar ETH");

        emit ETHEnviado(destinatario, valor, finalidade);
    }

    /**
     * @notice
     * Função interna para envio de TIC.
     *
     * @dev
     * Centraliza as validações e evita repetição entre envio pelo owner
     * e envio por contrato autorizado.
     *
     * @param destinatario Endereço que receberá TIC.
     * @param quantidade Quantidade de TIC.
     * @param finalidade Finalidade do envio.
     */
    function _enviarTIC(
        address destinatario,
        uint256 quantidade,
        string memory finalidade
    ) internal {
        require(destinatario != address(0), "Destinatario invalido");
        require(quantidade > 0, "Quantidade invalida");
        require(bytes(finalidade).length > 0, "Finalidade obrigatoria");
        require(
            tokenImpactoCarbono.balanceOf(address(this)) >= quantidade,
            "Saldo TIC insuficiente"
        );

        totalTICEnviado += quantidade;

        tokenImpactoCarbono.safeTransfer(destinatario, quantidade);

        emit TICEnviado(destinatario, quantidade, finalidade);
    }
}