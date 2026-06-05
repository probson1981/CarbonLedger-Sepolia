// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file CreditoCarbonoToken.sol
 * @author Patrício Alves
 * @title CreditoCarbonoToken
 *
 * @notice
 * Token ERC-1155 responsável por representar os lotes de créditos de carbono
 * emitidos no protocolo CarbonLedger.
 *
 * @dev
 * Cada lote de crédito de carbono é representado por um `idLote`.
 *
 * A lógica adotada no MVP é:
 *
 * - cada projeto aprovado poderá gerar um lote de créditos;
 * - cada crédito representa uma unidade de compensação ambiental;
 * - os créditos podem ser transferidos, vendidos ou aposentados;
 * - créditos aposentados devem ser queimados para impedir reutilização.
 *
 * O ERC-1155 foi escolhido porque permite representar vários tipos de ativos
 * em um único contrato. Assim, cada projeto ou lote pode ter seu próprio ID.
 */

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev
 * Interface mínima do RegistroProjetosCarbono usada pelo contrato de crédito.
 *
 * O CreditoCarbonoToken usa esta interface para:
 *
 * - confirmar se o projeto foi aprovado;
 * - verificar se os créditos ainda não foram emitidos;
 * - obter o proponente que receberá os créditos;
 * - obter a quantidade de créditos aprovados;
 * - marcar o projeto como emitido após o mint.
 */
interface IRegistroProjetosCarbonoCredito {
    function obterProponente(uint256 idProjeto) external view returns (address);

    function obterCreditosAprovados(
        uint256 idProjeto
    ) external view returns (uint256);

    function projetoAprovado(uint256 idProjeto) external view returns (bool);

    function projetoEmitido(uint256 idProjeto) external view returns (bool);

    function marcarCreditosEmitidos(uint256 idProjeto) external;
}

/**
 * @title CreditoCarbonoToken
 *
 * @notice
 * Contrato ERC-1155 para emissão e queima de créditos de carbono tokenizados.
 *
 * @dev
 * Este contrato representa os créditos ambientais aprovados por validação.
 *
 * Para o MVP, existem duas formas de emissão:
 *
 * 1. `emitirCreditos`: emissão manual pelo owner, útil para testes.
 *
 * 2. `emitirCreditosDeProjetoAprovado`: emissão vinculada ao
 *    RegistroProjetosCarbono, usando os dados reais do projeto aprovado.
 */
contract CreditoCarbonoToken is ERC1155, Ownable {
    /**
     * @notice
     * Estrutura com os dados principais de um lote de crédito de carbono.
     *
     * @dev
     * O lote guarda a relação entre o crédito emitido e o projeto ambiental
     * que originou aquele crédito.
     *
     * @param idProjeto Identificador do projeto ambiental associado ao lote.
     * @param quantidadeEmitida Quantidade total de créditos emitidos no lote.
     * @param quantidadeAposentada Quantidade de créditos já queimados ou aposentados.
     * @param anoReferencia Ano de referência ambiental do lote.
     * @param ativo Indica se o lote está ativo no protocolo.
     */
    struct LoteCredito {
        uint256 idProjeto;
        uint256 quantidadeEmitida;
        uint256 quantidadeAposentada;
        uint256 anoReferencia;
        bool ativo;
    }

    /**
     * @notice
     * Relaciona cada idLote aos seus dados ambientais e operacionais.
     */
    mapping(uint256 => LoteCredito) public lotesCredito;

    /**
     * @notice
     * Indica se um lote já foi emitido.
     *
     * @dev
     * Evita emissão duplicada para o mesmo idLote.
     */
    mapping(uint256 => bool) public loteEmitido;

    /**
     * @notice
     * Registra contratos autorizados a queimar créditos.
     *
     * @dev
     * Futuramente, o contrato RegistroAposentadorias será autorizado aqui
     * para que possa queimar créditos quando o comprador fizer a compensação.
     */
    mapping(address => bool) public contratosAutorizados;

    /**
     * @notice
     * Evento emitido quando um novo lote de créditos é criado.
     */
    event CreditosEmitidos(
        uint256 indexed idLote,
        uint256 indexed idProjeto,
        address indexed destinatario,
        uint256 quantidade,
        uint256 anoReferencia
    );

    /**
     * @notice
     * Evento emitido quando créditos são aposentados ou queimados.
     */
    event CreditosAposentados(
        uint256 indexed idLote,
        address indexed titular,
        uint256 quantidade
    );

    /**
     * @notice
     * Evento emitido quando um contrato é autorizado ou desautorizado.
     */
    event ContratoAutorizado(address indexed contrato, bool autorizado);

    /**
     * @notice
     * Restringe a execução a contratos autorizados.
     */
    modifier apenasContratoAutorizado() {
        require(contratosAutorizados[msg.sender], "Contrato nao autorizado");
        _;
    }

    /**
     * @notice
     * Inicializa o contrato ERC-1155 dos créditos de carbono.
     *
     * @dev
     * A URI base pode apontar para metadados no IPFS.
     *
     * Exemplo:
     * ipfs://bafy.../{id}.json
     *
     * O padrão ERC-1155 usa o marcador {id} para buscar os metadados
     * correspondentes a cada token.
     *
     * @param uriBase URI base dos metadados dos lotes de crédito.
     */
    constructor(string memory uriBase) ERC1155(uriBase) Ownable(msg.sender) {}

    /**
     * @notice
     * Autoriza ou remove autorização de outro contrato do protocolo.
     *
     * @dev
     * Essa função será usada para permitir que o RegistroAposentadorias
     * queime créditos quando eles forem aposentados pelo comprador.
     *
     * @param contrato Endereço do contrato a ser configurado.
     * @param autorizado Estado de autorização desejado.
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
     * Emite um novo lote de créditos de carbono manualmente.
     *
     * @dev
     * Esta função foi mantida para testes e operações administrativas.
     * Ela não altera o estado do projeto no RegistroProjetosCarbono.
     *
     * Para o fluxo principal do MVP, prefira usar:
     *
     * `emitirCreditosDeProjetoAprovado`.
     *
     * Regras:
     *
     * - destinatário não pode ser endereço zero;
     * - idLote ainda não pode ter sido emitido;
     * - quantidade deve ser maior que zero;
     * - idProjeto deve ser maior que zero;
     * - anoReferencia deve ser informado.
     *
     * @param destinatario Carteira que receberá os créditos.
     * @param idLote Identificador do lote ERC-1155.
     * @param idProjeto Identificador do projeto ambiental associado.
     * @param quantidade Quantidade de créditos emitidos.
     * @param anoReferencia Ano de referência ambiental do lote.
     */
    function emitirCreditos(
        address destinatario,
        uint256 idLote,
        uint256 idProjeto,
        uint256 quantidade,
        uint256 anoReferencia
    ) external onlyOwner {
        _registrarLoteEMintar(
            destinatario,
            idLote,
            idProjeto,
            quantidade,
            anoReferencia
        );
    }

    /**
     * @notice
     * Emite créditos de carbono para um projeto aprovado.
     *
     * @dev
     * Esta é a função principal recomendada para o MVP.
     *
     * Ela consulta o RegistroProjetosCarbono para obter:
     *
     * - se o projeto está aprovado;
     * - se o projeto ainda não foi emitido;
     * - quem é o proponente;
     * - quantos créditos foram aprovados.
     *
     * Após emitir o lote ERC-1155, a função chama
     * `marcarCreditosEmitidos` no RegistroProjetosCarbono.
     *
     * Para essa última chamada funcionar, o endereço deste contrato
     * CreditoCarbonoToken deve estar autorizado no RegistroProjetosCarbono.
     *
     * @param enderecoRegistroProjetos Endereço do contrato RegistroProjetosCarbono.
     * @param idProjeto Identificador do projeto aprovado.
     * @param idLote Identificador do lote ERC-1155 a ser criado.
     * @param anoReferencia Ano de referência ambiental do lote.
     */
    function emitirCreditosDeProjetoAprovado(
        address enderecoRegistroProjetos,
        uint256 idProjeto,
        uint256 idLote,
        uint256 anoReferencia
    ) external onlyOwner {
        require(
            enderecoRegistroProjetos != address(0),
            "Registro invalido"
        );
        require(idProjeto > 0, "Projeto invalido");
        require(idLote > 0, "Lote invalido");
        require(anoReferencia > 0, "Ano invalido");
        require(!loteEmitido[idLote], "Lote ja emitido");

        IRegistroProjetosCarbonoCredito registro = IRegistroProjetosCarbonoCredito(
                enderecoRegistroProjetos
            );

        require(registro.projetoAprovado(idProjeto), "Projeto nao aprovado");
        require(!registro.projetoEmitido(idProjeto), "Projeto ja emitido");

        address destinatario = registro.obterProponente(idProjeto);
        uint256 quantidade = registro.obterCreditosAprovados(idProjeto);

        require(destinatario != address(0), "Proponente invalido");
        require(quantidade > 0, "Creditos aprovados invalidos");

        _registrarLoteEMintar(
            destinatario,
            idLote,
            idProjeto,
            quantidade,
            anoReferencia
        );

        registro.marcarCreditosEmitidos(idProjeto);
    }

    /**
     * @notice
     * Queima créditos de carbono de uma carteira.
     *
     * @dev
     * A queima representa a aposentadoria do crédito.
     * Depois de queimado, o crédito não pode mais ser vendido,
     * transferido ou usado novamente.
     *
     * Esta função só pode ser chamada por contrato autorizado,
     * como o futuro RegistroAposentadorias.
     *
     * @param titular Carteira dona dos créditos.
     * @param idLote Identificador do lote ERC-1155.
     * @param quantidade Quantidade de créditos a queimar.
     */
    function queimarCreditos(
        address titular,
        uint256 idLote,
        uint256 quantidade
    ) external apenasContratoAutorizado {
        require(titular != address(0), "Titular invalido");
        require(lotesCredito[idLote].ativo, "Lote inativo");
        require(quantidade > 0, "Quantidade invalida");
        require(balanceOf(titular, idLote) >= quantidade, "Saldo insuficiente");

        lotesCredito[idLote].quantidadeAposentada += quantidade;

        _burn(titular, idLote, quantidade);

        emit CreditosAposentados(idLote, titular, quantidade);
    }

    /**
     * @notice
     * Consulta se um lote está ativo.
     *
     * @param idLote Identificador do lote.
     *
     * @return Verdadeiro se o lote estiver ativo.
     */
    function loteAtivo(uint256 idLote) external view returns (bool) {
        return lotesCredito[idLote].ativo;
    }

    /**
     * @notice
     * Registra internamente um lote e emite os créditos ERC-1155.
     *
     * @dev
     * Função interna usada tanto pela emissão manual quanto pela emissão
     * vinculada a projeto aprovado.
     *
     * @param destinatario Carteira que receberá os créditos.
     * @param idLote Identificador do lote ERC-1155.
     * @param idProjeto Identificador do projeto ambiental associado.
     * @param quantidade Quantidade de créditos a emitir.
     * @param anoReferencia Ano de referência ambiental do lote.
     */
    function _registrarLoteEMintar(
        address destinatario,
        uint256 idLote,
        uint256 idProjeto,
        uint256 quantidade,
        uint256 anoReferencia
    ) internal {
        require(destinatario != address(0), "Destinatario invalido");
        require(idLote > 0, "Lote invalido");
        require(idProjeto > 0, "Projeto invalido");
        require(quantidade > 0, "Quantidade invalida");
        require(anoReferencia > 0, "Ano invalido");
        require(!loteEmitido[idLote], "Lote ja emitido");

        lotesCredito[idLote] = LoteCredito({
            idProjeto: idProjeto,
            quantidadeEmitida: quantidade,
            quantidadeAposentada: 0,
            anoReferencia: anoReferencia,
            ativo: true
        });

        loteEmitido[idLote] = true;

        _mint(destinatario, idLote, quantidade, "");

        emit CreditosEmitidos(
            idLote,
            idProjeto,
            destinatario,
            quantidade,
            anoReferencia
        );
    }
}