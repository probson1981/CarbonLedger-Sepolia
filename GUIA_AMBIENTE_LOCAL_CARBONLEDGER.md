\# Guia de Ambiente Local do CarbonLedger



\## 1. Objetivo



Este documento orienta a montagem do ambiente local do projeto \*\*CarbonLedger\*\* no Visual Studio Code, incluindo instalação dos programas necessários, clonagem do repositório, instalação das dependências, criação e financiamento de carteiras locais, configuração da MetaMask, compilação dos contratos, deploy local, setup dos contratos, sincronização com o frontend e execução completa do fluxo de teste.



O ambiente descrito aqui é voltado para testes locais usando a rede \*\*Hardhat Localhost\*\*, com ETH fictício de desenvolvimento.



\---



\## 2. Programas necessários



Instale os programas abaixo antes de iniciar.



\### 2.1 Visual Studio Code



Instale o Visual Studio Code.



Extensões recomendadas:



```text

Solidity

ESLint

Prettier

TypeScript Vue Plugin ou suporte TypeScript padrão

GitLens, opcional

```



\### 2.2 Git



Instale o Git para Windows.



Depois confirme no PowerShell:



```powershell

git --version

```



\### 2.3 Node.js



Instale o Node.js em versão LTS.



Depois confirme:



```powershell

node -v

npm -v

```



\### 2.4 MetaMask



Instale a extensão MetaMask no navegador.



Use uma carteira apenas para testes. Nunca use carteira real com fundos reais no ambiente local.



\### 2.5 Navegador



Recomendado:



```text

Google Chrome

Microsoft Edge

```



\---



\## 3. Clonar o repositório



Escolha uma pasta de trabalho e rode:



```powershell

cd "D:\\Hackaton web3"



git clone https://github.com/probson1981/CarbonLedger.git



cd "D:\\Hackaton web3\\CarbonLedger"

```



Caso o repositório já exista:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



git pull

```



\---



\## 4. Abrir no Visual Studio Code



Na raiz do projeto:



```powershell

code .

```



\---



\## 5. Liberar execução de scripts no PowerShell



Caso o PowerShell bloqueie scripts locais, execute:



```powershell

Set-ExecutionPolicy -Scope CurrentUser RemoteSigned

```



Ou rode comandos pontuais com:



```powershell

powershell -ExecutionPolicy Bypass -File .\\scripts\\nome\_do\_script.ps1

```



\---



\## 6. Instalar dependências do projeto



Na raiz do projeto:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npm install

```



Depois instale as dependências do frontend:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger\\frontend"



npm install

```



Volte para a raiz:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"

```



\---



\## 7. Estrutura principal do projeto



As pastas mais importantes são:



```text

contracts

scripts

test

frontend

frontend\\src

frontend\\src\\config

frontend\\src\\contracts

frontend\\src\\components

```



Arquivos e scripts importantes:



```text

contracts\\\*.sol

scripts\\deploy\_local.ts

scripts\\setup\_local.ts

scripts\\gerar\_carteiras\_locais.ts

scripts\\financiar\_carteiras\_locais.ts

scripts\\sync\_frontend\_deployments.cjs

frontend\\src\\config\\contracts.generated.ts

frontend\\src\\config\\contasLocais.ts

frontend\\src\\config\\contratos.ts

frontend\\src\\config\\redes.ts

frontend\\src\\App.tsx

```



\---



\## 8. Subir a blockchain local Hardhat



Abra um terminal exclusivo para a blockchain local.



Na raiz do projeto:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat node --hostname 127.0.0.1

```



Deixe esse terminal aberto.



A rede local ficará disponível em:



```text

RPC: http://127.0.0.1:8545

Chain ID: 31337

Símbolo: ETH

```



Observação: sempre que o `hardhat node` for reiniciado, a blockchain local será zerada. Será necessário fazer novo deploy e novo setup.



\---



\## 9. Configurar a rede Hardhat Localhost na MetaMask



Abra a MetaMask e adicione uma rede manualmente.



Use os dados:



```text

Nome da rede: Hardhat Localhost

RPC URL: http://127.0.0.1:8545

Chain ID: 31337

Símbolo da moeda: ETH

```



Depois selecione a rede \*\*Hardhat Localhost\*\*.



\---



\## 10. Carteiras locais



O projeto usa perfis de demonstração associados a carteiras de teste.



Perfis principais:



```text

Administrador

Proponente

Validador

Comprador

```



Contas locais usadas com frequência no ambiente Hardhat:



```text

Admin:

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



As chaves privadas aparecem no terminal quando o comando abaixo está rodando:



```powershell

npx hardhat node --hostname 127.0.0.1

```



Importe as contas na MetaMask usando as chaves privadas exibidas pelo Hardhat.



Atenção: essas chaves são apenas para teste local. Nunca use em redes reais.



\---



\## 11. Gerar carteiras locais pelo script do projeto



O projeto possui script para gerar carteiras locais.



Na raiz do projeto:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat run .\\scripts\\gerar\_carteiras\_locais.ts

```



Depois verifique os arquivos gerados ou atualizados. Normalmente eles ficam na área de configuração do projeto ou do frontend.



Também é possível listar os arquivos modificados com:



```powershell

git status

```



\---



\## 12. Financiar carteiras locais



Com o `hardhat node` rodando em outro terminal, execute:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat run .\\scripts\\financiar\_carteiras\_locais.ts --network localhost

```



Esse script transfere ETH local fictício para as carteiras de teste.



Se alguma conta aparecer sem saldo na MetaMask, confirme se:



```text

a rede selecionada é Hardhat Localhost

o Hardhat node está rodando

a conta importada é a conta correta

o script de financiamento foi executado

```



\---



\## 13. Compilar contratos



Na raiz do projeto:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat compile

```



Resultado esperado:



```text

Compiled Solidity files successfully

```



Ou mensagem equivalente indicando que os contratos foram compilados.



\---



\## 14. Deploy local dos contratos



Com o `hardhat node` rodando, execute:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat run .\\scripts\\deploy\_local.ts --network localhost

```



Esse script implanta os contratos na rede local.



Contratos principais do protocolo:



```text

TokenImpactoCarbono

CreditoCarbonoToken

CertificadoCompensacaoNFT

RegistroOrganizacoes

TesourariaCarbono

RegistroProjetosCarbono

ValidacaoProjetos

MercadoCarbono

RegistroAposentadorias

StakingCarbono

GovernancaCarbono

AdaptadorOraculoChainlink

```



Após o deploy, os endereços dos contratos devem ser exibidos no terminal.



\---



\## 15. Setup local dos contratos



Após o deploy, execute o setup:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat run .\\scripts\\setup\_local.ts --network localhost

```



Esse script configura permissões entre contratos, autorizações, prazo de votação, quórum e tesouraria.



Resultado esperado, ou semelhante:



```text

ValidacaoProjetos autorizado no RegistroProjetosCarbono: true

CreditoCarbonoToken autorizado no RegistroProjetosCarbono: true

RegistroAposentadorias autorizado no CreditoCarbonoToken: true

RegistroAposentadorias autorizado no CertificadoCompensacaoNFT: true

StakingCarbono autorizado na TesourariaCarbono: true

Prazo de votação MVP: 60 segundos

Quórum mínimo MVP: 1 voto

Saldo TIC da Tesouraria: 100000.0 TIC

```



\---



\## 16. Sincronizar endereços dos contratos com o frontend



Depois do deploy e do setup, sincronize os endereços e ABIs para o frontend:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



node .\\scripts\\sync\_frontend\_deployments.cjs localhost

```



Esse comando atualiza arquivos como:



```text

frontend\\src\\config\\contracts.generated.ts

```



Após sincronizar, é recomendável conferir:



```powershell

Select-String -Path .\\frontend\\src\\config\\contracts.generated.ts -Pattern "RegistroProjetosCarbono|ValidacaoProjetos|MercadoCarbono|CreditoCarbonoToken"

```



\---



\## 17. Build do frontend



Na pasta do frontend:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger\\frontend"



npm run build

```



Resultado esperado:



```text

built successfully

```



Avisos sobre tamanho de chunks podem aparecer e não impedem o teste local.



\---



\## 18. Rodar o frontend



Na pasta do frontend:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger\\frontend"



npm run dev -- --force

```



O Vite mostrará um endereço semelhante a:



```text

http://localhost:5173

```



Abra esse endereço no navegador.



\---



\## 19. Limpar dados antigos do navegador



Antes de um teste limpo, abra o console do navegador e rode:



```javascript

Object.keys(localStorage)

&#x20; .filter((chave) => chave.startsWith("carbonledger"))

&#x20; .forEach((chave) => localStorage.removeItem(chave));



location.reload();

```



Isso remove projetos e estados antigos salvos no navegador.



\---



\## 20. Login de demonstração



Usuários de teste:



```text

Admin:

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



Ao trocar de perfil, troque também a conta ativa na MetaMask e clique em:



```text

Sincronizar MetaMask

```



\---



\## 21. Fluxo funcional completo para teste



\### 21.1 Proponente cadastra projeto



Perfil no frontend:



```text

proponente1

prop123

```



Conta MetaMask recomendada:



```text

0x70997970C51812dc3A010C7d01b50e0d17dc79C8

```



Passos:



```text

Entrar como proponente

Clicar em Submeter Projeto

Clicar em Novo projeto

Usar os dados preenchidos automaticamente ou ajustar os campos

Clicar em Enviar para validação

Confirmar a transação na MetaMask

```



Resultado esperado:



```text

Projeto cadastrado na blockchain

ID blockchain gerado

Projeto listado em Meus Projetos

```



Se o projeto aparecer como pendente localmente, a tela do validador poderá sincronizar o status real da blockchain depois.



\---



\### 21.2 Validador inicia votação, vota e encerra



Perfil no frontend:



```text

validador1

val123

```



Conta MetaMask recomendada:



```text

0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

```



Passos:



```text

Entrar como validador

Clicar em Validar projetos

Clicar em Sincronizar todos os projetos

Selecionar o projeto

Verificar se o status está Em análise

Clicar em Iniciar votação

Confirmar na MetaMask

Clicar em Verificar aptidão

Clicar em Aprovar ou Rejeitar

Confirmar na MetaMask

Aguardar o prazo de votação, normalmente 60 segundos

Clicar em Encerrar votação

Confirmar na MetaMask

```



Resultado esperado:



```text

Votação existe: Sim

Validador apto: Sim

Votação aberta: Sim

Total de votos: 1

Votos de aprovação: 1, caso aprovado

Pode encerrar: Sim, após o prazo

Projeto aprovado ou rejeitado

```



Regra de negócio atual:



```text

Iniciar votação somente para projeto em análise

Aprovar ou rejeitar somente se a votação existir e estiver aberta

Encerrar votação somente depois do fim do prazo

```



\---



\### 21.3 Admin emite créditos



Perfil no frontend:



```text

admin

admin123

```



Conta MetaMask recomendada:



```text

0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

```



Passos:



```text

Entrar como administrador

Clicar em Emissão de Créditos

Selecionar projeto aprovado

Clicar em Consultar projeto

Informar ID do lote

Informar ano de referência

Clicar em Emitir créditos

Confirmar na MetaMask

```



Valores sugeridos para teste:



```text

ID do lote: mesmo ID do projeto

Ano de referência: 2026

```



Resultado esperado:



```text

Créditos emitidos com sucesso

Lote ERC-1155 criado

Projeto passa para status Créditos emitidos

Saldo do proponente no lote fica disponível para oferta

```



\---



\### 21.4 Proponente cria oferta no marketplace



Perfil no frontend:



```text

proponente1

prop123

```



Conta MetaMask recomendada:



```text

0x70997970C51812dc3A010C7d01b50e0d17dc79C8

```



Passos:



```text

Entrar como proponente

Clicar em Ofertar Créditos

Selecionar projeto com créditos emitidos

Clicar em Consultar saldo e aprovação

Clicar em Aprovar marketplace

Confirmar na MetaMask

Informar quantidade a ofertar

Informar preço por crédito

Clicar em Criar oferta

Confirmar na MetaMask

```



Valores sugeridos:



```text

ID lote: 1

Quantidade a ofertar: 1000

Preço por crédito: 0.002 ETH

```



Resultado esperado:



```text

Marketplace aprovado

Oferta criada

Oferta aparece na lista de ofertas

```



\---



\### 21.5 Comprador compra créditos



Perfil no frontend:



```text

comprador1

comp123

```



Conta MetaMask recomendada:



```text

0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65

```



Passos:



```text

Entrar como comprador

Clicar em Comprar créditos

Clicar em Atualizar ofertas disponíveis

Selecionar oferta

Informar quantidade a comprar

Clicar em Calcular compra

Clicar em Comprar créditos

Confirmar na MetaMask

```



Valores sugeridos:



```text

Quantidade: 100

```



Resultado esperado:



```text

ETH local do comprador diminui

ETH local do proponente aumenta pelo valor líquido

Taxa do marketplace é separada

Saldo ERC-1155 do comprador aumenta no lote comprado

```



Observação: na rede Hardhat Localhost, a MetaMask pode mostrar US$ 0,00 mesmo com saldo positivo em ETH. Isso é normal, porque o ETH local é fictício e não tem cotação real.



\---



\### 21.6 Comprador aposenta créditos e emite NFT



Perfil no frontend:



```text

comprador1

comp123

```



Conta MetaMask recomendada:



```text

0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65

```



Passos:



```text

Entrar como comprador

Clicar em Meus Créditos ou Aposentar Créditos

Clicar em Atualizar meus créditos

Selecionar o lote comprado

Informar quantidade a aposentar

Clicar em Aposentar créditos e emitir NFT

Confirmar na MetaMask

Clicar em Atualizar resumo completo

```



Valores sugeridos:



```text

Quantidade a aposentar: 10

Motivo: Compensação voluntária de emissões de carbono

URI do relatório: ipfs://carbonledger/relatorios/relatorio-compensacao.json

URI do certificado: ipfs://carbonledger/certificados/certificado-compensacao.json

```



Resultado esperado:



```text

Créditos aposentados

Saldo do comprador no lote diminui

Aposentadoria registrada

Certificado NFT emitido

```



\---



\## 22. Comandos principais em sequência para teste limpo



Use esta sequência quando quiser reiniciar tudo do zero.



Terminal 1:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat node --hostname 127.0.0.1

```



Terminal 2:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



npx hardhat compile



npx hardhat run .\\scripts\\gerar\_carteiras\_locais.ts



npx hardhat run .\\scripts\\financiar\_carteiras\_locais.ts --network localhost



npx hardhat run .\\scripts\\deploy\_local.ts --network localhost



npx hardhat run .\\scripts\\setup\_local.ts --network localhost



node .\\scripts\\sync\_frontend\_deployments.cjs localhost

```



Terminal 3:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger\\frontend"



npm install



npm run build



npm run dev -- --force

```



No navegador:



```javascript

Object.keys(localStorage)

&#x20; .filter((chave) => chave.startsWith("carbonledger"))

&#x20; .forEach((chave) => localStorage.removeItem(chave));



location.reload();

```



\---



\## 23. Problemas comuns e soluções



\### 23.1 MetaMask não abre



Verifique:



```text

A extensão está instalada

A rede Hardhat Localhost está selecionada

A conta correta está ativa

O botão Sincronizar MetaMask foi clicado

O Hardhat node está rodando

```



\### 23.2 Rede incorreta



A aplicação espera:



```text

Chain ID: 31337

RPC: http://127.0.0.1:8545

```



Se estiver em outra rede, troque na MetaMask para \*\*Hardhat Localhost\*\*.



\### 23.3 Erro de nonce



Esse problema pode ocorrer depois de reiniciar a blockchain local ou reutilizar a MetaMask com histórico antigo.



Soluções:



```text

Reiniciar o Hardhat node

Limpar os dados locais do navegador

Na MetaMask, limpar a atividade ou redefinir a conta de teste

Fazer novo deploy e novo setup

```



\### 23.4 Contrato não encontrado



Rode novamente:



```powershell

npx hardhat run .\\scripts\\deploy\_local.ts --network localhost



npx hardhat run .\\scripts\\setup\_local.ts --network localhost



node .\\scripts\\sync\_frontend\_deployments.cjs localhost

```



Depois reinicie o frontend:



```powershell

cd .\\frontend



npm run dev -- --force

```



\### 23.5 Projeto não aparece com status atualizado



Na tela do validador:



```text

Clicar em Sincronizar todos os projetos

Selecionar o projeto

Clicar em Sincronizar status

Clicar em Verificar aptidão

```



\### 23.6 US$ 0,00 na MetaMask



Isso é normal na rede Hardhat Localhost.



O ETH local é fictício e pode não ter valor em dólar exibido pela MetaMask.



O que importa no teste é o saldo em ETH local e o saldo dos tokens ERC-1155.



\### 23.7 Build com aviso de chunk grande



Mensagem parecida com:



```text

Some chunks are larger than 500 kB after minification

```



Isso é aviso, não erro. O frontend pode ser testado normalmente.



\---



\## 24. Critério de teste aprovado



O fluxo local estará funcionando se for possível executar a sequência:



```text

Cadastrar projeto

Sincronizar projeto no validador

Iniciar votação

Votar aprovando ou rejeitando

Encerrar votação

Emitir créditos ERC-1155

Criar oferta no marketplace

Comprar créditos

Aposentar créditos

Emitir certificado NFT

```



Sem erros de contrato, rede, MetaMask ou build.



\---



\## 25. Comandos finais de verificação



Na raiz do projeto:



```powershell

npx hardhat compile

```



No frontend:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger\\frontend"



npm run build

```



Verificar autores nos cabeçalhos:



```powershell

cd "D:\\Hackaton web3\\CarbonLedger"



Select-String -Path .\\contracts\\\*.sol,.\\scripts\\\*.ts,.\\scripts\\\*.js,.\\frontend\\src\\\*.ts,.\\frontend\\src\\\*.tsx,.\\frontend\\src\\\*\*\\\*.ts,.\\frontend\\src\\\*\*\\\*.tsx,.\\test\\\*.ts -Pattern "@author"

```



Resultado esperado:



```text

@author Alanio Lima

@author Ednardo Peixoto

@author Patrício Alves

```



\---



\## 26. Observação de segurança



Todo o ambiente descrito neste guia é local e usa ETH fictício da rede Hardhat.



Nunca use chaves privadas reais, contas pessoais reais ou fundos reais neste ambiente de desenvolvimento.



