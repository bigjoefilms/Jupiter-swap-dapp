# Jupiter Swap Interface

A modern, React-based interface for swapping tokens on Solana using the Jupiter Exchange API. This project demonstrates how to integrate Jupiter's powerful aggregation protocol into your own applications.

![Jupiter Swap Interface](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)

## 🚀 Features

- **Modern UI**: Sleek, dark-themed interface with purple accents
- **Real-time Quotes**: Automatic price updates using Jupiter's quote API
- **Token Swapping**: Support for SOL/USDC swaps (easily extensible)
- **Slippage Control**: Adjustable slippage tolerance (0.1% - 5%)
- **Wallet Integration**: Seamless wallet connection with Solana Wallet Adapter
- **Loading States**: Visual feedback during transactions
- **Error Handling**: Comprehensive error management and user notifications
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Solana Web3.js
- **Wallet**: Solana Wallet Adapter React
- **API**: Jupiter Exchange V6 API
- **Encoding**: Base58 for transaction serialization

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Solana wallet (Phantom, Solflare, etc.)
- Basic understanding of React and TypeScript
- Solana devnet/mainnet SOL for testing

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/jupiter-swap-interface.git
cd jupiter-swap-interface
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_api_key_here
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_api_key
```

> **Note**: Get a free Helius API key at [helius.dev](https://helius.dev)

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔧 Configuration

### Adding New Tokens

To add support for additional tokens, update the `TOKENS` array in the component:

```typescript
const TOKENS: Token[] = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  // Add more tokens here
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
];
```

### Customizing Slippage

Default slippage is set to 0.5%. You can modify the default and range:

```typescript
const [slippage, setSlippage] = useState(0.5); // Default 0.5%

// In the slider component
<input
  type="range"
  min="0.1"    // Minimum slippage
  max="5"      // Maximum slippage
  step="0.1"   // Step size
  value={slippage}
  onChange={(e) => setSlippage(parseFloat(e.target.value))}
/>
```

## 🔌 Jupiter API Integration

### 1. Getting Quotes

```typescript
const getQuote = async () => {
  const amount = Math.floor(parseFloat(payAmount) * Math.pow(10, fromToken.decimals));
  const quoteResponse = await fetch(
    `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.mint}&outputMint=${toToken.mint}&amount=${amount}&slippageBps=${Math.floor(slippage * 100)}`
  );
  const quote = await quoteResponse.json();
  return quote;
};
```

### 2. Executing Swaps

```typescript
const handleSwap = async () => {
  // 1. Get quote
  const quoteResponse = await getQuote();
  
  // 2. Get swap transaction
  const { swapTransaction } = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey: wallet.publicKey.toString(),
      wrapAndUnwrapSol: true,
    })
  }).then(res => res.json());
  
  // 3. Sign and send transaction
  const transaction = VersionedTransaction.deserialize(
    Buffer.from(swapTransaction, 'base64')
  );
  const signedTransaction = await wallet.signTransaction(transaction);
  const txid = await connection.sendRawTransaction(signedTransaction.serialize());
};
```

## 🎨 UI Components

### Swap Interface Structure

```
SwapInterface/
├── Header (Wallet connection)
├── PaySection (Input token and amount)
├── ReceiveSection (Output token and amount)
├── SlippageControl (Tolerance settings)
└── SwapButton (Execute transaction)
```

### Styling

The interface uses Tailwind CSS with a dark theme:

- **Primary**: Purple (`bg-purple-600`, `border-purple-500`)
- **Background**: Dark grays (`bg-gray-900`, `bg-gray-800`)
- **Text**: White and gray variants
- **Interactive**: Hover effects and transitions

## 🛡️ Security Considerations

- **RPC Endpoint**: Use a reliable RPC provider (Helius, QuickNode, etc.)
- **Slippage Protection**: Implement reasonable slippage limits
- **Transaction Confirmation**: Always wait for transaction confirmation
- **Error Handling**: Provide clear error messages to users
- **Wallet Validation**: Check wallet connection before transactions

## 🔍 Troubleshooting

### Common Issues

1. **"Wallet not connected"**
   - Ensure your wallet is connected and unlocked
   - Check if the wallet adapter is properly configured

2. **"Insufficient funds"**
   - Verify you have enough SOL for the swap + transaction fees
   - Check token balances in your wallet

3. **"Transaction failed"**
   - Increase slippage tolerance
   - Check network congestion
   - Verify RPC endpoint is working

4. **"Quote not available"**
   - Check if the token pair is supported by Jupiter
   - Verify token mint addresses are correct

### Debug Mode

Enable console logging to debug issues:

```typescript
console.log('Quote response:', quoteResponse);
console.log('Swap transaction:', swapTransaction);
console.log('Transaction ID:', txid);
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Add proper error handling
- Include comments for complex logic
- Test on both devnet and mainnet

## 📚 Resources

- [Jupiter Exchange Documentation](https://docs.jup.ag/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Jupiter Exchange](https://jup.ag/) for providing the best swap aggregation on Solana
- [Solana Labs](https://solana.com/) for the incredible blockchain infrastructure
- The Solana developer community for continuous support and resources

## 💬 Support

If you have questions or need help:

- Open an issue in this repository
- Join the [Solana Discord](https://discord.gg/solana)
- Check out [Jupiter's Discord](https://discord.gg/jup)

---

**Happy Swapping! 🚀**

*Built with ❤️ for the Solana community*