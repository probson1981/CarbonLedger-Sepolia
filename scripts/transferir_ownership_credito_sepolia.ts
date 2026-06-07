/**
 * @file transferir_ownership_credito_sepolia.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 *
 * @notice
 * Transfere o ownership apenas do contrato CreditoCarbonoToken
 * para a conta Admin configurada em deployments/sepolia.json.
 *
 * @dev
 * Este script deve ser executado depois do deploy e setup Sepolia.
 *
 * Fluxo recomendado:
 *
 * npx hardhat run scripts/deploy_sepolia.ts --network sepolia
 * npx hardhat run scripts/setup_sepolia.ts --network sepolia
 * npx hardhat run scripts/financiar_contas_sepolia.ts --network sepolia
 * npx hardhat run scripts/transferir_ownership_credito_sepolia.ts --network sepolia
 * node scripts/sync_frontend_deployments.cjs
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
  rede?: string;
  chainId?: string | number | bigint;
  deployer?: string;
  contas?: {
    admin?: string;
  };
  contratos: {
    CreditoCarbonoToken?: string;
  };
};

function carregarDeploySepolia(): DadosDeploySepolia {
  if (!fs.existsSync(ARQUIVO_DEPLOY_SEPOLIA)) {
    throw new Error(
      `Arquivo não encontrado: ${ARQUIVO_DEPLOY_SEPOLIA}. Rode o deploy Sepolia antes.`
    );
  }

  return JSON.parse(
    fs.readFileSync(ARQUIVO_DEPLOY_SEPOLIA, "utf8")
  ) as DadosDeploySepolia;
}

async function main(): Promise<void> {
  console.log("");
  console.log("==============================================");
  console.log("CarbonLedger - Transferir Ownership do Crédito");
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

  const admin = dadosDeploy.contas?.admin;

  if (!admin || !ethers.isAddress(admin)) {
    throw new Error(
      "Admin não encontrado ou inválido em deployments/sepolia.json."
    );
  }

  const enderecoAdmin = ethers.getAddress(admin);

  const enderecoCredito = dadosDeploy.contratos.CreditoCarbonoToken;

  if (!enderecoCredito || !ethers.isAddress(enderecoCredito)) {
    throw new Error(
      "Endereco do CreditoCarbonoToken não encontrado ou inválido em deployments/sepolia.json."
    );
  }

  const enderecoCreditoSeguro = ethers.getAddress(enderecoCredito);

  const [deployer] = await ethers.getSigners();
  const enderecoDeployer = ethers.getAddress(await deployer.getAddress());

  console.log(`Deployer atual: ${enderecoDeployer}`);
  console.log(`Admin configurado: ${enderecoAdmin}`);
  console.log(`CreditoCarbonoToken: ${enderecoCreditoSeguro}`);
  console.log("");

  const creditoCarbonoToken = await ethers.getContractAt(
    "CreditoCarbonoToken",
    enderecoCreditoSeguro
  );

  const ownerAtual = ethers.getAddress(await creditoCarbonoToken.owner());

  console.log(`Owner atual do CreditoCarbonoToken: ${ownerAtual}`);

  if (ownerAtual.toLowerCase() === enderecoAdmin.toLowerCase()) {
    console.log("");
    console.log("OK: o Admin já é o owner do CreditoCarbonoToken.");
    return;
  }

  if (ownerAtual.toLowerCase() !== enderecoDeployer.toLowerCase()) {
    throw new Error(
      `O owner atual não é o deployer. Owner atual: ${ownerAtual}. Deployer: ${enderecoDeployer}. Transferência automática cancelada.`
    );
  }

  console.log("");
  console.log(`Transferindo ownership para o Admin: ${enderecoAdmin}`);

  const tx = await creditoCarbonoToken.transferOwnership(enderecoAdmin);

  console.log(`Tx enviada: ${tx.hash}`);

  const recibo = await tx.wait();

  console.log(`Confirmada no bloco: ${recibo?.blockNumber}`);

  const novoOwner = ethers.getAddress(await creditoCarbonoToken.owner());

  console.log("");
  console.log(`Novo owner do CreditoCarbonoToken: ${novoOwner}`);

  if (novoOwner.toLowerCase() !== enderecoAdmin.toLowerCase()) {
    throw new Error("A transferência de ownership não foi confirmada corretamente.");
  }

  console.log("");
  console.log("Transferência concluída com sucesso.");
  console.log("");
}

main().catch((erro: unknown) => {
  console.error("");
  console.error("Erro ao transferir ownership do CreditoCarbonoToken:");
  console.error(erro);
  process.exitCode = 1;
});