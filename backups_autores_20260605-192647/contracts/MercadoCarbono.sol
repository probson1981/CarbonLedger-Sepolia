// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file MercadoCarbono.sol
 * @author Patrício Alves
 * @title MercadoCarbono
 *
 * @notice
 * Contrato responsável pelo marketplace de créditos de carbono
 * do protocolo CarbonLedger.
 *
 * @dev
 * Este contrato permite que titulares de créditos ERC-1155 criem ofertas
 * de venda e que compradores ativos adquiram esses créditos usando ETH.
 *
 * O contrato:
 *
 * - registra ofertas de venda;
 * - valida saldo do vendedor;
 * - exige aprovação ERC-1155 do marketplace;
 * - processa compras parciais ou totais;
 * - calcula taxa de marketplace;
 * - envia taxa para a TesourariaCarbono;
 * - envia valor líquido ao vendedor;
 * - transfere créditos ERC-1155 ao comprador.
 *
 * Importante:
 * O MercadoCarbono não aposenta créditos.
 * A aposentadoria será feita posteriormente pelo RegistroAposentadorias.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @dev
 * Interface mínima do token ERC-1155 de créditos de carbono.
 *
 * Usada para consultar saldo, verificar aprovação e transferir créditos.
 */
interface ICreditoCarbonoTokenMercado {
    function balanceOf(
        address account,
        uint256 id
    ) external view returns (uint256);

    function isApprovedForAll(
        address account,
        address operator
    ) external view returns (bool);

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes calldata data
    ) external;
}

/**
 * @dev
 * Interface mínima do RegistroOrganizacoes.
 *
 * Usada para verificar se o comprador está cadastrado e ativo.
 */
interface IRegistroOrganizacoesMercado {
    function ehComprador(address carteira) external view returns (bool);

    function organizacaoAtiva(address carteira) external view returns (bool);
}

/**
 * @dev
 * Interface mínima da TesourariaCarbono.
 *
 * Usada para encaminhar taxas de marketplace.
 */
interface ITesourariaCarbonoMercado {
    function receberTaxaETH(string memory origem) external payable;
}

/**
 * @title MercadoCarbono
 *
 * @notice
 * Marketplace para negociação de créditos de carbono tokenizados.
 *
 * @dev
 * O contrato usa:
 *
 * - Ownable para funções administrativas;
 * - ReentrancyGuard para proteger funções que movimentam ETH;
 * - interface ERC-1155 para transferir créditos;
 * - TesourariaCarbono para receber emolumentos do protocolo.
 */
contract MercadoCarbono is Ownable, ReentrancyGuard {
    /**
     * @notice
     * Estados possíveis de uma oferta.
     */
    enum EstadoOferta {
        Aberta,
        ParcialmenteVendida,
        Encerrada,
        Cancelada
    }

    /**
     * @notice
     * Estrutura que representa uma oferta de venda de créditos.
     *
     * @param idOferta Identificador interno da oferta.
     * @param vendedor Carteira que criou a oferta.
     * @param idLote Identificador do lote ERC-1155 ofertado.
     * @param quantidadeTotal Quantidade total inicialmente ofertada.
     * @param quantidadeDisponivel Quantidade ainda disponível para venda.
     * @param precoPorCredito Preço unitário de cada crédito em wei.
     * @param estadoOferta Estado atual da oferta.
     * @param dataCriacao Data de criação da oferta.
     * @param dataAtualizacao Data da última alteração da oferta.
     */
    struct OfertaCredito {
        uint256 idOferta;
        address vendedor;
        uint256 idLote;
        uint256 quantidadeTotal;
        uint256 quantidadeDisponivel;
        uint256 precoPorCredito;
        EstadoOferta estadoOferta;
        uint256 dataCriacao;
        uint256 dataAtualizacao;
    }

    /**
     * @notice
     * Contrato ERC-1155 dos créditos de carbono.
     */
    ICreditoCarbonoTokenMercado public creditoCarbonoToken;

    /**
     * @notice
     * Contrato de cadastro das organizações.
     */
    IRegistroOrganizacoesMercado public registroOrganizacoes;

    /**
     * @notice
     * Tesouraria central do protocolo.
     */
    ITesourariaCarbonoMercado public tesourariaCarbono;

    /**
     * @notice
     * Total de ofertas criadas.
     */
    uint256 public totalOfertas;

    /**
     * @notice
     * Taxa de marketplace em basis points.
     *
     * @dev
     * 10000 basis points = 100%.
     * 300 basis points = 3%.
     */
    uint256 public taxaMarketplaceBps = 300;

    /**
     * @notice
     * Denominador usado no cálculo de basis points.
     */
    uint256 public constant BASE_BPS = 10000;

    /**
     * @notice
     * Mapeia idOferta para os dados da oferta.
     */
    mapping(uint256 => OfertaCredito) public ofertas;

    /**
     * @notice
     * Evento emitido quando uma oferta é criada.
     */
    event OfertaCriada(
        uint256 indexed idOferta,
        address indexed vendedor,
        uint256 indexed idLote,
        uint256 quantidade,
        uint256 precoPorCredito
    );

    /**
     * @notice
     * Evento emitido quando créditos são comprados.
     */
    event CreditosComprados(
        uint256 indexed idOferta,
        address indexed comprador,
        address indexed vendedor,
        uint256 idLote,
        uint256 quantidade,
        uint256 valorTotal,
        uint256 valorTaxa,
        uint256 valorVendedor
    );

    /**
     * @notice
     * Evento emitido quando uma oferta é cancelada.
     */
    event OfertaCancelada(uint256 indexed idOferta, address indexed vendedor);

    /**
     * @notice
     * Evento emitido quando a taxa de marketplace é alterada.
     */
    event TaxaMarketplaceAlterada(uint256 novaTaxaBps);

    /**
     * @notice
     * Evento emitido quando os contratos integrados são atualizados.
     */
    event ContratosAtualizados(
        address creditoCarbonoToken,
        address registroOrganizacoes,
        address tesourariaCarbono
    );

    /**
     * @notice
     * Inicializa o marketplace de carbono.
     *
     * @param enderecoCreditoCarbonoToken Endereço do ERC-1155 de créditos.
     * @param enderecoRegistroOrganizacoes Endereço do RegistroOrganizacoes.
     * @param enderecoTesourariaCarbono Endereço da TesourariaCarbono.
     */
    constructor(
        address enderecoCreditoCarbonoToken,
        address enderecoRegistroOrganizacoes,
        address enderecoTesourariaCarbono
    ) Ownable(msg.sender) {
        require(
            enderecoCreditoCarbonoToken != address(0),
            "Token de credito invalido"
        );
        require(
            enderecoRegistroOrganizacoes != address(0),
            "Registro organizacoes invalido"
        );
        require(
            enderecoTesourariaCarbono != address(0),
            "Tesouraria invalida"
        );

        creditoCarbonoToken = ICreditoCarbonoTokenMercado(
            enderecoCreditoCarbonoToken
        );

        registroOrganizacoes = IRegistroOrganizacoesMercado(
            enderecoRegistroOrganizacoes
        );

        tesourariaCarbono = ITesourariaCarbonoMercado(
            enderecoTesourariaCarbono
        );

        emit ContratosAtualizados(
            enderecoCreditoCarbonoToken,
            enderecoRegistroOrganizacoes,
            enderecoTesourariaCarbono
        );
    }

    /**
     * @notice
     * Atualiza os contratos integrados ao marketplace.
     *
     * @dev
     * Função administrativa para ajustes em ambiente local ou testnet.
     *
     * @param enderecoCreditoCarbonoToken Novo endereço do ERC-1155.
     * @param enderecoRegistroOrganizacoes Novo endereço do registro.
     * @param enderecoTesourariaCarbono Novo endereço da tesouraria.
     */
    function atualizarContratos(
        address enderecoCreditoCarbonoToken,
        address enderecoRegistroOrganizacoes,
        address enderecoTesourariaCarbono
    ) external onlyOwner {
        require(
            enderecoCreditoCarbonoToken != address(0),
            "Token de credito invalido"
        );
        require(
            enderecoRegistroOrganizacoes != address(0),
            "Registro organizacoes invalido"
        );
        require(
            enderecoTesourariaCarbono != address(0),
            "Tesouraria invalida"
        );

        creditoCarbonoToken = ICreditoCarbonoTokenMercado(
            enderecoCreditoCarbonoToken
        );

        registroOrganizacoes = IRegistroOrganizacoesMercado(
            enderecoRegistroOrganizacoes
        );

        tesourariaCarbono = ITesourariaCarbonoMercado(
            enderecoTesourariaCarbono
        );

        emit ContratosAtualizados(
            enderecoCreditoCarbonoToken,
            enderecoRegistroOrganizacoes,
            enderecoTesourariaCarbono
        );
    }

    /**
     * @notice
     * Altera a taxa de marketplace.
     *
     * @dev
     * A taxa é informada em basis points.
     *
     * Exemplos:
     *
     * - 100 = 1%;
     * - 300 = 3%;
     * - 1000 = 10%.
     *
     * Para o MVP, limitamos a taxa máxima a 20%.
     *
     * @param novaTaxaBps Nova taxa em basis points.
     */
    function alterarTaxaMarketplace(uint256 novaTaxaBps) external onlyOwner {
        require(novaTaxaBps <= 2000, "Taxa acima do limite");

        taxaMarketplaceBps = novaTaxaBps;

        emit TaxaMarketplaceAlterada(novaTaxaBps);
    }

    /**
     * @notice
     * Cria uma oferta de venda de créditos de carbono.
     *
     * @dev
     * O vendedor precisa:
     *
     * - possuir saldo suficiente do lote;
     * - ter aprovado o MercadoCarbono no ERC-1155 com setApprovalForAll.
     *
     * A aprovação deve ser feita diretamente no CreditoCarbonoToken.
     *
     * @param idLote Identificador do lote ERC-1155.
     * @param quantidade Quantidade de créditos ofertados.
     * @param precoPorCredito Preço unitário em wei.
     *
     * @return idOferta Identificador da oferta criada.
     */
    function criarOferta(
        uint256 idLote,
        uint256 quantidade,
        uint256 precoPorCredito
    ) external returns (uint256) {
        require(idLote > 0, "Lote invalido");
        require(quantidade > 0, "Quantidade invalida");
        require(precoPorCredito > 0, "Preco invalido");

        require(
            registroOrganizacoes.organizacaoAtiva(msg.sender),
            "Vendedor nao cadastrado ou inativo"
        );

        require(
            creditoCarbonoToken.balanceOf(msg.sender, idLote) >= quantidade,
            "Saldo insuficiente"
        );

        require(
            creditoCarbonoToken.isApprovedForAll(msg.sender, address(this)),
            "Marketplace nao aprovado"
        );

        totalOfertas++;

        ofertas[totalOfertas] = OfertaCredito({
            idOferta: totalOfertas,
            vendedor: msg.sender,
            idLote: idLote,
            quantidadeTotal: quantidade,
            quantidadeDisponivel: quantidade,
            precoPorCredito: precoPorCredito,
            estadoOferta: EstadoOferta.Aberta,
            dataCriacao: block.timestamp,
            dataAtualizacao: block.timestamp
        });

        emit OfertaCriada(
            totalOfertas,
            msg.sender,
            idLote,
            quantidade,
            precoPorCredito
        );

        return totalOfertas;
    }

    /**
     * @notice
     * Compra créditos de carbono de uma oferta aberta.
     *
     * @dev
     * O comprador precisa estar cadastrado como comprador ativo.
     *
     * A função:
     *
     * - valida a oferta;
     * - calcula valor total;
     * - calcula taxa do protocolo;
     * - envia taxa à tesouraria;
     * - envia valor líquido ao vendedor;
     * - transfere créditos ao comprador;
     * - devolve eventual pagamento excedente.
     *
     * @param idOferta Identificador da oferta.
     * @param quantidade Quantidade de créditos a comprar.
     */
    function comprarCreditos(
        uint256 idOferta,
        uint256 quantidade
    ) external payable nonReentrant {
        require(
            registroOrganizacoes.ehComprador(msg.sender),
            "Somente comprador ativo"
        );
        require(quantidade > 0, "Quantidade invalida");

        OfertaCredito storage oferta = ofertas[idOferta];

        require(oferta.idOferta != 0, "Oferta inexistente");
        require(
            oferta.estadoOferta == EstadoOferta.Aberta ||
                oferta.estadoOferta == EstadoOferta.ParcialmenteVendida,
            "Oferta indisponivel"
        );
        require(
            oferta.quantidadeDisponivel >= quantidade,
            "Quantidade indisponivel"
        );

        require(
            creditoCarbonoToken.balanceOf(oferta.vendedor, oferta.idLote) >=
                quantidade,
            "Vendedor sem saldo"
        );

        require(
            creditoCarbonoToken.isApprovedForAll(
                oferta.vendedor,
                address(this)
            ),
            "Marketplace nao aprovado"
        );

        uint256 valorTotal = quantidade * oferta.precoPorCredito;

        require(msg.value >= valorTotal, "Pagamento insuficiente");

        uint256 valorTaxa = (valorTotal * taxaMarketplaceBps) / BASE_BPS;
        uint256 valorVendedor = valorTotal - valorTaxa;

        oferta.quantidadeDisponivel -= quantidade;
        oferta.dataAtualizacao = block.timestamp;

        if (oferta.quantidadeDisponivel == 0) {
            oferta.estadoOferta = EstadoOferta.Encerrada;
        } else {
            oferta.estadoOferta = EstadoOferta.ParcialmenteVendida;
        }

        if (valorTaxa > 0) {
            tesourariaCarbono.receberTaxaETH{value: valorTaxa}(
                "taxa de marketplace"
            );
        }

        if (valorVendedor > 0) {
            (bool sucessoVendedor, ) = payable(oferta.vendedor).call{
                value: valorVendedor
            }("");

            require(sucessoVendedor, "Falha ao pagar vendedor");
        }

        creditoCarbonoToken.safeTransferFrom(
            oferta.vendedor,
            msg.sender,
            oferta.idLote,
            quantidade,
            ""
        );

        if (msg.value > valorTotal) {
            (bool sucessoDevolucao, ) = payable(msg.sender).call{
                value: msg.value - valorTotal
            }("");

            require(sucessoDevolucao, "Falha ao devolver excedente");
        }

        emit CreditosComprados(
            idOferta,
            msg.sender,
            oferta.vendedor,
            oferta.idLote,
            quantidade,
            valorTotal,
            valorTaxa,
            valorVendedor
        );
    }

    /**
     * @notice
     * Cancela uma oferta aberta ou parcialmente vendida.
     *
     * @dev
     * Apenas o vendedor pode cancelar sua própria oferta.
     *
     * @param idOferta Identificador da oferta.
     */
    function cancelarOferta(uint256 idOferta) external {
        OfertaCredito storage oferta = ofertas[idOferta];

        require(oferta.idOferta != 0, "Oferta inexistente");
        require(oferta.vendedor == msg.sender, "Somente vendedor");
        require(
            oferta.estadoOferta == EstadoOferta.Aberta ||
                oferta.estadoOferta == EstadoOferta.ParcialmenteVendida,
            "Oferta nao cancelavel"
        );

        oferta.estadoOferta = EstadoOferta.Cancelada;
        oferta.dataAtualizacao = block.timestamp;

        emit OfertaCancelada(idOferta, msg.sender);
    }

    /**
     * @notice
     * Consulta se uma oferta está disponível para compra.
     *
     * @param idOferta Identificador da oferta.
     *
     * @return Verdadeiro se a oferta puder receber compras.
     */
    function ofertaDisponivel(uint256 idOferta) external view returns (bool) {
        OfertaCredito memory oferta = ofertas[idOferta];

        return
            oferta.idOferta != 0 &&
            oferta.quantidadeDisponivel > 0 &&
            (oferta.estadoOferta == EstadoOferta.Aberta ||
                oferta.estadoOferta == EstadoOferta.ParcialmenteVendida);
    }

    /**
     * @notice
     * Calcula os valores de uma compra sem executar a compra.
     *
     * @param idOferta Identificador da oferta.
     * @param quantidade Quantidade de créditos.
     *
     * @return valorTotal Valor total da compra.
     * @return valorTaxa Valor da taxa do protocolo.
     * @return valorVendedor Valor líquido destinado ao vendedor.
     */
    function calcularCompra(
        uint256 idOferta,
        uint256 quantidade
    )
        external
        view
        returns (
            uint256 valorTotal,
            uint256 valorTaxa,
            uint256 valorVendedor
        )
    {
        OfertaCredito memory oferta = ofertas[idOferta];

        require(oferta.idOferta != 0, "Oferta inexistente");
        require(quantidade > 0, "Quantidade invalida");

        valorTotal = quantidade * oferta.precoPorCredito;
        valorTaxa = (valorTotal * taxaMarketplaceBps) / BASE_BPS;
        valorVendedor = valorTotal - valorTaxa;
    }
}