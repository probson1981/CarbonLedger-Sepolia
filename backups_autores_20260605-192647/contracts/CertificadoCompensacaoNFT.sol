// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file CertificadoCompensacaoNFT.sol
 * @author Patrício Alves
 * @title CertificadoCompensacaoNFT
 *
 * @notice
 * Contrato ERC-721 responsável pela emissão de certificados digitais
 * de compensação de carbono no protocolo CarbonLedger.
 *
 * @dev
 * Cada certificado representa uma aposentadoria de créditos de carbono.
 *
 * A lógica adotada é:
 *
 * - o comprador adquire créditos de carbono;
 * - o comprador aposenta esses créditos;
 * - os créditos aposentados são queimados;
 * - o sistema emite um NFT como certificado da compensação realizada.
 *
 * O NFT não representa crédito negociável. Ele representa apenas um
 * comprovante digital, rastreável e auditável da compensação.
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CertificadoCompensacaoNFT
 *
 * @notice
 * Implementa certificados ERC-721 para comprovar compensações realizadas.
 *
 * @dev
 * O contrato usa:
 *
 * - ERC721 da OpenZeppelin para emissão de NFTs únicos;
 * - Ownable para controle administrativo;
 * - lista de contratos autorizados para restringir a emissão.
 *
 * No fluxo completo, apenas o contrato RegistroAposentadorias deverá
 * chamar a função de emissão de certificados.
 */
contract CertificadoCompensacaoNFT is ERC721, Ownable {
    /**
     * @notice
     * Estrutura que armazena os dados principais do certificado.
     *
     * @dev
     * O certificado fica vinculado a uma aposentadoria de créditos.
     *
     * @param idCertificado Identificador único do certificado NFT.
     * @param idAposentadoria Identificador da aposentadoria associada.
     * @param beneficiario Endereço da empresa ou organização beneficiária.
     * @param quantidadeCompensada Quantidade de créditos aposentados.
     * @param descricao Descrição resumida da compensação.
     * @param uriCertificado URI com metadados do certificado.
     * @param dataEmissao Data de emissão do certificado.
     */
    struct Certificado {
        uint256 idCertificado;
        uint256 idAposentadoria;
        address beneficiario;
        uint256 quantidadeCompensada;
        string descricao;
        string uriCertificado;
        uint256 dataEmissao;
    }

    /**
     * @notice
     * Contador total de certificados emitidos.
     *
     * @dev
     * Também é usado para gerar o próximo tokenId do ERC-721.
     */
    uint256 public totalCertificados;

    /**
     * @notice
     * Mapeia o id do certificado para os dados completos do certificado.
     */
    mapping(uint256 => Certificado) public certificados;

    /**
     * @notice
     * Mapeia o id do token para a URI de metadados.
     *
     * @dev
     * A URI pode apontar para IPFS ou outro serviço de armazenamento.
     */
    mapping(uint256 => string) private urisCertificados;

    /**
     * @notice
     * Lista de contratos autorizados a emitir certificados.
     *
     * @dev
     * No fluxo completo, o RegistroAposentadorias será autorizado aqui.
     */
    mapping(address => bool) public contratosAutorizados;

    /**
     * @notice
     * Evento emitido quando um novo certificado é gerado.
     */
    event CertificadoEmitido(
        uint256 indexed idCertificado,
        uint256 indexed idAposentadoria,
        address indexed beneficiario,
        uint256 quantidadeCompensada,
        string uriCertificado
    );

    /**
     * @notice
     * Evento emitido quando um contrato é autorizado ou desautorizado.
     */
    event ContratoAutorizado(address indexed contrato, bool autorizado);

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
     * Inicializa o contrato ERC-721 dos certificados de compensação.
     *
     * @dev
     * Define o nome e o símbolo do NFT.
     *
     * Nome: Certificado de Compensacao CarbonLedger
     * Símbolo: CCLC
     *
     * O Ownable define o implantador como dono inicial do contrato.
     */
    constructor()
        ERC721("Certificado de Compensacao CarbonLedger", "CCLC")
        Ownable(msg.sender)
    {}

    /**
     * @notice
     * Autoriza ou remove autorização de um contrato do protocolo.
     *
     * @dev
     * Essa função deve ser chamada pelo dono do contrato.
     *
     * Exemplo de uso:
     *
     * autorizarContrato(enderecoRegistroAposentadorias, true)
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
     * Emite um certificado NFT de compensação.
     *
     * @dev
     * Esta função só pode ser chamada por contrato autorizado.
     *
     * No fluxo completo:
     *
     * 1. o comprador aposenta créditos;
     * 2. o RegistroAposentadorias queima os créditos;
     * 3. o RegistroAposentadorias chama esta função;
     * 4. o beneficiário recebe o NFT de certificado.
     *
     * @param beneficiario Endereço que receberá o certificado.
     * @param idAposentadoria Identificador da aposentadoria associada.
     * @param quantidadeCompensada Quantidade de créditos compensados.
     * @param descricao Descrição resumida da compensação.
     * @param uriCertificado URI dos metadados do certificado.
     *
     * @return idCertificado Identificador do NFT emitido.
     */
    function emitirCertificado(
        address beneficiario,
        uint256 idAposentadoria,
        uint256 quantidadeCompensada,
        string memory descricao,
        string memory uriCertificado
    ) external apenasContratoAutorizado returns (uint256) {
        require(beneficiario != address(0), "Beneficiario invalido");
        require(idAposentadoria > 0, "Aposentadoria invalida");
        require(quantidadeCompensada > 0, "Quantidade invalida");
        require(bytes(descricao).length > 0, "Descricao obrigatoria");
        require(bytes(uriCertificado).length > 0, "URI obrigatoria");

        /*
         * Incrementa o contador de certificados.
         *
         * O novo valor será usado como tokenId do NFT.
         */
        totalCertificados++;

        uint256 idCertificado = totalCertificados;

        /*
         * Registra os dados do certificado em armazenamento permanente.
         */
        certificados[idCertificado] = Certificado({
            idCertificado: idCertificado,
            idAposentadoria: idAposentadoria,
            beneficiario: beneficiario,
            quantidadeCompensada: quantidadeCompensada,
            descricao: descricao,
            uriCertificado: uriCertificado,
            dataEmissao: block.timestamp
        });

        /*
         * Armazena a URI específica do NFT.
         */
        urisCertificados[idCertificado] = uriCertificado;

        /*
         * Emite o NFT para o beneficiário.
         *
         * A função _safeMint é herdada do ERC721 da OpenZeppelin.
         */
        _safeMint(beneficiario, idCertificado);

        emit CertificadoEmitido(
            idCertificado,
            idAposentadoria,
            beneficiario,
            quantidadeCompensada,
            uriCertificado
        );

        return idCertificado;
    }

    /**
     * @notice
     * Retorna a URI de metadados de um certificado NFT.
     *
     * @dev
     * Sobrescreve a função tokenURI do ERC-721.
     *
     * A chamada ownerOf(tokenId) é usada para garantir que o token existe.
     *
     * @param tokenId Identificador do certificado NFT.
     *
     * @return URI dos metadados do certificado.
     */
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        /*
         * Se o token não existir, ownerOf reverte automaticamente.
         */
        ownerOf(tokenId);

        return urisCertificados[tokenId];
    }
}