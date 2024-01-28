'use client'
import { useState, useEffect } from "react";
import InterestUi from "../components/interestUi";
import MetadataUi from "@/components/metadatUi";
import {
  Connection,
  Transaction,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TokenMetadata,
} from "@solana/spl-token-metadata";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
  const [mint, setMint] = useState<string | null>(null);
  const [metaData, setMetaData] = useState<TokenMetadata>();
  const [showInterest, setShowInterest] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const { publicKey, sendTransaction } = useWallet();
  const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
  const connection = new Connection(rpcEndpoint, "confirmed");

  async function createMint() {
    try {
      const res = await fetch("/api/mint", {
        method: "POST",
        body: JSON.stringify({ 
          publicKey: publicKey,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const txData = await res.json();
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);
      console.log('mint address', txData.mint)

      setMint(txData.mint);

      console.log(
        "\nCreate Mint Account:",
        `https://explorer.solana.com/tx/${txHash}?cluster=devnet-solana`,
      );
    } catch (err) {
      console.log('err', err)
    }
  }

  // Remove a key from the metadata account
  async function removeMetadata() {
    try {
      const res = await fetch("/api/remove", {
        method: "POST",
        body: JSON.stringify({ 
          publicKey: publicKey,
          mint: mint,
          metaData: metaData,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const txData = await res.json();
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      setMint(txData.mint);

      console.log(
        "\nUpdated Metadata on Mint Account:",
        `https://explorer.solana.com/tx/${txHash}?cluster=devnet-solana`,
      );
    } catch (err) {
      console.log('err', err)
    }
  }

   // Remove a key from the metadata account
   async function closeMintAccount() {
    try {
      const res = await fetch("/api/closeMint", {
        method: "POST",
        body: JSON.stringify({ 
          publicKey: publicKey,
          mint: mint,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const txData = await res.json();
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      console.log(
        "\nMint Account Closed:",
        `https://explorer.solana.com/tx/${txHash}?cluster=devnet-solana`,
      );

      setMint(null);
    } catch (err) {
      console.log('err', err)
    }
  }

  // Mint Tokens to Account
  async function mintToAccount() {
    try {
      const res = await fetch("/api/mintTo", {
        method: "POST",
        body: JSON.stringify({ 
          publicKey: publicKey,
          mint: mint,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const txData = await res.json();
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      console.log(
        "\nTokens Minted! :",
        `https://explorer.solana.com/tx/${txHash}?cluster=devnet-solana`,
      );
      console.log('txHash', txHash)

    } catch (err) {
      console.log('err', err)
    }
  }

  // Burn Tokens from Account
  async function burnTokens() {
    try {
      const res = await fetch("/api/burn", {
        method: "POST",
        body: JSON.stringify({ 
          publicKey: publicKey,
          mint: mint,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const txData = await res.json();
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      console.log(
        "\nTokens Burned:",
        `https://explorer.solana.com/tx/${txHash}?cluster=devnet-solana`,
      );

    } catch (err) {
      console.log('err', err)
    }
  }

  // Update Interest on Token
  async function updateInterest() {
    try {
      setShowInterest(false);

      const res = await fetch("/api/updateInterest", {
        method: "POST",
        body: JSON.stringify({ 
            mint: mint,
            publicKey: publicKey,
        }),
        headers: {
            "Content-Type": "application/json",
        },
      });

      const txData = await res.json();
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      console.log(
        "\nInterest Updated:",
        `https://explorer.solana.com/tx/${txHash}?cluster=devnet-solana`,
      );

      setShowInterest(true);
    } catch (err) {
        console.log('err', err)
    }
  }

  // Read Metadata from Mint Account
  async function readMintMetadata() {
    try {
      const res = await fetch("/api/readMint", {
        method: "POST",
        body: JSON.stringify({ 
          mint: mint,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const mintData = await res.json();

      console.log('mintData.metadata', mintData.metadata)

      setMetaData(mintData.metadata);

    } catch (err) {
      console.log('err', err)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-r from-green-400 to-blue-500 space-y-2'>
      <h1 className='text-6xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500'>
        Token Extensions
      </h1>
      {!publicKey && (
        <h1 className='text-2xl font-bold text-center text-black'>
          Connect Wallet to get started
        </h1>
      )}
      <WalletMultiButton />
      <div className='flex flex-col space-x-2'>
        {!mint && publicKey && (
          <button 
            onClick={createMint} 
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
          >
            Create Mint
          </button>
        )}
        
        {mint && (
          <div className='flex flex-col space-y-2'>
            <h1 className='text-2xl font-bold text-center text-black'>
              Mint Address: {mint}
            </h1>
            <div className='flex flex-row space-x-2 items-center justify-center'>
              <button 
                onClick={readMintMetadata}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              >
                Read Mint Metadata
              </button>

              <button 
                onClick={()=> removeMetadata()}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              >
                Remove Metadata
              </button>

              <button 
                onClick={()=> closeMintAccount()}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              >
                Close Mint Account
              </button>
            </div>

            <div className='flex flex-row space-x-2 items-center justify-center'>
              <button
                onClick={()=> mintToAccount()}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              >
                Mint Tokens to Account
              </button>
              <button
                // disabled={true}
                onClick={()=> burnTokens()}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              >
                Burn Tokens from Account
              </button>
            </div>

            <div className='flex flex-row space-x-2 items-center justify-center'>
              <button
                onClick={()=> updateInterest()}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              >
                Update Interest
              </button>
            </div>

            <div className='flex flex-row space-x-2 items-center justify-center'>
              {metaData && (
                <button
                  onClick={()=> setShowMetadata(!showMetadata)}
                  className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                >
                  {showMetadata ? 'Hide Metadata' : 'Show Metadata'}
                </button>
              )}
              <button
                onClick={()=> setShowInterest(!showInterest)}
                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              >
                {showInterest ? 'Hide Interest' : 'Show Interest'}
              </button>
            </div>

            <div className='flex flex-col space-y-2 items-center justify-center'>
              {showMetadata && metaData && (
                <MetadataUi metadata={metaData}/>
              )}
              {showInterest && (
                <InterestUi mint={mint}/>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}