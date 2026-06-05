// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @file ValidacaoProjetos.sol
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @title ValidacaoProjetos
 *
 * @notice
 * Contrato responsável pela votação técnica dos projetos ambientais
 * submetidos ao protocolo CarbonLedger.
 *
 * @dev
 * Este contrato não cadastra projetos e não emite créditos.
 *
 * Sua função é controlar a etapa de validação:
 *
 * - iniciar votação de um projeto submetido;
 * - permitir votos de validadores ativos;
 * - registrar votos de aprovação ou rejeição;
 * - receber sugestão de créditos aprovados;
 * - encerrar votação após o prazo;
 * - informar o resultado ao RegistroProjetosCarbono.
 *
 * No modelo consolidado, o validador pode precisar atender a dois critérios:
 *
 * 1. estar cadastrado como validador ativo em RegistroOrganizacoes;
 * 2. possuir stake mínimo no contrato StakingCarbono, se essa exigência
 *    estiver ativada.
 *
 * Como o StakingCarbono ainda será implementado, este contrato já deixa
 * a integração prevista de forma configurável.
 */

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @dev
 * Interface mínima do RegistroOrganizacoes usada pela validação.
 *
 * O objetivo é verificar se uma carteira está cadastrada como validadora ativa.
 *
 * O nome da interface foi especificado com sufixo para evitar conflito
 * com outras interfaces semelhantes declaradas em outros arquivos.
 */
interface IRegistroOrganizacoesValidacao {
    function ehValidador(address carteira) external view returns (bool);
}

/**
 * @dev
 * Interface mínima do RegistroProjetosCarbono usada pela validação.
 *
 * O contrato ValidacaoProjetos chama funções do RegistroProjetosCarbono
 * para alterar o estado do projeto e registrar o resultado da votação.
 */
interface IRegistroProjetosCarbonoValidacao {
    function marcarEmVotacao(uint256 idProjeto) external;

    function registrarResultadoValidacao(
        uint256 idProjeto,
        bool aprovado,
        uint256 creditosAprovados
    ) external;

    function obterCreditosSolicitados(
        uint256 idProjeto
    ) external view returns (uint256);
}

/**
 * @dev
 * Interface mínima prevista para o futuro contrato StakingCarbono.
 *
 * A função saldoEmStake deverá retornar a quantidade de TIC bloqueada
 * por determinado participante.
 *
 * Enquanto a exigência de stake estiver desativada, esta interface não
 * precisa ser usada.
 */
interface IStakingCarbonoValidacao {
    function saldoEmStake(address participante) external view returns (uint256);
}

/**
 * @title ValidacaoProjetos
 *
 * @notice
 * Controla a votação de validadores para aprovação ou rejeição de projetos.
 *
 * @dev
 * O contrato trabalha em conjunto com:
 *
 * - RegistroOrganizacoes: verifica se o votante é validador;
 * - RegistroProjetosCarbono: altera estado e registra resultado;
 * - StakingCarbono: opcionalmente verifica stake mínimo.
 *
 * Importante:
 * Após o deploy, este contrato deve ser autorizado no RegistroProjetosCarbono,
 * chamando:
 *
 * RegistroProjetosCarbono.autorizarContrato(enderecoValidacaoProjetos, true)
 */
contract ValidacaoProjetos is Ownable {
    /**
     * @notice
     * Opções de voto possíveis.
     *
     * @dev
     * Nenhum é o valor padrão antes do validador votar.
     */
    enum Voto {
        Nenhum,
        Aprovar,
        Rejeitar
    }

    /**
     * @notice
     * Estrutura que armazena os dados de uma votação de projeto.
     *
     * @param idProjeto Identificador do projeto em votação.
     * @param inicioVotacao Momento em que a votação foi iniciada.
     * @param fimVotacao Momento em que a votação será encerrada.
     * @param votosAprovacao Quantidade de votos favoráveis.
     * @param votosRejeicao Quantidade de votos contrários.
     * @param somaCreditosSugeridos Soma das quantidades de créditos sugeridas pelos validadores.
     * @param quantidadeSugestoes Quantidade de sugestões de créditos recebidas.
     * @param encerrada Indica se a votação foi encerrada.
     * @param aprovado Indica se o resultado final foi aprovação.
     * @param creditosAprovados Quantidade final de créditos aprovados.
     */
    struct VotacaoProjeto {
        uint256 idProjeto;
        uint256 inicioVotacao;
        uint256 fimVotacao;
        uint256 votosAprovacao;
        uint256 votosRejeicao;
        uint256 somaCreditosSugeridos;
        uint256 quantidadeSugestoes;
        bool encerrada;
        bool aprovado;
        uint256 creditosAprovados;
    }

    /**
     * @notice
     * Contrato de cadastro de organizações.
     */
    IRegistroOrganizacoesValidacao public registroOrganizacoes;

    /**
     * @notice
     * Contrato de registro de projetos.
     */
    IRegistroProjetosCarbonoValidacao public registroProjetosCarbono;

    /**
     * @notice
     * Contrato de staking.
     *
     * @dev
     * Pode ficar como address zero enquanto o staking ainda não for usado.
     */
    IStakingCarbonoValidacao public stakingCarbono;

    /**
     * @notice
     * Prazo padrão da votação.
     *
     * @dev
     * Valor inicial: 3 dias.
     */
    uint256 public prazoVotacao = 3 days;

    /**
     * @notice
     * Quórum mínimo de votos para validar o resultado.
     *
     * @dev
     * Valor inicial: 2 validadores.
     */
    uint256 public quorumMinimo = 2;

    /**
     * @notice
     * Indica se o contrato deve exigir stake mínimo para votar.
     *
     * @dev
     * Enquanto o StakingCarbono não estiver pronto, este valor pode ficar falso.
     */
    bool public exigirStakeMinimo;

    /**
     * @notice
     * Stake mínimo exigido para o validador votar.
     *
     * @dev
     * O valor é dado em unidades do token TIC.
     * Como o TIC possui 18 casas decimais, 1000 TIC devem ser informados
     * como 1000 * 10^18.
     */
    uint256 public stakeMinimoValidador;

    /**
     * @notice
     * Mapeia o id do projeto para sua votação.
     */
    mapping(uint256 => VotacaoProjeto) public votacoes;

    /**
     * @notice
     * Indica se determinado validador já votou em determinado projeto.
     */
    mapping(uint256 => mapping(address => bool)) public jaVotou;

    /**
     * @notice
     * Registra o voto de cada validador por projeto.
     */
    mapping(uint256 => mapping(address => Voto)) public votos;

    /**
     * @notice
     * Evento emitido quando uma votação é iniciada.
     */
    event VotacaoIniciada(
        uint256 indexed idProjeto,
        address indexed iniciador,
        uint256 inicioVotacao,
        uint256 fimVotacao
    );

    /**
     * @notice
     * Evento emitido quando um voto é registrado.
     */
    event VotoRegistrado(
        uint256 indexed idProjeto,
        address indexed validador,
        Voto voto,
        uint256 creditosSugeridos
    );

    /**
     * @notice
     * Evento emitido quando uma votação é encerrada.
     */
    event VotacaoEncerrada(
        uint256 indexed idProjeto,
        bool aprovado,
        uint256 creditosAprovados,
        uint256 votosAprovacao,
        uint256 votosRejeicao
    );

    /**
     * @notice
     * Evento emitido quando parâmetros de votação são alterados.
     */
    event ParametrosVotacaoAlterados(
        uint256 prazoVotacao,
        uint256 quorumMinimo
    );

    /**
     * @notice
     * Evento emitido quando a configuração de staking é alterada.
     */
    event ConfiguracaoStakeAlterada(
        address indexed enderecoStaking,
        bool exigirStakeMinimo,
        uint256 stakeMinimoValidador
    );

    /**
     * @notice
     * Inicializa o contrato de validação.
     *
     * @param enderecoRegistroOrganizacoes Endereço do RegistroOrganizacoes.
     * @param enderecoRegistroProjetosCarbono Endereço do RegistroProjetosCarbono.
     */
    constructor(
        address enderecoRegistroOrganizacoes,
        address enderecoRegistroProjetosCarbono
    ) Ownable(msg.sender) {
        require(
            enderecoRegistroOrganizacoes != address(0),
            "Registro organizacoes invalido"
        );
        require(
            enderecoRegistroProjetosCarbono != address(0),
            "Registro projetos invalido"
        );

        registroOrganizacoes = IRegistroOrganizacoesValidacao(
            enderecoRegistroOrganizacoes
        );

        registroProjetosCarbono = IRegistroProjetosCarbonoValidacao(
            enderecoRegistroProjetosCarbono
        );
    }

    /**
     * @notice
     * Altera os parâmetros gerais de votação.
     *
     * @dev
     * Futuramente, esta função poderá ser chamada pela GovernancaCarbono.
     *
     * @param novoPrazoVotacao Novo prazo da votação em segundos.
     * @param novoQuorumMinimo Novo quórum mínimo de votos.
     */
    function alterarParametrosVotacao(
        uint256 novoPrazoVotacao,
        uint256 novoQuorumMinimo
    ) external onlyOwner {
        require(novoPrazoVotacao > 0, "Prazo invalido");
        require(novoQuorumMinimo > 0, "Quorum invalido");

        prazoVotacao = novoPrazoVotacao;
        quorumMinimo = novoQuorumMinimo;

        emit ParametrosVotacaoAlterados(prazoVotacao, quorumMinimo);
    }

    /**
     * @notice
     * Configura a integração com o contrato de staking.
     *
     * @dev
     * Se exigirStake for verdadeiro, o endereço do StakingCarbono deve ser válido.
     *
     * @param enderecoStaking Endereço do contrato StakingCarbono.
     * @param exigirStake Indica se o stake mínimo deve ser exigido.
     * @param novoStakeMinimo Stake mínimo exigido para votar.
     */
    function configurarStakeValidador(
        address enderecoStaking,
        bool exigirStake,
        uint256 novoStakeMinimo
    ) external onlyOwner {
        if (exigirStake) {
            require(enderecoStaking != address(0), "Staking invalido");
            require(novoStakeMinimo > 0, "Stake minimo invalido");
        }

        stakingCarbono = IStakingCarbonoValidacao(enderecoStaking);
        exigirStakeMinimo = exigirStake;
        stakeMinimoValidador = novoStakeMinimo;

        emit ConfiguracaoStakeAlterada(
            enderecoStaking,
            exigirStake,
            novoStakeMinimo
        );
    }

    /**
     * @notice
     * Inicia a votação de um projeto ambiental.
     *
     * @dev
     * Apenas um validador apto pode iniciar a votação.
     *
     * Ao iniciar, o contrato chama RegistroProjetosCarbono.marcarEmVotacao.
     *
     * Para isso funcionar, este contrato deve estar autorizado no
     * RegistroProjetosCarbono.
     *
     * @param idProjeto Identificador do projeto.
     */
    function iniciarVotacao(uint256 idProjeto) external {
        require(validadorApto(msg.sender), "Validador nao apto");
        require(idProjeto > 0, "Projeto invalido");
        require(votacoes[idProjeto].idProjeto == 0, "Votacao ja iniciada");

        registroProjetosCarbono.marcarEmVotacao(idProjeto);

        uint256 inicio = block.timestamp;
        uint256 fim = inicio + prazoVotacao;

        votacoes[idProjeto] = VotacaoProjeto({
            idProjeto: idProjeto,
            inicioVotacao: inicio,
            fimVotacao: fim,
            votosAprovacao: 0,
            votosRejeicao: 0,
            somaCreditosSugeridos: 0,
            quantidadeSugestoes: 0,
            encerrada: false,
            aprovado: false,
            creditosAprovados: 0
        });

        emit VotacaoIniciada(idProjeto, msg.sender, inicio, fim);
    }

    /**
     * @notice
     * Registra o voto de um validador.
     *
     * @dev
     * Para voto de aprovação, o validador deve sugerir uma quantidade
     * de créditos maior que zero e menor ou igual aos créditos solicitados.
     *
     * Para voto de rejeição, a quantidade de créditos sugeridos deve ser zero.
     *
     * @param idProjeto Identificador do projeto.
     * @param voto Voto do validador.
     * @param creditosSugeridos Quantidade de créditos sugeridos, se aprovação.
     */
    function votarProjeto(
        uint256 idProjeto,
        Voto voto,
        uint256 creditosSugeridos
    ) external {
        require(validadorApto(msg.sender), "Validador nao apto");
        require(
            voto == Voto.Aprovar || voto == Voto.Rejeitar,
            "Voto invalido"
        );

        VotacaoProjeto storage votacao = votacoes[idProjeto];

        require(votacao.idProjeto != 0, "Votacao inexistente");
        require(!votacao.encerrada, "Votacao encerrada");
        require(block.timestamp <= votacao.fimVotacao, "Prazo encerrado");
        require(!jaVotou[idProjeto][msg.sender], "Validador ja votou");

        jaVotou[idProjeto][msg.sender] = true;
        votos[idProjeto][msg.sender] = voto;

        if (voto == Voto.Aprovar) {
            uint256 creditosSolicitados = registroProjetosCarbono
                .obterCreditosSolicitados(idProjeto);

            require(creditosSugeridos > 0, "Creditos sugeridos invalidos");
            require(
                creditosSugeridos <= creditosSolicitados,
                "Sugestao acima do solicitado"
            );

            votacao.votosAprovacao++;
            votacao.somaCreditosSugeridos += creditosSugeridos;
            votacao.quantidadeSugestoes++;
        } else {
            require(
                creditosSugeridos == 0,
                "Rejeicao nao deve sugerir creditos"
            );

            votacao.votosRejeicao++;
        }

        emit VotoRegistrado(
            idProjeto,
            msg.sender,
            voto,
            creditosSugeridos
        );
    }

    /**
     * @notice
     * Encerra a votação de um projeto.
     *
     * @dev
     * Qualquer usuário pode chamar após o fim do prazo.
     *
     * O contrato calcula:
     *
     * - se o quórum foi atingido;
     * - se houve maioria de aprovação;
     * - a média dos créditos sugeridos, em caso de aprovação.
     *
     * Em seguida, chama RegistroProjetosCarbono.registrarResultadoValidacao.
     *
     * @param idProjeto Identificador do projeto.
     */
    function encerrarVotacao(uint256 idProjeto) external {
        VotacaoProjeto storage votacao = votacoes[idProjeto];

        require(votacao.idProjeto != 0, "Votacao inexistente");
        require(!votacao.encerrada, "Votacao ja encerrada");
        require(block.timestamp > votacao.fimVotacao, "Votacao ainda aberta");

        votacao.encerrada = true;

        uint256 quantidadeTotalVotos =
            votacao.votosAprovacao +
            votacao.votosRejeicao;

        bool atingiuQuorum = quantidadeTotalVotos >= quorumMinimo;
        bool maioriaAprovou = votacao.votosAprovacao > votacao.votosRejeicao;

        bool aprovado = atingiuQuorum && maioriaAprovou;
        uint256 creditosAprovados = 0;

        if (aprovado) {
            creditosAprovados =
                votacao.somaCreditosSugeridos /
                votacao.quantidadeSugestoes;
        }

        votacao.aprovado = aprovado;
        votacao.creditosAprovados = creditosAprovados;

        registroProjetosCarbono.registrarResultadoValidacao(
            idProjeto,
            aprovado,
            creditosAprovados
        );

        emit VotacaoEncerrada(
            idProjeto,
            aprovado,
            creditosAprovados,
            votacao.votosAprovacao,
            votacao.votosRejeicao
        );
    }

    /**
     * @notice
     * Verifica se uma carteira está apta a atuar como validadora.
     *
     * @dev
     * A aptidão depende de:
     *
     * - ser validador ativo em RegistroOrganizacoes;
     * - se habilitado, possuir stake mínimo em StakingCarbono.
     *
     * @param carteira Endereço consultado.
     *
     * @return Verdadeiro se o endereço estiver apto a votar.
     */
    function validadorApto(address carteira) public view returns (bool) {
        bool cadastradoComoValidador = registroOrganizacoes.ehValidador(
            carteira
        );

        if (!cadastradoComoValidador) {
            return false;
        }

        if (!exigirStakeMinimo) {
            return true;
        }

        if (address(stakingCarbono) == address(0)) {
            return false;
        }

        return stakingCarbono.saldoEmStake(carteira) >= stakeMinimoValidador;
    }

    /**
     * @notice
     * Retorna se uma votação está aberta.
     *
     * @param idProjeto Identificador do projeto.
     *
     * @return Verdadeiro se a votação existir, não estiver encerrada
     * e ainda estiver dentro do prazo.
     */
    function votacaoAberta(uint256 idProjeto) external view returns (bool) {
        VotacaoProjeto memory votacao = votacoes[idProjeto];

        return
            votacao.idProjeto != 0 &&
            !votacao.encerrada &&
            block.timestamp <= votacao.fimVotacao;
    }

    /**
     * @notice
     * Retorna o total de votos de uma votação.
     *
     * @param idProjeto Identificador do projeto.
     *
     * @return Total de votos registrados.
     */
    function totalVotos(uint256 idProjeto) external view returns (uint256) {
        VotacaoProjeto memory votacao = votacoes[idProjeto];

        return votacao.votosAprovacao + votacao.votosRejeicao;
    }
}
