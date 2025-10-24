// SPL Token Service - Handle all SPL token operations on Solana
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount
} from '@solana/spl-token';
import { NETWORK_CONFIG, ACTIVE_NETWORKS, SPL_TOKENS } from '../config.js';

class SPLTokenService {
  constructor() {
    this.connection = null;
  }

  // Initialize Solana connection
  initConnection() {
    if (!this.connection) {
      const endpoint = NETWORK_CONFIG.solana[ACTIVE_NETWORKS.solana];
      this.connection = new Connection(endpoint, 'confirmed');
    }
    return this.connection;
  }

  // Get token balance for a specific mint
  async getTokenBalance(walletAddress, mintAddress) {
    try {
      const connection = this.initConnection();
      const walletPubkey = new PublicKey(walletAddress);
      const mintPubkey = new PublicKey(mintAddress);

      // Get associated token account
      const tokenAccount = await getAssociatedTokenAddress(mintPubkey, walletPubkey);

      try {
        // Get account info
        const accountInfo = await getAccount(connection, tokenAccount);
        const balance = Number(accountInfo.amount);

        // Find token decimals
        let decimals = 6; // default
        for (const token of Object.values(SPL_TOKENS)) {
          if (token.mint === mintAddress) {
            decimals = token.decimals;
            break;
          }
        }

        return balance / Math.pow(10, decimals);
      } catch (error) {
        // Token account doesn't exist - balance is 0
        return 0;
      }
    } catch (error) {
      console.error('Error fetching SPL token balance:', error);
      return 0;
    }
  }

  // Transfer SPL tokens
  async transferToken(provider, mintAddress, recipientAddress, amount, decimals) {
    try {
      const connection = this.initConnection();
      const mintPubkey = new PublicKey(mintAddress);
      const fromPubkey = provider.publicKey;
      const toPubkey = new PublicKey(recipientAddress);

      // Convert amount to token units
      const tokenAmount = Math.floor(parseFloat(amount) * Math.pow(10, decimals));

      // Get associated token accounts
      const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
      const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

      // Create transaction
      const transaction = new Transaction({
        feePayer: fromPubkey,
        blockhash: blockhash,
        lastValidBlockHeight: lastValidBlockHeight,
      });

      // Check if recipient token account exists
      try {
        await getAccount(connection, toTokenAccount);
      } catch (error) {
        // Token account doesn't exist, need to create it
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          fromPubkey,
          toTokenAccount,
          toPubkey,
          mintPubkey
        );
        transaction.add(createATAInstruction);
      }

      // Add transfer instruction
      const transferInstruction = createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        tokenAmount
      );
      transaction.add(transferInstruction);

      // Request Phantom to sign and send
      const { signature } = await provider.signAndSendTransaction(transaction);

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed');

      return signature;
    } catch (error) {
      console.error('Error transferring SPL token:', error);
      throw error;
    }
  }

  // Get all token balances for a wallet
  async getAllTokenBalances(walletAddress) {
    const balances = {};

    for (const [symbol, tokenInfo] of Object.entries(SPL_TOKENS)) {
      const balance = await this.getTokenBalance(walletAddress, tokenInfo.mint);
      balances[symbol] = balance;
    }

    return balances;
  }
}

// Export singleton instance
export const splTokenService = new SPLTokenService();
