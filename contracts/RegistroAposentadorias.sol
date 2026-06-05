// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file RegistroAposentadorias.sol
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @title RegistroAposentadorias
 *
 * @notice
 * Contrato responsável por registrar a aposentadoria dos créditos de carbono
 * no protocolo CarbonLedger.
 *
 * @dev
 * A aposentadoria é o ato que transforma um crédito comprado em uma
 * compensação efetiva.
 *
 * No mercado de carbono, comprar um crédito não significa, por si só,
 * compensar emissões. A compensação ocorre quando o crédito é aposentado,
 * cancelado ou queimado, impedindo sua reutilização.
 *
 * Este contrato executa esse fluxo:
 *
 * 1. comprador solicita aposentadoria;
 * 2. contrato cobra emolumento de aposentadoria;
 * 3. contrato encaminha taxa para a TesourariaCarbono;
 * 4. contrato queima os créditos ERC-1155 do comprador;
 * 5. contrato registra a aposentadoria;
 * 6. contrato solicita a emissão de certificado NFT ERC-721.
 *
 * Importante:
 * Para este contrato funcionar corretamente, ele deve ser autorizado em:
 *
 * - CreditoCarbonoToken, para que possa queimar créditos;
 * - CertificadoCompensacaoNFT, para que possa emitir certificados.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev
 * Interface mínima do RegistroOrganizacoes.
 *
 * Usada para verificar se quem está aposentando créditos é um comprador ativo.
 */
interface IRegistroOrganizacoesAposentadoria {
    function ehComprador(address carteira) external view returns (bool);
}

/**
 * @dev
 * Interface mínima do CreditoCarbonoToken.
 *
 * Usada para consultar saldo e queimar créditos de carbono ERC-1155.
 */
interface ICreditoCarbonoTokenAposentadoria {
    function balanceOf(
        address account,
        uint256 id
    ) external view returns (uint256);

    function queimarCreditos(
        address titular,
        uint256 idLote,
        uint256 quantidade
    ) external;
}

/**
 * @dev
 * Interface mínima do CertificadoCompensacaoNFT.
 *
 * Usada para emitir certificado NFT após a aposentadoria dos créditos.
 */
interface ICertificadoCompensacaoNFTAposentadoria {
    function emitirCertificado(
        address beneficiario,
        uint256 idAposentadoria,
        uint256 quantidadeCompensada,
        string memory descricao,
        string memory uriCertificado
    ) external returns (uint256);
}

/**
 * @dev
 * Interface mínima da TesourariaCarbono.
 *
 * Usada para encaminhar o emolumento de aposentadoria.
 */
interface ITesourariaCarbonoAposentadoria {
    function receberTaxaETH(string memory origem) external payable;
}

/**
 * @title RegistroAposentadorias
 *
 * @notice
 * Registra a baixa definitiva dos créditos de carbono.
 *
 * @dev
 * Este contrato representa a etapa final do ciclo ambiental:
 *
 * - o crédito deixa de circular;
 * - o saldo ERC-1155 do comprador é reduzido;
 * - a compensação fica registrada;
 * - um certificado NFT é emitido.
 */
contract RegistroAposentadorias is Ownable, ReentrancyGuard {
    /**
     * @notice
     * Estrutura que representa uma aposentadoria de créditos.
     *
     * @param idAposentadoria Identificador único da aposentadoria.
     * @param comprador Carteira que aposentou os créditos.
     * @param idLote Identificador do lote ERC-1155 aposentado.
     * @param quantidade Quantidade de créditos aposentados.
     * @param motivo Motivo declarado da aposentadoria.
     * @param uriRelatorio URI do relatório ou documento de compensação.
     * @param dataAposentadoria Data em que a aposentadoria foi registrada.
     * @param idCertificado Identificador do certificado NFT emitido.
     */
    struct Aposentadoria {
        uint256 idAposentadoria;
        address comprador;
        uint256 idLote;
        uint256 quantidade;
        string motivo;
        string uriRelatorio;
        uint256 dataAposentadoria;
        uint256 idCertificado;
    }

    /**
     * @notice
     * Contrato de cadastro das organizações.
     */
    IRegistroOrganizacoesAposentadoria public registroOrganizacoes;

    /**
     * @notice
     * Contrato ERC-1155 dos créditos de carbono.
     */
    ICreditoCarbonoTokenAposentadoria public creditoCarbonoToken;

    /**
     * @notice
     * Contrato ERC-721 dos certificados de compensação.
     */
    ICertificadoCompensacaoNFTAposentadoria public certificadoCompensacaoNFT;

    /**
     * @notice
     * Tesouraria central do protocolo.
     */
    ITesourariaCarbonoAposentadoria public tesourariaCarbono;

    /**
     * @notice
     * Total de aposentadorias registradas.
     */
    uint256 public totalAposentadorias;

    /**
     * @notice
     * Emolumento cobrado para aposentar créditos e emitir certificado.
     *
     * @dev
     * Valor inicial sugerido no modelo consolidado: 0.0005 ether.
     */
    uint256 public taxaAposentadoria = 0.0005 ether;

    /**
     * @notice
     * Mapeia idAposentadoria para os dados da aposentadoria.
     */
    mapping(uint256 => Aposentadoria) public aposentadorias;

    /**
     * @notice
     * Total de créditos compensados por comprador.
     */
    mapping(address => uint256) public totalCompensadoPorComprador;

    /**
     * @notice
     * Total de créditos aposentados por lote.
     */
    mapping(uint256 => uint256) public totalAposentadoPorLote;

    /**
     * @notice
     * Evento emitido quando uma aposentadoria é registrada.
     */
    event CreditosAposentados(
        uint256 indexed idAposentadoria,
        address indexed comprador,
        uint256 indexed idLote,
        uint256 quantidade,
        uint256 idCertificado
    );

    /**
     * @notice
     * Evento emitido quando a taxa de aposentadoria é alterada.
     */
    event TaxaAposentadoriaAlterada(uint256 novaTaxa);

    /**
     * @notice
     * Evento emitido quando os contratos integrados são atualizados.
     */
    event ContratosAtualizados(
        address registroOrganizacoes,
        address creditoCarbonoToken,
        address certificadoCompensacaoNFT,
        address tesourariaCarbono
    );

    /**
     * @notice
     * Inicializa o contrato de aposentadorias.
     *
     * @param enderecoRegistroOrganizacoes Endereço do RegistroOrganizacoes.
     * @param enderecoCreditoCarbonoToken Endereço do CreditoCarbonoToken.
     * @param enderecoCertificadoCompensacaoNFT Endereço do CertificadoCompensacaoNFT.
     * @param enderecoTesourariaCarbono Endereço da TesourariaCarbono.
     */
    constructor(
        address enderecoRegistroOrganizacoes,
        address enderecoCreditoCarbonoToken,
        address enderecoCertificadoCompensacaoNFT,
        address enderecoTesourariaCarbono
    ) Ownable(msg.sender) {
        _validarEnderecos(
            enderecoRegistroOrganizacoes,
            enderecoCreditoCarbonoToken,
            enderecoCertificadoCompensacaoNFT,
            enderecoTesourariaCarbono
        );

        registroOrganizacoes = IRegistroOrganizacoesAposentadoria(
            enderecoRegistroOrganizacoes
        );

        creditoCarbonoToken = ICreditoCarbonoTokenAposentadoria(
            enderecoCreditoCarbonoToken
        );

        certificadoCompensacaoNFT = ICertificadoCompensacaoNFTAposentadoria(
            enderecoCertificadoCompensacaoNFT
        );

        tesourariaCarbono = ITesourariaCarbonoAposentadoria(
            enderecoTesourariaCarbono
        );

        emit ContratosAtualizados(
            enderecoRegistroOrganizacoes,
            enderecoCreditoCarbonoToken,
            enderecoCertificadoCompensacaoNFT,
            enderecoTesourariaCarbono
        );
    }

    /**
     * @notice
     * Atualiza os contratos integrados.
     *
     * @dev
     * Função administrativa útil em ambiente local ou testnet.
     *
     * Em produção, essa função deveria ser controlada pela governança.
     *
     * @param enderecoRegistroOrganizacoes Novo endereço do RegistroOrganizacoes.
     * @param enderecoCreditoCarbonoToken Novo endereço do CreditoCarbonoToken.
     * @param enderecoCertificadoCompensacaoNFT Novo endereço do CertificadoCompensacaoNFT.
     * @param enderecoTesourariaCarbono Novo endereço da TesourariaCarbono.
     */
    function atualizarContratos(
        address enderecoRegistroOrganizacoes,
        address enderecoCreditoCarbonoToken,
        address enderecoCertificadoCompensacaoNFT,
        address enderecoTesourariaCarbono
    ) external onlyOwner {
        _validarEnderecos(
            enderecoRegistroOrganizacoes,
            enderecoCreditoCarbonoToken,
            enderecoCertificadoCompensacaoNFT,
            enderecoTesourariaCarbono
        );

        registroOrganizacoes = IRegistroOrganizacoesAposentadoria(
            enderecoRegistroOrganizacoes
        );

        creditoCarbonoToken = ICreditoCarbonoTokenAposentadoria(
            enderecoCreditoCarbonoToken
        );

        certificadoCompensacaoNFT = ICertificadoCompensacaoNFTAposentadoria(
            enderecoCertificadoCompensacaoNFT
        );

        tesourariaCarbono = ITesourariaCarbonoAposentadoria(
            enderecoTesourariaCarbono
        );

        emit ContratosAtualizados(
            enderecoRegistroOrganizacoes,
            enderecoCreditoCarbonoToken,
            enderecoCertificadoCompensacaoNFT,
            enderecoTesourariaCarbono
        );
    }

    /**
     * @notice
     * Altera o emolumento de aposentadoria.
     *
     * @dev
     * Futuramente, esta função poderá ser controlada pela GovernancaCarbono.
     *
     * @param novaTaxa Novo valor da taxa em wei.
     */
    function alterarTaxaAposentadoria(uint256 novaTaxa) external onlyOwner {
        taxaAposentadoria = novaTaxa;

        emit TaxaAposentadoriaAlterada(novaTaxa);
    }

    /**
     * @notice
     * Aposenta créditos de carbono.
     *
     * @dev
     * Esta é a função principal do contrato.
     *
     * Regras:
     *
     * - o chamador deve ser comprador ativo;
     * - deve possuir saldo suficiente do lote;
     * - deve pagar a taxa de aposentadoria;
     * - deve informar motivo;
     * - deve informar URI do relatório;
     * - deve informar URI do certificado;
     * - os créditos são queimados;
     * - a aposentadoria é registrada;
     * - o certificado NFT é emitido.
     *
     * @param idLote Identificador do lote ERC-1155.
     * @param quantidade Quantidade de créditos a aposentar.
     * @param motivo Motivo declarado da aposentadoria.
     * @param uriRelatorio URI do relatório de compensação.
     * @param uriCertificado URI dos metadados do certificado NFT.
     *
     * @return idAposentadoria Identificador da aposentadoria registrada.
     */
    function aposentarCreditos(
        uint256 idLote,
        uint256 quantidade,
        string memory motivo,
        string memory uriRelatorio,
        string memory uriCertificado
    ) external payable nonReentrant returns (uint256) {
        _validarPedidoAposentadoria(
            idLote,
            quantidade,
            motivo,
            uriRelatorio,
            uriCertificado
        );

        _encaminharTaxaAposentadoria();

        creditoCarbonoToken.queimarCreditos(
            msg.sender,
            idLote,
            quantidade
        );

        totalAposentadorias++;

        uint256 idAposentadoria = totalAposentadorias;

        string memory descricaoCertificado = string.concat(
            "Compensacao de creditos de carbono. Motivo: ",
            motivo
        );

        uint256 idCertificado = certificadoCompensacaoNFT.emitirCertificado(
            msg.sender,
            idAposentadoria,
            quantidade,
            descricaoCertificado,
            uriCertificado
        );

        aposentadorias[idAposentadoria] = Aposentadoria({
            idAposentadoria: idAposentadoria,
            comprador: msg.sender,
            idLote: idLote,
            quantidade: quantidade,
            motivo: motivo,
            uriRelatorio: uriRelatorio,
            dataAposentadoria: block.timestamp,
            idCertificado: idCertificado
        });

        totalCompensadoPorComprador[msg.sender] += quantidade;
        totalAposentadoPorLote[idLote] += quantidade;

        emit CreditosAposentados(
            idAposentadoria,
            msg.sender,
            idLote,
            quantidade,
            idCertificado
        );

        return idAposentadoria;
    }

    /**
     * @notice
     * Retorna se uma aposentadoria existe.
     *
     * @param idAposentadoria Identificador da aposentadoria.
     *
     * @return Verdadeiro se a aposentadoria existir.
     */
    function aposentadoriaExiste(
        uint256 idAposentadoria
    ) external view returns (bool) {
        return aposentadorias[idAposentadoria].idAposentadoria != 0;
    }

    /**
     * @notice
     * Valida os endereços dos contratos integrados.
     *
     * @dev
     * Função interna para evitar repetição no construtor e na atualização.
     */
    function _validarEnderecos(
        address enderecoRegistroOrganizacoes,
        address enderecoCreditoCarbonoToken,
        address enderecoCertificadoCompensacaoNFT,
        address enderecoTesourariaCarbono
    ) internal pure {
        require(
            enderecoRegistroOrganizacoes != address(0),
            "Registro organizacoes invalido"
        );
        require(
            enderecoCreditoCarbonoToken != address(0),
            "Token de credito invalido"
        );
        require(
            enderecoCertificadoCompensacaoNFT != address(0),
            "Certificado invalido"
        );
        require(
            enderecoTesourariaCarbono != address(0),
            "Tesouraria invalida"
        );
    }

    /**
     * @notice
     * Valida os dados do pedido de aposentadoria.
     *
     * @dev
     * Centraliza as validações para reduzir complexidade da função principal.
     */
    function _validarPedidoAposentadoria(
        uint256 idLote,
        uint256 quantidade,
        string memory motivo,
        string memory uriRelatorio,
        string memory uriCertificado
    ) internal view {
        require(
            registroOrganizacoes.ehComprador(msg.sender),
            "Somente comprador ativo"
        );
        require(idLote > 0, "Lote invalido");
        require(quantidade > 0, "Quantidade invalida");
        require(bytes(motivo).length > 0, "Motivo obrigatorio");
        require(bytes(uriRelatorio).length > 0, "Relatorio obrigatorio");
        require(bytes(uriCertificado).length > 0, "Certificado obrigatorio");
        require(msg.value >= taxaAposentadoria, "Taxa insuficiente");
        require(
            creditoCarbonoToken.balanceOf(msg.sender, idLote) >= quantidade,
            "Saldo insuficiente"
        );
    }

    /**
     * @notice
     * Encaminha a taxa de aposentadoria para a tesouraria.
     *
     * @dev
     * Se o usuário pagar valor excedente, o excedente é devolvido.
     */
    function _encaminharTaxaAposentadoria() internal {
        if (taxaAposentadoria > 0) {
            tesourariaCarbono.receberTaxaETH{value: taxaAposentadoria}(
                "taxa de aposentadoria"
            );
        }

        if (msg.value > taxaAposentadoria) {
            (bool sucessoDevolucao, ) = payable(msg.sender).call{
                value: msg.value - taxaAposentadoria
            }("");

            require(sucessoDevolucao, "Falha ao devolver excedente");
        }
    }
}
