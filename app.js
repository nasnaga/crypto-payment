// Phantom Wallet Integration - Multi-chain Support
class CryptoPaymentApp {
    constructor() {
        this.solanaProvider = null;
        this.ethereumProvider = null;
        this.bitcoinProvider = null;
        this.walletAddress = null;
        this.currentNetwork = 'SOL';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkPhantomWallet();
    }

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('sendPayment').addEventListener('click', () => this.sendPayment());
        document.getElementById('currency').addEventListener('change', (e) => this.onCurrencyChange(e));
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

            // Use the first successful connection
            const firstSuccess = results.find(r => r.status === 'fulfilled');
            if (firstSuccess) {
                this.walletAddress = firstSuccess.value.address;
                this.currentNetwork = firstSuccess.value.network;
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

        walletAddress.textContent = this.formatAddress(this.walletAddress);
        connectBtn.textContent = 'Connected';
        connectBtn.disabled = true;

        paymentForm.style.display = 'block';

        this.getBalance();
    }

    handleWalletDisconnected() {
        this.walletAddress = null;

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

            // Get balance based on currency/network
            switch (currency) {
                case 'SOL':
                    if (this.solanaProvider && this.solanaProvider.publicKey) {
                        // In production, use @solana/web3.js to fetch actual balance
                        setTimeout(() => {
                            balanceElement.textContent = '---';
                        }, 1000);
                    }
                    break;
                case 'ETH':
                    if (this.ethereumProvider) {
                        // In production, fetch ETH balance
                        setTimeout(() => {
                            balanceElement.textContent = '---';
                        }, 1000);
                    }
                    break;
                case 'BTC':
                    if (this.bitcoinProvider) {
                        // In production, fetch BTC balance
                        setTimeout(() => {
                            balanceElement.textContent = '---';
                        }, 1000);
                    }
                    break;
                case 'USDC':
                    // USDC can be on multiple chains, check which one is active
                    setTimeout(() => {
                        balanceElement.textContent = '---';
                    }, 1000);
                    break;
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

        // Update current network based on currency
        switch (currency) {
            case 'SOL':
                this.currentNetwork = 'SOL';
                break;
            case 'ETH':
                this.currentNetwork = 'ETH';
                break;
            case 'BTC':
                this.currentNetwork = 'BTC';
                break;
            case 'USDC':
                // USDC defaults to Solana, but could be ETH or Polygon
                this.currentNetwork = 'SOL';
                break;
        }

        this.getBalance();
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

            // Handle different currencies
            let txHash;
            switch (currency) {
                case 'SOL':
                    txHash = await this.sendSolana(recipient, amount);
                    break;
                case 'ETH':
                    txHash = await this.sendEthereum(recipient, amount);
                    break;
                case 'BTC':
                    txHash = await this.sendBitcoin(recipient, amount);
                    break;
                case 'USDC':
                    txHash = await this.sendUSDC(recipient, amount);
                    break;
                default:
                    throw new Error('Unsupported currency');
            }

            this.showStatus('success', 'Payment sent successfully!', txHash);

            // Clear form
            document.getElementById('amount').value = '';
            document.getElementById('recipientAddress').value = '';

            // Update balance
            this.getBalance();

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
            // Convert amount to lamports (1 SOL = 1,000,000,000 lamports)
            const lamports = Math.floor(parseFloat(amount) * 1000000000);

            // Create transaction using Phantom's API
            const transaction = {
                feePayer: this.solanaProvider.publicKey,
                recentBlockhash: 'placeholder', // In production, fetch from network
                instructions: [{
                    programId: 'SystemProgram',
                    keys: [
                        { pubkey: this.solanaProvider.publicKey, isSigner: true, isWritable: true },
                        { pubkey: recipient, isSigner: false, isWritable: true }
                    ],
                    data: lamports
                }]
            };

            // Request Phantom to sign and send
            const response = await this.solanaProvider.signAndSendTransaction(transaction);
            return response.signature;

        } catch (error) {
            if (error.message.includes('User rejected')) {
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

            // Send transaction
            const txHash = await this.ethereumProvider.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: fromAddress,
                    to: recipient,
                    value: amountInWei,
                    gas: '0x5208', // 21000 gas for simple transfer
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
            // USDC on Solana is a SPL token
            // In production, use @solana/spl-token library
            const response = await this.solanaProvider.signAndSendTransaction({
                message: `Send ${amount} USDC to ${recipient}`
            });

            return response.signature;

        } catch (error) {
            if (error.message.includes('User rejected')) {
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
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CryptoPaymentApp();
});
