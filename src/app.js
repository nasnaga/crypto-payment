// Phantom Wallet Integration - Multi-chain Support
import { balanceService } from './services/balanceService.js';
import { splTokenService } from './services/splTokenService.js';
import { erc20TokenService } from './services/erc20TokenService.js';
import { feeService } from './services/feeService.js';
import { transactionHistoryService } from './services/transactionHistoryService.js';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { NETWORK_CONFIG, ACTIVE_NETWORKS, TOKENS, SPL_TOKENS, ERC20_TOKENS, EXPLORERS } from './config.js';

class CryptoPaymentApp {
    constructor() {
        this.solanaProvider = null;
        this.ethereumProvider = null;
        this.bitcoinProvider = null;
        this.walletAddresses = {
            SOL: null,
            ETH: null,
            POLYGON: null,
            BASE: null,
            BTC: null
        };
        this.currentNetwork = 'SOL';
        this.selectedSPLToken = null;
        this.selectedERC20Token = null;
        this.selectedFeeSpeed = 'medium';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkPhantomWallet();
        this.initDarkMode();
    }

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('sendPayment').addEventListener('click', () => this.sendPayment());
        document.getElementById('currency').addEventListener('change', (e) => this.onCurrencyChange(e));
        document.getElementById('splToken').addEventListener('change', (e) => this.onSPLTokenChange(e));
        document.getElementById('erc20Token').addEventListener('change', (e) => this.onERC20TokenChange(e));
        document.getElementById('feeSpeed').addEventListener('change', (e) => this.onFeeSpeedChange(e));

        // Transaction history event listeners
        document.getElementById('historyNetworkFilter').addEventListener('change', (e) => this.filterTransactions());
        document.getElementById('historyStatusFilter').addEventListener('change', (e) => this.filterTransactions());
        document.getElementById('clearHistory').addEventListener('click', () => this.clearTransactionHistory());

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => this.toggleDarkMode());
    }

    checkPhantomWallet() {
        // Check for Phantom's multi-chain support
        if (window.phantom) {
            console.log('Phantom wallet detected');

            // Solana provider
            if (window.phantom.solana && window.phantom.solana.isPhantom) {
                this.solanaProvider = window.phantom.solana;
                console.log('Solana provider available');
            }

            // Ethereum provider
            if (window.phantom.ethereum && window.phantom.ethereum.isPhantom) {
                this.ethereumProvider = window.phantom.ethereum;
                console.log('Ethereum provider available');
            }

            // Bitcoin provider
            if (window.phantom.bitcoin && window.phantom.bitcoin.isPhantom) {
                this.bitcoinProvider = window.phantom.bitcoin;
                console.log('Bitcoin provider available');
            }

            // Fallback to window.solana for older Phantom versions
            if (!this.solanaProvider && window.solana && window.solana.isPhantom) {
                this.solanaProvider = window.solana;
                console.log('Using legacy Solana provider');
            }

            // Check if already connected
            if (this.solanaProvider && this.solanaProvider.isConnected) {
                this.handleWalletConnected('SOL');
            }
        } else if (window.solana && window.solana.isPhantom) {
            // Fallback for older Phantom versions
            this.solanaProvider = window.solana;
            console.log('Using legacy Phantom wallet');

            if (this.solanaProvider.isConnected) {
                this.handleWalletConnected('SOL');
            }
        } else {
            this.showStatus('error', 'Phantom wallet not found. Please install Phantom wallet extension.');
        }
    }

    async connectWallet() {
        try {
            if (!this.solanaProvider && !this.ethereumProvider && !this.bitcoinProvider) {
                alert('Please install Phantom wallet extension!');
                window.open('https://phantom.app/', '_blank');
                return;
            }

            const connectBtn = document.getElementById('connectWallet');
            connectBtn.disabled = true;
            connectBtn.textContent = 'Connecting...';

            // Try to connect all available providers
            const connectionPromises = [];

            if (this.solanaProvider) {
                connectionPromises.push(
                    this.solanaProvider.connect().then(response => ({
                        network: 'SOL',
                        address: response.publicKey.toString()
                    }))
                );
            }

            if (this.ethereumProvider) {
                connectionPromises.push(
                    this.ethereumProvider.request({ method: 'eth_requestAccounts' })
                        .then(accounts => ({
                            network: 'ETH',
                            address: accounts[0]
                        }))
                );
            }

            if (this.bitcoinProvider) {
                connectionPromises.push(
                    this.bitcoinProvider.requestAccounts().then(accounts => ({
                        network: 'BTC',
                        address: accounts[0].address
                    }))
                );
            }

            // Connect to all available networks
            const results = await Promise.allSettled(connectionPromises);

            // Store all successful connections
            let hasConnection = false;
            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { network, address } = result.value;
                    this.walletAddresses[network] = address;

                    // EVM chains share the same address
                    if (network === 'ETH') {
                        this.walletAddresses.POLYGON = address;
                        this.walletAddresses.BASE = address;
                    }

                    if (!hasConnection) {
                        this.currentNetwork = network;
                        hasConnection = true;
                    }
                }
            });

            if (hasConnection) {
                this.handleWalletConnected(this.currentNetwork);
            } else {
                throw new Error('Failed to connect to any network');
            }

        } catch (error) {
            console.error('Connection error:', error);
            this.showStatus('error', 'Failed to connect wallet: ' + error.message);

            const connectBtn = document.getElementById('connectWallet');
            connectBtn.disabled = false;
            connectBtn.textContent = 'Connect Phantom Wallet';
        }
    }

    handleWalletConnected(network) {
        // Update UI
        const walletStatus = document.getElementById('walletStatus');
        const walletAddress = document.getElementById('walletAddress');
        const connectBtn = document.getElementById('connectWallet');
        const paymentForm = document.getElementById('paymentForm');

        walletStatus.classList.remove('status-disconnected');
        walletStatus.classList.add('status-connected');

        const currentAddress = this.walletAddresses[this.currentNetwork];
        walletAddress.textContent = this.formatAddress(currentAddress);
        connectBtn.textContent = 'Connected';
        connectBtn.disabled = true;

        paymentForm.style.display = 'block';

        this.getBalance();
        this.loadTransactionHistory();
    }

    handleWalletDisconnected() {
        this.walletAddresses = {
            SOL: null,
            ETH: null,
            BTC: null
        };

        const walletStatus = document.getElementById('walletStatus');
        const walletAddress = document.getElementById('walletAddress');
        const connectBtn = document.getElementById('connectWallet');
        const paymentForm = document.getElementById('paymentForm');

        walletStatus.classList.remove('status-connected');
        walletStatus.classList.add('status-disconnected');

        walletAddress.textContent = 'Not Connected';
        connectBtn.textContent = 'Connect Phantom Wallet';
        connectBtn.disabled = false;

        paymentForm.style.display = 'none';
    }

    formatAddress(address) {
        if (!address) return 'Not Connected';
        return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
    }

    async getBalance() {
        try {
            const currency = document.getElementById('currency').value;
            const balanceInfo = document.getElementById('balanceInfo');
            const balanceElement = document.getElementById('balance');
            const balanceCurrency = document.getElementById('balanceCurrency');

            balanceInfo.style.display = 'block';
            balanceElement.textContent = 'Loading...';
            balanceCurrency.textContent = currency;

            // Get the appropriate wallet address for the currency
            let address = null;
            let network = null;

            switch (currency) {
                case 'SOL':
                    address = this.walletAddresses.SOL;
                    break;
                case 'ETH':
                    address = this.walletAddresses.ETH;
                    break;
                case 'BTC':
                    address = this.walletAddresses.BTC;
                    break;
                case 'USDC':
                    // USDC defaults to Solana, but check if we have Solana wallet
                    address = this.walletAddresses.SOL || this.walletAddresses.ETH;
                    network = this.walletAddresses.SOL ? 'solana' : 'ethereum';
                    break;
            }

            if (!address) {
                balanceElement.textContent = '0.00';
                return;
            }

            // Fetch balance using balanceService
            const balance = await balanceService.getBalance(address, currency, network);

            if (balance !== null) {
                // Format balance to 6 decimal places
                balanceElement.textContent = balance.toFixed(6);
            } else {
                balanceElement.textContent = 'Error';
            }

        } catch (error) {
            console.error('Error fetching balance:', error);
            const balanceElement = document.getElementById('balance');
            balanceElement.textContent = 'Error';
        }
    }

    onCurrencyChange(event) {
        const currency = event.target.value;
        document.getElementById('currencySymbol').textContent = currency;

        // Show/hide token selectors based on currency
        const splTokenSection = document.getElementById('splTokenSection');
        const erc20TokenSection = document.getElementById('erc20TokenSection');
        const feeCustomization = document.getElementById('feeCustomization');

        if (currency === 'SOL') {
            splTokenSection.style.display = 'block';
            erc20TokenSection.style.display = 'none';
            feeCustomization.style.display = 'block';
            this.currentNetwork = 'SOL';
        } else if (currency === 'ETH' || currency === 'POLYGON' || currency === 'BASE') {
            splTokenSection.style.display = 'none';
            erc20TokenSection.style.display = 'block';
            feeCustomization.style.display = 'block';
            this.currentNetwork = currency;
        } else {
            splTokenSection.style.display = 'none';
            erc20TokenSection.style.display = 'none';
            feeCustomization.style.display = 'none';
            this.currentNetwork = currency;
        }

        // Reset token selections
        this.selectedSPLToken = null;
        this.selectedERC20Token = null;
        document.getElementById('splToken').value = '';
        document.getElementById('erc20Token').value = '';

        // Update wallet address display
        const walletAddress = document.getElementById('walletAddress');
        const currentAddress = this.walletAddresses[this.currentNetwork];
        if (currentAddress) {
            walletAddress.textContent = this.formatAddress(currentAddress);
        }

        this.getBalance();
        this.updateFeeEstimate();
    }

    onSPLTokenChange(event) {
        const tokenSymbol = event.target.value;
        this.selectedSPLToken = tokenSymbol ? SPL_TOKENS[tokenSymbol] : null;

        if (this.selectedSPLToken) {
            document.getElementById('currencySymbol').textContent = tokenSymbol;
            this.getSPLTokenBalance();
        } else {
            document.getElementById('currencySymbol').textContent = 'SOL';
            this.getBalance();
        }
    }

    onERC20TokenChange(event) {
        const tokenSymbol = event.target.value;
        this.selectedERC20Token = tokenSymbol;

        if (this.selectedERC20Token) {
            document.getElementById('currencySymbol').textContent = tokenSymbol;
            this.getERC20TokenBalance();
        } else {
            document.getElementById('currencySymbol').textContent = 'ETH';
            this.getBalance();
        }
    }

    async getSPLTokenBalance() {
        try {
            const balanceInfo = document.getElementById('balanceInfo');
            const balanceElement = document.getElementById('balance');
            const balanceCurrency = document.getElementById('balanceCurrency');

            balanceInfo.style.display = 'block';
            balanceElement.textContent = 'Loading...';

            if (!this.selectedSPLToken) {
                balanceElement.textContent = '0.00';
                return;
            }

            const address = this.walletAddresses.SOL;
            if (!address) {
                balanceElement.textContent = '0.00';
                return;
            }

            const balance = await splTokenService.getTokenBalance(address, this.selectedSPLToken.mint);
            balanceElement.textContent = balance.toFixed(6);
            balanceCurrency.textContent = this.selectedSPLToken.symbol;

        } catch (error) {
            console.error('Error fetching SPL token balance:', error);
            document.getElementById('balance').textContent = 'Error';
        }
    }

    async getERC20TokenBalance() {
        try {
            const balanceInfo = document.getElementById('balanceInfo');
            const balanceElement = document.getElementById('balance');
            const balanceCurrency = document.getElementById('balanceCurrency');

            balanceInfo.style.display = 'block';
            balanceElement.textContent = 'Loading...';

            if (!this.selectedERC20Token) {
                balanceElement.textContent = '0.00';
                return;
            }

            const address = this.walletAddresses.ETH;
            if (!address) {
                balanceElement.textContent = '0.00';
                return;
            }

            const tokenInfo = ERC20_TOKENS[this.selectedERC20Token];
            const balance = await erc20TokenService.getTokenBalance(
                address,
                tokenInfo.address,
                tokenInfo.decimals
            );

            balanceElement.textContent = balance.toFixed(6);
            balanceCurrency.textContent = tokenInfo.symbol;

        } catch (error) {
            console.error('Error fetching ERC-20 token balance:', error);
            document.getElementById('balance').textContent = 'Error';
        }
    }

    onFeeSpeedChange(event) {
        this.selectedFeeSpeed = event.target.value;
        this.updateFeeEstimate();
    }

    async updateFeeEstimate() {
        try {
            const feeAmount = document.getElementById('feeAmount');

            if (this.currentNetwork === 'ETH') {
                // Ethereum fee estimation
                const gasPrices = await feeService.getEthereumGasPrices();
                const speedInfo = gasPrices[this.selectedFeeSpeed];
                feeAmount.textContent = `~${speedInfo.gwei} Gwei (${speedInfo.estimatedTime})`;
            } else if (this.currentNetwork === 'SOL') {
                // Solana fee estimation
                const feeInfo = await feeService.estimateSolanaFee(this.selectedFeeSpeed);
                feeAmount.textContent = `~${feeInfo.totalFee.toFixed(6)} SOL`;
            } else {
                feeAmount.textContent = 'Fee estimation not available';
            }
        } catch (error) {
            console.error('Error updating fee estimate:', error);
            document.getElementById('feeAmount').textContent = 'Error estimating fee';
        }
    }

    async sendPayment() {
        try {
            const currency = document.getElementById('currency').value;
            const amount = document.getElementById('amount').value;
            const recipient = document.getElementById('recipientAddress').value;

            // Validation
            if (!amount || parseFloat(amount) <= 0) {
                this.showStatus('error', 'Please enter a valid amount');
                return;
            }

            if (!recipient) {
                this.showStatus('error', 'Please enter a recipient address');
                return;
            }

            const sendBtn = document.getElementById('sendPayment');
            sendBtn.disabled = true;
            sendBtn.textContent = 'Processing...';

            this.showStatus('pending', 'Preparing transaction...');

            // Handle different currencies and tokens
            let txHash;

            // Check if an SPL token is selected
            if (currency === 'SOL' && this.selectedSPLToken) {
                txHash = await splTokenService.transferToken(
                    this.solanaProvider,
                    this.selectedSPLToken.mint,
                    recipient,
                    amount,
                    this.selectedSPLToken.decimals
                );
            }
            // Check if an ERC-20 token is selected
            else if (currency === 'ETH' && this.selectedERC20Token) {
                const tokenInfo = ERC20_TOKENS[this.selectedERC20Token];
                txHash = await erc20TokenService.transferToken(
                    this.ethereumProvider,
                    tokenInfo.address,
                    recipient,
                    amount,
                    tokenInfo.decimals
                );
            }
            // Handle native currencies
            else {
                switch (currency) {
                    case 'SOL':
                        txHash = await this.sendSolana(recipient, amount);
                        break;
                    case 'ETH':
                    case 'POLYGON':
                    case 'BASE':
                        txHash = await this.sendEthereum(recipient, amount);
                        break;
                    case 'BTC':
                        txHash = await this.sendBitcoin(recipient, amount);
                        break;
                    default:
                        throw new Error('Unsupported currency');
                }
            }

            this.showStatus('success', 'Payment sent successfully!', txHash);

            // Save transaction to history
            await this.saveTransactionToHistory({
                txHash,
                amount,
                currency: this.selectedSPLToken?.symbol || this.selectedERC20Token || currency,
                recipient,
                sender: this.walletAddresses[this.currentNetwork],
                network: this.currentNetwork,
                status: 'confirmed',
            });

            // Clear form
            document.getElementById('amount').value = '';
            document.getElementById('recipientAddress').value = '';

            // Update balance
            if (this.selectedSPLToken) {
                this.getSPLTokenBalance();
            } else if (this.selectedERC20Token) {
                this.getERC20TokenBalance();
            } else {
                this.getBalance();
            }

            // Reload transaction history
            this.loadTransactionHistory();

            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Payment';

        } catch (error) {
            console.error('Payment error:', error);
            this.showStatus('error', 'Payment failed: ' + error.message);

            const sendBtn = document.getElementById('sendPayment');
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Payment';
        }
    }

    async sendSolana(recipient, amount) {
        if (!this.solanaProvider) {
            throw new Error('Solana wallet not connected');
        }

        try {
            // Create Solana connection
            const endpoint = NETWORK_CONFIG.solana[ACTIVE_NETWORKS.solana];
            const connection = new Connection(endpoint, 'confirmed');

            // Convert amount to lamports (1 SOL = 1,000,000,000 lamports)
            const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);

            // Get sender's public key
            const fromPubkey = this.solanaProvider.publicKey;

            // Convert recipient address to PublicKey
            const toPubkey = new PublicKey(recipient);

            // Create transfer instruction
            const transferInstruction = SystemProgram.transfer({
                fromPubkey: fromPubkey,
                toPubkey: toPubkey,
                lamports: lamports,
            });

            // Get recent blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

            // Create transaction
            const transaction = new Transaction({
                feePayer: fromPubkey,
                blockhash: blockhash,
                lastValidBlockHeight: lastValidBlockHeight,
            }).add(transferInstruction);

            // Request Phantom to sign and send
            const { signature } = await this.solanaProvider.signAndSendTransaction(transaction);

            // Wait for confirmation
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight,
            }, 'confirmed');

            return signature;

        } catch (error) {
            if (error.message.includes('User rejected') || error.code === 4001) {
                throw new Error('Transaction cancelled by user');
            }
            throw new Error('Solana transaction failed: ' + error.message);
        }
    }

    async sendEthereum(recipient, amount) {
        if (!this.ethereumProvider) {
            throw new Error('Ethereum wallet not connected');
        }

        try {
            // Convert amount to wei (1 ETH = 10^18 wei)
            const amountInWei = '0x' + Math.floor(parseFloat(amount) * 1e18).toString(16);

            // Get the connected account
            const accounts = await this.ethereumProvider.request({ method: 'eth_accounts' });
            const fromAddress = accounts[0];

            // Get gas price based on selected speed
            const gasPrices = await feeService.getEthereumGasPrices();
            const selectedGasPrice = gasPrices[this.selectedFeeSpeed].gasPrice;
            const gasPriceHex = '0x' + selectedGasPrice.toString(16);

            // Send transaction
            const txHash = await this.ethereumProvider.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: fromAddress,
                    to: recipient,
                    value: amountInWei,
                    gas: '0x5208', // 21000 gas for simple transfer
                    gasPrice: gasPriceHex,
                }]
            });

            return txHash;

        } catch (error) {
            if (error.code === 4001) {
                throw new Error('Transaction cancelled by user');
            }
            throw new Error('Ethereum transaction failed: ' + error.message);
        }
    }

    async sendBitcoin(recipient, amount) {
        if (!this.bitcoinProvider) {
            throw new Error('Bitcoin wallet not connected');
        }

        try {
            // Convert amount to satoshis (1 BTC = 100,000,000 satoshis)
            const satoshis = Math.floor(parseFloat(amount) * 100000000);

            // Get connected account
            const accounts = await this.bitcoinProvider.requestAccounts();
            const fromAddress = accounts[0].address;

            // Send Bitcoin transaction
            const txHash = await this.bitcoinProvider.sendTransfer(recipient, satoshis);

            return txHash;

        } catch (error) {
            if (error.message.includes('User rejected')) {
                throw new Error('Transaction cancelled by user');
            }
            throw new Error('Bitcoin transaction failed: ' + error.message);
        }
    }

    async sendUSDC(recipient, amount) {
        // USDC is typically on Solana (SPL token) or Ethereum (ERC-20)
        // Default to Solana USDC for this implementation

        if (!this.solanaProvider) {
            throw new Error('Wallet not connected for USDC transfer');
        }

        try {
            // Create Solana connection
            const endpoint = NETWORK_CONFIG.solana[ACTIVE_NETWORKS.solana];
            const connection = new Connection(endpoint, 'confirmed');

            // Get USDC mint address
            const usdcMint = new PublicKey(TOKENS.usdc_sol.mint);

            // Convert amount to token units (USDC has 6 decimals)
            const tokenAmount = Math.floor(parseFloat(amount) * Math.pow(10, TOKENS.usdc_sol.decimals));

            // Get sender's public key
            const fromPubkey = this.solanaProvider.publicKey;
            const toPubkey = new PublicKey(recipient);

            // Get associated token accounts
            const fromTokenAccount = await getAssociatedTokenAddress(usdcMint, fromPubkey);
            const toTokenAccount = await getAssociatedTokenAddress(usdcMint, toPubkey);

            // Create transfer instruction
            const transferInstruction = createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                fromPubkey,
                tokenAmount
            );

            // Get recent blockhash
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

            // Create transaction
            const transaction = new Transaction({
                feePayer: fromPubkey,
                blockhash: blockhash,
                lastValidBlockHeight: lastValidBlockHeight,
            }).add(transferInstruction);

            // Request Phantom to sign and send
            const { signature } = await this.solanaProvider.signAndSendTransaction(transaction);

            // Wait for confirmation
            await connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight,
            }, 'confirmed');

            return signature;

        } catch (error) {
            if (error.message.includes('User rejected') || error.code === 4001) {
                throw new Error('Transaction cancelled by user');
            }
            throw new Error('USDC transaction failed: ' + error.message);
        }
    }

    showStatus(type, message, txHash = null) {
        const statusDiv = document.getElementById('transactionStatus');
        const statusMessage = document.getElementById('statusMessage');
        const txHashDiv = document.getElementById('transactionHash');
        const txHashLink = document.getElementById('txHashLink');

        statusDiv.style.display = 'block';
        statusDiv.className = 'transaction-status ' + type;
        statusMessage.textContent = message;

        if (txHash) {
            txHashDiv.style.display = 'block';
            txHashLink.textContent = txHash;

            // Set the correct explorer URL based on current network
            let explorerUrl;
            switch (this.currentNetwork) {
                case 'SOL':
                    explorerUrl = `https://solscan.io/tx/${txHash}`;
                    break;
                case 'ETH':
                    explorerUrl = `https://etherscan.io/tx/${txHash}`;
                    break;
                case 'POLYGON':
                    explorerUrl = `https://polygonscan.com/tx/${txHash}`;
                    break;
                case 'BASE':
                    explorerUrl = `https://basescan.org/tx/${txHash}`;
                    break;
                case 'BTC':
                    explorerUrl = `https://blockchair.com/bitcoin/transaction/${txHash}`;
                    break;
                default:
                    explorerUrl = `https://solscan.io/tx/${txHash}`;
            }
            txHashLink.href = explorerUrl;
        } else {
            txHashDiv.style.display = 'none';
        }

        // Auto-hide after 10 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 10000);
        }
    }

    // Transaction History Methods
    async saveTransactionToHistory(transaction) {
        try {
            // Get explorer URL
            let explorerUrl = '';
            const network = transaction.network.toLowerCase();
            const activeNetwork = ACTIVE_NETWORKS[network] || 'mainnet';

            if (EXPLORERS[network]) {
                const explorerBase = EXPLORERS[network][activeNetwork];
                explorerUrl = `${explorerBase}/tx/${transaction.txHash}`;
            }

            await transactionHistoryService.addTransaction({
                ...transaction,
                explorerUrl,
                timestamp: Date.now(),
            });
        } catch (error) {
            console.error('Error saving transaction:', error);
        }
    }

    async loadTransactionHistory() {
        try {
            const transactions = await transactionHistoryService.getAllTransactions();
            this.displayTransactions(transactions);

            // Show history section if we have transactions
            const historySection = document.getElementById('transactionHistorySection');
            if (transactions.length > 0) {
                historySection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading transaction history:', error);
        }
    }

    displayTransactions(transactions) {
        const transactionList = document.getElementById('transactionList');

        if (transactions.length === 0) {
            transactionList.innerHTML = '<p class="no-transactions">No transactions yet</p>';
            return;
        }

        const transactionsHTML = transactions.map(tx => {
            const date = new Date(tx.timestamp);
            const statusClass = `badge-${tx.status}`;

            return `
                <div class="transaction-item">
                    <div class="transaction-header">
                        <div class="transaction-amount">
                            ${parseFloat(tx.amount).toFixed(6)} ${tx.currency}
                        </div>
                        <div class="transaction-badge ${statusClass}">
                            ${tx.status}
                        </div>
                    </div>
                    <div class="transaction-details">
                        <strong>Network:</strong> ${tx.network}
                    </div>
                    <div class="transaction-details">
                        <strong>To:</strong> ${this.formatAddress(tx.recipient)}
                    </div>
                    ${tx.explorerUrl ? `
                        <a href="${tx.explorerUrl}" target="_blank" rel="noopener noreferrer" class="transaction-hash">
                            View on Explorer: ${tx.txHash.substring(0, 8)}...${tx.txHash.substring(tx.txHash.length - 8)}
                        </a>
                    ` : ''}
                    <div class="transaction-timestamp">
                        ${date.toLocaleString()}
                    </div>
                </div>
            `;
        }).join('');

        transactionList.innerHTML = transactionsHTML;
    }

    async filterTransactions() {
        try {
            const networkFilter = document.getElementById('historyNetworkFilter').value;
            const statusFilter = document.getElementById('historyStatusFilter').value;

            let transactions = await transactionHistoryService.getAllTransactions();

            // Apply network filter
            if (networkFilter) {
                transactions = transactions.filter(tx => tx.network === networkFilter);
            }

            // Apply status filter
            if (statusFilter) {
                transactions = transactions.filter(tx => tx.status === statusFilter);
            }

            this.displayTransactions(transactions);
        } catch (error) {
            console.error('Error filtering transactions:', error);
        }
    }

    async clearTransactionHistory() {
        if (confirm('Are you sure you want to clear all transaction history?')) {
            try {
                await transactionHistoryService.clearAllTransactions();
                this.loadTransactionHistory();
                document.getElementById('transactionHistorySection').style.display = 'none';
            } catch (error) {
                console.error('Error clearing transaction history:', error);
                alert('Failed to clear transaction history');
            }
        }
    }

    // Dark Mode Methods
    initDarkMode() {
        // Check for saved dark mode preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Apply dark mode if saved or if user prefers dark mode
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
            this.updateDarkModeIcon(true);
        } else {
            this.updateDarkModeIcon(false);
        }
    }

    toggleDarkMode() {
        const isDark = document.body.classList.toggle('dark-mode');

        // Save preference
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Update icon
        this.updateDarkModeIcon(isDark);
    }

    updateDarkModeIcon(isDark) {
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
}

// Export the class for use in main.js
export { CryptoPaymentApp };
