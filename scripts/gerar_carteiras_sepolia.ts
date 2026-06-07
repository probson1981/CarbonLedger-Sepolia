/**
 * @file gerar_carteiras_sepolia.ts
 *
 * Gera carteiras novas para uso seguro na Sepolia, atualiza
 * automaticamente os endereços públicos dos papéis no .env
 * e cria um arquivo auxiliar para importação manual no MetaMask.
 *
 * Comportamento:
 *
 * - Se .sepolia-wallets.json não existir:
 *   gera novas carteiras.
 *
 * - Se .sepolia-wallets.json já existir:
 *   reutiliza as carteiras existentes, atualiza o .env,
 *   recria o arquivo .sepolia-metamask-import.txt e abre o arquivo.
 *
 * - Para forçar a criação de novas carteiras:
 *
 *   npx hardhat run scripts/gerar_carteiras_sepolia.ts -- --force
 *
 * Arquivos gerados ou atualizados:
 *
 * .sepolia-wallets.json
 * .sepolia-metamask-import.txt
 * .env
 *
 * Atenção:
 * - .sepolia-wallets.json contém private keys.
 * - .sepolia-metamask-import.txt contém private keys.
 * - .env pode conter private key do deployer.
 * - Nenhum desses arquivos deve ser enviado ao GitHub.
 * - Este script não altera SEPOLIA_RPC_URL, SEPOLIA_DEPLOYER_PRIVATE_KEY
 *   nem ETHERSCAN_API_KEY.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { ethers } from "ethers";

const ARQUIVO_WALLETS = path.join(process.cwd(), ".sepolia-wallets.json");

const ARQUIVO_METAMASK = path.join(
  process.cwd(),
  ".sepolia-metamask-import.txt"
);

const ARQUIVO_ENV = path.join(process.cwd(), ".env");

const papeis = [
  "admin",
  "proponente",
  "validador1",
  "validador2",
  "comprador",
  "usuarioExtra",
] as const;

type PapelCarteira = (typeof papeis)[number];

type DadosCarteira = {
  papel: PapelCarteira;
  nomeMetaMask: string;
  address: string;
  privateKey: string;
};

type CarteirasGeradas = Record<PapelCarteira, DadosCarteira>;

type ArquivoWalletsNovo = {
  aviso?: string;
  rede?: string;
  geradoEm?: string;
  contas: Record<string, Partial<DadosCarteira>>;
};

type ArquivoWalletsAntigo = Record<string, Partial<DadosCarteira>>;

const nomesMetaMaskPorPapel: Record<PapelCarteira, string> = {
  admin: "CarbonLedger Admin",
  proponente: "CarbonLedger Proponente",
  validador1: "CarbonLedger Validador 1",
  validador2: "CarbonLedger Validador 2",
  comprador: "CarbonLedger Comprador",
  usuarioExtra: "CarbonLedger Usuario Extra",
};

const variaveisEnvPorPapel: Record<PapelCarteira, string> = {
  admin: "SEPOLIA_ADMIN_ADDRESS",
  proponente: "SEPOLIA_PROPONENTE_ADDRESS",
  validador1: "SEPOLIA_VALIDADOR1_ADDRESS",
  validador2: "SEPOLIA_VALIDADOR2_ADDRESS",
  comprador: "SEPOLIA_COMPRADOR_ADDRESS",
  usuarioExtra: "SEPOLIA_USUARIO_EXTRA_ADDRESS",
};

function deveForcarGeracao(): boolean {
  return process.argv.includes("--force");
}

function gerarCarteirasNovas(): CarteirasGeradas {
  const carteiras = {} as CarteirasGeradas;

  for (const papel of papeis) {
    const wallet = ethers.Wallet.createRandom();

    carteiras[papel] = {
      papel,
      nomeMetaMask: nomesMetaMaskPorPapel[papel],
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  }

  return carteiras;
}

function normalizarCarteirasExistentes(
  dadosArquivo: ArquivoWalletsNovo | ArquivoWalletsAntigo
): CarteirasGeradas {
  const dadosComContas = dadosArquivo as Partial<ArquivoWalletsNovo>;

  const origem: Record<string, Partial<DadosCarteira>> =
    dadosComContas.contas && typeof dadosComContas.contas === "object"
      ? dadosComContas.contas
      : (dadosArquivo as ArquivoWalletsAntigo);

  const carteiras = {} as CarteirasGeradas;

  for (const papel of papeis) {
    const conta = origem[papel];

    if (!conta) {
      throw new Error(
        `Carteira do papel "${papel}" não encontrada em .sepolia-wallets.json.`
      );
    }

    if (!conta.address || !ethers.isAddress(conta.address)) {
      throw new Error(
        `Endereço inválido ou ausente para o papel "${papel}" em .sepolia-wallets.json.`
      );
    }

    if (!conta.privateKey || typeof conta.privateKey !== "string") {
      throw new Error(
        `Private key ausente para o papel "${papel}" em .sepolia-wallets.json.`
      );
    }

    if (!/^0x[0-9a-fA-F]{64}$/.test(conta.privateKey)) {
      throw new Error(
        `Private key inválida para o papel "${papel}" em .sepolia-wallets.json.`
      );
    }

    carteiras[papel] = {
      papel,
      nomeMetaMask: conta.nomeMetaMask || nomesMetaMaskPorPapel[papel],
      address: ethers.getAddress(conta.address),
      privateKey: conta.privateKey,
    };
  }

  return carteiras;
}

function carregarCarteirasExistentes(): CarteirasGeradas {
  const conteudo = fs.readFileSync(ARQUIVO_WALLETS, "utf8");

  const dadosArquivo = JSON.parse(conteudo) as
    | ArquivoWalletsNovo
    | ArquivoWalletsAntigo;

  return normalizarCarteirasExistentes(dadosArquivo);
}

function salvarCarteirasJson(carteiras: CarteirasGeradas): void {
  const saida = {
    aviso:
      "Arquivo sensível. Contém private keys. Não envie para GitHub, chats ou locais públicos.",
    rede: "sepolia",
    geradoEm: new Date().toISOString(),
    contas: carteiras,
  };

  fs.writeFileSync(ARQUIVO_WALLETS, JSON.stringify(saida, null, 2), "utf8");
}

function obterCarteiras(): {
  carteiras: CarteirasGeradas;
  foramGeradasAgora: boolean;
} {
  const forcar = deveForcarGeracao();
  const arquivoExiste = fs.existsSync(ARQUIVO_WALLETS);

  if (arquivoExiste && !forcar) {
    const carteiras = carregarCarteirasExistentes();

    return {
      carteiras,
      foramGeradasAgora: false,
    };
  }

  const carteiras = gerarCarteirasNovas();

  salvarCarteirasJson(carteiras);

  return {
    carteiras,
    foramGeradasAgora: true,
  };
}

function gerarConteudoMetaMask(carteiras: CarteirasGeradas): string {
  const linhas: string[] = [];

  linhas.push("CarbonLedger - Contas Sepolia para importar no MetaMask");
  linhas.push("======================================================");
  linhas.push("");
  linhas.push("LEIA COM ATENÇÃO");
  linhas.push("");
  linhas.push("Este arquivo foi gerado automaticamente pelo script:");
  linhas.push("");
  linhas.push("npx hardhat run scripts\\gerar_carteiras_sepolia.ts");
  linhas.push("");
  linhas.push("As contas abaixo precisam ser importadas no MetaMask para que o fluxo");
  linhas.push("completo do MVP possa ser testado com papéis separados.");
  linhas.push("");
  linhas.push("Papéis usados no sistema:");
  linhas.push("");
  linhas.push("- Admin: emite créditos após aprovação do projeto.");
  linhas.push("- Proponente: cadastra projeto e oferta créditos.");
  linhas.push("- Validador 1: inicia votação, vota e encerra validação.");
  linhas.push("- Validador 2: conta adicional de validação.");
  linhas.push("- Comprador: compra créditos e aposenta créditos.");
  linhas.push("- Usuário extra: conta auxiliar para testes.");
  linhas.push("");
  linhas.push("ATENÇÃO DE SEGURANÇA");
  linhas.push("");
  linhas.push("- Este arquivo contém private keys.");
  linhas.push("- Não envie este arquivo para o GitHub.");
  linhas.push("- Não compartilhe este arquivo em chats públicos.");
  linhas.push("- Use essas contas apenas na rede de teste Sepolia.");
  linhas.push("- Não envie ETH real nem ativos reais para essas contas.");
  linhas.push("");
  linhas.push("COMO IMPORTAR CADA CONTA NO METAMASK");
  linhas.push("");
  linhas.push("1. Abra o MetaMask.");
  linhas.push("2. Clique no seletor de contas, no topo da extensão.");
  linhas.push("3. Clique em Adicionar conta ou carteira de hardware.");
  linhas.push("4. Escolha Importar conta.");
  linhas.push("5. Selecione o tipo Private Key.");
  linhas.push("6. Copie a private key da conta desejada neste arquivo.");
  linhas.push("7. Cole a private key no MetaMask.");
  linhas.push("8. Clique em Importar.");
  linhas.push("9. Depois de importar, renomeie a conta com o nome sugerido abaixo.");
  linhas.push("10. Repita o processo para Admin, Proponente, Validador e Comprador.");
  linhas.push("");
  linhas.push("Depois de importar as contas:");
  linhas.push("");
  linhas.push("1. Selecione a rede Sepolia no MetaMask.");
  linhas.push("2. Abra o frontend do CarbonLedger.");
  linhas.push("3. Troque a conta ativa conforme o papel que deseja testar.");
  linhas.push("4. Clique em Sincronizar MetaMask dentro da aplicação.");
  linhas.push("");
  linhas.push("CONTAS DISPONÍVEIS");
  linhas.push("");

  for (const papel of papeis) {
    const conta = carteiras[papel];

    linhas.push("------------------------------------------------------");
    linhas.push(`Papel no sistema: ${conta.papel}`);
    linhas.push(`Nome sugerido no MetaMask: ${conta.nomeMetaMask}`);
    linhas.push(`Endereço público: ${conta.address}`);
    linhas.push(`Private key: ${conta.privateKey}`);
    linhas.push("");
  }

  linhas.push("ORDEM SUGERIDA DE TESTE NO FRONTEND");
  linhas.push("");
  linhas.push("1. Proponente: cadastrar projeto.");
  linhas.push("2. Validador 1: iniciar votação, votar e encerrar validação.");
  linhas.push("3. Admin: emitir créditos.");
  linhas.push("4. Proponente: ofertar créditos no marketplace.");
  linhas.push("5. Comprador: comprar créditos.");
  linhas.push("6. Comprador: aposentar créditos e gerar NFT de compensação.");
  linhas.push("");
  linhas.push("COMANDOS ÚTEIS");
  linhas.push("");
  linhas.push("Para financiar as carteiras:");
  linhas.push("");
  linhas.push("npx hardhat run scripts\\financiar_carteiras_sepolia.ts --network sepolia");
  linhas.push("");
  linhas.push("Para fazer deploy, setup, sync e build:");
  linhas.push("");
  linhas.push("node scripts\\preparar_sepolia.cjs");
  linhas.push("");
  linhas.push("Para forçar a geração de novas carteiras:");
  linhas.push("");
  linhas.push("npx hardhat run scripts\\gerar_carteiras_sepolia.ts -- --force");
  linhas.push("");

  return linhas.join("\n");
}

function salvarArquivoMetaMask(carteiras: CarteirasGeradas): void {
  const conteudo = gerarConteudoMetaMask(carteiras);

  fs.writeFileSync(ARQUIVO_METAMASK, conteudo, "utf8");
}

function linhaEnv(nomeVariavel: string, valor: string): string {
  return `${nomeVariavel}=${valor}`;
}

function atualizarOuAdicionarVariavelEnv(
  conteudoEnv: string,
  nomeVariavel: string,
  valor: string
): string {
  const linhas = conteudoEnv.split(/\r?\n/);
  const prefixo = `${nomeVariavel}=`;

  let variavelEncontrada = false;

  const linhasAtualizadas = linhas.map((linha) => {
    if (linha.trimStart().startsWith(prefixo)) {
      variavelEncontrada = true;
      return linhaEnv(nomeVariavel, valor);
    }

    return linha;
  });

  if (!variavelEncontrada) {
    const precisaLinhaEmBranco =
      linhasAtualizadas.length > 0 &&
      linhasAtualizadas[linhasAtualizadas.length - 1].trim() !== "";

    if (precisaLinhaEmBranco) {
      linhasAtualizadas.push("");
    }

    linhasAtualizadas.push(linhaEnv(nomeVariavel, valor));
  }

  return linhasAtualizadas.join("\n");
}

function atualizarEnvComEnderecos(carteiras: CarteirasGeradas): void {
  let conteudoEnv = "";

  if (fs.existsSync(ARQUIVO_ENV)) {
    conteudoEnv = fs.readFileSync(ARQUIVO_ENV, "utf8");
  } else {
    conteudoEnv =
      "# CarbonLedger - variáveis locais de ambiente\n" +
      "# Este arquivo não deve ser enviado ao GitHub.\n";
  }

  for (const papel of papeis) {
    const nomeVariavel = variaveisEnvPorPapel[papel];
    const endereco = carteiras[papel].address;

    conteudoEnv = atualizarOuAdicionarVariavelEnv(
      conteudoEnv,
      nomeVariavel,
      endereco
    );
  }

  if (!conteudoEnv.endsWith("\n")) {
    conteudoEnv += "\n";
  }

  fs.writeFileSync(ARQUIVO_ENV, conteudoEnv, "utf8");
}

function abrirArquivoMetaMask(): void {
  try {
    if (process.platform === "win32") {
      const processo = spawn("cmd", ["/c", "start", "", ARQUIVO_METAMASK], {
        detached: true,
        stdio: "ignore",
      });

      processo.unref();
      return;
    }

    if (process.platform === "darwin") {
      const processo = spawn("open", [ARQUIVO_METAMASK], {
        detached: true,
        stdio: "ignore",
      });

      processo.unref();
      return;
    }

    const processo = spawn("xdg-open", [ARQUIVO_METAMASK], {
      detached: true,
      stdio: "ignore",
    });

    processo.unref();
  } catch {
    console.log("");
    console.log("Não foi possível abrir o arquivo automaticamente.");
    console.log(`Abra manualmente: ${ARQUIVO_METAMASK}`);
  }
}

function imprimirResumo(
  carteiras: CarteirasGeradas,
  foramGeradasAgora: boolean
): void {
  console.log("");

  if (foramGeradasAgora) {
    console.log("Carteiras Sepolia geradas com sucesso.");
  } else {
    console.log("Carteiras Sepolia existentes reaproveitadas.");
    console.log("Nenhuma nova carteira foi criada.");
  }

  console.log(`Arquivo de carteiras JSON: ${ARQUIVO_WALLETS}`);
  console.log(`Arquivo para importação MetaMask: ${ARQUIVO_METAMASK}`);
  console.log(`Arquivo .env atualizado: ${ARQUIVO_ENV}`);
  console.log("");
  console.log("Endereços em uso:");
  console.log("");

  for (const papel of papeis) {
    const conta = carteiras[papel];
    console.log(`${conta.nomeMetaMask}`);
    console.log(`  papel:    ${conta.papel}`);
    console.log(`  endereço: ${conta.address}`);
    console.log("");
  }

  console.log("Variáveis atualizadas no .env:");
  console.log("");

  for (const papel of papeis) {
    const nomeVariavel = variaveisEnvPorPapel[papel];
    console.log(`${nomeVariavel}=${carteiras[papel].address}`);
  }

  console.log("");
  console.log("IMPORTANTE:");
  console.log("- O arquivo .sepolia-wallets.json contém private keys.");
  console.log("- O arquivo .sepolia-metamask-import.txt contém private keys.");
  console.log("- Não envie esses arquivos para o GitHub.");
  console.log("- Não envie o arquivo .env para o GitHub.");
  console.log("- O arquivo .sepolia-metamask-import.txt será aberto automaticamente.");
  console.log("- Importe as private keys no MetaMask para testar cada papel.");
  console.log("");
  console.log("Campos preservados no .env, se já existirem:");
  console.log("- SEPOLIA_RPC_URL");
  console.log("- SEPOLIA_DEPLOYER_PRIVATE_KEY");
  console.log("- ETHERSCAN_API_KEY");
  console.log("");

  if (!foramGeradasAgora) {
    console.log("Para gerar um novo conjunto de carteiras, rode:");
    console.log("");
    console.log("npx hardhat run scripts\\gerar_carteiras_sepolia.ts -- --force");
    console.log("");
  }
}

function main(): void {
  const { carteiras, foramGeradasAgora } = obterCarteiras();

  if (!foramGeradasAgora) {
    salvarCarteirasJson(carteiras);
  }

  salvarArquivoMetaMask(carteiras);

  atualizarEnvComEnderecos(carteiras);

  imprimirResumo(carteiras, foramGeradasAgora);

  abrirArquivoMetaMask();
}

main();