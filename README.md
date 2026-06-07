# CarbonLedger

## Registro, validação, negociação, aposentadoria e certificação de créditos de carbono em blockchain

**Autores:**

* Alanio Lima
* Ednardo Peixoto
* Patrício Alves

Projeto desenvolvido para o **Hackathon Web 3.0 do IREDE**.

---

## 1. Visão geral

O **CarbonLedger** é uma aplicação Web3 desenvolvida para demonstrar um fluxo mínimo de registro, validação, emissão, comercialização, aposentadoria e certificação de créditos de carbono usando blockchain e smart contracts.

A proposta do projeto é simular uma infraestrutura descentralizada para rastrear créditos ambientais desde a submissão de um projeto de carbono até a emissão de créditos tokenizados, sua negociação em marketplace e sua posterior aposentadoria com emissão de certificado NFT.

O sistema foi construído como um **MVP**, ou seja, uma versão mínima funcional capaz de demonstrar o ciclo principal da aplicação em ambiente local Hardhat e em rede pública de testes Sepolia.

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
5. comprar créditos usando ETH de teste;
6. aposentar créditos comprados;
7. emitir certificado NFT de compensação;
8. visualizar contratos, transações e NFTs na Sepolia.

---

## 4. Escopo do MVP

O MVP implementa um ciclo funcional simplificado com os seguintes perfis:

### Administrador

Responsável por:

* operar funções administrativas do protocolo;
* emitir créditos de carbono para projetos aprovados;
* receber o ownership do contrato `CreditoCarbonoToken` após o deploy;
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
* Sepolia
* Sepolia Etherscan

---

## 6. Estrutura geral do projeto

```text
contracts
scripts
test
frontend
frontend\src
frontend\src\config
frontend\src\contracts
frontend\src\components
deployments
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
MockPriceFeedChainlink.sol
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
Emissão de certificado NFT ERC-721
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

O marketplace permite que o proponente oferte créditos de carbono emitidos e que compradores adquiram esses créditos usando ETH de teste.

No MVP, o contrato de marketplace calcula:

* valor total da compra;
* taxa do marketplace;
* valor líquido destinado ao vendedor.

Após a compra:

* o saldo ETH do comprador diminui;
* o saldo ETH do proponente aumenta;
* a taxa é separada conforme regra do marketplace;
* os créditos ERC-1155 passam para a carteira do comprador.

---

## 10. Aposentadoria e certificado NFT

Após comprar créditos, o comprador pode aposentar parte ou todo o saldo adquirido.

A aposentadoria representa a retirada definitiva daquele crédito de circulação, impedindo nova venda ou reutilização.

Ao aposentar créditos, o sistema registra a compensação e emite um certificado NFT associado à operação.

O NFT é emitido pelo contrato:

```text
CertificadoCompensacaoNFT
```

Na Sepolia, esse NFT pode ser visualizado pelo Sepolia Etherscan.

---

## 11. Redes suportadas

O projeto foi estruturado para funcionar em:

```text
Hardhat Localhost
Sepolia
```

### Hardhat Localhost

```text
RPC: http://127.0.0.1:8545
Chain ID: 31337
Símbolo: ETH
```

O ETH usado nesse ambiente é fictício e não possui valor real.

### Sepolia

```text
Chain ID decimal: 11155111
Chain ID hexadecimal: 0xaa36a7
Símbolo: SepoliaETH
Explorador: Sepolia Etherscan
```

A rede Sepolia permite visualizar contratos, transações, saldos, eventos e NFTs em um explorador público.

---

## 12. Instalação básica

Clone o repositório:

```powershell
git clone https://github.com/probson1981/CarbonLedger-Sepolia.git
cd CarbonLedger-Sepolia
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

A variável `SEPOLIA_DEPLOYER_PRIVATE_KEY` deve conter a private key da conta que pagará:

* deploy dos contratos;
* setup dos contratos;
* financiamento das carteiras de teste;
* transferência de ownership do contrato `CreditoCarbonoToken` para o Admin.

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

## 20. Executar ambiente local Hardhat

### Terminal 1: iniciar blockchain local

```powershell
npx hardhat node --hostname 127.0.0.1
```

Esse terminal deve permanecer aberto.

### Terminal 2: compilar contratos

```powershell
npx hardhat compile --force
```

### Gerar carteiras locais

```powershell
npx hardhat run .\scripts\gerar_carteiras_locais.ts
```

### Financiar carteiras locais

```powershell
npx hardhat run .\scripts\financiar_carteiras_locais.ts --network localhost
```

### Fazer deploy dos contratos

```powershell
npx hardhat run .\scripts\deploy_local.ts --network localhost
```

### Configurar contratos

```powershell
npx hardhat run .\scripts\setup_local.ts --network localhost
```

### Sincronizar contratos com o frontend

```powershell
node .\scripts\sync_frontend_deployments.cjs localhost
```

---

## 21. Configuração da MetaMask para ambiente local

Adicione uma rede manual na MetaMask com os seguintes dados:

```text
Nome da rede: Hardhat Localhost
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Símbolo: ETH
```

Importe as contas de teste usando as chaves privadas exibidas pelo Hardhat ao executar:

```powershell
npx hardhat node --hostname 127.0.0.1
```

Contas usadas com frequência no teste local:

```text
Administrador:
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Proponente:
0x70997970C51812dc3A010C7d01b50e0d17dc79C8

Validador 1:
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

Validador 2:
0x90F79bf6EB2c4f870365E785982E1f101E93b906

Comprador:
0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65
```

Essas contas e chaves são apenas para ambiente local. Nunca devem ser usadas em redes reais.

---

## 22. Usuários de demonstração

```text
Administrador:
usuário: admin
senha: admin123

Proponente 1:
usuário: proponente1
senha: prop123

Proponente 2:
usuário: proponente2
senha: prop456

Validador 1:
usuário: validador1
senha: val123

Validador 2:
usuário: validador2
senha: val456

Comprador 1:
usuário: comprador1
senha: comp123

Comprador 2:
usuário: comprador2
senha: comp456
```

Ao trocar de usuário no frontend, também troque a conta ativa na MetaMask e clique em **Sincronizar MetaMask**.

---

## 23. Teste funcional mínimo

### 23.1 Cadastro do projeto

Perfil:

```text
proponente1
prop123
```

Conta MetaMask:

```text
Proponente
```

Passos:

```text
Submeter Projeto
Novo projeto
Enviar para validação
Confirmar na MetaMask
```

Resultado esperado:

```text
Projeto cadastrado na blockchain
Projeto aparece na lista do proponente
```

---

### 23.2 Validação

Perfil:

```text
validador1
val123
```

Conta MetaMask:

```text
Validador 1
```

Passos:

```text
Validar projetos
Sincronizar todos os projetos
Selecionar projeto em análise
Iniciar votação
Confirmar na MetaMask
Verificar aptidão
Aprovar ou rejeitar
Confirmar na MetaMask
Aguardar prazo de votação
Encerrar votação
Confirmar na MetaMask
```

Resultado esperado:

```text
Votação criada
Voto registrado
Votação encerrada
Projeto aprovado ou rejeitado
```

---

### 23.3 Emissão de créditos

Perfil:

```text
admin
admin123
```

Conta MetaMask:

```text
Admin
```

Passos:

```text
Emissão de Créditos
Selecionar projeto aprovado
Consultar projeto
Emitir créditos
Confirmar na MetaMask
```

Resultado esperado:

```text
Créditos ERC-1155 emitidos
Projeto passa para Créditos emitidos
Proponente recebe saldo no lote
```

---

### 23.4 Oferta no marketplace

Perfil:

```text
proponente1
prop123
```

Conta MetaMask:

```text
Proponente
```

Passos:

```text
Ofertar Créditos
Selecionar projeto com créditos emitidos
Consultar saldo e aprovação
Aprovar marketplace
Confirmar na MetaMask
Criar oferta
Confirmar na MetaMask
```

Resultado esperado:

```text
Oferta criada no marketplace
```

---

### 23.5 Compra dos créditos

Perfil:

```text
comprador1
comp123
```

Conta MetaMask:

```text
Comprador
```

Passos:

```text
Comprar créditos
Atualizar ofertas disponíveis
Selecionar oferta
Calcular compra
Comprar créditos
Confirmar na MetaMask
```

Resultado esperado:

```text
Comprador recebe créditos ERC-1155
Proponente recebe ETH
Marketplace separa taxa
```

---

### 23.6 Aposentadoria e certificado NFT

Perfil:

```text
comprador1
comp123
```

Conta MetaMask:

```text
Comprador
```

Passos:

```text
Aposentar Créditos
Atualizar meus créditos
Selecionar lote comprado
Informar quantidade a aposentar
Aposentar créditos e emitir NFT
Confirmar na MetaMask
Atualizar resumo completo
```

Resultado esperado:

```text
Créditos aposentados
Saldo do comprador reduzido
Certificado NFT emitido
NFT visível no Sepolia Etherscan
```

---

## 24. Scripts Sepolia principais

### `gerar_carteiras_sepolia.ts`

Gera ou reaproveita carteiras de teste para os papéis do MVP.

Também atualiza o `.env` com os endereços públicos e gera o arquivo `.sepolia-metamask-import.txt`.

Por padrão, não sobrescreve carteiras existentes.

Para forçar novas carteiras:

```powershell
npx hardhat run .\scripts\gerar_carteiras_sepolia.ts -- --force
```

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

---

## 25. Sepolia Etherscan

Após o deploy, os contratos aparecem no Sepolia Etherscan.

Os endereços atuais dos contratos ficam registrados em:

```text
deployments\sepolia.json
```

O relatório de setup fica registrado em:

```text
deployments\sepolia.setup.json
```

A verificação do código-fonte dos contratos no Etherscan pode ser feita posteriormente usando `ETHERSCAN_API_KEY`.

---

## 26. Arquivos que não devem ir para o GitHub

Os arquivos abaixo contêm dados sensíveis ou dependências locais e não devem ser enviados ao repositório:

```text
.env
.sepolia-wallets.json
.sepolia-metamask-import.txt
node_modules
frontend\node_modules
```

O arquivo `.env.example` pode ser enviado, pois contém apenas placeholders.

---

## 27. Limitações do MVP

O CarbonLedger, nesta versão, é um MVP acadêmico e experimental. As principais limitações são:

* ausência de auditoria formal dos smart contracts;
* ausência de integração com sistemas reais de certificação de carbono;
* ausência de validação documental ambiental real;
* ausência de oráculos ambientais reais para medições de emissões;
* uso de mock para price feed em parte do fluxo de MVP;
* persistência parcial de alguns dados no navegador;
* dependência de sincronização manual entre blockchain e frontend em alguns fluxos;
* marketplace simplificado;
* governança implementada em nível básico para demonstração;
* staking simplificado para fins de MVP;
* controle de identidade e permissões simplificado;
* URIs IPFS usadas como referências simuladas;
* ausência de integração com armazenamento descentralizado real no fluxo de teste;
* ausência de tratamento completo para cenários de produção, escalabilidade e segurança.

---

## 28. Trabalhos futuros

Possíveis evoluções do projeto:

* verificação dos contratos no Sepolia Etherscan;
* integração com IPFS real;
* integração com oráculos ambientais;
* substituição definitiva do mock por price feed externo quando aplicável;
* melhoria do módulo de governança;
* melhoria do módulo de staking;
* auditoria dos contratos inteligentes;
* integração com padrões reconhecidos de certificação de carbono;
* painel analítico para rastreabilidade dos créditos;
* melhoria da arquitetura do frontend;
* indexação de eventos on-chain;
* criação de API auxiliar para consulta histórica;
* melhoria da experiência de usuário;
* suporte a múltiplos validadores e quóruns mais complexos;
* relatórios de compensação exportáveis;
* melhoria da documentação técnica.

---

## 29. Observações finais

O CarbonLedger demonstra como a tecnologia blockchain pode ser aplicada à rastreabilidade de créditos de carbono, oferecendo maior transparência no registro, validação, emissão, negociação e aposentadoria de créditos ambientais.

O projeto não pretende substituir, nesta fase, processos reais de certificação ambiental. Seu objetivo é demonstrar tecnicamente um fluxo Web3 mínimo para um mercado digital de créditos de carbono em ambiente controlado de hackathon e em rede pública de testes.

---

## 30. Licença

Projeto desenvolvido para fins educacionais, experimentais e de demonstração no contexto do Hackathon Web 3.0 do IREDE.
