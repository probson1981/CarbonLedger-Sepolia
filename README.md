# CarbonLedger

## Registro, validação, negociação e aposentadoria de créditos de carbono em blockchain

**Autores:**

* Alanio Lima
* Ednardo Peixoto
* Patrício Alves

Projeto desenvolvido para o **Hackathon Web 3.0 do IREDE**.

---

## 1. Visão geral

O **CarbonLedger** é uma aplicação Web3 desenvolvida para demonstrar, em ambiente local, um fluxo mínimo de registro, validação, emissão, comercialização, aposentadoria e certificação de créditos de carbono usando blockchain e smart contracts.

A proposta do projeto é simular uma infraestrutura descentralizada para rastrear créditos ambientais desde a submissão de um projeto de carbono até a emissão de créditos tokenizados, sua negociação em marketplace e sua posterior aposentadoria com emissão de certificado NFT.

O sistema foi construído como um **MVP**, ou seja, uma versão mínima funcional capaz de demonstrar o ciclo principal da aplicação.

---

## 2. Contextualização

Mercados de carbono são mecanismos econômicos usados para incentivar a redução ou compensação de emissões de gases de efeito estufa. Em termos simplificados, projetos ambientais capazes de reduzir, evitar ou remover emissões podem gerar créditos de carbono. Esses créditos podem ser comercializados e posteriormente aposentados por empresas ou pessoas que desejam compensar emissões.

Apesar do potencial desses mercados, existem desafios importantes, como:

* rastreabilidade dos créditos;
* transparência na validação;
* dupla contagem;
* confiabilidade das informações;
* controle sobre créditos emitidos e aposentados;
* auditoria das transações;
* registro histórico das compensações.

A tecnologia blockchain pode ajudar nesse contexto por permitir registros públicos, auditáveis e imutáveis. O CarbonLedger explora essa ideia por meio de contratos inteligentes que representam organizações, projetos, validações, créditos tokenizados, marketplace, aposentadorias e certificados.

---

## 3. Objetivo do projeto

O objetivo do CarbonLedger é demonstrar um fluxo Web3 mínimo para:

1. cadastrar projetos ambientais;
2. validar projetos por meio de votação;
3. emitir créditos de carbono tokenizados;
4. ofertar créditos em marketplace;
5. comprar créditos usando ETH em rede local;
6. aposentar créditos comprados;
7. emitir certificado NFT de compensação.

---

## 4. Escopo do MVP

O MVP implementa um ciclo funcional simplificado com os seguintes perfis:

### Administrador

Responsável por:

* implantar e configurar o protocolo;
* emitir créditos de carbono para projetos aprovados;
* consultar contratos e permissões do sistema.

### Proponente

Responsável por:

* cadastrar projetos ambientais;
* acompanhar o status dos projetos;
* receber créditos emitidos;
* criar ofertas de venda no marketplace.

### Validador

Responsável por:

* consultar projetos em análise;
* iniciar votação;
* aprovar ou rejeitar projetos;
* encerrar votação após o prazo definido.

### Comprador

Responsável por:

* consultar ofertas disponíveis;
* comprar créditos de carbono;
* consultar créditos adquiridos;
* aposentar créditos;
* receber certificado NFT de compensação.

---

## 5. Tecnologias utilizadas

O projeto utiliza:

* Solidity
* Hardhat
* TypeScript
* React
* Vite
* ethers.js
* OpenZeppelin Contracts
* MetaMask
* Node.js
* PowerShell
* Git e GitHub

---

## 6. Estrutura geral do projeto

```text
contracts
scripts
test
frontend
frontend/src
frontend/src/config
frontend/src/contracts
frontend/src/components
```

Principais contratos:

```text
TokenImpactoCarbono.sol
CreditoCarbonoToken.sol
CertificadoCompensacaoNFT.sol
RegistroOrganizacoes.sol
RegistroProjetosCarbono.sol
ValidacaoProjetos.sol
TesourariaCarbono.sol
MercadoCarbono.sol
RegistroAposentadorias.sol
StakingCarbono.sol
GovernancaCarbono.sol
AdaptadorOraculoChainlink.sol
```

---

## 7. Fluxo mínimo implementado no MVP

O fluxo mínimo realizado no MVP é o seguinte:

```text
Cadastro do projeto
        ↓
Entrada do projeto em análise
        ↓
Início da votação pelo validador
        ↓
Voto de aprovação ou rejeição
        ↓
Encerramento da votação
        ↓
Projeto aprovado
        ↓
Emissão de créditos ERC-1155
        ↓
Criação de oferta no marketplace
        ↓
Compra dos créditos pelo comprador
        ↓
Aposentadoria dos créditos
        ↓
Emissão de certificado NFT
```

---

## 8. Tokens e ativos do sistema

### TokenImpactoCarbono

Token ERC-20 usado no protocolo para representar o token utilitário interno do sistema.

### CreditoCarbonoToken

Token ERC-1155 usado para representar lotes de créditos de carbono.

Cada lote está associado a um projeto ambiental aprovado.

### CertificadoCompensacaoNFT

Token ERC-721 usado para representar o certificado de compensação emitido após a aposentadoria dos créditos.

---

## 9. Marketplace

O marketplace permite que o proponente oferte créditos de carbono emitidos e que compradores adquiram esses créditos usando ETH da rede local Hardhat.

No MVP, o comprador paga em ETH fictício local. O contrato de marketplace calcula:

* valor total da compra;
* taxa do marketplace;
* valor líquido destinado ao vendedor.

Após a compra:

* o saldo ETH local do comprador diminui;
* o saldo ETH local do proponente aumenta;
* a taxa é separada conforme regra do marketplace;
* os créditos ERC-1155 passam para a carteira do comprador.

---

## 10. Aposentadoria e certificado NFT

Após comprar créditos, o comprador pode aposentar parte ou todo o saldo adquirido.

A aposentadoria representa a retirada definitiva daquele crédito de circulação, impedindo nova venda ou reutilização.

Ao aposentar créditos, o sistema registra a compensação e emite um certificado NFT associado à operação.

---

## 11. Ambiente local

O projeto foi testado em ambiente local usando:

```text
Hardhat Localhost
RPC: http://127.0.0.1:8545
Chain ID: 31337
Símbolo: ETH
```

O ETH usado nesse ambiente é fictício e não possui valor real.

Por isso, a MetaMask pode mostrar saldo positivo em ETH e, ao mesmo tempo, exibir valor em dólar igual a zero. Esse comportamento é esperado em redes locais.

---

## 12. Instalação básica

Clone o repositório:

```powershell
git clone https://github.com/probson1981/CarbonLedger.git
cd CarbonLedger
```

Instale as dependências da raiz:

```powershell
npm install
```

Instale as dependências do frontend:

```powershell
cd frontend
npm install
cd ..
```

---

## 13. Configuração do arquivo `.env`

O projeto usa variáveis de ambiente para configurar a rede Sepolia, a conta deployer e as contas públicas usadas nos papéis do MVP.

Crie o arquivo `.env` a partir do exemplo:

```powershell
copy .env.example .env
```

O arquivo `.env` deve ficar na raiz do projeto.

Exemplo:

```env
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

SEPOLIA_DEPLOYER_PRIVATE_KEY=0xCOLOQUE_A_PRIVATE_KEY_DO_DEPLOYER_AQUI

ETHERSCAN_API_KEY=

SEPOLIA_ADMIN_ADDRESS=0xEnderecoDoAdmin
SEPOLIA_PROPONENTE_ADDRESS=0xEnderecoDoProponente
SEPOLIA_VALIDADOR1_ADDRESS=0xEnderecoDoValidador1
SEPOLIA_VALIDADOR2_ADDRESS=0xEnderecoDoValidador2
SEPOLIA_COMPRADOR_ADDRESS=0xEnderecoDoComprador
SEPOLIA_USUARIO_EXTRA_ADDRESS=0xEnderecoUsuarioExtra

SEPOLIA_FUND_AMOUNT_ETH=0.05
SEPOLIA_MIN_BALANCE_ETH=0.02
```

A variável `SEPOLIA_DEPLOYER_PRIVATE_KEY` deve conter a private key da conta que pagará o deploy, o setup, o financiamento das carteiras de teste e a transferência de ownership do contrato `CreditoCarbonoToken`.

O arquivo `.env` não deve ser enviado ao GitHub.

---

## 14. Gerar carteiras de teste para Sepolia

Para criar ou reaproveitar contas de teste para cada papel do MVP, rode:

```powershell
npx hardhat run .\scripts\gerar_carteiras_sepolia.ts
```

Esse script cria ou atualiza os seguintes arquivos locais:

```text
.sepolia-wallets.json
.sepolia-metamask-import.txt
.env
```

O arquivo `.sepolia-wallets.json` contém as contas geradas, incluindo endereços públicos e private keys.

O arquivo `.sepolia-metamask-import.txt` contém instruções para importar as contas no MetaMask, com:

```text
papel no sistema
nome sugerido para a conta no MetaMask
endereço público
private key
```

Esse arquivo é aberto automaticamente ao final da execução do script.

Papéis gerados:

```text
admin
proponente
validador1
validador2
comprador
usuarioExtra
```

O script também atualiza automaticamente no `.env` os endereços públicos das contas:

```env
SEPOLIA_ADMIN_ADDRESS=0x...
SEPOLIA_PROPONENTE_ADDRESS=0x...
SEPOLIA_VALIDADOR1_ADDRESS=0x...
SEPOLIA_VALIDADOR2_ADDRESS=0x...
SEPOLIA_COMPRADOR_ADDRESS=0x...
SEPOLIA_USUARIO_EXTRA_ADDRESS=0x...
```

Por segurança, se o arquivo `.sepolia-wallets.json` já existir, o script reaproveita as carteiras existentes e não gera novas contas automaticamente.

Para forçar a geração de um novo conjunto de carteiras, use:

```powershell
npx hardhat run .\scripts\gerar_carteiras_sepolia.ts -- --force
```

Use `--force` com cuidado, pois isso gera novas contas, atualiza o `.env` e exige novo deploy para que os contratos reconheçam esses novos endereços.

Os arquivos abaixo são sensíveis e não devem ser enviados ao GitHub:

```text
.env
.sepolia-wallets.json
.sepolia-metamask-import.txt
```

---

## 15. Importar contas no MetaMask

Após gerar as carteiras, abra o arquivo:

```powershell
notepad .\.sepolia-metamask-import.txt
```

Esse arquivo mostra as contas que devem ser importadas no MetaMask.

Para importar uma conta:

```text
1. Abra o MetaMask.
2. Clique no seletor de contas.
3. Escolha Adicionar conta ou carteira de hardware.
4. Escolha Importar conta.
5. Selecione o tipo Private Key.
6. Copie a private key indicada no arquivo .sepolia-metamask-import.txt.
7. Cole a private key no MetaMask.
8. Clique em Importar.
9. Renomeie a conta com o nome sugerido no arquivo.
```

Repita o processo para os papéis principais:

```text
CarbonLedger Admin
CarbonLedger Proponente
CarbonLedger Validador 1
CarbonLedger Comprador
```

O Validador 2 e o Usuário Extra são úteis para testes adicionais.

---

## 16. Financiar as carteiras recém-geradas

Após gerar as carteiras, financie as contas de teste com SepoliaETH:

```powershell
npx hardhat run .\scripts\financiar_carteiras_sepolia.ts --network sepolia
```

Esse script lê diretamente o arquivo:

```text
.sepolia-wallets.json
```

e envia SepoliaETH da conta deployer para as carteiras geradas.

O valor enviado e o saldo mínimo são controlados pelas variáveis:

```env
SEPOLIA_FUND_AMOUNT_ETH=0.05
SEPOLIA_MIN_BALANCE_ETH=0.02
```

Se uma carteira já tiver saldo maior ou igual ao mínimo definido, o script não envia nova transferência.

---

## 17. Preparação completa da Sepolia

Depois de gerar, importar e financiar as carteiras, rode o script mestre:

```powershell
node .\scripts\preparar_sepolia.cjs
```

Esse script executa automaticamente:

```text
1. Compilação dos contratos
2. Deploy dos contratos na Sepolia
3. Setup das permissões e parâmetros
4. Verificação de funding das contas registradas no deployment
5. Transferência do ownership do CreditoCarbonoToken para o Admin
6. Sincronização dos contratos com o frontend
7. Build do frontend
```

Internamente, ele executa:

```powershell
npx hardhat compile --force

npx hardhat run .\scripts\deploy_sepolia.ts --network sepolia

npx hardhat run .\scripts\setup_sepolia.ts --network sepolia

npx hardhat run .\scripts\financiar_contas_sepolia.ts --network sepolia

npx hardhat run .\scripts\transferir_ownership_credito_sepolia.ts --network sepolia

node .\scripts\sync_frontend_deployments.cjs

cd frontend
npm run build
```

O script `financiar_contas_sepolia.ts` é uma checagem pós-deploy. Ele lê as contas em:

```text
deployments\sepolia.json
```

e confirma se as contas oficialmente registradas no deployment possuem saldo mínimo.

---

## 18. Rodar o frontend

Após a preparação da Sepolia, rode:

```powershell
cd frontend
npm run dev
```

A aplicação ficará disponível em endereço semelhante a:

```text
http://localhost:5173
```

No MetaMask:

```text
1. Selecione a rede Sepolia.
2. Selecione a conta correspondente ao papel usado no frontend.
3. Conecte a conta ao site local.
4. Clique em Sincronizar MetaMask dentro da aplicação.
```

---

## 19. Fluxo recomendado para uma máquina nova

Em uma máquina nova, após clonar o repositório:

```powershell
git clone https://github.com/probson1981/CarbonLedger-Sepolia.git
cd CarbonLedger-Sepolia
npm install
cd frontend
npm install
cd ..
```

Crie o `.env`:

```powershell
copy .env.example .env
```

Preencha no `.env`:

```text
SEPOLIA_RPC_URL
SEPOLIA_DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY, se for verificar contratos
```

Depois rode:

```powershell
npx hardhat run .\scripts\gerar_carteiras_sepolia.ts
```

Importe as contas no MetaMask usando o arquivo:

```text
.sepolia-metamask-import.txt
```

Financie as carteiras geradas:

```powershell
npx hardhat run .\scripts\financiar_carteiras_sepolia.ts --network sepolia
```

Prepare a Sepolia:

```powershell
node .\scripts\preparar_sepolia.cjs
```

Rode o frontend:

```powershell
cd frontend
npm run dev
```

---

## 20. Sequência de teste do MVP

A sequência mínima de teste é:

```text
1. Proponente cadastra projeto.
2. Validador 1 inicia votação.
3. Validador 1 vota.
4. Validador 1 encerra votação.
5. Admin emite créditos.
6. Proponente cria oferta no marketplace.
7. Comprador compra créditos.
8. Comprador aposenta créditos.
9. Sistema emite NFT de compensação.
```

Ao trocar de papel no frontend, também troque a conta ativa no MetaMask e clique em:

```text
Sincronizar MetaMask
```

---

## 21. Scripts Sepolia principais

### `gerar_carteiras_sepolia.ts`

Gera ou reaproveita carteiras de teste para os papéis do MVP.

Também atualiza o `.env` com os endereços públicos e gera o arquivo `.sepolia-metamask-import.txt`.

### `financiar_carteiras_sepolia.ts`

Financia diretamente as carteiras existentes em `.sepolia-wallets.json`.

Uso recomendado logo depois de gerar as carteiras.

### `preparar_sepolia.cjs`

Script mestre que compila, faz deploy, configura contratos, verifica funding, transfere ownership, sincroniza o frontend e executa build.

### `financiar_contas_sepolia.ts`

Lê as contas registradas em `deployments\sepolia.json` e garante que elas possuem saldo mínimo.

É executado dentro do script mestre como verificação pós-deploy.

### `sync_frontend_deployments.cjs`

Atualiza automaticamente:

```text
frontend\src\config\contracts.generated.ts
frontend\src\config\contratos.ts
```

Assim, após cada deploy, o frontend passa a apontar para os contratos recém-implantados.
