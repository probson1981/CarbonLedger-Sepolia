// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file RegistroOrganizacoes.sol
 * @author Patrício Alves
 * @title RegistroOrganizacoes
 *
 * @notice
 * Contrato responsável pelo cadastro e controle das organizações
 * participantes do protocolo CarbonLedger.
 *
 * @dev
 * Este contrato funciona como a camada cadastral do sistema.
 *
 * Ele registra quais carteiras podem atuar como:
 *
 * - proponentes de projetos ambientais;
 * - validadores de projetos;
 * - compradores de créditos de carbono;
 * - administradores do protocolo.
 *
 * O contrato não executa regras de mercado, não emite créditos,
 * não valida projetos e não movimenta recursos financeiros.
 *
 * Sua finalidade é apenas manter o registro confiável dos participantes
 * e permitir que outros contratos consultem se uma carteira possui
 * autorização para determinada função.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RegistroOrganizacoes
 *
 * @notice
 * Cadastro de organizações e participantes do protocolo CarbonLedger.
 *
 * @dev
 * O contrato utiliza Ownable da OpenZeppelin para restringir funções
 * administrativas ao dono do contrato.
 *
 * Em uma versão posterior, o dono poderá ser substituído por um contrato
 * de governança, permitindo que a DAO controle inclusões, remoções e
 * alterações cadastrais.
 */
contract RegistroOrganizacoes is Ownable {
    /**
     * @notice
     * Define os tipos de organização aceitos no protocolo.
     *
     * @dev
     * O valor Nenhum é usado como padrão para carteiras ainda não cadastradas.
     */
    enum TipoOrganizacao {
        Nenhum,
        Proponente,
        Validador,
        Comprador,
        Administrador
    }

    /**
     * @notice
     * Estrutura principal de cadastro de uma organização.
     *
     * @dev
     * O campo documento pode representar CNPJ, identificação interna
     * ou outro identificador cadastral usado no MVP.
     *
     * Como os dados gravados em blockchain são públicos, recomenda-se
     * evitar documentos sensíveis em ambiente real.
     *
     * @param carteira Endereço da carteira vinculada à organização.
     * @param nome Nome público da organização.
     * @param documento Identificador cadastral da organização.
     * @param uriDocumentos URI com documentos cadastrais ou evidências externas.
     * @param tipoOrganizacao Papel exercido pela organização no protocolo.
     * @param ativa Indica se a organização está ativa.
     * @param dataCadastro Data em que a organização foi cadastrada.
     * @param dataAtualizacao Data da última alteração cadastral.
     */
    struct Organizacao {
        address carteira;
        string nome;
        string documento;
        string uriDocumentos;
        TipoOrganizacao tipoOrganizacao;
        bool ativa;
        uint256 dataCadastro;
        uint256 dataAtualizacao;
    }

    /**
     * @notice
     * Total de organizações cadastradas.
     */
    uint256 public totalOrganizacoes;

    /**
     * @notice
     * Mapeia a carteira para os dados da organização.
     */
    mapping(address => Organizacao) public organizacoes;

    /**
     * @notice
     * Indica se uma carteira já foi cadastrada.
     */
    mapping(address => bool) public organizacaoCadastrada;

    /**
     * @notice
     * Lista de carteiras cadastradas.
     *
     * @dev
     * Ajuda o front-end e os scripts de demonstração a listar organizações.
     */
    address[] public carteirasCadastradas;

    /**
     * @notice
     * Evento emitido quando uma nova organização é cadastrada.
     */
    event OrganizacaoCadastrada(
        address indexed carteira,
        string nome,
        TipoOrganizacao tipoOrganizacao,
        uint256 dataCadastro
    );

    /**
     * @notice
     * Evento emitido quando uma organização tem seus dados atualizados.
     */
    event OrganizacaoAtualizada(
        address indexed carteira,
        string nome,
        TipoOrganizacao tipoOrganizacao,
        uint256 dataAtualizacao
    );

    /**
     * @notice
     * Evento emitido quando uma organização é ativada ou desativada.
     */
    event EstadoOrganizacaoAlterado(
        address indexed carteira,
        bool ativa,
        uint256 dataAtualizacao
    );

    /**
     * @notice
     * Inicializa o contrato de registro de organizações.
     *
     * @dev
     * O implantador do contrato é definido como owner.
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice
     * Cadastra uma nova organização no protocolo.
     *
     * @dev
     * Apenas o dono do contrato pode cadastrar organizações.
     *
     * Em uma versão futura, esta regra pode ser transferida para a
     * GovernancaCarbono.
     *
     * Regras:
     *
     * - a carteira não pode ser o endereço zero;
     * - a carteira não pode estar cadastrada previamente;
     * - o nome deve ser informado;
     * - o tipo da organização não pode ser Nenhum.
     *
     * @param carteira Endereço da carteira da organização.
     * @param nome Nome público da organização.
     * @param documento Identificador cadastral da organização.
     * @param uriDocumentos URI com documentos ou dados cadastrais externos.
     * @param tipoOrganizacao Tipo da organização no protocolo.
     */
    function cadastrarOrganizacao(
        address carteira,
        string memory nome,
        string memory documento,
        string memory uriDocumentos,
        TipoOrganizacao tipoOrganizacao
    ) external onlyOwner {
        require(carteira != address(0), "Carteira invalida");
        require(!organizacaoCadastrada[carteira], "Organizacao ja cadastrada");
        require(bytes(nome).length > 0, "Nome obrigatorio");
        require(tipoOrganizacao != TipoOrganizacao.Nenhum, "Tipo invalido");

        organizacoes[carteira] = Organizacao({
            carteira: carteira,
            nome: nome,
            documento: documento,
            uriDocumentos: uriDocumentos,
            tipoOrganizacao: tipoOrganizacao,
            ativa: true,
            dataCadastro: block.timestamp,
            dataAtualizacao: block.timestamp
        });

        organizacaoCadastrada[carteira] = true;
        carteirasCadastradas.push(carteira);
        totalOrganizacoes++;

        emit OrganizacaoCadastrada(
            carteira,
            nome,
            tipoOrganizacao,
            block.timestamp
        );
    }

    /**
     * @notice
     * Atualiza dados cadastrais de uma organização já existente.
     *
     * @dev
     * Apenas o dono do contrato pode atualizar dados.
     *
     * A carteira permanece a mesma, mas nome, documento, URI e tipo podem
     * ser alterados.
     *
     * @param carteira Endereço da organização a ser atualizada.
     * @param nome Novo nome público.
     * @param documento Novo identificador cadastral.
     * @param uriDocumentos Nova URI de documentos.
     * @param tipoOrganizacao Novo tipo da organização.
     */
    function atualizarOrganizacao(
        address carteira,
        string memory nome,
        string memory documento,
        string memory uriDocumentos,
        TipoOrganizacao tipoOrganizacao
    ) external onlyOwner {
        require(organizacaoCadastrada[carteira], "Organizacao inexistente");
        require(bytes(nome).length > 0, "Nome obrigatorio");
        require(tipoOrganizacao != TipoOrganizacao.Nenhum, "Tipo invalido");

        Organizacao storage organizacao = organizacoes[carteira];

        organizacao.nome = nome;
        organizacao.documento = documento;
        organizacao.uriDocumentos = uriDocumentos;
        organizacao.tipoOrganizacao = tipoOrganizacao;
        organizacao.dataAtualizacao = block.timestamp;

        emit OrganizacaoAtualizada(
            carteira,
            nome,
            tipoOrganizacao,
            block.timestamp
        );
    }

    /**
     * @notice
     * Ativa uma organização previamente cadastrada.
     *
     * @dev
     * Uma organização ativa pode participar dos fluxos do protocolo
     * conforme seu tipo.
     *
     * @param carteira Endereço da organização.
     */
    function ativarOrganizacao(address carteira) external onlyOwner {
        require(organizacaoCadastrada[carteira], "Organizacao inexistente");

        organizacoes[carteira].ativa = true;
        organizacoes[carteira].dataAtualizacao = block.timestamp;

        emit EstadoOrganizacaoAlterado(carteira, true, block.timestamp);
    }

    /**
     * @notice
     * Desativa uma organização previamente cadastrada.
     *
     * @dev
     * Uma organização desativada não deve conseguir atuar como proponente,
     * validador ou comprador nos demais contratos.
     *
     * @param carteira Endereço da organização.
     */
    function desativarOrganizacao(address carteira) external onlyOwner {
        require(organizacaoCadastrada[carteira], "Organizacao inexistente");

        organizacoes[carteira].ativa = false;
        organizacoes[carteira].dataAtualizacao = block.timestamp;

        emit EstadoOrganizacaoAlterado(carteira, false, block.timestamp);
    }

    /**
     * @notice
     * Verifica se uma carteira é proponente ativa.
     *
     * @param carteira Endereço a ser consultado.
     *
     * @return Verdadeiro se a carteira for proponente ativa.
     */
    function ehProponente(address carteira) external view returns (bool) {
        Organizacao memory organizacao = organizacoes[carteira];

        return
            organizacao.ativa &&
            organizacao.tipoOrganizacao == TipoOrganizacao.Proponente;
    }

    /**
     * @notice
     * Verifica se uma carteira é validadora ativa.
     *
     * @dev
     * Esta função verifica apenas o cadastro.
     *
     * No fluxo consolidado, a aptidão final para votar também dependerá
     * do stake mínimo no contrato StakingCarbono.
     *
     * @param carteira Endereço a ser consultado.
     *
     * @return Verdadeiro se a carteira for validadora ativa.
     */
    function ehValidador(address carteira) external view returns (bool) {
        Organizacao memory organizacao = organizacoes[carteira];

        return
            organizacao.ativa &&
            organizacao.tipoOrganizacao == TipoOrganizacao.Validador;
    }

    /**
     * @notice
     * Verifica se uma carteira é compradora ativa.
     *
     * @param carteira Endereço a ser consultado.
     *
     * @return Verdadeiro se a carteira for compradora ativa.
     */
    function ehComprador(address carteira) external view returns (bool) {
        Organizacao memory organizacao = organizacoes[carteira];

        return
            organizacao.ativa &&
            organizacao.tipoOrganizacao == TipoOrganizacao.Comprador;
    }

    /**
     * @notice
     * Verifica se uma carteira é administradora ativa.
     *
     * @param carteira Endereço a ser consultado.
     *
     * @return Verdadeiro se a carteira for administradora ativa.
     */
    function ehAdministrador(address carteira) external view returns (bool) {
        Organizacao memory organizacao = organizacoes[carteira];

        return
            organizacao.ativa &&
            organizacao.tipoOrganizacao == TipoOrganizacao.Administrador;
    }

    /**
     * @notice
     * Verifica se uma organização cadastrada está ativa.
     *
     * @param carteira Endereço a ser consultado.
     *
     * @return Verdadeiro se estiver cadastrada e ativa.
     */
    function organizacaoAtiva(address carteira) external view returns (bool) {
        return
            organizacaoCadastrada[carteira] &&
            organizacoes[carteira].ativa;
    }

    /**
     * @notice
     * Retorna o tipo cadastral de uma organização.
     *
     * @param carteira Endereço a ser consultado.
     *
     * @return Tipo da organização.
     */
    function obterTipoOrganizacao(
        address carteira
    ) external view returns (TipoOrganizacao) {
        require(organizacaoCadastrada[carteira], "Organizacao inexistente");

        return organizacoes[carteira].tipoOrganizacao;
    }

    /**
     * @notice
     * Retorna a carteira cadastrada em determinada posição da lista.
     *
     * @dev
     * Útil para scripts e front-end.
     *
     * @param indice Posição da carteira na lista.
     *
     * @return Endereço da carteira cadastrada.
     */
    function obterCarteiraPorIndice(
        uint256 indice
    ) external view returns (address) {
        require(indice < carteirasCadastradas.length, "Indice invalido");

        return carteirasCadastradas[indice];
    }

    /**
     * @notice
     * Retorna a quantidade total de carteiras cadastradas.
     *
     * @return Quantidade de carteiras cadastradas.
     */
    function quantidadeCarteirasCadastradas() external view returns (uint256) {
        return carteirasCadastradas.length;
    }
}
