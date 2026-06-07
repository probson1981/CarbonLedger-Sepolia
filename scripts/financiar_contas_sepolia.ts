/**
 * @file financiar_contas_sepolia.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 *
 * @notice
 * Envia Sepolia ETH da conta deployer para as contas de teste do MVP.
 *
 * @dev
 * Lê as contas em:
 *
 * deployments/sepolia.json
 *
 * Executar com:
 *
 * npx hardhat run scripts/financiar_contas_sepolia.ts --network sepolia
 *
 * Variáveis opcionais no .env:
 *
 * SEPOLIA_FUND_AMOUNT_ETH=0.05
 * SEPOLIA_MIN_BALANCE_ETH=0.02
 */

import fs from "node:fs";
import path from "node:path";
import { network } from "hardhat";

const CHAIN_ID_SEPOLIA = 11155111;

const ARQUIVO_DEPLOY_SEPOLIA = path.join(
  process.cwd(),
  "deployments",
  "sepolia.json"
);

type DadosDeploySepolia = {
  projeto?: string;
  rede?: string;
  chainId?: string | number | bigint;
  deployer?: string;
  contas?: Record<string, string>;
};

function carregarDeploySepolia(): DadosDeploySepolia {
  if (!fs.existsSync(ARQUIVO_DEPLOY_SEPOLIA)) {
    throw new Error(
      `Arquivo não encontrado: ${ARQUIVO_DEPLOY_SEPOLIA}. Rode o deploy Sepolia antes.`
    );
  }

  const conteudo = fs.readFileSync(ARQUIVO_DEPLOY_SEPOLIA, "utf8");

  return JSON.parse(conteudo) as DadosDeploySepolia;
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
  console.log("CarbonLedger - Financiar Contas Sepolia");
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

  const dadosDeploy = carregarDeploySepolia();

  const chainIdArquivo = String(dadosDeploy.chainId ?? "");

  if (chainIdArquivo !== String(CHAIN_ID_SEPOLIA)) {
    throw new Error(
      `O arquivo deployments/sepolia.json não parece ser da Sepolia. Chain ID no arquivo: ${chainIdArquivo}`
    );
  }

  if (!dadosDeploy.contas || Object.keys(dadosDeploy.contas).length === 0) {
    throw new Error(
      "Nenhuma conta foi encontrada em deployments/sepolia.json."
    );
  }

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
  console.log(`Valor por conta: ${valorEnvioEth} Sepolia ETH`);
  console.log(`Saldo mínimo alvo: ${saldoMinimoEth} Sepolia ETH`);
  console.log("");

  if (saldoInicialDeployer <= valorEnvio) {
    throw new Error(
      "Saldo do deployer insuficiente para financiar as contas."
    );
  }

  const contasUnicas = new Map<string, { papel: string; endereco: string }>();

  for (const [papel, enderecoOriginal] of Object.entries(dadosDeploy.contas)) {
    if (!ethers.isAddress(enderecoOriginal)) {
      console.log(`PULADO: ${papel} possui endereço inválido: ${enderecoOriginal}`);
      continue;
    }

    const endereco = ethers.getAddress(enderecoOriginal);

    if (endereco.toLowerCase() === enderecoDeployer.toLowerCase()) {
      console.log(
        `PULADO: ${papel} é o próprio deployer (${endereco}).`
      );
      continue;
    }

    if (!contasUnicas.has(endereco.toLowerCase())) {
      contasUnicas.set(endereco.toLowerCase(), {
        papel,
        endereco,
      });
    }
  }

  console.log("Contas que serão verificadas:");
  for (const conta of contasUnicas.values()) {
    console.log(`- ${conta.papel}: ${conta.endereco}`);
  }
  console.log("");

  for (const conta of contasUnicas.values()) {
    const saldoAtual = await ethers.provider.getBalance(conta.endereco);

    console.log("----------------------------------------------");
    console.log(`${conta.papel}: ${conta.endereco}`);
    console.log(`Saldo atual: ${ethers.formatEther(saldoAtual)} Sepolia ETH`);

    if (saldoAtual >= saldoMinimo) {
      console.log("OK: saldo já está acima do mínimo. Nenhuma transferência feita.");
      continue;
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
  console.log("Financiamento Sepolia concluído");
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
  console.error("Erro ao financiar contas Sepolia:");
  console.error(erro);
  process.exitCode = 1;
});