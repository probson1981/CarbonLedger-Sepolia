/**
 * @file preparar_sepolia.cjs
 *
 * Executa o fluxo completo de preparação do CarbonLedger na Sepolia:
 *
 * 1. Compila contratos
 * 2. Faz deploy Sepolia
 * 3. Executa setup Sepolia
 * 4. Financia contas de teste
 * 5. Transfere ownership do CreditoCarbonoToken para o Admin
 * 6. Sincroniza frontend
 * 7. Compila frontend
 *
 * Comando:
 *
 * node scripts/preparar_sepolia.cjs
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const ROOT = process.cwd();

function executar(comando, opcoes = {}) {
  console.log("");
  console.log("==============================================");
  console.log(`Executando: ${comando}`);
  console.log("==============================================");
  console.log("");

  execSync(comando, {
    cwd: opcoes.cwd || ROOT,
    stdio: "inherit",
    shell: true,
  });
}

function verificarArquivoObrigatorio(caminho, descricao) {
  const caminhoCompleto = path.join(ROOT, caminho);

  if (!fs.existsSync(caminhoCompleto)) {
    throw new Error(`${descricao} não encontrado: ${caminhoCompleto}`);
  }
}

function main() {
  console.log("");
  console.log("==============================================");
  console.log("CarbonLedger - Preparação completa Sepolia");
  console.log("==============================================");
  console.log("");

  verificarArquivoObrigatorio(".env", "Arquivo .env");
  verificarArquivoObrigatorio(
    "scripts/deploy_sepolia.ts",
    "Script de deploy Sepolia"
  );
  verificarArquivoObrigatorio(
    "scripts/setup_sepolia.ts",
    "Script de setup Sepolia"
  );
  verificarArquivoObrigatorio(
    "scripts/financiar_contas_sepolia.ts",
    "Script de financiamento Sepolia"
  );
  verificarArquivoObrigatorio(
    "scripts/transferir_ownership_credito_sepolia.ts",
    "Script de transferência de ownership do crédito"
  );
  verificarArquivoObrigatorio(
    "scripts/sync_frontend_deployments.cjs",
    "Script de sincronização do frontend"
  );

  executar("npx hardhat compile --force");

  executar("npx hardhat run .\\scripts\\deploy_sepolia.ts --network sepolia");

  executar("npx hardhat run .\\scripts\\setup_sepolia.ts --network sepolia");

  executar(
    "npx hardhat run .\\scripts\\financiar_contas_sepolia.ts --network sepolia"
  );

  executar(
    "npx hardhat run .\\scripts\\transferir_ownership_credito_sepolia.ts --network sepolia"
  );

  executar("node .\\scripts\\sync_frontend_deployments.cjs");

  executar("npm run build", {
    cwd: path.join(ROOT, "frontend"),
  });

  console.log("");
  console.log("==============================================");
  console.log("Preparação Sepolia concluída com sucesso");
  console.log("==============================================");
  console.log("");
  console.log("Próximo passo:");
  console.log("");
  console.log("cd frontend");
  console.log("npm run dev");
  console.log("");
}

try {
  main();
} catch (erro) {
  console.error("");
  console.error("Erro na preparação Sepolia:");
  console.error(erro);
  process.exitCode = 1;
}