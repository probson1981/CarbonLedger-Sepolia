/**
 * @file gerar_carteiras_sepolia.ts
 *
 * Gera carteiras novas para uso seguro na Sepolia.
 *
 * Executar:
 * npx hardhat run scripts/gerar_carteiras_sepolia.ts
 *
 * O arquivo gerado NÃO deve ir para o GitHub.
 */

import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";

const ARQUIVO_SAIDA = path.join(process.cwd(), ".sepolia-wallets.json");

const papeis = [
  "admin",
  "proponente",
  "validador1",
  "validador2",
  "comprador",
  "usuarioExtra",
] as const;

function main() {
  const carteiras: Record<
    string,
    {
      address: string;
      privateKey: string;
    }
  > = {};

  for (const papel of papeis) {
    const wallet = ethers.Wallet.createRandom();

    carteiras[papel] = {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }

  fs.writeFileSync(ARQUIVO_SAIDA, JSON.stringify(carteiras, null, 2), "utf8");

  console.log("");
  console.log("Carteiras Sepolia geradas com sucesso.");
  console.log(`Arquivo: ${ARQUIVO_SAIDA}`);
  console.log("");
  console.log("Endereços gerados:");
  console.log("");

  for (const [papel, dados] of Object.entries(carteiras)) {
    console.log(`${papel}: ${dados.address}`);
  }

  console.log("");
  console.log("IMPORTANTE:");
  console.log("- Não envie .sepolia-wallets.json para o GitHub.");
  console.log("- Importe essas private keys no MetaMask.");
  console.log("- Financie essas contas com SepoliaETH.");
  console.log("");
}

main();