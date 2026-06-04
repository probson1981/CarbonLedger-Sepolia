// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/*
 * MockPriceFeedChainlink.sol
 * Autor: Patrício Alves
 * Projeto: CarbonLedger
 *
 * Mock local de um Price Feed Chainlink para testes do CarbonLedger.
 *
 * Este contrato simula as funções principais de um AggregatorV3Interface.
 *
 * Ele será usado apenas nos testes locais Hardhat, pois na rede local não
 * existe um oráculo real da Chainlink.
 */
contract MockPriceFeedChainlink {
    /**
     * @notice
     * Número de casas decimais do preço.
     *
     * @dev
     * Para ETH USD, normalmente o feed usa 8 casas decimais.
     */
    uint8 private casasDecimais;

    /**
     * @notice
     * Descrição textual do feed.
     */
    string private descricao;

    /**
     * @notice
     * Versão simulada do feed.
     */
    uint256 private versao;

    /**
     * @notice
     * Identificador da rodada atual.
     */
    uint80 private idRodada;

    /**
     * @notice
     * Resposta do preço.
     */
    int256 private resposta;

    /**
     * @notice
     * Timestamp de início da rodada.
     */
    uint256 private iniciadoEm;

    /**
     * @notice
     * Timestamp de atualização do preço.
     */
    uint256 private atualizadoEm;

    /**
     * @notice
     * Rodada em que a resposta foi confirmada.
     */
    uint80 private respondidoNaRodada;

    /**
     * @notice
     * Inicializa o mock do price feed.
     *
     * @param _casasDecimais Quantidade de casas decimais.
     * @param _descricao Descrição do feed.
     * @param _versao Versão simulada.
     * @param _resposta Preço inicial.
     */
    constructor(
        uint8 _casasDecimais,
        string memory _descricao,
        uint256 _versao,
        int256 _resposta
    ) {
        casasDecimais = _casasDecimais;
        descricao = _descricao;
        versao = _versao;
        idRodada = 1;
        resposta = _resposta;
        iniciadoEm = block.timestamp;
        atualizadoEm = block.timestamp;
        respondidoNaRodada = 1;
    }

    /**
     * @notice
     * Retorna as casas decimais do feed.
     */
    function decimals() external view returns (uint8) {
        return casasDecimais;
    }

    /**
     * @notice
     * Retorna a descrição do feed.
     */
    function description() external view returns (string memory) {
        return descricao;
    }

    /**
     * @notice
     * Retorna a versão do feed.
     */
    function version() external view returns (uint256) {
        return versao;
    }

    /**
     * @notice
     * Retorna os dados da última rodada.
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            idRodada,
            resposta,
            iniciadoEm,
            atualizadoEm,
            respondidoNaRodada
        );
    }

    /**
     * @notice
     * Atualiza a resposta do mock.
     *
     * @dev
     * Função usada apenas nos testes para simular cenários válidos
     * e inválidos do oráculo.
     *
     * @param novaResposta Novo preço.
     * @param novoAtualizadoEm Novo timestamp de atualização.
     * @param novaRodadaRespondida Nova rodada respondida.
     */
    function atualizarResposta(
        int256 novaResposta,
        uint256 novoAtualizadoEm,
        uint80 novaRodadaRespondida
    ) external {
        idRodada++;
        resposta = novaResposta;
        iniciadoEm = block.timestamp;
        atualizadoEm = novoAtualizadoEm;
        respondidoNaRodada = novaRodadaRespondida;
    }
}