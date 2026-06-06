/* eslint-disable */
// Arquivo gerado automaticamente.
// Não edite manualmente.
//
// Para atualizar depois de um deploy local, rode:
// node scripts/sync_frontend_deployments.cjs

export const DEPLOYMENTS = {
  "31337": {
    "projeto": "CarbonLedger",
    "networkName": "localhost",
    "chainId": "31337",
    "deployer": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "geradoEm": "2026-06-06T02:14:07.691Z",
    "contratos": {
      "TokenImpactoCarbono": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "CreditoCarbonoToken": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "CertificadoCompensacaoNFT": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
      "RegistroOrganizacoes": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
      "TesourariaCarbono": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      "RegistroProjetosCarbono": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
      "ValidacaoProjetos": "0x0165878A594ca255338adfa4d48449f69242Eb8F",
      "MercadoCarbono": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
      "RegistroAposentadorias": "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
      "StakingCarbono": "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      "GovernancaCarbono": "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
      "MockPriceFeedChainlink": "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
      "AdaptadorOraculoChainlink": "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"
    },
    "TokenImpactoCarbono": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "CreditoCarbonoToken": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "CertificadoCompensacaoNFT": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    "RegistroOrganizacoes": "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    "TesourariaCarbono": "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    "RegistroProjetosCarbono": "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    "ValidacaoProjetos": "0x0165878A594ca255338adfa4d48449f69242Eb8F",
    "MercadoCarbono": "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
    "RegistroAposentadorias": "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    "StakingCarbono": "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
    "GovernancaCarbono": "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    "MockPriceFeedChainlink": "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    "AdaptadorOraculoChainlink": "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0"
  }
} as const;

export const ABIS = {
  "AdaptadorOraculoChainlink": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoInicialPriceFeed",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "int256",
          "name": "preco",
          "type": "int256"
        },
        {
          "indexed": false,
          "internalType": "uint8",
          "name": "casasDecimais",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "atualizadoEm",
          "type": "uint256"
        }
      ],
      "name": "PrecoConsultado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "novoPriceFeed",
          "type": "address"
        }
      ],
      "name": "PriceFeedAtualizado",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "novoPriceFeed",
          "type": "address"
        }
      ],
      "name": "atualizarPriceFeed",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "casasDecimaisFeed",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "valorUSD18",
          "type": "uint256"
        }
      ],
      "name": "converterUSD18ParaWei",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "valorWei",
          "type": "uint256"
        }
      ],
      "name": "converterWeiParaUSD18",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "descricaoFeed",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "enderecoPriceFeed",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "obterPrecoAtual",
      "outputs": [
        {
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        },
        {
          "internalType": "int256",
          "name": "preco",
          "type": "int256"
        },
        {
          "internalType": "uint8",
          "name": "casasDecimais",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "atualizadoEm",
          "type": "uint256"
        },
        {
          "internalType": "uint80",
          "name": "answeredInRound",
          "type": "uint80"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "obterPrecoNormalizado18",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "priceFeed",
      "outputs": [
        {
          "internalType": "contract AggregatorV3Interface",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "versaoFeed",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "AggregatorV3Interface": [
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "description",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestRoundData",
      "outputs": [
        {
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        },
        {
          "internalType": "int256",
          "name": "answer",
          "type": "int256"
        },
        {
          "internalType": "uint256",
          "name": "startedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "updatedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint80",
          "name": "answeredInRound",
          "type": "uint80"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "version",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "CertificadoCompensacaoNFT": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721IncorrectOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721InsufficientApproval",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC721InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC721NonexistentToken",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "approved",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idCertificado",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idAposentadoria",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "beneficiario",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidadeCompensada",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "uriCertificado",
          "type": "string"
        }
      ],
      "name": "CertificadoEmitido",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "ContratoAutorizado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "autorizarContrato",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "certificados",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "idCertificado",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "idAposentadoria",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "beneficiario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeCompensada",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriCertificado",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "dataEmissao",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "contratosAutorizados",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "beneficiario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idAposentadoria",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeCompensada",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriCertificado",
          "type": "string"
        }
      ],
      "name": "emitirCertificado",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "getApproved",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ownerOf",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "tokenURI",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalCertificados",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "CreditoCarbonoToken": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "uriBase",
          "type": "string"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "tokenId",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idsLength",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "valuesLength",
          "type": "uint256"
        }
      ],
      "name": "ERC1155InvalidArrayLength",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidOperator",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC1155InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "ERC1155MissingApprovalForAll",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "ApprovalForAll",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "ContratoAutorizado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "titular",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "CreditosAposentados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "anoReferencia",
          "type": "uint256"
        }
      ],
      "name": "CreditosEmitidos",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "indexed": false,
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        }
      ],
      "name": "TransferBatch",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "TransferSingle",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "string",
          "name": "value",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "URI",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "autorizarContrato",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "accounts",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        }
      ],
      "name": "balanceOfBatch",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "contratosAutorizados",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "anoReferencia",
          "type": "uint256"
        }
      ],
      "name": "emitirCreditos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoRegistroProjetos",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "anoReferencia",
          "type": "uint256"
        }
      ],
      "name": "emitirCreditosDeProjetoAprovado",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        }
      ],
      "name": "loteAtivo",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "loteEmitido",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "lotesCredito",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeEmitida",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeAposentada",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "anoReferencia",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "ativo",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "titular",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "queimarCreditos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256[]",
          "name": "ids",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "values",
          "type": "uint256[]"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeBatchTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "approved",
          "type": "bool"
        }
      ],
      "name": "setApprovalForAll",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "uri",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "IRegistroProjetosCarbonoCredito": [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "marcarCreditosEmitidos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "obterCreditosAprovados",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "obterProponente",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "projetoAprovado",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "projetoEmitido",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "GovernancaCarbono": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoTokenImpactoCarbono",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "prazoVotacaoPadrao",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quorumMinimo",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "saldoMinimoParaPropor",
          "type": "uint256"
        }
      ],
      "name": "ParametrosGovernancaAlterados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "cancelador",
          "type": "address"
        }
      ],
      "name": "PropostaCancelada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "proponente",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "contratoAlvo",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "inicioVotacao",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "fimVotacao",
          "type": "uint256"
        }
      ],
      "name": "PropostaCriada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "executor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "sucesso",
          "type": "bool"
        }
      ],
      "name": "PropostaExecutada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "novoToken",
          "type": "address"
        }
      ],
      "name": "TokenGovernancaAtualizado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "votante",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "apoio",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "peso",
          "type": "uint256"
        }
      ],
      "name": "VotoRegistrado",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "novoPrazoVotacaoPadrao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "novoQuorumMinimo",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "novoSaldoMinimoParaPropor",
          "type": "uint256"
        }
      ],
      "name": "alterarParametrosGovernanca",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "novoToken",
          "type": "address"
        }
      ],
      "name": "atualizarTokenGovernanca",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        }
      ],
      "name": "cancelarProposta",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "contratoAlvo",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "valorETH",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "dadosExecucao",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        }
      ],
      "name": "criarProposta",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        }
      ],
      "name": "estadoProposta",
      "outputs": [
        {
          "internalType": "enum GovernancaCarbono.EstadoProposta",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        }
      ],
      "name": "executarProposta",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "retorno",
          "type": "bytes"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "jaVotou",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "pesoDoVoto",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "prazoVotacaoPadrao",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        }
      ],
      "name": "propostaAprovada",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "propostas",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "proponente",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "contratoAlvo",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "valorETH",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "dadosExecucao",
          "type": "bytes"
        },
        {
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "inicioVotacao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "fimVotacao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "votosFavor",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "votosContra",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "executada",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "cancelada",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "quorumMinimo",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "saldoMinimoParaPropor",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenImpactoCarbono",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalPropostas",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        }
      ],
      "name": "totalVotos",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProposta",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "apoio",
          "type": "bool"
        }
      ],
      "name": "votar",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "votoFavoravel",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ],
  "ICreditoCarbonoTokenMercado": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "operator",
          "type": "address"
        }
      ],
      "name": "isApprovedForAll",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        }
      ],
      "name": "safeTransferFrom",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "IRegistroOrganizacoesMercado": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehComprador",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "organizacaoAtiva",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "ITesourariaCarbonoMercado": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "origem",
          "type": "string"
        }
      ],
      "name": "receberTaxaETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ],
  "MercadoCarbono": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoCreditoCarbonoToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoRegistroOrganizacoes",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoTesourariaCarbono",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "creditoCarbonoToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "registroOrganizacoes",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "tesourariaCarbono",
          "type": "address"
        }
      ],
      "name": "ContratosAtualizados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "comprador",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "vendedor",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "valorTotal",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "valorTaxa",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "valorVendedor",
          "type": "uint256"
        }
      ],
      "name": "CreditosComprados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "vendedor",
          "type": "address"
        }
      ],
      "name": "OfertaCancelada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "vendedor",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "precoPorCredito",
          "type": "uint256"
        }
      ],
      "name": "OfertaCriada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "novaTaxaBps",
          "type": "uint256"
        }
      ],
      "name": "TaxaMarketplaceAlterada",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "BASE_BPS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "novaTaxaBps",
          "type": "uint256"
        }
      ],
      "name": "alterarTaxaMarketplace",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoCreditoCarbonoToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoRegistroOrganizacoes",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoTesourariaCarbono",
          "type": "address"
        }
      ],
      "name": "atualizarContratos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "calcularCompra",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "valorTotal",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "valorTaxa",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "valorVendedor",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        }
      ],
      "name": "cancelarOferta",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "comprarCreditos",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "creditoCarbonoToken",
      "outputs": [
        {
          "internalType": "contract ICreditoCarbonoTokenMercado",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "precoPorCredito",
          "type": "uint256"
        }
      ],
      "name": "criarOferta",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        }
      ],
      "name": "ofertaDisponivel",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "ofertas",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "idOferta",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "vendedor",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeTotal",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeDisponivel",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "precoPorCredito",
          "type": "uint256"
        },
        {
          "internalType": "enum MercadoCarbono.EstadoOferta",
          "name": "estadoOferta",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "dataCriacao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "dataAtualizacao",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "registroOrganizacoes",
      "outputs": [
        {
          "internalType": "contract IRegistroOrganizacoesMercado",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "taxaMarketplaceBps",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tesourariaCarbono",
      "outputs": [
        {
          "internalType": "contract ITesourariaCarbonoMercado",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalOfertas",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "MockPriceFeedChainlink": [
    {
      "inputs": [
        {
          "internalType": "uint8",
          "name": "_casasDecimais",
          "type": "uint8"
        },
        {
          "internalType": "string",
          "name": "_descricao",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "_versao",
          "type": "uint256"
        },
        {
          "internalType": "int256",
          "name": "_resposta",
          "type": "int256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "int256",
          "name": "novaResposta",
          "type": "int256"
        },
        {
          "internalType": "uint256",
          "name": "novoAtualizadoEm",
          "type": "uint256"
        },
        {
          "internalType": "uint80",
          "name": "novaRodadaRespondida",
          "type": "uint80"
        }
      ],
      "name": "atualizarResposta",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "description",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestRoundData",
      "outputs": [
        {
          "internalType": "uint80",
          "name": "roundId",
          "type": "uint80"
        },
        {
          "internalType": "int256",
          "name": "answer",
          "type": "int256"
        },
        {
          "internalType": "uint256",
          "name": "startedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "updatedAt",
          "type": "uint256"
        },
        {
          "internalType": "uint80",
          "name": "answeredInRound",
          "type": "uint80"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "version",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "ICertificadoCompensacaoNFTAposentadoria": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "beneficiario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idAposentadoria",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeCompensada",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriCertificado",
          "type": "string"
        }
      ],
      "name": "emitirCertificado",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "ICreditoCarbonoTokenAposentadoria": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "titular",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "queimarCreditos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "IRegistroOrganizacoesAposentadoria": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehComprador",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "ITesourariaCarbonoAposentadoria": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "origem",
          "type": "string"
        }
      ],
      "name": "receberTaxaETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ],
  "RegistroAposentadorias": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoRegistroOrganizacoes",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoCreditoCarbonoToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoCertificadoCompensacaoNFT",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoTesourariaCarbono",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "registroOrganizacoes",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "creditoCarbonoToken",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "certificadoCompensacaoNFT",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "tesourariaCarbono",
          "type": "address"
        }
      ],
      "name": "ContratosAtualizados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idAposentadoria",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "comprador",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "idCertificado",
          "type": "uint256"
        }
      ],
      "name": "CreditosAposentados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "novaTaxa",
          "type": "uint256"
        }
      ],
      "name": "TaxaAposentadoriaAlterada",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "novaTaxa",
          "type": "uint256"
        }
      ],
      "name": "alterarTaxaAposentadoria",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idAposentadoria",
          "type": "uint256"
        }
      ],
      "name": "aposentadoriaExiste",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "aposentadorias",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "idAposentadoria",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "comprador",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "motivo",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriRelatorio",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "dataAposentadoria",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "idCertificado",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idLote",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "motivo",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriRelatorio",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriCertificado",
          "type": "string"
        }
      ],
      "name": "aposentarCreditos",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoRegistroOrganizacoes",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoCreditoCarbonoToken",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoCertificadoCompensacaoNFT",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoTesourariaCarbono",
          "type": "address"
        }
      ],
      "name": "atualizarContratos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "certificadoCompensacaoNFT",
      "outputs": [
        {
          "internalType": "contract ICertificadoCompensacaoNFTAposentadoria",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "creditoCarbonoToken",
      "outputs": [
        {
          "internalType": "contract ICreditoCarbonoTokenAposentadoria",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "registroOrganizacoes",
      "outputs": [
        {
          "internalType": "contract IRegistroOrganizacoesAposentadoria",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "taxaAposentadoria",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tesourariaCarbono",
      "outputs": [
        {
          "internalType": "contract ITesourariaCarbonoAposentadoria",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "totalAposentadoPorLote",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalAposentadorias",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "totalCompensadoPorComprador",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "RegistroOrganizacoes": [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "ativa",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "dataAtualizacao",
          "type": "uint256"
        }
      ],
      "name": "EstadoOrganizacaoAlterado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "nome",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "enum RegistroOrganizacoes.TipoOrganizacao",
          "name": "tipoOrganizacao",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "dataAtualizacao",
          "type": "uint256"
        }
      ],
      "name": "OrganizacaoAtualizada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "nome",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "enum RegistroOrganizacoes.TipoOrganizacao",
          "name": "tipoOrganizacao",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "dataCadastro",
          "type": "uint256"
        }
      ],
      "name": "OrganizacaoCadastrada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ativarOrganizacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "nome",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "documento",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriDocumentos",
          "type": "string"
        },
        {
          "internalType": "enum RegistroOrganizacoes.TipoOrganizacao",
          "name": "tipoOrganizacao",
          "type": "uint8"
        }
      ],
      "name": "atualizarOrganizacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "nome",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "documento",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriDocumentos",
          "type": "string"
        },
        {
          "internalType": "enum RegistroOrganizacoes.TipoOrganizacao",
          "name": "tipoOrganizacao",
          "type": "uint8"
        }
      ],
      "name": "cadastrarOrganizacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "carteirasCadastradas",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "desativarOrganizacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehAdministrador",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehComprador",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehProponente",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehValidador",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "indice",
          "type": "uint256"
        }
      ],
      "name": "obterCarteiraPorIndice",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "obterTipoOrganizacao",
      "outputs": [
        {
          "internalType": "enum RegistroOrganizacoes.TipoOrganizacao",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "organizacaoAtiva",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "organizacaoCadastrada",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "organizacoes",
      "outputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "nome",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "documento",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "uriDocumentos",
          "type": "string"
        },
        {
          "internalType": "enum RegistroOrganizacoes.TipoOrganizacao",
          "name": "tipoOrganizacao",
          "type": "uint8"
        },
        {
          "internalType": "bool",
          "name": "ativa",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "dataCadastro",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "dataAtualizacao",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "quantidadeCarteirasCadastradas",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalOrganizacoes",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "IRegistroOrganizacoes": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehProponente",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "ITesourariaCarbono": [
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "origem",
          "type": "string"
        }
      ],
      "name": "receberTaxaETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
  ],
  "RegistroProjetosCarbono": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoRegistroOrganizacoes",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoTesourariaCarbono",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "ContratoAutorizado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "enum RegistroProjetosCarbono.EstadoProjeto",
          "name": "estadoProjeto",
          "type": "uint8"
        }
      ],
      "name": "EstadoProjetoAlterado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "novoPrazo",
          "type": "uint256"
        }
      ],
      "name": "PrazoReenvioProjetoAlterado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "proponente",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "hashProjeto",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "creditosSolicitados",
          "type": "uint256"
        }
      ],
      "name": "ProjetoCadastrado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "proponente",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "creditosSolicitados",
          "type": "uint256"
        }
      ],
      "name": "ProjetoReenviado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "aprovado",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "creditosAprovados",
          "type": "uint256"
        }
      ],
      "name": "ResultadoValidacaoRegistrado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "novaTaxa",
          "type": "uint256"
        }
      ],
      "name": "TaxaSubmissaoProjetoAlterada",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "novoPrazo",
          "type": "uint256"
        }
      ],
      "name": "alterarPrazoReenvioProjeto",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "novaTaxa",
          "type": "uint256"
        }
      ],
      "name": "alterarTaxaSubmissaoProjeto",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "autorizarContrato",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "nomeProjeto",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "localizacao",
          "type": "string"
        },
        {
          "internalType": "enum RegistroProjetosCarbono.TipoProjeto",
          "name": "tipoProjeto",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "creditosSolicitados",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "uriEvidencias",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "inicioPeriodoReferencia",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "fimPeriodoReferencia",
          "type": "uint256"
        }
      ],
      "name": "cadastrarProjeto",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "contratosAutorizados",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "marcarCreditosEmitidos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "marcarEmVotacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "obterCreditosAprovados",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "obterCreditosSolicitados",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "obterEstadoProjeto",
      "outputs": [
        {
          "internalType": "enum RegistroProjetosCarbono.EstadoProjeto",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "obterProponente",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "prazoReenvioProjeto",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "projetoAprovado",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "projetoEmitido",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "name": "projetoJaCadastrado",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "projetos",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "proponente",
          "type": "address"
        },
        {
          "internalType": "string",
          "name": "nomeProjeto",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "descricao",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "localizacao",
          "type": "string"
        },
        {
          "internalType": "enum RegistroProjetosCarbono.TipoProjeto",
          "name": "tipoProjeto",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "creditosSolicitados",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "creditosAprovados",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "uriEvidencias",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "hashProjeto",
          "type": "bytes32"
        },
        {
          "internalType": "enum RegistroProjetosCarbono.EstadoProjeto",
          "name": "estadoProjeto",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "inicioPeriodoReferencia",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "fimPeriodoReferencia",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "dataSubmissao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "dataUltimaRejeicao",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "novaDescricao",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "novosCreditosSolicitados",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "novaUriEvidencias",
          "type": "string"
        }
      ],
      "name": "reenviarProjeto",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "aprovado",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "creditosAprovados",
          "type": "uint256"
        }
      ],
      "name": "registrarResultadoValidacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "registroOrganizacoes",
      "outputs": [
        {
          "internalType": "contract IRegistroOrganizacoes",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "revogarProjeto",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "suspenderProjeto",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "taxaSubmissaoProjeto",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tesourariaCarbono",
      "outputs": [
        {
          "internalType": "contract ITesourariaCarbono",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalProjetos",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "ITesourariaCarbonoStaking": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "finalidade",
          "type": "string"
        }
      ],
      "name": "enviarTICAutorizado",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "StakingCarbono": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoTokenImpactoCarbono",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoTesourariaCarbono",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "tokenImpactoCarbono",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "address",
          "name": "tesourariaCarbono",
          "type": "address"
        }
      ],
      "name": "ContratosAtualizados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "stakeMinimoValidador",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "periodoMinimoBloqueio",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "taxaRecompensaAnualBps",
          "type": "uint256"
        }
      ],
      "name": "ParametrosStakingAlterados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "participante",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "RecompensaResgatada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "participante",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "novoSaldo",
          "type": "uint256"
        }
      ],
      "name": "StakeDepositado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "participante",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "saldoRestante",
          "type": "uint256"
        }
      ],
      "name": "StakeSacado",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "BASE_BPS",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "novoStakeMinimoValidador",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "novoPeriodoMinimoBloqueio",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "novaTaxaRecompensaAnualBps",
          "type": "uint256"
        }
      ],
      "name": "alterarParametrosStaking",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoTokenImpactoCarbono",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoTesourariaCarbono",
          "type": "address"
        }
      ],
      "name": "atualizarContratos",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "participante",
          "type": "address"
        }
      ],
      "name": "calcularRecompensaPendente",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "dataInicioStake",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "dataUltimoCalculo",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "depositarStake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "periodoMinimoBloqueio",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "participante",
          "type": "address"
        }
      ],
      "name": "possuiStakeMinimoValidador",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "recompensasAcumuladas",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "resgatarRecompensa",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "sacarStake",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "saldoEmStake",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "stakeMinimoValidador",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "taxaRecompensaAnualBps",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tesourariaCarbono",
      "outputs": [
        {
          "internalType": "contract ITesourariaCarbonoStaking",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenImpactoCarbono",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalEmStake",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "TesourariaCarbono": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoTokenImpactoCarbono",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ReentrancyGuardReentrantCall",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "ContratoAutorizado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "valor",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "finalidade",
          "type": "string"
        }
      ],
      "name": "ETHEnviado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "remetente",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "valor",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "origem",
          "type": "string"
        }
      ],
      "name": "ETHRecebido",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "finalidade",
          "type": "string"
        }
      ],
      "name": "TICEnviado",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "remetente",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "origem",
          "type": "string"
        }
      ],
      "name": "TICRecebido",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "novoToken",
          "type": "address"
        }
      ],
      "name": "TokenImpactoCarbonoAtualizado",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "novoToken",
          "type": "address"
        }
      ],
      "name": "atualizarTokenImpactoCarbono",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "contrato",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "autorizado",
          "type": "bool"
        }
      ],
      "name": "autorizarContrato",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "contratosAutorizados",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "origem",
          "type": "string"
        }
      ],
      "name": "depositarTIC",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "destinatario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "valor",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "finalidade",
          "type": "string"
        }
      ],
      "name": "enviarETH",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "destinatario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "valor",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "finalidade",
          "type": "string"
        }
      ],
      "name": "enviarETHAutorizado",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "finalidade",
          "type": "string"
        }
      ],
      "name": "enviarTIC",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "finalidade",
          "type": "string"
        }
      ],
      "name": "enviarTICAutorizado",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "origem",
          "type": "string"
        }
      ],
      "name": "receberTaxaETH",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "saldoETH",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "saldoTIC",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "tokenImpactoCarbono",
      "outputs": [
        {
          "internalType": "contract IERC20",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalETHEnviado",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalETHRecebido",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalTICEnviado",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalTICRecebido",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "stateMutability": "payable",
      "type": "receive"
    }
  ],
  "TokenImpactoCarbono": [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "suprimentoInicial",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "allowance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientAllowance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "balance",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "needed",
          "type": "uint256"
        }
      ],
      "name": "ERC20InsufficientBalance",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "approver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidApprover",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "receiver",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidReceiver",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "ERC20InvalidSpender",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Approval",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "Transfer",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        }
      ],
      "name": "allowance",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "spender",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "approve",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "balanceOf",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "decimals",
      "outputs": [
        {
          "internalType": "uint8",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "destinatario",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "quantidade",
          "type": "uint256"
        }
      ],
      "name": "emitirTokens",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "name",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "symbol",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalSupply",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transfer",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        }
      ],
      "name": "transferFrom",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "IRegistroOrganizacoesValidacao": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "ehValidador",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "IRegistroProjetosCarbonoValidacao": [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "marcarEmVotacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "obterCreditosSolicitados",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "aprovado",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "creditosAprovados",
          "type": "uint256"
        }
      ],
      "name": "registrarResultadoValidacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "IStakingCarbonoValidacao": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "participante",
          "type": "address"
        }
      ],
      "name": "saldoEmStake",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "ValidacaoProjetos": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoRegistroOrganizacoes",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "enderecoRegistroProjetosCarbono",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "enderecoStaking",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "exigirStakeMinimo",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "stakeMinimoValidador",
          "type": "uint256"
        }
      ],
      "name": "ConfiguracaoStakeAlterada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "prazoVotacao",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "quorumMinimo",
          "type": "uint256"
        }
      ],
      "name": "ParametrosVotacaoAlterados",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "bool",
          "name": "aprovado",
          "type": "bool"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "creditosAprovados",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "votosAprovacao",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "votosRejeicao",
          "type": "uint256"
        }
      ],
      "name": "VotacaoEncerrada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "iniciador",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "inicioVotacao",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "fimVotacao",
          "type": "uint256"
        }
      ],
      "name": "VotacaoIniciada",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "validador",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum ValidacaoProjetos.Voto",
          "name": "voto",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "creditosSugeridos",
          "type": "uint256"
        }
      ],
      "name": "VotoRegistrado",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "novoPrazoVotacao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "novoQuorumMinimo",
          "type": "uint256"
        }
      ],
      "name": "alterarParametrosVotacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "enderecoStaking",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "exigirStake",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "novoStakeMinimo",
          "type": "uint256"
        }
      ],
      "name": "configurarStakeValidador",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "encerrarVotacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "exigirStakeMinimo",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "iniciarVotacao",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "jaVotou",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "prazoVotacao",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "quorumMinimo",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "registroOrganizacoes",
      "outputs": [
        {
          "internalType": "contract IRegistroOrganizacoesValidacao",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "registroProjetosCarbono",
      "outputs": [
        {
          "internalType": "contract IRegistroProjetosCarbonoValidacao",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "stakeMinimoValidador",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "stakingCarbono",
      "outputs": [
        {
          "internalType": "contract IStakingCarbonoValidacao",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "totalVotos",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "carteira",
          "type": "address"
        }
      ],
      "name": "validadorApto",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        }
      ],
      "name": "votacaoAberta",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "votacoes",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "inicioVotacao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "fimVotacao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "votosAprovacao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "votosRejeicao",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "somaCreditosSugeridos",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "quantidadeSugestoes",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "encerrada",
          "type": "bool"
        },
        {
          "internalType": "bool",
          "name": "aprovado",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "creditosAprovados",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "idProjeto",
          "type": "uint256"
        },
        {
          "internalType": "enum ValidacaoProjetos.Voto",
          "name": "voto",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "creditosSugeridos",
          "type": "uint256"
        }
      ],
      "name": "votarProjeto",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "votos",
      "outputs": [
        {
          "internalType": "enum ValidacaoProjetos.Voto",
          "name": "",
          "type": "uint8"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
} as const;

export type SupportedChainId = keyof typeof DEPLOYMENTS;
export type ContractName = keyof typeof ABIS;
