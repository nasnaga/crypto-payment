// Validation utilities

import { PublicKey } from '@solana/web3.js';

export function isValidSolanaAddress(address) {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function isValidEthereumAddress(address) {
  // Basic Ethereum address validation
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidBitcoinAddress(address) {
  // Basic Bitcoin address validation (supports P2PKH, P2SH, Bech32)
  return (
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || // Legacy (P2PKH, P2SH)
    /^bc1[a-z0-9]{39,59}$/.test(address) // Bech32 (SegWit)
  );
}

export function validateAmount(amount, decimals = 18) {
  if (!amount || isNaN(amount)) return false;
  const num = parseFloat(amount);
  if (num <= 0) return false;

  // Check decimal places
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  return decimalPlaces <= decimals;
}

export function validateAddress(address, network) {
  switch (network) {
    case 'SOL':
      return isValidSolanaAddress(address);
    case 'ETH':
      return isValidEthereumAddress(address);
    case 'BTC':
      return isValidBitcoinAddress(address);
    case 'USDC':
      // USDC can be on multiple networks, try both
      return isValidSolanaAddress(address) || isValidEthereumAddress(address);
    default:
      return false;
  }
}

export function sanitizeInput(input) {
  return input.trim().replace(/[^\w\s.-]/gi, '');
}
