/**
 * @file financiar_carteiras_sepolia.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 *
 * @notice
 * Financia diretamente as carteiras geradas em .sepolia-wallets.json.
 *
 * @dev
 * Este script deve ser usado logo depois de:
 *
 * npx hardhat run scripts/gerar_carteiras_sepolia.ts
 *
 * Ele lê:
 *
 * .sepolia-wallets.json
 *
 * E envia Sepolia ETH da conta deployer para:
 *
 * admin
 * proponente
 * validador1
 * validador2
 * comprador
 * usuarioExtra
 *
 * Executar com:
 *
 * npx hardhat run scripts/financiar_carteiras_sepolia.ts --network sepolia
 *
 * Variáveis opcionais no .env:
 *
 * SEPOLIA_FUND_AMOUNT_ETH=0.05
 * SEPOLIA_MIN_BALANCE_ETH=0.02
 *
 * Atenção:
 * - Este script não imprime private keys.
 * - O arquivo .sepolia-wallets.json contém private keys e não deve ir ao GitHub.
 */

import fs from "node:fs";
import path from "node:path";
import { network } from "hardhat";

const CHAIN_ID_SEPOLIA = 11155111;

const ARQUIVO_WALLETS = path.join(process.cwd(), ".sepolia-wallets.json");

const PAPEIS_ESPERADOS = [
  "admin",
  "proponente",
  "validador1",
  "validador2",
  "comprador",
  "usuarioExtra",
] as const;

type PapelCarteira = (typeof PAPEIS_ESPERADOS)[number];

type DadosCarteira = {
  papel?: string;
  nomeMetaMask?: string;
  address: string;
  privateKey?: string;
};

type FormatoAntigoWallets = Record<PapelCarteira, DadosCarteira>;

type FormatoNovoWallets = {
  aviso?: string;
  rede?: string;
  geradoEm?: string;
  contas: Record<PapelCarteira, DadosCarteira>;
};

type ContaFinanciamento = {
  papel: PapelCarteira;
  nomeMetaMask: string;
  endereco: string;
};

function carregarArquivoWallets(): FormatoAntigoWallets | FormatoNovoWallets {
  if (!fs.existsSync(ARQUIVO_WALLETS)) {
    throw new Error(
      `Arquivo não encontrado: ${ARQUIVO_WALLETS}. Rode primeiro: npx hardhat run scripts/gerar_carteiras_sepolia.ts`
    );
  }

  const conteudo = fs.readFileSync(ARQUIVO_WALLETS, "utf8");

  return JSON.parse(conteudo) as FormatoAntigoWallets | FormatoNovoWallets;
}

function extrairContas(
  dados: FormatoAntigoWallets | FormatoNovoWallets
): ContaFinanciamento[] {
  const origem =
    "contas" in dados && dados.contas && typeof dados.contas === "object"
      ? dados.contas
      : (dados as FormatoAntigoWallets);

  const contas: ContaFinanciamento[] = [];

  for (const papel of PAPEIS_ESPERADOS) {
    const conta = origem[papel];

    if (!conta || typeof conta.address !== "string") {
      throw new Error(
        `Carteira do papel "${papel}" não encontrada ou sem endereço em .sepolia-wallets.json.`
      );
    }

    contas.push({
      papel,
      nomeMetaMask:
        conta.nomeMetaMask ||
        `CarbonLedger ${papel.charAt(0).toUpperCase()}${papel.slice(1)}`,
      endereco: conta.address,
    });
  }

  return contas;
}

function obterValorEnv(nome: string, valorPadrao: string): string {
  const valor = process.env[nome]?.trim();

  if (!valor) {
    return valorPadrao;
  }

  return valor;
}

async function main(): Promise<void> {
  console.log("");
  console.log("==============================================");
  console.log("CarbonLedger - Financiar Carteiras Sepolia");
  console.log("==============================================");
  console.log("");

  const conexao = await network.connect();
  const { ethers } = conexao;

  const rede = await ethers.provider.getNetwork();
  const chainIdDetectado = Number(rede.chainId);

  console.log(`Chain ID detectado: ${chainIdDetectado}`);

  if (chainIdDetectado !== CHAIN_ID_SEPOLIA) {
    throw new Error(
      `Este script deve ser executado apenas na Sepolia. Chain ID detectado: ${chainIdDetectado}`
    );
  }

  const dadosWallets = carregarArquivoWallets();
  const contas = extrairContas(dadosWallets);

  const [deployer] = await ethers.getSigners();

  const enderecoDeployer = ethers.getAddress(await deployer.getAddress());
  const saldoInicialDeployer = await ethers.provider.getBalance(
    enderecoDeployer
  );

  const valorEnvioEth = obterValorEnv("SEPOLIA_FUND_AMOUNT_ETH", "0.05");
  const saldoMinimoEth = obterValorEnv("SEPOLIA_MIN_BALANCE_ETH", "0.02");

  const valorEnvio = ethers.parseEther(valorEnvioEth);
  const saldoMinimo = ethers.parseEther(saldoMinimoEth);

  console.log(`Deployer: ${enderecoDeployer}`);
  console.log(
    `Saldo inicial do deployer: ${ethers.formatEther(
      saldoInicialDeployer
    )} Sepolia ETH`
  );
  console.log(`Valor por carteira: ${valorEnvioEth} Sepolia ETH`);
  console.log(`Saldo mínimo alvo: ${saldoMinimoEth} Sepolia ETH`);
  console.log("");

  console.log("Carteiras que serão verificadas:");
  for (const conta of contas) {
    console.log(`- ${conta.papel}: ${conta.endereco}`);
  }
  console.log("");

  const contasUnicas = new Map<string, ContaFinanciamento>();

  for (const conta of contas) {
    if (!ethers.isAddress(conta.endereco)) {
      throw new Error(
        `Endereço inválido para ${conta.papel}: ${conta.endereco}`
      );
    }

    const enderecoNormalizado = ethers.getAddress(conta.endereco);
    const chave = enderecoNormalizado.toLowerCase();

    if (chave === enderecoDeployer.toLowerCase()) {
      console.log(
        `PULADO: ${conta.papel} é o próprio deployer (${enderecoNormalizado}).`
      );
      continue;
    }

    if (!contasUnicas.has(chave)) {
      contasUnicas.set(chave, {
        ...conta,
        endereco: enderecoNormalizado,
      });
    }
  }

  for (const conta of contasUnicas.values()) {
    const saldoAtual = await ethers.provider.getBalance(conta.endereco);

    console.log("----------------------------------------------");
    console.log(`${conta.papel}: ${conta.endereco}`);
    console.log(`Nome sugerido MetaMask: ${conta.nomeMetaMask}`);
    console.log(`Saldo atual: ${ethers.formatEther(saldoAtual)} Sepolia ETH`);

    if (saldoAtual >= saldoMinimo) {
      console.log("OK: saldo já está acima do mínimo. Nenhuma transferência feita.");
      continue;
    }

    if (saldoInicialDeployer <= valorEnvio) {
      throw new Error(
        "Saldo do deployer insuficiente para financiar as carteiras."
      );
    }

    console.log(
      `Enviando ${ethers.formatEther(valorEnvio)} Sepolia ETH para ${conta.papel}...`
    );

    const tx = await deployer.sendTransaction({
      to: conta.endereco,
      value: valorEnvio,
    });

    console.log(`Tx enviada: ${tx.hash}`);

    const recibo = await tx.wait();

    console.log(`Confirmada no bloco: ${recibo?.blockNumber}`);

    const saldoFinal = await ethers.provider.getBalance(conta.endereco);

    console.log(`Saldo final: ${ethers.formatEther(saldoFinal)} Sepolia ETH`);
  }

  const saldoFinalDeployer = await ethers.provider.getBalance(enderecoDeployer);

  console.log("");
  console.log("==============================================");
  console.log("Financiamento das carteiras Sepolia concluído");
  console.log("==============================================");
  console.log("");
  console.log(
    `Saldo final do deployer: ${ethers.formatEther(
      saldoFinalDeployer
    )} Sepolia ETH`
  );
  console.log("");
}

main().catch((erro: unknown) => {
  console.error("");
  console.error("Erro ao financiar carteiras Sepolia:");
  console.error(erro);
  process.exitCode = 1;
});