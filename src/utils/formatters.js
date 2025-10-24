// Formatting utilities

export function formatAddress(address, chars = 4) {
  if (!address) return 'Not Connected';
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

export function formatNumber(number, decimals = 6) {
  if (number === null || number === undefined) return '0';
  const num = parseFloat(number);
  if (isNaN(num)) return '0';

  // Format with commas and limit decimals
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(amount, currency = 'USD', decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
}

// Convert lamports to SOL
export function lamportsToSol(lamports) {
  return lamports / 1000000000;
}

// Convert SOL to lamports
export function solToLamports(sol) {
  return Math.floor(sol * 1000000000);
}

// Convert wei to ETH
export function weiToEth(wei) {
  return Number(wei) / 1e18;
}

// Convert ETH to wei
export function ethToWei(eth) {
  return Math.floor(eth * 1e18);
}

// Convert satoshis to BTC
export function satoshisToBtc(satoshis) {
  return satoshis / 100000000;
}

// Convert BTC to satoshis
export function btcToSatoshis(btc) {
  return Math.floor(btc * 100000000);
}

// Convert token amount based on decimals
export function tokenToSmallestUnit(amount, decimals) {
  return Math.floor(amount * Math.pow(10, decimals));
}

// Convert smallest unit to token amount
export function smallestUnitToToken(amount, decimals) {
  return Number(amount) / Math.pow(10, decimals);
}
