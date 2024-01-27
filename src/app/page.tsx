'use client'
import { useState } from "react";
import {
  Connection,
  Transaction,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TokenMetadata,
  createRemoveKeyInstruction,
} from "@solana/spl-token-metadata";
import dynamic from "next/dynamic";


// pub struct TokenMetadata {
//     /// The authority that can sign to update the metadata
//     pub update_authority: OptionalNonZeroPubkey,
//     /// The associated mint, used to counter spoofing to be sure that metadata
//     /// belongs to a particular mint
//     pub mint: Pubkey,
//     /// The longer name of the token
//     pub name: String,
//     /// The shortened symbol for the token
//     pub symbol: String,
//     /// The URI pointing to richer metadata
//     pub uri: String,
//     /// Any additional metadata about the token as key-value pairs. The program
//     /// must avoid storing the same key twice.
//     pub additional_metadata: Vec<(String, String)>,
// }

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export default function Home() {
  const [mint, setMint] = useState<string | null>(null);
  const [metaData, setMetaData] = useState<TokenMetadata>();
  const { publicKey, sendTransaction } = useWallet();
  const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
  const connection = new Connection(rpcEndpoint, "confirmed");

  async function createMint() {
    console.log('publicKey starting mint', publicKey?.toString())
    try {
      // send the metadata to the /api/mint endpoint
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
      
      console.log("txData", txData);
      console.log('txData mint', txData.mint)
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);
      console.log('mint address', txData.mint)
      setMint(txData.mint);

      console.log(
        "\nCreate Mint Account:",
        `https://solscan.io/tx/${txHash}?cluster=devnet-solana`,
      );
      console.log('txHash', txHash)
    } catch (err) {
      // unpack the response
      console.log('err', err)
    }
  }


  // Remove a key from the metadata account
  async function removeMetadata() {
    console.log('publicKey', publicKey?.toString())
      console.log('mint', mint)
      console.log('metaData', metaData)
    try {
      // send the metadata to the /api/mint endpoint
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
      
      console.log("txData", txData);
      console.log('txData mint', txData.mint)
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      setMint(txData.mint);

      console.log(
        "\nUpdated Metadata on Mint Account:",
        `https://solscan.io/tx/${txHash}?cluster=devnet-solana`,
      );
      console.log('txHash', txHash)
    } catch (err) {
      // unpack the response
      console.log('err', err)
    }
  }

   // Remove a key from the metadata account
   async function closeMintAccount() {
    try {
      // send the metadata to the /api/mint endpoint
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
      
      console.log("txData", txData);
      console.log('txData mint', txData.mint)
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      console.log(
        "\nMint Account Closed:",
        `https://solscan.io/tx/${txHash}?cluster=devnet-solana`,
      );
      console.log('txHash', txHash)

      setMint(null);
    } catch (err) {
      // unpack the response
      console.log('err', err)
    }
  }

  // Mint Tokens to Account
  async function mintToAccount() {
    try {
      // send the metadata to the /api/mint endpoint
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
      
      console.log("txData", txData);
      console.log('txData mint', txData.mint)
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      console.log(
        "\nTokens Minted! :",
        `https://solscan.io/tx/${txHash}?cluster=devnet-solana`,
      );
      console.log('txHash', txHash)

    } catch (err) {
      // unpack the response
      console.log('err', err)
    }
  }

  // Burn Tokens from Account
  async function burnTokens() {
    try {
      // send the metadata to the /api/mint endpoint
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
      
      console.log("txData", txData);
      console.log('txData mint', txData.mint)
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      console.log(
        "\nMint Account Closed:",
        `https://solscan.io/tx/${txHash}?cluster=devnet-solana`,
      );
      console.log('txHash', txHash)

    } catch (err) {
      // unpack the response
      console.log('err', err)
    }
  }

  // Read Metadata from Mint Account
  async function readMintMetadata() {
    try {
      console.log('mint', mint)
      // send the metadata to the /api/mint endpoint
      const res = await fetch("/api/readMint", {
        method: "POST",
        body: JSON.stringify({ 
          mint: mint, // Mint Account address
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const mintData = await res.json();

      console.log('mintData', mintData)
      console.log('mintData.metadata', mintData.metadata)

      setMetaData(mintData.metadata);

    } catch (err) {
      // unpack the response
      console.log('err', err)
    }
  }
  

  return (
    <div 
      className='flex flex-col items-center justify-center min-h-screen py-2 bg-gradient-to-r from-green-400 to-blue-500 space-y-2'
    >
      <h1 
        className='text-6xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-red-500'
      >
        Token Extensions
      </h1>
      <WalletMultiButton />
      <div
        className='flex flex-row space-x-2'
      >
        <button 
          onClick={createMint} 
          className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
        >
          Create Mint
        </button>
        {mint && (
          <button 
            onClick={readMintMetadata}
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
          >
            Read Mint Metadata
          </button>
        )}
        {mint && (
          <button 
            onClick={()=> removeMetadata()}
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
          >
            Remove Metadata
          </button>
        )}
        {mint && (
          <button 
            onClick={()=> closeMintAccount()}
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
          >
            Close Mint Account
          </button>
        )}
      </div>
      <div
        className='flex flex-row space-y-2'
      >
        {mint && (
          <div>
            <button
              onClick={()=> mintToAccount()}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            >
              Mint Tokens to Account
            </button>
            <button
              disabled={true}
              onClick={()=> burnTokens()}
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            >
              Burn Tokens from Account
            </button>
          </div>
        )}
      </div>
    </div>      
  )
}