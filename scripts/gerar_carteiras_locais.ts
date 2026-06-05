/**
 * @file gerar_carteiras_locais.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Script para gerar carteiras locais de teste para o CarbonLedger.
 *
 * @dev
 * Este script gera carteiras Ethereum para uso local no projeto.
 *
 * Serão geradas:
 *
 * 1. Uma carteira administradora;
 * 2. Três carteiras proponentes;
 * 3. Três carteiras validadoras;
 * 4. Três carteiras compradoras.
 *
 * O script salva os dados em:
 *
 * carteiras/carteiras.local.json
 * carteiras/.env.carteiras.local
 *
 * Atenção:
 * As chaves privadas geradas são sensíveis.
 * Não use essas carteiras em mainnet.
 * Não publique esses arquivos no GitHub.
 */

import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";

/**
 * @notice Estrutura de uma carteira gerada pelo script.
 */
type CarteiraGerada = {
  papel: string;
  indice: number;
  nome: string;
  address: string;
  privateKey: string;
};

/**
 * @notice Diretório onde os arquivos serão salvos.
 */
const DIRETORIO_SAIDA = path.join(process.cwd(), "carteiras");

/**
 * @notice Arquivo JSON com todas as carteiras.
 */
const ARQUIVO_JSON = path.join(DIRETORIO_SAIDA, "carteiras.local.json");

/**
 * @notice Arquivo .env com endereços e chaves privadas.
 */
const ARQUIVO_ENV = path.join(DIRETORIO_SAIDA, ".env.carteiras.local");

/**
 * @notice RPC local padrão do Hardhat Node.
 *
 * @dev
 * Para financiar automaticamente as carteiras, rode antes:
 *
 * npx hardhat node
 *
 * Depois, em outro terminal, rode este script.
 */
const RPC_LOCAL = process.env.RPC_LOCAL ?? "http://127.0.0.1:8545";

/**
 * @notice Chave privada padrão da primeira conta do Hardhat local.
 *
 * @dev
 * Essa chave é pública e conhecida em ambientes Hardhat locais.
 * Nunca use esta chave em rede real.
 */
const PRIVATE_KEY_DEPLOYER_HARDHAT =
  process.env.PRIVATE_KEY_DEPLOYER_LOCAL ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

/**
 * @notice Valor de ETH local enviado para cada carteira, se o Hardhat Node estiver ativo.
 */
const VALOR_FINANCIAMENTO_ETH =
  process.env.VALOR_FINANCIAMENTO_ETH ?? "100";

/**
 * @notice Cria o diretório de saída, se ele ainda não existir.
 */
function prepararDiretorioSaida() {
  if (!fs.existsSync(DIRETORIO_SAIDA)) {
    fs.mkdirSync(DIRETORIO_SAIDA, { recursive: true });
  }
}

/**
 * @notice Gera uma carteira aleatória.
 *
 * @param papel Papel funcional da carteira no protocolo.
 * @param indice Índice da carteira dentro do grupo.
 * @param nome Nome amigável da carteira.
 *
 * @return Dados da carteira gerada.
 */
function gerarCarteira(
  papel: string,
  indice: number,
  nome: string
): CarteiraGerada {
  const wallet = ethers.Wallet.createRandom();

  return {
    papel,
    indice,
    nome,
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * @notice Gera todas as carteiras necessárias para o CarbonLedger.
 *
 * @return Lista de carteiras geradas.
 */
function gerarCarteirasCarbonLedger(): CarteiraGerada[] {
  const carteiras: CarteiraGerada[] = [];

  /**
   * @dev
   * Carteira administradora do protocolo.
   */
  carteiras.push(
    gerarCarteira("administrador", 1, "Administrador do Sistema")
  );

  /**
   * @dev
   * Três carteiras proponentes.
   */
  for (let i = 1; i <= 3; i++) {
    carteiras.push(gerarCarteira("proponente", i, `Proponente ${i}`));
  }

  /**
   * @dev
   * Três carteiras validadoras.
   */
  for (let i = 1; i <= 3; i++) {
    carteiras.push(gerarCarteira("validador", i, `Validador ${i}`));
  }

  /**
   * @dev
   * Três carteiras compradoras.
   */
  for (let i = 1; i <= 3; i++) {
    carteiras.push(gerarCarteira("comprador", i, `Comprador ${i}`));
  }

  return carteiras;
}

/**
 * @notice Monta o conteúdo JSON com metadados e carteiras.
 *
 * @param carteiras Lista de carteiras geradas.
 *
 * @return Objeto pronto para serialização JSON.
 */
function montarJsonSaida(carteiras: CarteiraGerada[]) {
  return {
    projeto: "CarbonLedger",
    finalidade: "Carteiras locais para testes e demonstrações",
    redeSugerida: "Hardhat local ou localhost",
    geradoEm: new Date().toISOString(),
    aviso:
      "Arquivo contém chaves privadas. Não publicar, não versionar e não usar em mainnet.",
    carteiras: {
      administrador: carteiras.filter((c) => c.papel === "administrador"),
      proponentes: carteiras.filter((c) => c.papel === "proponente"),
      validadores: carteiras.filter((c) => c.papel === "validador"),
      compradores: carteiras.filter((c) => c.papel === "comprador"),
    },
  };
}

/**
 * @notice Monta o conteúdo do arquivo .env com endereços e chaves privadas.
 *
 * @param carteiras Lista de carteiras geradas.
 *
 * @return Conteúdo textual do arquivo .env.
 */
function montarEnvSaida(carteiras: CarteiraGerada[]): string {
  const linhas: string[] = [];

  linhas.push("# CarbonLedger - Carteiras locais de teste");
  linhas.push("# Arquivo sensível. Não publicar no GitHub.");
  linhas.push("");

  for (const carteira of carteiras) {
    const prefixo =
      carteira.papel === "administrador"
        ? "ADMINISTRADOR"
        : `${carteira.papel.toUpperCase()}_${carteira.indice}`;

    linhas.push(`${prefixo}_ADDRESS=${carteira.address}`);
    linhas.push(`${prefixo}_PRIVATE_KEY=${carteira.privateKey}`);
    linhas.push("");
  }

  return linhas.join("\n");
}

/**
 * @notice Salva os arquivos de saída em disco.
 *
 * @param carteiras Lista de carteiras geradas.
 */
function salvarArquivos(carteiras: CarteiraGerada[]) {
  prepararDiretorioSaida();

  const jsonSaida = montarJsonSaida(carteiras);
  const envSaida = montarEnvSaida(carteiras);

  fs.writeFileSync(ARQUIVO_JSON, JSON.stringify(jsonSaida, null, 2), "utf8");
  fs.writeFileSync(ARQUIVO_ENV, envSaida, "utf8");
}

/**
 * @notice Tenta financiar as carteiras com ETH local.
 *
 * @dev
 * Essa etapa só funciona se houver um Hardhat Node rodando em:
 *
 * http://127.0.0.1:8545
 *
 * Caso o nó não esteja rodando, o script apenas gera as carteiras.
 *
 * @param carteiras Lista de carteiras geradas.
 */
async function tentarFinanciarCarteiras(carteiras: CarteiraGerada[]) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_LOCAL);

    /**
     * @dev
     * Testa se o nó local está respondendo.
     */
    await provider.getBlockNumber();

    const financiador = new ethers.Wallet(
      PRIVATE_KEY_DEPLOYER_HARDHAT,
      provider
    );

    const valor = ethers.parseEther(VALOR_FINANCIAMENTO_ETH);

    console.log("");
    console.log("Hardhat Node detectado.");
    console.log(`Financiando cada carteira com ${VALOR_FINANCIAMENTO_ETH} ETH local...`);

    for (const carteira of carteiras) {
      const saldoAtual = await provider.getBalance(carteira.address);

      if (saldoAtual >= valor) {
        console.log(`${carteira.nome}: já possui saldo suficiente.`);
        continue;
      }

      const tx = await financiador.sendTransaction({
        to: carteira.address,
        value: valor,
      });

      await tx.wait();

      console.log(`${carteira.nome}: ${carteira.address} financiada.`);
    }
  } catch {
    console.log("");
    console.log("Hardhat Node local não detectado.");
    console.log("As carteiras foram geradas, mas não foram financiadas.");
    console.log("Para financiar automaticamente, rode antes:");
    console.log("");
    console.log("npx hardhat node");
    console.log("");
    console.log("E depois execute este script em outro terminal.");
  }
}

/**
 * @notice Função principal do script.
 */
async function main() {
  console.log("Gerando carteiras locais para o CarbonLedger...");

  const carteiras = gerarCarteirasCarbonLedger();

  salvarArquivos(carteiras);

  console.log("");
  console.log("Carteiras geradas com sucesso.");
  console.log(`Arquivo JSON: ${ARQUIVO_JSON}`);
  console.log(`Arquivo ENV:  ${ARQUIVO_ENV}`);

  console.log("");
  console.log("Endereços gerados:");

  for (const carteira of carteiras) {
    console.log(
      `${carteira.nome.padEnd(24)} | ${carteira.papel.padEnd(13)} | ${
        carteira.address
      }`
    );
  }

  await tentarFinanciarCarteiras(carteiras);

  console.log("");
  console.log("Concluído.");
  console.log("Não publique os arquivos da pasta carteiras.");
}

main().catch((erro) => {
  console.error("Erro ao gerar carteiras locais:");
  console.error(erro);
  process.exitCode = 1;
});
