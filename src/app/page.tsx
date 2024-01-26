'use client'
import { useState } from "react";
import {
  Connection,
  Transaction,
  PublicKey
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  getMint,
  getMetadataPointerState,
  getTokenMetadata,
  TYPE_SIZE,
  LENGTH_SIZE,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import {
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
  const [mint, setMint] = useState<string>('');
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
      // console.log("txData", txData);
      const tx = Transaction.from(Buffer.from(txData.transaction, "base64"));
      const txHash =
        await sendTransaction(tx, connection);

      setMint(txData.mint);

      console.log(
        "\nCreate Mint Account:",
        `https://solscan.io/tx/${tx}?cluster=devnet-solana`,
      );
      console.log('txHash', txHash)
    } catch (err) {
      // unpack the response
      console.log('err', err)
    }

  }


  // Remove a key from the metadata account
  async function removeMetadata() {
    // Instruction to remove a key from the metadata
    const removeKeyInstruction = 
      createRemoveKeyInstruction({
        programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
        metadata: new PublicKey(mint), // Address of the metadata
        updateAuthority: updateAuthority, // Authority that can update the metadata
        key: metaData.additionalMetadata[0][0], // Key to remove from the metadata
        idempotent: true, // If the idempotent flag is set to true, then the instruction will not error if the key does not exist
      });

    // Add instruction to new transaction
    const transaction = new Transaction().add(removeKeyInstruction);

    const txHash = await sendTransaction(transaction, connection);

    console.log('txHash', txHash)

    // // Send transaction
    // const transactionSignature = await sendAndConfirmTransaction(
    //   connection,
    //   transaction,
    //   [publicKey as Signer, mintKeypair as Signer], // Signers
    // );

    console.log(
      "\nRemove Additional Metadata Field:",
      `https://solana.fm/tx/${txHash}?cluster=devnet-solana`,
    );

    // Retrieve and log the metadata state
    const updatedMetadata = await getTokenMetadata(
      connection,
      mint, // Mint Account address
    );
    console.log("\nUpdated Metadata:", JSON.stringify(updatedMetadata, null, 2));

    console.log(
      "\nMint Account:",
      `https://solana.fm/address/${mint}?cluster=devnet-solana`,
    );
  }

  // Read Metadata from Mint Account
  async function readMintMetadata() {
    // Retrieve mint information
    const mintInfo = await getMint(
      connection,
      new PublicKey(mint),
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );

    // Retrieve and log the metadata pointer state
    const metadataPointer = getMetadataPointerState(mintInfo);
    console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));

    // Retrieve and log the metadata state
    const metadata = await getTokenMetadata(
      connection,
      new PublicKey(mint), // Mint Account address
    );
    console.log("\nMetadata:", JSON.stringify(metadata, null, 2));
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
      <button 
        onClick={createMint} 
        className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
      >
        Create Mint
      </button>

      <button 
        onClick={readMintMetadata}
        className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
      >
        Read Mint Metadata
      </button>
      
      <button 
        onClick={removeMetadata}
        className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
      >
        Remove Metadata
      </button>
    </div>      
  )
}