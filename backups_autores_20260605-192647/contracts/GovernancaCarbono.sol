// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file GovernancaCarbono.sol
 * @author Patrício Alves
 * @title GovernancaCarbono
 *
 * @notice
 * Contrato responsável pela governança simplificada do protocolo CarbonLedger.
 *
 * @dev
 * Este contrato implementa uma DAO básica para permitir que participantes
 * com TokenImpactoCarbono, TIC, possam criar propostas, votar e executar
 * decisões aprovadas.
 *
 * A governança pode ser usada para alterar parâmetros do protocolo, como:
 *
 * - taxa de submissão de projeto;
 * - taxa de marketplace;
 * - taxa de aposentadoria;
 * - prazo de votação;
 * - quórum mínimo;
 * - stake mínimo de validador;
 * - parâmetros de staking;
 * - autorizações e ajustes administrativos.
 *
 * Para que a governança consiga executar funções protegidas por onlyOwner
 * em outros contratos, a propriedade desses contratos deve ser transferida
 * para o endereço da GovernancaCarbono após o deploy.
 *
 * Exemplo:
 *
 * contratoAlvo.transferOwnership(enderecoGovernancaCarbono);
 *
 * Este contrato é simplificado para fins de MVP acadêmico.
 * Em uma versão de produção, seria recomendável usar mecanismos mais
 * avançados, como snapshots de votos, timelock e módulos formais de votação.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GovernancaCarbono
 *
 * @notice
 * DAO simplificada do protocolo CarbonLedger.
 *
 * @dev
 * O peso do voto é baseado no saldo atual de TokenImpactoCarbono da carteira
 * no momento da votação.
 *
 * Regras principais:
 *
 * - apenas usuários com saldo mínimo de TIC podem criar propostas;
 * - apenas usuários com saldo de TIC podem votar;
 * - cada carteira vota uma única vez por proposta;
 * - a proposta só pode ser executada após o fim do prazo;
 * - a proposta precisa atingir quórum mínimo;
 * - a proposta precisa ter maioria favorável;
 * - a execução é feita por chamada externa ao contrato alvo.
 */
contract GovernancaCarbono is Ownable, ReentrancyGuard {
    /**
     * @notice
     * Estados possíveis de uma proposta.
     */
    enum EstadoProposta {
        Ativa,
        Aprovada,
        Rejeitada,
        Executada,
        Cancelada
    }

    /**
     * @notice
     * Estrutura principal de uma proposta de governança.
     *
     * @param idProposta Identificador interno da proposta.
     * @param proponente Carteira que criou a proposta.
     * @param contratoAlvo Contrato que será chamado se a proposta for aprovada.
     * @param valorETH Valor em ETH enviado na execução, se aplicável.
     * @param dadosExecucao Chamada codificada a ser executada no contrato alvo.
     * @param descricao Descrição textual da proposta.
     * @param inicioVotacao Momento de início da votação.
     * @param fimVotacao Momento de encerramento da votação.
     * @param votosFavor Peso total dos votos favoráveis.
     * @param votosContra Peso total dos votos contrários.
     * @param executada Indica se a proposta já foi executada.
     * @param cancelada Indica se a proposta foi cancelada.
     */
    struct Proposta {
        uint256 idProposta;
        address proponente;
        address contratoAlvo;
        uint256 valorETH;
        bytes dadosExecucao;
        string descricao;
        uint256 inicioVotacao;
        uint256 fimVotacao;
        uint256 votosFavor;
        uint256 votosContra;
        bool executada;
        bool cancelada;
    }

    /**
     * @notice
     * Token ERC-20 usado para peso de voto.
     */
    IERC20 public tokenImpactoCarbono;

    /**
     * @notice
     * Total de propostas criadas.
     */
    uint256 public totalPropostas;

    /**
     * @notice
     * Prazo padrão das votações de governança.
     *
     * @dev
     * Valor inicial: 3 dias.
     */
    uint256 public prazoVotacaoPadrao;

    /**
     * @notice
     * Quórum mínimo exigido para uma proposta ser válida.
     *
     * @dev
     * O valor é medido em unidades do token TIC.
     */
    uint256 public quorumMinimo;

    /**
     * @notice
     * Saldo mínimo de TIC exigido para criar propostas.
     */
    uint256 public saldoMinimoParaPropor;

    /**
     * @notice
     * Mapeia idProposta para seus dados.
     */
    mapping(uint256 => Proposta) public propostas;

    /**
     * @notice
     * Indica se uma carteira já votou em determinada proposta.
     */
    mapping(uint256 => mapping(address => bool)) public jaVotou;

    /**
     * @notice
     * Registra se o voto de uma carteira foi favorável ou contrário.
     */
    mapping(uint256 => mapping(address => bool)) public votoFavoravel;

    /**
     * @notice
     * Registra o peso do voto de cada carteira em cada proposta.
     */
    mapping(uint256 => mapping(address => uint256)) public pesoDoVoto;

    /**
     * @notice
     * Evento emitido quando uma proposta é criada.
     */
    event PropostaCriada(
        uint256 indexed idProposta,
        address indexed proponente,
        address indexed contratoAlvo,
        string descricao,
        uint256 inicioVotacao,
        uint256 fimVotacao
    );

    /**
     * @notice
     * Evento emitido quando um voto é registrado.
     */
    event VotoRegistrado(
        uint256 indexed idProposta,
        address indexed votante,
        bool apoio,
        uint256 peso
    );

    /**
     * @notice
     * Evento emitido quando uma proposta é executada.
     */
    event PropostaExecutada(
        uint256 indexed idProposta,
        address indexed executor,
        bool sucesso
    );

    /**
     * @notice
     * Evento emitido quando uma proposta é cancelada.
     */
    event PropostaCancelada(
        uint256 indexed idProposta,
        address indexed cancelador
    );

    /**
     * @notice
     * Evento emitido quando os parâmetros da governança são alterados.
     */
    event ParametrosGovernancaAlterados(
        uint256 prazoVotacaoPadrao,
        uint256 quorumMinimo,
        uint256 saldoMinimoParaPropor
    );

    /**
     * @notice
     * Evento emitido quando o token de governança é atualizado.
     */
    event TokenGovernancaAtualizado(address indexed novoToken);

    /**
     * @notice
     * Inicializa o contrato de governança.
     *
     * @param enderecoTokenImpactoCarbono Endereço do token ERC-20 TIC.
     */
    constructor(address enderecoTokenImpactoCarbono) Ownable(msg.sender) {
        require(
            enderecoTokenImpactoCarbono != address(0),
            "Token TIC invalido"
        );

        tokenImpactoCarbono = IERC20(enderecoTokenImpactoCarbono);

        prazoVotacaoPadrao = 3 days;
        quorumMinimo = 1000 ether;
        saldoMinimoParaPropor = 100 ether;

        emit TokenGovernancaAtualizado(enderecoTokenImpactoCarbono);

        emit ParametrosGovernancaAlterados(
            prazoVotacaoPadrao,
            quorumMinimo,
            saldoMinimoParaPropor
        );
    }

    /**
     * @notice
     * Permite que a governança receba ETH.
     *
     * @dev
     * Isso é necessário caso alguma proposta execute chamada com valor em ETH.
     */
    receive() external payable {}

    /**
     * @notice
     * Atualiza o token usado para governança.
     *
     * @dev
     * Função administrativa útil em ambiente de teste.
     * Em produção, essa mudança deveria ser feita pela própria governança.
     *
     * @param novoToken Endereço do novo token de governança.
     */
    function atualizarTokenGovernanca(address novoToken) external onlyOwner {
        require(novoToken != address(0), "Token TIC invalido");

        tokenImpactoCarbono = IERC20(novoToken);

        emit TokenGovernancaAtualizado(novoToken);
    }

    /**
     * @notice
     * Altera os parâmetros da governança.
     *
     * @dev
     * Função administrativa do MVP.
     * Em versão mais avançada, essa função poderia ser chamada pela própria DAO.
     *
     * @param novoPrazoVotacaoPadrao Novo prazo padrão em segundos.
     * @param novoQuorumMinimo Novo quórum mínimo em TIC.
     * @param novoSaldoMinimoParaPropor Novo saldo mínimo para criar proposta.
     */
    function alterarParametrosGovernanca(
        uint256 novoPrazoVotacaoPadrao,
        uint256 novoQuorumMinimo,
        uint256 novoSaldoMinimoParaPropor
    ) external onlyOwner {
        require(novoPrazoVotacaoPadrao > 0, "Prazo invalido");
        require(novoQuorumMinimo > 0, "Quorum invalido");

        prazoVotacaoPadrao = novoPrazoVotacaoPadrao;
        quorumMinimo = novoQuorumMinimo;
        saldoMinimoParaPropor = novoSaldoMinimoParaPropor;

        emit ParametrosGovernancaAlterados(
            prazoVotacaoPadrao,
            quorumMinimo,
            saldoMinimoParaPropor
        );
    }

    /**
     * @notice
     * Cria uma nova proposta de governança.
     *
     * @dev
     * A proposta contém uma chamada codificada para um contrato alvo.
     *
     * Exemplo de uso:
     *
     * dadosExecucao = contrato.interface.encodeFunctionData(
     *     "alterarTaxaMarketplace",
     *     [500]
     * );
     *
     * @param contratoAlvo Endereço do contrato a ser chamado.
     * @param valorETH Valor em ETH a ser enviado na execução.
     * @param dadosExecucao Dados codificados da chamada.
     * @param descricao Descrição da proposta.
     *
     * @return idProposta Identificador da proposta criada.
     */
    function criarProposta(
        address contratoAlvo,
        uint256 valorETH,
        bytes calldata dadosExecucao,
        string calldata descricao
    ) external returns (uint256) {
        require(contratoAlvo != address(0), "Contrato alvo invalido");
        require(dadosExecucao.length > 0, "Dados obrigatorios");
        require(bytes(descricao).length > 0, "Descricao obrigatoria");

        uint256 saldoProponente = tokenImpactoCarbono.balanceOf(msg.sender);

        require(
            saldoProponente >= saldoMinimoParaPropor,
            "Saldo insuficiente para propor"
        );

        totalPropostas++;

        uint256 idProposta = totalPropostas;
        uint256 inicio = block.timestamp;
        uint256 fim = inicio + prazoVotacaoPadrao;

        propostas[idProposta] = Proposta({
            idProposta: idProposta,
            proponente: msg.sender,
            contratoAlvo: contratoAlvo,
            valorETH: valorETH,
            dadosExecucao: dadosExecucao,
            descricao: descricao,
            inicioVotacao: inicio,
            fimVotacao: fim,
            votosFavor: 0,
            votosContra: 0,
            executada: false,
            cancelada: false
        });

        emit PropostaCriada(
            idProposta,
            msg.sender,
            contratoAlvo,
            descricao,
            inicio,
            fim
        );

        return idProposta;
    }

    /**
     * @notice
     * Registra voto em uma proposta ativa.
     *
     * @dev
     * O peso do voto é o saldo atual de TIC do votante no momento do voto.
     *
     * @param idProposta Identificador da proposta.
     * @param apoio Verdadeiro para voto favorável e falso para voto contrário.
     */
    function votar(uint256 idProposta, bool apoio) external {
        Proposta storage proposta = propostas[idProposta];

        require(proposta.idProposta != 0, "Proposta inexistente");
        require(!proposta.cancelada, "Proposta cancelada");
        require(!proposta.executada, "Proposta executada");
        require(block.timestamp <= proposta.fimVotacao, "Votacao encerrada");
        require(!jaVotou[idProposta][msg.sender], "Carteira ja votou");

        uint256 peso = tokenImpactoCarbono.balanceOf(msg.sender);

        require(peso > 0, "Sem poder de voto");

        jaVotou[idProposta][msg.sender] = true;
        votoFavoravel[idProposta][msg.sender] = apoio;
        pesoDoVoto[idProposta][msg.sender] = peso;

        if (apoio) {
            proposta.votosFavor += peso;
        } else {
            proposta.votosContra += peso;
        }

        emit VotoRegistrado(idProposta, msg.sender, apoio, peso);
    }

    /**
     * @notice
     * Executa uma proposta aprovada.
     *
     * @dev
     * Regras:
     *
     * - votação deve estar encerrada;
     * - proposta não pode estar cancelada;
     * - proposta não pode ter sido executada;
     * - quórum mínimo deve ter sido atingido;
     * - votos favoráveis devem superar votos contrários;
     * - contrato precisa ter saldo de ETH suficiente, se valorETH for maior que zero.
     *
     * @param idProposta Identificador da proposta.
     *
     * @return retorno Dados retornados pela chamada ao contrato alvo.
     */
    function executarProposta(
        uint256 idProposta
    ) external nonReentrant returns (bytes memory retorno) {
        Proposta storage proposta = propostas[idProposta];

        require(proposta.idProposta != 0, "Proposta inexistente");
        require(!proposta.cancelada, "Proposta cancelada");
        require(!proposta.executada, "Proposta ja executada");
        require(block.timestamp > proposta.fimVotacao, "Votacao ainda aberta");

        uint256 quantidadeTotalVotos =
            proposta.votosFavor +
            proposta.votosContra;

        require(quantidadeTotalVotos >= quorumMinimo, "Quorum nao atingido");
        require(
            proposta.votosFavor > proposta.votosContra,
            "Proposta rejeitada"
        );
        require(
            address(this).balance >= proposta.valorETH,
            "Saldo ETH insuficiente"
        );

        proposta.executada = true;

        (bool sucesso, bytes memory dadosRetorno) = proposta.contratoAlvo.call{
            value: proposta.valorETH
        }(proposta.dadosExecucao);

        require(sucesso, "Falha ao executar proposta");

        emit PropostaExecutada(idProposta, msg.sender, sucesso);

        return dadosRetorno;
    }

    /**
     * @notice
     * Cancela uma proposta ainda não executada.
     *
     * @dev
     * O cancelamento pode ser feito pelo proponente ou pelo owner.
     *
     * @param idProposta Identificador da proposta.
     */
    function cancelarProposta(uint256 idProposta) external {
        Proposta storage proposta = propostas[idProposta];

        require(proposta.idProposta != 0, "Proposta inexistente");
        require(!proposta.executada, "Proposta ja executada");
        require(!proposta.cancelada, "Proposta ja cancelada");
        require(
            msg.sender == proposta.proponente || msg.sender == owner(),
            "Sem permissao"
        );

        proposta.cancelada = true;

        emit PropostaCancelada(idProposta, msg.sender);
    }

    /**
     * @notice
     * Retorna o estado atual de uma proposta.
     *
     * @param idProposta Identificador da proposta.
     *
     * @return Estado atual da proposta.
     */
    function estadoProposta(
        uint256 idProposta
    ) public view returns (EstadoProposta) {
        Proposta memory proposta = propostas[idProposta];

        require(proposta.idProposta != 0, "Proposta inexistente");

        if (proposta.cancelada) {
            return EstadoProposta.Cancelada;
        }

        if (proposta.executada) {
            return EstadoProposta.Executada;
        }

        if (block.timestamp <= proposta.fimVotacao) {
            return EstadoProposta.Ativa;
        }

        uint256 quantidadeTotalVotos =
            proposta.votosFavor +
            proposta.votosContra;

        if (
            quantidadeTotalVotos >= quorumMinimo &&
            proposta.votosFavor > proposta.votosContra
        ) {
            return EstadoProposta.Aprovada;
        }

        return EstadoProposta.Rejeitada;
    }

    /**
     * @notice
     * Informa se uma proposta foi aprovada.
     *
     * @param idProposta Identificador da proposta.
     *
     * @return Verdadeiro se a proposta estiver aprovada.
     */
    function propostaAprovada(
        uint256 idProposta
    ) external view returns (bool) {
        return estadoProposta(idProposta) == EstadoProposta.Aprovada;
    }

    /**
     * @notice
     * Retorna o total de votos de uma proposta.
     *
     * @param idProposta Identificador da proposta.
     *
     * @return Total de votos ponderados.
     */
    function totalVotos(uint256 idProposta) external view returns (uint256) {
        Proposta memory proposta = propostas[idProposta];

        require(proposta.idProposta != 0, "Proposta inexistente");

        return proposta.votosFavor + proposta.votosContra;
    }
}