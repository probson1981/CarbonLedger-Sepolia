import type { UsuarioDemo } from "../types/carbonledger";

export const usuariosDemo: UsuarioDemo[] = [
  {
    usuario: "admin",
    senha: "admin123",
    nome: "Administrador do Sistema",
    perfil: "administrador",
  },
  {
    usuario: "proponente1",
    senha: "prop123",
    nome: "Proponente Solar Nordeste",
    perfil: "proponente",
  },
  {
    usuario: "proponente2",
    senha: "prop456",
    nome: "Proponente BioCarbono Ceará",
    perfil: "proponente",
  },
  {
    usuario: "validador1",
    senha: "val123",
    nome: "Validador Ambiental 1",
    perfil: "validador",
  },
  {
    usuario: "validador2",
    senha: "val456",
    nome: "Validador Ambiental 2",
    perfil: "validador",
  },
  {
    usuario: "comprador1",
    senha: "comp123",
    nome: "Comprador Industrial 1",
    perfil: "comprador",
  },
  {
    usuario: "comprador2",
    senha: "comp456",
    nome: "Comprador Corporativo 2",
    perfil: "comprador",
  },
];

export const TIPO_PROJETO_MAP: Record<string, number> = {
  "Energia Solar": 0,
  "Energia Eólica": 1,
  Reflorestamento: 2,
  "Conservação Florestal": 3,
  Biodigestor: 4,
  "Eficiência Energética": 5,
  Reciclagem: 6,
  Outro: 7,
};
