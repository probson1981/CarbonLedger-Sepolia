// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file RegistroProjetosCarbono.sol
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @title RegistroProjetosCarbono
 *
 * @notice
 * Contrato responsável pelo cadastro, controle de estado e registro
 * dos projetos ambientais submetidos ao protocolo CarbonLedger.
 *
 * @dev
 * Este contrato representa a camada de registro dos projetos que poderão
 * gerar créditos de carbono.
 *
 * Ele não emite créditos diretamente.
 * Ele apenas registra o projeto, controla seus estados e armazena
 * a quantidade de créditos solicitados e aprovados.
 *
 * A emissão efetiva dos créditos será feita pelo contrato
 * CreditoCarbonoToken após aprovação do projeto.
 *
 * O contrato também cobra um emolumento de submissão, encaminhando
 * o valor para a TesourariaCarbono.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev
 * Interface mínima do RegistroOrganizacoes.
 *
 * Usada para verificar se quem submete projeto é um proponente ativo.
 */
interface IRegistroOrganizacoes {
    function ehProponente(address carteira) external view returns (bool);
}

/**
 * @dev
 * Interface mínima da TesourariaCarbono.
 *
 * Usada para encaminhar emolumentos de submissão de projetos.
 */
interface ITesourariaCarbono {
    function receberTaxaETH(string memory origem) external payable;
}

/**
 * @title RegistroProjetosCarbono
 *
 * @notice
 * Registra projetos ambientais submetidos para validação no CarbonLedger.
 *
 * @dev
 * Estados principais:
 *
 * - Submetido: projeto cadastrado e aguardando votação;
 * - EmVotacao: projeto em análise pelos validadores;
 * - Aprovado: projeto aprovado;
 * - Rejeitado: projeto rejeitado;
 * - Emitido: créditos já foram emitidos;
 * - Suspenso: projeto temporariamente suspenso;
 * - Revogado: projeto cancelado definitivamente.
 */
contract RegistroProjetosCarbono is Ownable {
    /**
     * @notice
     * Tipos de projeto ambiental aceitos no MVP.
     */
    enum TipoProjeto {
        Solar,
        Eolico,
        Reflorestamento,
        ConservacaoFlorestal,
        Biodigestor,
        EficienciaEnergetica,
        Reciclagem,
        Outro
    }

    /**
     * @notice
     * Estados possíveis de um projeto no protocolo.
     */
    enum EstadoProjeto {
        Rascunho,
        Submetido,
        EmVotacao,
        Aprovado,
        Rejeitado,
        Emitido,
        Suspenso,
        Revogado
    }

    /**
     * @notice
     * Estrutura principal de um projeto ambiental.
     *
     * @param idProjeto Identificador interno do projeto.
     * @param proponente Carteira da organização proponente.
     * @param nomeProjeto Nome público do projeto.
     * @param descricao Descrição resumida do projeto.
     * @param localizacao Localização declarada do projeto.
     * @param tipoProjeto Tipo ambiental do projeto.
     * @param creditosSolicitados Quantidade de créditos solicitados.
     * @param creditosAprovados Quantidade de créditos aprovados após validação.
     * @param uriEvidencias URI com documentos e evidências externas.
     * @param hashProjeto Hash único do projeto.
     * @param estadoProjeto Estado atual do projeto.
     * @param inicioPeriodoReferencia Início do período ambiental de referência.
     * @param fimPeriodoReferencia Fim do período ambiental de referência.
     * @param dataSubmissao Data da submissão mais recente.
     * @param dataUltimaRejeicao Data da última rejeição, se houver.
     */
    struct ProjetoCarbono {
        uint256 idProjeto;
        address proponente;
        string nomeProjeto;
        string descricao;
        string localizacao;
        TipoProjeto tipoProjeto;
        uint256 creditosSolicitados;
        uint256 creditosAprovados;
        string uriEvidencias;
        bytes32 hashProjeto;
        EstadoProjeto estadoProjeto;
        uint256 inicioPeriodoReferencia;
        uint256 fimPeriodoReferencia;
        uint256 dataSubmissao;
        uint256 dataUltimaRejeicao;
    }

    /**
     * @notice
     * Contrato de cadastro das organizações.
     */
    IRegistroOrganizacoes public registroOrganizacoes;

    /**
     * @notice
     * Contrato de tesouraria do protocolo.
     */
    ITesourariaCarbono public tesourariaCarbono;

    /**
     * @notice
     * Total de projetos cadastrados.
     */
    uint256 public totalProjetos;

    /**
     * @notice
     * Emolumento cobrado para submissão de projeto.
     *
     * @dev
     * Valor inicial sugerido no modelo consolidado: 0.001 ether.
     */
    uint256 public taxaSubmissaoProjeto = 0.001 ether;

    /**
     * @notice
     * Prazo mínimo para reenvio de projeto rejeitado.
     */
    uint256 public prazoReenvioProjeto = 30 days;

    /**
     * @notice
     * Mapeia o id do projeto para os dados do projeto.
     */
    mapping(uint256 => ProjetoCarbono) public projetos;

    /**
     * @notice
     * Controla hashes de projetos já cadastrados.
     *
     * @dev
     * Evita que o mesmo projeto, no mesmo período e local, seja cadastrado
     * mais de uma vez.
     */
    mapping(bytes32 => bool) public projetoJaCadastrado;

    /**
     * @notice
     * Contratos autorizados a alterar estados internos do projeto.
     *
     * @dev
     * Exemplo:
     *
     * - ValidacaoProjetos poderá marcar projeto como EmVotacao;
     * - ValidacaoProjetos poderá registrar resultado;
     * - CreditoCarbonoToken poderá marcar créditos como emitidos.
     */
    mapping(address => bool) public contratosAutorizados;

    /**
     * @notice
     * Evento emitido quando um projeto é cadastrado.
     */
    event ProjetoCadastrado(
        uint256 indexed idProjeto,
        address indexed proponente,
        bytes32 indexed hashProjeto,
        uint256 creditosSolicitados
    );

    /**
     * @notice
     * Evento emitido quando um projeto rejeitado é reenviado.
     */
    event ProjetoReenviado(
        uint256 indexed idProjeto,
        address indexed proponente,
        uint256 creditosSolicitados
    );

    /**
     * @notice
     * Evento emitido quando o estado do projeto é alterado.
     */
    event EstadoProjetoAlterado(
        uint256 indexed idProjeto,
        EstadoProjeto estadoProjeto
    );

    /**
     * @notice
     * Evento emitido quando a validação do projeto é registrada.
     */
    event ResultadoValidacaoRegistrado(
        uint256 indexed idProjeto,
        bool aprovado,
        uint256 creditosAprovados
    );

    /**
     * @notice
     * Evento emitido quando um contrato é autorizado ou desautorizado.
     */
    event ContratoAutorizado(address indexed contrato, bool autorizado);

    /**
     * @notice
     * Evento emitido quando a taxa de submissão é alterada.
     */
    event TaxaSubmissaoProjetoAlterada(uint256 novaTaxa);

    /**
     * @notice
     * Evento emitido quando o prazo de reenvio é alterado.
     */
    event PrazoReenvioProjetoAlterado(uint256 novoPrazo);

    /**
     * @notice
     * Restringe funções a contratos autorizados.
     */
    modifier apenasContratoAutorizado() {
        require(contratosAutorizados[msg.sender], "Contrato nao autorizado");
        _;
    }

    /**
     * @notice
     * Inicializa o registro de projetos.
     *
     * @param enderecoRegistroOrganizacoes Endereço do RegistroOrganizacoes.
     * @param enderecoTesourariaCarbono Endereço da TesourariaCarbono.
     */
    constructor(
        address enderecoRegistroOrganizacoes,
        address enderecoTesourariaCarbono
    ) Ownable(msg.sender) {
        require(
            enderecoRegistroOrganizacoes != address(0),
            "Registro organizacoes invalido"
        );
        require(
            enderecoTesourariaCarbono != address(0),
            "Tesouraria invalida"
        );

        registroOrganizacoes = IRegistroOrganizacoes(
            enderecoRegistroOrganizacoes
        );

        tesourariaCarbono = ITesourariaCarbono(enderecoTesourariaCarbono);
    }

    /**
     * @notice
     * Autoriza ou remove autorização de outro contrato do protocolo.
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
     * Altera a taxa de submissão de projeto.
     *
     * @dev
     * Futuramente esta função poderá ser controlada pela governança.
     *
     * @param novaTaxa Novo valor da taxa em wei.
     */
    function alterarTaxaSubmissaoProjeto(uint256 novaTaxa) external onlyOwner {
        taxaSubmissaoProjeto = novaTaxa;

        emit TaxaSubmissaoProjetoAlterada(novaTaxa);
    }

    /**
     * @notice
     * Altera o prazo mínimo para reenvio de projeto rejeitado.
     *
     * @param novoPrazo Novo prazo em segundos.
     */
    function alterarPrazoReenvioProjeto(
        uint256 novoPrazo
    ) external onlyOwner {
        prazoReenvioProjeto = novoPrazo;

        emit PrazoReenvioProjetoAlterado(novoPrazo);
    }

    /**
     * @notice
     * Cadastra um novo projeto ambiental.
     *
     * @dev
     * Apenas proponentes ativos podem cadastrar projetos.
     *
     * A função cobra emolumento de submissão e encaminha o valor
     * para a TesourariaCarbono.
     *
     * O hashProjeto é calculado com os principais dados que identificam
     * o projeto, sua localização e seu período de referência.
     *
     * @param nomeProjeto Nome do projeto.
     * @param descricao Descrição do projeto.
     * @param localizacao Localização declarada.
     * @param tipoProjeto Tipo ambiental do projeto.
     * @param creditosSolicitados Quantidade de créditos solicitados.
     * @param uriEvidencias URI das evidências externas.
     * @param inicioPeriodoReferencia Início do período de referência.
     * @param fimPeriodoReferencia Fim do período de referência.
     *
     * @return idProjeto Identificador do projeto criado.
     */
    function cadastrarProjeto(
        string memory nomeProjeto,
        string memory descricao,
        string memory localizacao,
        TipoProjeto tipoProjeto,
        uint256 creditosSolicitados,
        string memory uriEvidencias,
        uint256 inicioPeriodoReferencia,
        uint256 fimPeriodoReferencia
    ) external payable returns (uint256) {
        require(
            registroOrganizacoes.ehProponente(msg.sender),
            "Somente proponente ativo"
        );
        require(msg.value >= taxaSubmissaoProjeto, "Taxa insuficiente");
        require(bytes(nomeProjeto).length > 0, "Nome obrigatorio");
        require(bytes(descricao).length > 0, "Descricao obrigatoria");
        require(bytes(localizacao).length > 0, "Localizacao obrigatoria");
        require(bytes(uriEvidencias).length > 0, "URI obrigatoria");
        require(creditosSolicitados > 0, "Creditos invalidos");
        require(
            inicioPeriodoReferencia < fimPeriodoReferencia,
            "Periodo invalido"
        );

        bytes32 hashProjeto = keccak256(
            abi.encode(
                msg.sender,
                nomeProjeto,
                localizacao,
                tipoProjeto,
                inicioPeriodoReferencia,
                fimPeriodoReferencia
            )
        );

        require(!projetoJaCadastrado[hashProjeto], "Projeto ja cadastrado");

        if (msg.value > 0) {
            tesourariaCarbono.receberTaxaETH{value: msg.value}(
                "taxa de submissao de projeto"
            );
        }

        totalProjetos++;

        projetos[totalProjetos] = ProjetoCarbono({
            idProjeto: totalProjetos,
            proponente: msg.sender,
            nomeProjeto: nomeProjeto,
            descricao: descricao,
            localizacao: localizacao,
            tipoProjeto: tipoProjeto,
            creditosSolicitados: creditosSolicitados,
            creditosAprovados: 0,
            uriEvidencias: uriEvidencias,
            hashProjeto: hashProjeto,
            estadoProjeto: EstadoProjeto.Submetido,
            inicioPeriodoReferencia: inicioPeriodoReferencia,
            fimPeriodoReferencia: fimPeriodoReferencia,
            dataSubmissao: block.timestamp,
            dataUltimaRejeicao: 0
        });

        projetoJaCadastrado[hashProjeto] = true;

        emit ProjetoCadastrado(
            totalProjetos,
            msg.sender,
            hashProjeto,
            creditosSolicitados
        );

        emit EstadoProjetoAlterado(totalProjetos, EstadoProjeto.Submetido);

        return totalProjetos;
    }

    /**
     * @notice
     * Reenvia projeto rejeitado para nova análise.
     *
     * @dev
     * Mantém o mesmo idProjeto, mas permite atualizar evidências
     * e créditos solicitados após o prazo de reenvio.
     *
     * Essa função evita criar novo projeto duplicado apenas para corrigir
     * documentação ou solicitação de créditos.
     *
     * @param idProjeto Identificador do projeto rejeitado.
     * @param novaDescricao Nova descrição do projeto.
     * @param novosCreditosSolicitados Nova quantidade de créditos solicitados.
     * @param novaUriEvidencias Nova URI de evidências.
     */
    function reenviarProjeto(
        uint256 idProjeto,
        string memory novaDescricao,
        uint256 novosCreditosSolicitados,
        string memory novaUriEvidencias
    ) external payable {
        ProjetoCarbono storage projeto = projetos[idProjeto];

        require(projeto.idProjeto != 0, "Projeto inexistente");
        require(projeto.proponente == msg.sender, "Somente proponente");
        require(
            projeto.estadoProjeto == EstadoProjeto.Rejeitado,
            "Projeto nao rejeitado"
        );
        require(
            block.timestamp >=
                projeto.dataUltimaRejeicao + prazoReenvioProjeto,
            "Prazo de reenvio nao atingido"
        );
        require(msg.value >= taxaSubmissaoProjeto, "Taxa insuficiente");
        require(bytes(novaDescricao).length > 0, "Descricao obrigatoria");
        require(bytes(novaUriEvidencias).length > 0, "URI obrigatoria");
        require(novosCreditosSolicitados > 0, "Creditos invalidos");

        if (msg.value > 0) {
            tesourariaCarbono.receberTaxaETH{value: msg.value}(
                "taxa de reenvio de projeto"
            );
        }

        projeto.descricao = novaDescricao;
        projeto.creditosSolicitados = novosCreditosSolicitados;
        projeto.creditosAprovados = 0;
        projeto.uriEvidencias = novaUriEvidencias;
        projeto.estadoProjeto = EstadoProjeto.Submetido;
        projeto.dataSubmissao = block.timestamp;

        emit ProjetoReenviado(
            idProjeto,
            msg.sender,
            novosCreditosSolicitados
        );

        emit EstadoProjetoAlterado(idProjeto, EstadoProjeto.Submetido);
    }

    /**
     * @notice
     * Marca projeto como em votação.
     *
     * @dev
     * Deve ser chamada pelo contrato ValidacaoProjetos.
     *
     * @param idProjeto Identificador do projeto.
     */
    function marcarEmVotacao(
        uint256 idProjeto
    ) external apenasContratoAutorizado {
        ProjetoCarbono storage projeto = projetos[idProjeto];

        require(projeto.idProjeto != 0, "Projeto inexistente");
        require(
            projeto.estadoProjeto == EstadoProjeto.Submetido,
            "Estado invalido"
        );

        projeto.estadoProjeto = EstadoProjeto.EmVotacao;

        emit EstadoProjetoAlterado(idProjeto, EstadoProjeto.EmVotacao);
    }

    /**
     * @notice
     * Registra o resultado da validação de um projeto.
     *
     * @dev
     * Deve ser chamada pelo contrato ValidacaoProjetos.
     *
     * @param idProjeto Identificador do projeto.
     * @param aprovado Indica se o projeto foi aprovado.
     * @param creditosAprovados Quantidade de créditos aprovados.
     */
    function registrarResultadoValidacao(
        uint256 idProjeto,
        bool aprovado,
        uint256 creditosAprovados
    ) external apenasContratoAutorizado {
        ProjetoCarbono storage projeto = projetos[idProjeto];

        require(projeto.idProjeto != 0, "Projeto inexistente");
        require(
            projeto.estadoProjeto == EstadoProjeto.EmVotacao,
            "Projeto nao esta em votacao"
        );

        if (aprovado) {
            require(creditosAprovados > 0, "Creditos aprovados invalidos");
            require(
                creditosAprovados <= projeto.creditosSolicitados,
                "Aprovado acima do solicitado"
            );

            projeto.creditosAprovados = creditosAprovados;
            projeto.estadoProjeto = EstadoProjeto.Aprovado;
        } else {
            projeto.creditosAprovados = 0;
            projeto.estadoProjeto = EstadoProjeto.Rejeitado;
            projeto.dataUltimaRejeicao = block.timestamp;
        }

        emit ResultadoValidacaoRegistrado(
            idProjeto,
            aprovado,
            creditosAprovados
        );

        emit EstadoProjetoAlterado(idProjeto, projeto.estadoProjeto);
    }

    /**
     * @notice
     * Marca que os créditos aprovados já foram emitidos.
     *
     * @dev
     * Deve ser chamada pelo contrato CreditoCarbonoToken após mint.
     *
     * @param idProjeto Identificador do projeto.
     */
    function marcarCreditosEmitidos(
        uint256 idProjeto
    ) external apenasContratoAutorizado {
        ProjetoCarbono storage projeto = projetos[idProjeto];

        require(projeto.idProjeto != 0, "Projeto inexistente");
        require(
            projeto.estadoProjeto == EstadoProjeto.Aprovado,
            "Projeto nao aprovado"
        );

        projeto.estadoProjeto = EstadoProjeto.Emitido;

        emit EstadoProjetoAlterado(idProjeto, EstadoProjeto.Emitido);
    }

    /**
     * @notice
     * Suspende temporariamente um projeto.
     *
     * @dev
     * Função administrativa.
     *
     * @param idProjeto Identificador do projeto.
     */
    function suspenderProjeto(uint256 idProjeto) external onlyOwner {
        ProjetoCarbono storage projeto = projetos[idProjeto];

        require(projeto.idProjeto != 0, "Projeto inexistente");
        require(
            projeto.estadoProjeto != EstadoProjeto.Revogado,
            "Projeto revogado"
        );

        projeto.estadoProjeto = EstadoProjeto.Suspenso;

        emit EstadoProjetoAlterado(idProjeto, EstadoProjeto.Suspenso);
    }

    /**
     * @notice
     * Revoga definitivamente um projeto.
     *
     * @dev
     * Função administrativa.
     *
     * @param idProjeto Identificador do projeto.
     */
    function revogarProjeto(uint256 idProjeto) external onlyOwner {
        ProjetoCarbono storage projeto = projetos[idProjeto];

        require(projeto.idProjeto != 0, "Projeto inexistente");

        projeto.estadoProjeto = EstadoProjeto.Revogado;

        emit EstadoProjetoAlterado(idProjeto, EstadoProjeto.Revogado);
    }

    /**
     * @notice
     * Retorna o proponente de um projeto.
     *
     * @param idProjeto Identificador do projeto.
     *
     * @return Endereço do proponente.
     */
    function obterProponente(uint256 idProjeto) external view returns (address) {
        return projetos[idProjeto].proponente;
    }

    /**
     * @notice
     * Retorna os créditos solicitados de um projeto.
     */
    function obterCreditosSolicitados(
        uint256 idProjeto
    ) external view returns (uint256) {
        return projetos[idProjeto].creditosSolicitados;
    }

    /**
     * @notice
     * Retorna os créditos aprovados de um projeto.
     */
    function obterCreditosAprovados(
        uint256 idProjeto
    ) external view returns (uint256) {
        return projetos[idProjeto].creditosAprovados;
    }

    /**
     * @notice
     * Retorna o estado atual de um projeto.
     */
    function obterEstadoProjeto(
        uint256 idProjeto
    ) external view returns (EstadoProjeto) {
        return projetos[idProjeto].estadoProjeto;
    }

    /**
     * @notice
     * Informa se o projeto está aprovado.
     */
    function projetoAprovado(uint256 idProjeto) external view returns (bool) {
        return projetos[idProjeto].estadoProjeto == EstadoProjeto.Aprovado;
    }

    /**
     * @notice
     * Informa se o projeto já teve créditos emitidos.
     */
    function projetoEmitido(uint256 idProjeto) external view returns (bool) {
        return projetos[idProjeto].estadoProjeto == EstadoProjeto.Emitido;
    }
}
