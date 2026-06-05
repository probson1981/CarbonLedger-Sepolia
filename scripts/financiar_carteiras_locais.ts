/**
 * @file financiar_carteiras_locais.ts
 * @author Alanio Lima
 * @author Ednardo Peixoto
 * @author Patrício Alves
 * @notice Financia carteiras locais já geradas para o CarbonLedger.
 *
 * @dev
 * Este script lê o arquivo carteiras/carteiras.local.json
 * e envia ETH local para cada carteira usando a primeira conta padrão
 * do Hardhat Node.
 *
 * Antes de executar, rode em outro terminal:
 *
 * npx hardhat node
 *
 * Observação:
 * Esta versão controla o nonce manualmente para evitar erro:
 *
 * nonce has already been used
 */

import fs from "node:fs";
import path from "node:path";
import { ethers } from "ethers";

type CarteiraGerada = {
  papel: string;
  indice: number;
  nome: string;
  address: string;
  privateKey: string;
};

type ArquivoCarteiras = {
  projeto: string;
  finalidade: string;
  redeSugerida: string;
  geradoEm: string;
  aviso: string;
  carteiras: {
    administrador: CarteiraGerada[];
    proponentes: CarteiraGerada[];
    validadores: CarteiraGerada[];
    compradores: CarteiraGerada[];
  };
};

const ARQUIVO_JSON = path.join(
  process.cwd(),
  "carteiras",
  "carteiras.local.json"
);

const RPC_LOCAL = process.env.RPC_LOCAL ?? "http://127.0.0.1:8545";

const PRIVATE_KEY_DEPLOYER_HARDHAT =
  process.env.PRIVATE_KEY_DEPLOYER_LOCAL ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const VALOR_FINANCIAMENTO_ETH =
  process.env.VALOR_FINANCIAMENTO_ETH ?? "100";

function carregarCarteiras(): CarteiraGerada[] {
  if (!fs.existsSync(ARQUIVO_JSON)) {
    throw new Error(`Arquivo não encontrado: ${ARQUIVO_JSON}`);
  }

  const conteudo = fs.readFileSync(ARQUIVO_JSON, "utf8");
  const dados = JSON.parse(conteudo) as ArquivoCarteiras;

  return [
    ...dados.carteiras.administrador,
    ...dados.carteiras.proponentes,
    ...dados.carteiras.validadores,
    ...dados.carteiras.compradores,
  ];
}

async function main() {
  console.log("Financiando carteiras locais já geradas...");
  console.log(`Arquivo: ${ARQUIVO_JSON}`);

  const carteiras = carregarCarteiras();

  const provider = new ethers.JsonRpcProvider(RPC_LOCAL);

  const numeroBloco = await provider.getBlockNumber();

  console.log(`Hardhat Node detectado. Bloco atual: ${numeroBloco}`);

  const financiador = new ethers.Wallet(
    PRIVATE_KEY_DEPLOYER_HARDHAT,
    provider
  );

  const enderecoFinanciador = await financiador.getAddress();

  const valor = ethers.parseEther(VALOR_FINANCIAMENTO_ETH);

  console.log(`Carteira financiadora: ${enderecoFinanciador}`);
  console.log(`Valor por carteira: ${VALOR_FINANCIAMENTO_ETH} ETH local`);

  let nonceAtual = await provider.getTransactionCount(
    enderecoFinanciador,
    "latest"
  );

  console.log(`Nonce inicial: ${nonceAtual}`);
  console.log("");

  for (const carteira of carteiras) {
    const saldoAntes = await provider.getBalance(carteira.address);

    if (saldoAntes >= valor) {
      console.log(
        `${carteira.nome}: já possui saldo suficiente. Saldo: ${ethers.formatEther(
          saldoAntes
        )} ETH`
      );
      continue;
    }

    console.log(
      `${carteira.nome}: financiando ${carteira.address} com nonce ${nonceAtual}...`
    );

    const tx = await financiador.sendTransaction({
      to: carteira.address,
      value: valor,
      nonce: nonceAtual,
    });

    await tx.wait();

    nonceAtual++;

    const saldoDepois = await provider.getBalance(carteira.address);

    console.log(
      `${carteira.nome}: saldo atual ${ethers.formatEther(saldoDepois)} ETH`
    );
  }

  console.log("");
  console.log("Financiamento concluído.");
}

main().catch((erro) => {
  console.error("Erro ao financiar carteiras locais:");
  console.error(erro);
  process.exitCode = 1;
});
