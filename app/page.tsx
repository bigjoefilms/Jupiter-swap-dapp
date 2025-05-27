'use client'

import { VersionedTransaction, Connection } from "@solana/web3.js";
import base58 from "bs58";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useState } from 'react';

interface Token {
  symbol: string;
  mint: string;
  decimals: number;
}

const TOKENS: Token[] = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
];

export default function Home() {
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('0.1');
  const [receiveAmount, setReceiveAmount] = useState('9.40403');
  const [fromToken, setFromToken] = useState(TOKENS[0]);
  const [toToken, setToToken] = useState(TOKENS[1]);
  const [slippage, setSlippage] = useState(0.5);

  const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=c7e5b412-c980-4f46-8b06-2c85c0b4a08d");

  const getQuote = async () => {
    if (!payAmount || parseFloat(payAmount) <= 0) return;

    try {
      const amount = Math.floor(parseFloat(payAmount) * Math.pow(10, fromToken.decimals));
      const quoteResponse = await (
        await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.mint}&outputMint=${toToken.mint}&amount=${amount}&slippageBps=${Math.floor(slippage * 100)}`
        )
      ).json();

      if (quoteResponse.error) {
        console.error('Quote error:', quoteResponse.error);
        return;
      }

      const outAmount = parseFloat(quoteResponse.outAmount) / Math.pow(10, toToken.decimals);
      setReceiveAmount(outAmount.toFixed(6));
    } catch (error) {
      console.error('Error getting quote:', error);
    }
  };

  const handleSwap = async () => {
    if (!connected || !wallet.publicKey) {
      alert('Please connect your wallet ');
      return;
    }


    setIsLoading(true);

    try {
      const amount = Math.floor(parseFloat(payAmount) * Math.pow(10, fromToken.decimals));
      
      const quoteResponse = await (
        await fetch(
          `https://quote-api.jup.ag/v6/quote?inputMint=${fromToken.mint}&outputMint=${toToken.mint}&amount=${amount}&slippageBps=${Math.floor(slippage * 100)}`
        )
      ).json();

      console.log('Quote response:', quoteResponse);

      if (quoteResponse.error) {
        throw new Error(quoteResponse.error);
      }

      // Get serialized transaction for swap
      const { swapTransaction } = await (
        await fetch('https://quote-api.jup.ag/v6/swap', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey: wallet.publicKey.toString(),
            wrapAndUnwrapSol: true,
          })
        })
      ).json();

      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support signing transactions');
      }

      const signedTransaction = await wallet.signTransaction(transaction);
      const rawTransaction = signedTransaction.serialize();

      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      const latestBlockHash = await connection.getLatestBlockhash();
      
      await connection.confirmTransaction({
        blockhash: latestBlockHash.blockhash,
        lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
        signature: txid
      }, "confirmed");

      console.log(`Transaction successful: https://solscan.io/tx/${txid}`);
      alert(`Swap successful! View on Solscan: https://solscan.io/tx/${txid}`);

    } catch (error) {
      console.error('Swap error:', error);
      alert(`Swap failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSwitch = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setPayAmount(receiveAmount);
    setReceiveAmount(payAmount);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex justify-end items-center gap-3 py-4 px-6">
        <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !text-white" />
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900 rounded-2xl p-6 border border-purple-500">
            {/* You Pay Section */}
            <div className="mb-6">
              <h3 className="text-white text-lg font-medium mb-3">You pay</h3>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    onBlur={getQuote}
                    className="w-full bg-gray-800 rounded-lg px-4 py-3 text-white text-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                    placeholder="0.0"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className="text-gray-400">≈</span>
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
                  <span className="text-white font-medium">{fromToken.symbol}</span>
                  <button
                    onClick={handleTokenSwitch}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    ⇅
                  </button>
                </div>
              </div>
            </div>

            {/* You Receive Section */}
            <div className="mb-6">
              <h3 className="text-white text-lg font-medium mb-3">You receive</h3>
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg px-4 py-3">
                  <span className="text-white text-lg">{receiveAmount}</span>
                </div>
                <div className="bg-gray-800 rounded-lg px-4 py-3">
                  <span className="text-white font-medium">{toToken.symbol}</span>
                </div>
              </div>
            </div>

            {/* Slippage Settings */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Slippage tolerance</span>
                <span>{slippage}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!connected || isLoading || !payAmount || parseFloat(payAmount) <= 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg py-4 font-medium text-white transition-colors relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Swapping...</span>
                </div>
              ) : (
                'Swap'
              )}
            </button>

            {!connected && (
              <p className="text-center text-gray-400 text-sm mt-3">
                Connect your wallet to start swapping
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-center text-gray-500 text-sm">
            <p>Powered by Jupiter Exchange</p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}