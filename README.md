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

## 13. Executar ambiente local

### Terminal 1: iniciar blockchain local

```powershell
npx hardhat node --hostname 127.0.0.1
```

Esse terminal deve permanecer aberto.

### Terminal 2: compilar contratos

```powershell
npx hardhat compile
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

## 14. Rodar o frontend

Entre na pasta do frontend:

```powershell
cd frontend
```

Faça o build:

```powershell
npm run build
```

Rode a aplicação:

```powershell
npm run dev -- --force
```

A aplicação será aberta normalmente em endereço semelhante a:

```text
http://localhost:5173
```

---

## 15. Configuração da MetaMask

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

## 16. Usuários de demonstração

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

## 17. Teste funcional mínimo

### 17.1 Cadastro do projeto

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

### 17.2 Validação

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

### 17.3 Emissão de créditos

Perfil:

```text
admin
admin123
```

Conta MetaMask:

```text
Administrador
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

### 17.4 Oferta no marketplace

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

### 17.5 Compra dos créditos

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
Proponente recebe ETH local líquido
Marketplace separa taxa
```

---

### 17.6 Aposentadoria e certificado

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
```

---

## 18. Limitações do MVP

O CarbonLedger, nesta versão, é um MVP acadêmico e experimental. As principais limitações são:

* execução local em Hardhat, sem uso de rede pública real;
* ETH usado apenas como ativo fictício de teste;
* ausência de auditoria formal dos smart contracts;
* ausência de integração com sistemas reais de certificação de carbono;
* ausência de validação documental ambiental real;
* ausência de oráculos ambientais reais para medições de emissões;
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

## 19. Trabalhos futuros

Possíveis evoluções do projeto:

* implantação em rede pública de testes, como Sepolia;
* integração com IPFS real;
* integração com oráculos ambientais;
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

## 20. Observações finais

O CarbonLedger demonstra como a tecnologia blockchain pode ser aplicada à rastreabilidade de créditos de carbono, oferecendo maior transparência no registro, validação, emissão, negociação e aposentadoria de créditos ambientais.

O projeto não pretende substituir, nesta fase, processos reais de certificação ambiental. Seu objetivo é demonstrar tecnicamente um fluxo Web3 mínimo para um mercado digital de créditos de carbono em ambiente controlado de hackathon.

---

## 21. Licença

Projeto desenvolvido para fins educacionais, experimentais e de demonstração no contexto do Hackathon Web 3.0 do IREDE.
