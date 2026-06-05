/**
 * @file main.tsx
 * @author Patrício Alves
 *
 * @notice
 * Ponto de entrada do frontend CarbonLedger.
 *
 * @dev
 * Registra os listeners do MetaMask para que a aplicação atualize
 * automaticamente quando o usuário trocar de rede ou de conta.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { observarMudancasMetamask } from "./config/redes";

/**
 * @dev
 * Ativa atualização automática quando houver troca de rede ou conta
 * no MetaMask.
 */
observarMudancasMetamask();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);