// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file StakingCarbono.sol
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @title StakingCarbono
 *
 * @notice
 * Contrato responsável pelo staking de tokens TIC no protocolo CarbonLedger.
 *
 * @dev
 * O staking permite que participantes bloqueiem TokenImpactoCarbono,
 * também chamado de TIC, para demonstrar compromisso econômico com o
 * protocolo e receber recompensas proporcionais ao tempo e ao valor em stake.
 *
 * No modelo consolidado do CarbonLedger, o staking tem especial importância
 * para validadores, pois o contrato ValidacaoProjetos pode exigir um saldo
 * mínimo em stake para permitir participação nas votações de projetos
 * ambientais.
 *
 * O staking não gera créditos de carbono.
 * Os créditos de carbono somente são gerados por projetos ambientais
 * submetidos, validados e aprovados.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @dev
 * Interface mínima da TesourariaCarbono.
 *
 * Usada para solicitar pagamento de recompensas em TIC.
 *
 * Para funcionar, o contrato StakingCarbono deve ser autorizado na
 * TesourariaCarbono por meio da função:
 *
 * TesourariaCarbono.autorizarContrato(enderecoStakingCarbono, true)
 */
interface ITesourariaCarbonoStaking {
    function enviarTICAutorizado(
        address destinatario,
        uint256 quantidade,
        string memory finalidade
    ) external;
}

/**
 * @title StakingCarbono
 *
 * @notice
 * Permite depósito, bloqueio, resgate e recompensa de tokens TIC.
 *
 * @dev
 * O contrato usa:
 *
 * - SafeERC20 para movimentação segura do token TIC;
 * - Ownable para controle administrativo;
 * - ReentrancyGuard para proteção em funções com transferência de tokens.
 */
contract StakingCarbono is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /**
     * @notice
     * Token ERC-20 utilitário do protocolo CarbonLedger.
     */
    IERC20 public tokenImpactoCarbono;

    /**
     * @notice
     * Tesouraria responsável por pagar recompensas em TIC.
     */
    ITesourariaCarbonoStaking public tesourariaCarbono;

    /**
     * @notice
     * Base de cálculo para basis points.
     *
     * @dev
     * 10000 bps equivale a 100%.
     */
    uint256 public constant BASE_BPS = 10000;

    /**
     * @notice
     * Quantidade mínima recomendada para um validador estar apto.
     *
     * @dev
     * O contrato ValidacaoProjetos poderá consultar saldoEmStake
     * e comparar com seu próprio parâmetro de stake mínimo.
     */
    uint256 public stakeMinimoValidador;

    /**
     * @notice
     * Período mínimo em que o stake deve permanecer bloqueado.
     */
    uint256 public periodoMinimoBloqueio;

    /**
     * @notice
     * Taxa anual de recompensa em basis points.
     *
     * @dev
     * Exemplo:
     * 500 bps = 5% ao ano.
     */
    uint256 public taxaRecompensaAnualBps;

    /**
     * @notice
     * Total de tokens atualmente em stake no contrato.
     */
    uint256 public totalEmStake;

    /**
     * @notice
     * Saldo em stake de cada participante.
     *
     * @dev
     * Este getter público é importante para integração com ValidacaoProjetos.
     */
    mapping(address => uint256) public saldoEmStake;

    /**
     * @notice
     * Momento do primeiro depósito ou último aumento de stake do participante.
     *
     * @dev
     * Usado para aplicar o período mínimo de bloqueio.
     */
    mapping(address => uint256) public dataInicioStake;

    /**
     * @notice
     * Último instante em que as recompensas do participante foram atualizadas.
     */
    mapping(address => uint256) public dataUltimoCalculo;

    /**
     * @notice
     * Recompensas acumuladas e ainda não resgatadas.
     */
    mapping(address => uint256) public recompensasAcumuladas;

    /**
     * @notice
     * Evento emitido quando um participante deposita TIC em stake.
     */
    event StakeDepositado(
        address indexed participante,
        uint256 quantidade,
        uint256 novoSaldo
    );

    /**
     * @notice
     * Evento emitido quando um participante saca parte ou todo seu stake.
     */
    event StakeSacado(
        address indexed participante,
        uint256 quantidade,
        uint256 saldoRestante
    );

    /**
     * @notice
     * Evento emitido quando um participante recebe recompensa.
     */
    event RecompensaResgatada(
        address indexed participante,
        uint256 quantidade
    );

    /**
     * @notice
     * Evento emitido quando os parâmetros do staking são alterados.
     */
    event ParametrosStakingAlterados(
        uint256 stakeMinimoValidador,
        uint256 periodoMinimoBloqueio,
        uint256 taxaRecompensaAnualBps
    );

    /**
     * @notice
     * Evento emitido quando os contratos integrados são atualizados.
     */
    event ContratosAtualizados(
        address tokenImpactoCarbono,
        address tesourariaCarbono
    );

    /**
     * @notice
     * Inicializa o contrato de staking.
     *
     * @param enderecoTokenImpactoCarbono Endereço do token ERC-20 TIC.
     * @param enderecoTesourariaCarbono Endereço da TesourariaCarbono.
     */
    constructor(
        address enderecoTokenImpactoCarbono,
        address enderecoTesourariaCarbono
    ) Ownable(msg.sender) {
        require(
            enderecoTokenImpactoCarbono != address(0),
            "Token TIC invalido"
        );
        require(
            enderecoTesourariaCarbono != address(0),
            "Tesouraria invalida"
        );

        tokenImpactoCarbono = IERC20(enderecoTokenImpactoCarbono);
        tesourariaCarbono = ITesourariaCarbonoStaking(
            enderecoTesourariaCarbono
        );

        stakeMinimoValidador = 1000 ether;
        periodoMinimoBloqueio = 1 days;
        taxaRecompensaAnualBps = 500;

        emit ContratosAtualizados(
            enderecoTokenImpactoCarbono,
            enderecoTesourariaCarbono
        );

        emit ParametrosStakingAlterados(
            stakeMinimoValidador,
            periodoMinimoBloqueio,
            taxaRecompensaAnualBps
        );
    }

    /**
     * @notice
     * Atualiza os contratos integrados ao staking.
     *
     * @dev
     * Função administrativa útil em ambiente local ou testnet.
     * Em produção, essa função deveria ser controlada pela governança.
     *
     * @param enderecoTokenImpactoCarbono Novo endereço do token TIC.
     * @param enderecoTesourariaCarbono Novo endereço da tesouraria.
     */
    function atualizarContratos(
        address enderecoTokenImpactoCarbono,
        address enderecoTesourariaCarbono
    ) external onlyOwner {
        require(
            enderecoTokenImpactoCarbono != address(0),
            "Token TIC invalido"
        );
        require(
            enderecoTesourariaCarbono != address(0),
            "Tesouraria invalida"
        );

        tokenImpactoCarbono = IERC20(enderecoTokenImpactoCarbono);
        tesourariaCarbono = ITesourariaCarbonoStaking(
            enderecoTesourariaCarbono
        );

        emit ContratosAtualizados(
            enderecoTokenImpactoCarbono,
            enderecoTesourariaCarbono
        );
    }

    /**
     * @notice
     * Altera os parâmetros principais do staking.
     *
     * @dev
     * Futuramente, essa função poderá ser controlada pela GovernancaCarbono.
     *
     * @param novoStakeMinimoValidador Novo stake mínimo recomendado.
     * @param novoPeriodoMinimoBloqueio Novo período mínimo de bloqueio.
     * @param novaTaxaRecompensaAnualBps Nova taxa anual de recompensa em bps.
     */
    function alterarParametrosStaking(
        uint256 novoStakeMinimoValidador,
        uint256 novoPeriodoMinimoBloqueio,
        uint256 novaTaxaRecompensaAnualBps
    ) external onlyOwner {
        require(
            novoStakeMinimoValidador > 0,
            "Stake minimo invalido"
        );
        require(
            novaTaxaRecompensaAnualBps <= 5000,
            "Recompensa acima do limite"
        );

        stakeMinimoValidador = novoStakeMinimoValidador;
        periodoMinimoBloqueio = novoPeriodoMinimoBloqueio;
        taxaRecompensaAnualBps = novaTaxaRecompensaAnualBps;

        emit ParametrosStakingAlterados(
            stakeMinimoValidador,
            periodoMinimoBloqueio,
            taxaRecompensaAnualBps
        );
    }

    /**
     * @notice
     * Deposita tokens TIC em stake.
     *
     * @dev
     * O participante deve aprovar previamente o StakingCarbono para movimentar
     * seus tokens TIC.
     *
     * Antes de alterar o saldo, o contrato atualiza as recompensas pendentes.
     *
     * @param quantidade Quantidade de TIC a depositar.
     */
    function depositarStake(uint256 quantidade) external nonReentrant {
        require(quantidade > 0, "Quantidade invalida");

        _atualizarRecompensa(msg.sender);

        tokenImpactoCarbono.safeTransferFrom(
            msg.sender,
            address(this),
            quantidade
        );

        if (saldoEmStake[msg.sender] == 0) {
            dataInicioStake[msg.sender] = block.timestamp;
        }

        saldoEmStake[msg.sender] += quantidade;
        totalEmStake += quantidade;
        dataUltimoCalculo[msg.sender] = block.timestamp;

        emit StakeDepositado(
            msg.sender,
            quantidade,
            saldoEmStake[msg.sender]
        );
    }

    /**
     * @notice
     * Saca tokens TIC previamente depositados em stake.
     *
     * @dev
     * O participante só pode sacar depois de cumprido o período mínimo
     * de bloqueio.
     *
     * Antes do saque, o contrato atualiza as recompensas acumuladas.
     *
     * @param quantidade Quantidade de TIC a sacar.
     */
    function sacarStake(uint256 quantidade) external nonReentrant {
        require(quantidade > 0, "Quantidade invalida");
        require(
            saldoEmStake[msg.sender] >= quantidade,
            "Saldo em stake insuficiente"
        );
        require(
            block.timestamp >=
                dataInicioStake[msg.sender] + periodoMinimoBloqueio,
            "Periodo minimo nao atingido"
        );

        _atualizarRecompensa(msg.sender);

        saldoEmStake[msg.sender] -= quantidade;
        totalEmStake -= quantidade;

        if (saldoEmStake[msg.sender] == 0) {
            dataInicioStake[msg.sender] = 0;
            dataUltimoCalculo[msg.sender] = 0;
        } else {
            dataUltimoCalculo[msg.sender] = block.timestamp;
        }

        tokenImpactoCarbono.safeTransfer(msg.sender, quantidade);

        emit StakeSacado(
            msg.sender,
            quantidade,
            saldoEmStake[msg.sender]
        );
    }

    /**
     * @notice
     * Resgata recompensas acumuladas em TIC.
     *
     * @dev
     * As recompensas são pagas pela TesourariaCarbono.
     *
     * Para funcionar, este contrato precisa estar autorizado na tesouraria.
     */
    function resgatarRecompensa() external nonReentrant {
        _atualizarRecompensa(msg.sender);

        uint256 recompensa = recompensasAcumuladas[msg.sender];

        require(recompensa > 0, "Sem recompensa");

        recompensasAcumuladas[msg.sender] = 0;

        tesourariaCarbono.enviarTICAutorizado(
            msg.sender,
            recompensa,
            "recompensa de staking"
        );

        emit RecompensaResgatada(msg.sender, recompensa);
    }

    /**
     * @notice
     * Verifica se uma carteira possui stake mínimo de validador.
     *
     * @param participante Endereço consultado.
     *
     * @return Verdadeiro se o participante possuir saldo em stake suficiente.
     */
    function possuiStakeMinimoValidador(
        address participante
    ) external view returns (bool) {
        return saldoEmStake[participante] >= stakeMinimoValidador;
    }

    /**
     * @notice
     * Calcula a recompensa pendente de um participante.
     *
     * @dev
     * Considera a recompensa já acumulada mais a recompensa gerada
     * desde o último cálculo.
     *
     * @param participante Endereço consultado.
     *
     * @return Recompensa total pendente.
     */
    function calcularRecompensaPendente(
        address participante
    ) public view returns (uint256) {
        uint256 saldo = saldoEmStake[participante];

        if (saldo == 0) {
            return recompensasAcumuladas[participante];
        }

        uint256 ultimoCalculo = dataUltimoCalculo[participante];

        if (ultimoCalculo == 0 || block.timestamp <= ultimoCalculo) {
            return recompensasAcumuladas[participante];
        }

        uint256 tempoDecorrido = block.timestamp - ultimoCalculo;

        uint256 recompensaNova = (saldo *
            taxaRecompensaAnualBps *
            tempoDecorrido) / (BASE_BPS * 365 days);

        return recompensasAcumuladas[participante] + recompensaNova;
    }

    /**
     * @notice
     * Atualiza a recompensa acumulada de um participante.
     *
     * @dev
     * Função interna chamada antes de depósitos, saques e resgates.
     *
     * @param participante Endereço do participante.
     */
    function _atualizarRecompensa(address participante) internal {
        uint256 recompensaPendente = calcularRecompensaPendente(participante);

        recompensasAcumuladas[participante] = recompensaPendente;

        if (saldoEmStake[participante] > 0) {
            dataUltimoCalculo[participante] = block.timestamp;
        }
    }
}
