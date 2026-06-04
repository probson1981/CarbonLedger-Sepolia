// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file AdaptadorOraculoChainlink.sol
 * @author Patrício Alves
 * @title AdaptadorOraculoChainlink
 *
 * @notice
 * Contrato adaptador para consulta de dados externos por meio de oráculo
 * Chainlink no protocolo CarbonLedger.
 *
 * @dev
 * Este contrato foi criado para isolar a lógica de consulta ao oráculo.
 *
 * No MVP, o dado externo principal será o preço ETH/USD obtido de um
 * Price Feed da Chainlink.
 *
 * O contrato pode ser usado por outros módulos para:
 *
 * - consultar o preço atual do ETH em USD;
 * - converter valores em wei para USD com 18 casas decimais;
 * - converter valores em USD com 18 casas decimais para wei;
 * - demonstrar integração Web3 com dado externo confiável.
 *
 * Observação:
 * O oráculo não valida carbono, não aprova projetos e não emite créditos.
 * Ele apenas fornece dados externos para o protocolo.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev
 * Interface mínima do AggregatorV3Interface da Chainlink.
 *
 * @notice
 * A interface é declarada localmente para evitar problemas de caminho de
 * importação entre versões diferentes do pacote Chainlink Contracts.
 *
 * Em produção, também seria possível importar diretamente da biblioteca
 * Chainlink, conforme a versão instalada.
 */
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);

    function description() external view returns (string memory);

    function version() external view returns (uint256);

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title AdaptadorOraculoChainlink
 *
 * @notice
 * Adaptador para leitura de Price Feed Chainlink.
 *
 * @dev
 * O contrato guarda o endereço do feed externo e disponibiliza funções
 * de leitura e conversão.
 *
 * No caso típico de ETH/USD, o preço retornado pela Chainlink costuma vir
 * com 8 casas decimais. Contudo, este contrato consulta o número de casas
 * diretamente no feed por meio da função decimals().
 */
contract AdaptadorOraculoChainlink is Ownable {
    /**
     * @notice
     * Interface do feed Chainlink usado pelo protocolo.
     */
    AggregatorV3Interface public priceFeed;

    /**
     * @notice
     * Último endereço configurado para o price feed.
     */
    address public enderecoPriceFeed;

    /**
     * @notice
     * Evento emitido quando o price feed é atualizado.
     */
    event PriceFeedAtualizado(address indexed novoPriceFeed);

    /**
     * @notice
     * Evento emitido quando uma consulta de preço é realizada.
     */
    event PrecoConsultado(
        int256 preco,
        uint8 casasDecimais,
        uint256 atualizadoEm
    );

    /**
     * @notice
     * Inicializa o adaptador de oráculo.
     *
     * @dev
     * O endereço informado deve ser de um AggregatorV3Interface compatível.
     *
     * Exemplo de uso em Sepolia:
     *
     * - ETH/USD Price Feed Chainlink.
     *
     * @param enderecoInicialPriceFeed Endereço do price feed Chainlink.
     */
    constructor(address enderecoInicialPriceFeed) Ownable(msg.sender) {
        require(
            enderecoInicialPriceFeed != address(0),
            "Price feed invalido"
        );

        enderecoPriceFeed = enderecoInicialPriceFeed;
        priceFeed = AggregatorV3Interface(enderecoInicialPriceFeed);

        emit PriceFeedAtualizado(enderecoInicialPriceFeed);
    }

    /**
     * @notice
     * Atualiza o endereço do price feed.
     *
     * @dev
     * Função administrativa útil para ambiente local, testnet ou troca de rede.
     *
     * Em produção, essa função deveria ser controlada pela GovernancaCarbono.
     *
     * @param novoPriceFeed Novo endereço do price feed.
     */
    function atualizarPriceFeed(address novoPriceFeed) external onlyOwner {
        require(novoPriceFeed != address(0), "Price feed invalido");

        enderecoPriceFeed = novoPriceFeed;
        priceFeed = AggregatorV3Interface(novoPriceFeed);

        emit PriceFeedAtualizado(novoPriceFeed);
    }

    /**
     * @notice
     * Consulta o preço atual informado pelo price feed.
     *
     * @dev
     * Retorna o valor bruto do oráculo, junto com metadados úteis.
     *
     * Para ETH/USD, o valor representa o preço de 1 ETH em USD,
     * normalmente com 8 casas decimais, mas isso depende do feed.
     *
     * @return roundId Identificador da rodada do oráculo.
     * @return preco Preço retornado pelo oráculo.
     * @return casasDecimais Quantidade de casas decimais do feed.
     * @return atualizadoEm Timestamp da última atualização.
     * @return answeredInRound Rodada em que a resposta foi confirmada.
     */
    function obterPrecoAtual()
        public
        view
        returns (
            uint80 roundId,
            int256 preco,
            uint8 casasDecimais,
            uint256 atualizadoEm,
            uint80 answeredInRound
        )
    {
        (
            uint80 idRodada,
            int256 resposta,
            ,
            uint256 dataAtualizacao,
            uint80 rodadaRespondida
        ) = priceFeed.latestRoundData();

        require(resposta > 0, "Preco invalido");
        require(dataAtualizacao > 0, "Preco nao atualizado");
        require(rodadaRespondida >= idRodada, "Rodada invalida");

        return (
            idRodada,
            resposta,
            priceFeed.decimals(),
            dataAtualizacao,
            rodadaRespondida
        );
    }

    /**
     * @notice
     * Consulta o preço ETH/USD normalizado para 18 casas decimais.
     *
     * @dev
     * Essa função facilita cálculos internos com wei e tokens ERC-20.
     *
     * Exemplo:
     *
     * Se o feed retorna 3000_00000000 com 8 casas decimais,
     * esta função retorna 3000 * 10^18.
     *
     * @return Preço normalizado com 18 casas decimais.
     */
    function obterPrecoNormalizado18() public view returns (uint256) {
        (, int256 preco, uint8 casasDecimais, , ) = obterPrecoAtual();

        uint256 precoUint = uint256(preco);

        if (casasDecimais == 18) {
            return precoUint;
        }

        if (casasDecimais < 18) {
            return precoUint * (10 ** (18 - casasDecimais));
        }

        return precoUint / (10 ** (casasDecimais - 18));
    }

    /**
     * @notice
     * Converte um valor em wei para USD com 18 casas decimais.
     *
     * @dev
     * Usa o preço ETH/USD normalizado para 18 casas.
     *
     * Exemplo conceitual:
     *
     * valorWei = 1 ether
     * preço ETH/USD = 3000 * 10^18
     * retorno = 3000 * 10^18
     *
     * @param valorWei Valor em wei.
     *
     * @return Valor equivalente em USD com 18 casas decimais.
     */
    function converterWeiParaUSD18(
        uint256 valorWei
    ) external view returns (uint256) {
        require(valorWei > 0, "Valor invalido");

        uint256 precoETHUSD18 = obterPrecoNormalizado18();

        return (valorWei * precoETHUSD18) / 1 ether;
    }

    /**
     * @notice
     * Converte valor em USD com 18 casas decimais para wei.
     *
     * @dev
     * Usa o preço ETH/USD normalizado para 18 casas.
     *
     * Exemplo conceitual:
     *
     * valorUSD18 = 3000 * 10^18
     * preço ETH/USD = 3000 * 10^18
     * retorno = 1 ether
     *
     * @param valorUSD18 Valor em USD com 18 casas decimais.
     *
     * @return Valor equivalente em wei.
     */
    function converterUSD18ParaWei(
        uint256 valorUSD18
    ) external view returns (uint256) {
        require(valorUSD18 > 0, "Valor invalido");

        uint256 precoETHUSD18 = obterPrecoNormalizado18();

        return (valorUSD18 * 1 ether) / precoETHUSD18;
    }

    /**
     * @notice
     * Retorna a descrição do price feed.
     *
     * @return Descrição informada pelo oráculo.
     */
    function descricaoFeed() external view returns (string memory) {
        return priceFeed.description();
    }

    /**
     * @notice
     * Retorna a versão do price feed.
     *
     * @return Versão do agregador Chainlink.
     */
    function versaoFeed() external view returns (uint256) {
        return priceFeed.version();
    }

    /**
     * @notice
     * Retorna o número de casas decimais do price feed.
     *
     * @return Quantidade de casas decimais.
     */
    function casasDecimaisFeed() external view returns (uint8) {
        return priceFeed.decimals();
    }
}
