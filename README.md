# Crypto Payment Gateway

A cryptocurrency payment gateway that integrates with Phantom wallet to accept payments in multiple currencies including Solana (SOL), Ethereum (ETH), Bitcoin (BTC), and USD Coin (USDC).

## Features

- Phantom Wallet integration
- Support for multiple cryptocurrencies:
  - Solana (SOL)
  - Ethereum (ETH)
  - Bitcoin (BTC)
  - USD Coin (USDC)
- Real-time wallet connection status
- Clean and modern user interface
- Transaction status tracking
- Mobile responsive design

## Prerequisites

- [Phantom Wallet](https://phantom.app/) browser extension installed
- Node.js and npm (for running local server)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/nasnaga/crypto-payment.git
cd crypto-payment
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Running the Application

You can run the application using one of these methods:

**Option 1: Using npm script (recommended)**
```bash
npm start
```

**Option 2: Using live-server for development**
```bash
npm run dev
```

**Option 3: Using Python's built-in server**
```bash
python3 -m http.server 8080
```

Then open your browser and navigate to `http://localhost:8080`

### Using the Payment Gateway

1. **Install Phantom Wallet**: If you haven't already, install the [Phantom wallet extension](https://phantom.app/) in your browser.

2. **Connect Wallet**: Click the "Connect Phantom Wallet" button and approve the connection in the Phantom popup.

3. **Select Currency**: Choose your preferred cryptocurrency from the dropdown menu (SOL, ETH, BTC, or USDC).

4. **Enter Payment Details**:
   - Amount: Enter the amount you want to send
   - Recipient Address: Enter the recipient's wallet address

5. **Send Payment**: Click "Send Payment" and confirm the transaction in your Phantom wallet.

## Important Notes

### Multi-Chain Support

Phantom wallet now supports multiple blockchains, and this payment gateway takes full advantage of that:

- **Solana (SOL)**: Native support with full transaction capabilities
- **Ethereum (ETH)**: Full support for ETH transfers via Phantom's Ethereum provider
- **Bitcoin (BTC)**: Full support for Bitcoin transfers including Ordinals and BRC-20 tokens
- **USDC**: Supported on Solana (SPL token) and can be extended to Ethereum (ERC-20)
- **Additional Networks**: Phantom also supports Polygon, Base, and Sui

### Current Implementation Status

- **SOL**: Transaction signing and sending implemented
- **ETH**: Full Ethereum transaction support with gas estimation
- **BTC**: Bitcoin transfer support with satoshi conversion
- **USDC**: Implemented as SPL token on Solana
- This is a demo/development version - always test with small amounts first

### Security

- Never share your private keys or seed phrases
- Always verify recipient addresses before sending
- Test transactions with small amounts first
- This application does not store any private keys or wallet information

## Development

### Project Structure

```
crypto-payment/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── app.js             # JavaScript application logic
├── package.json       # Node.js dependencies
└── README.md          # Documentation
```

### Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Phantom Wallet Multi-Chain API
  - Solana Provider (`window.phantom.solana`)
  - Ethereum Provider (`window.phantom.ethereum`)
  - Bitcoin Provider (`window.phantom.bitcoin`)
- Solana Web3.js (for advanced Solana features)
- SPL Token (for USDC and other Solana tokens)

### Key Features

- Multi-chain wallet connection
- Automatic network detection
- Transaction signing for SOL, ETH, BTC, and USDC
- Block explorer links for each network
- Real-time transaction status updates
- Responsive design for mobile and desktop

## Future Enhancements

- [ ] Real-time balance fetching for all supported networks
- [ ] Full implementation of Solana Web3.js with RPC connection
- [ ] Advanced SPL Token support for all Solana tokens
- [ ] ERC-20 token support on Ethereum
- [ ] Transaction history and tracking
- [ ] QR code generation for payment addresses
- [ ] Payment request links
- [ ] Multi-language support
- [ ] Dark mode toggle
- [ ] Support for Polygon and Base networks
- [ ] Gas fee estimation and customization
- [ ] Address book for frequent recipients

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on the GitHub repository.

## Disclaimer

This software is provided for educational and development purposes. Always exercise caution when handling cryptocurrency transactions. The developers are not responsible for any loss of funds.
