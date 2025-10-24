// Network and RPC Configuration
export const NETWORK_CONFIG = {
  solana: {
    mainnet: 'https://api.mainnet-beta.solana.com',
    devnet: 'https://api.devnet.solana.com',
    testnet: 'https://api.testnet.solana.com',
  },
  ethereum: {
    mainnet: 'https://eth.llamarpc.com',
    goerli: 'https://goerli.infura.io/v3',
  },
  polygon: {
    mainnet: 'https://polygon-rpc.com',
    mumbai: 'https://rpc-mumbai.maticvigil.com',
  },
  base: {
    mainnet: 'https://mainnet.base.org',
    goerli: 'https://goerli.base.org',
  },
  bitcoin: {
    mainnet: 'https://blockstream.info/api',
  },
};

// Current active networks
export const ACTIVE_NETWORKS = {
  solana: 'mainnet',
  ethereum: 'mainnet',
  polygon: 'mainnet',
  base: 'mainnet',
  bitcoin: 'mainnet',
};

// Token configurations
export const TOKENS = {
  sol: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    network: 'solana',
  },
  eth: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    network: 'ethereum',
  },
  btc: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    network: 'bitcoin',
  },
  usdc_sol: {
    name: 'USD Coin (Solana)',
    symbol: 'USDC',
    decimals: 6,
    network: 'solana',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Mainnet USDC
  },
  usdc_eth: {
    name: 'USD Coin (Ethereum)',
    symbol: 'USDC',
    decimals: 6,
    network: 'ethereum',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Mainnet USDC
  },
};

// Popular SPL tokens on Solana
export const SPL_TOKENS = {
  USDC: {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  USDT: {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
  },
  BONK: {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    name: 'Bonk',
    symbol: 'BONK',
    decimals: 5,
  },
  RAY: {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    name: 'Raydium',
    symbol: 'RAY',
    decimals: 6,
  },
  ORCA: {
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    name: 'Orca',
    symbol: 'ORCA',
    decimals: 6,
  },
  JUP: {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    name: 'Jupiter',
    symbol: 'JUP',
    decimals: 6,
  },
};

// Popular ERC-20 tokens
export const ERC20_TOKENS = {
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
  },
  DAI: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
  },
  LINK: {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    name: 'Chainlink',
    symbol: 'LINK',
    decimals: 18,
  },
  UNI: {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    name: 'Uniswap',
    symbol: 'UNI',
    decimals: 18,
  },
};

// Block explorers
export const EXPLORERS = {
  solana: {
    mainnet: 'https://solscan.io',
    devnet: 'https://solscan.io/?cluster=devnet',
    testnet: 'https://solscan.io/?cluster=testnet',
  },
  ethereum: {
    mainnet: 'https://etherscan.io',
    goerli: 'https://goerli.etherscan.io',
  },
  polygon: {
    mainnet: 'https://polygonscan.com',
    mumbai: 'https://mumbai.polygonscan.com',
  },
  base: {
    mainnet: 'https://basescan.org',
    goerli: 'https://goerli.basescan.org',
  },
  bitcoin: {
    mainnet: 'https://blockchair.com/bitcoin',
  },
};

// Cache TTL (in milliseconds)
export const CACHE_TTL = {
  balance: 30000, // 30 seconds
  tokenMetadata: 300000, // 5 minutes
  gasPrice: 15000, // 15 seconds
};
