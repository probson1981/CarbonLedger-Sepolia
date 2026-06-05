/**
 * @file contasLocais.ts
 * @author Patrício Alves
 *
 * @notice
 * Arquivo gerado automaticamente pelo script scripts/deploy_local.ts.
 */

export type PapelContaLocal =
  | "Administrador"
  | "Proponente"
  | "Validador"
  | "Comprador"
  | "Usuario";

export interface ContaLocal {
  chave: string;
  nome: string;
  papel: PapelContaLocal;
  endereco: string;
}

export const CONTAS_LOCAIS: Record<string, ContaLocal> = {
  admin: {
    chave: "admin",
    nome: "CarbonLedger Admin",
    papel: "Administrador",
    endereco: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },

  proponente: {
    chave: "proponente",
    nome: "Proponente Solar",
    papel: "Proponente",
    endereco: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },

  validador1: {
    chave: "validador1",
    nome: "Validador Ambiental 1",
    papel: "Validador",
    endereco: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },

  validador2: {
    chave: "validador2",
    nome: "Validador Ambiental 2",
    papel: "Validador",
    endereco: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  },

  comprador: {
    chave: "comprador",
    nome: "Comprador Industrial",
    papel: "Comprador",
    endereco: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  },

  usuarioExtra: {
    chave: "usuarioExtra",
    nome: "Usuario Extra",
    papel: "Usuario",
    endereco: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  },
};

function normalizarEndereco(endereco: string): string {
  return endereco.trim().toLowerCase();
}

export function obterContaLocalPorEndereco(
  endereco: string
): ContaLocal | undefined {
  const enderecoNormalizado = normalizarEndereco(endereco);

  return Object.values(CONTAS_LOCAIS).find(
    (conta) => normalizarEndereco(conta.endereco) === enderecoNormalizado
  );
}

export function descreverContaLocal(endereco: string): string {
  const conta = obterContaLocalPorEndereco(endereco);

  if (!conta) {
    return `Conta nao mapeada: ${endereco}`;
  }

  return `${conta.nome} - ${conta.papel}`;
}
