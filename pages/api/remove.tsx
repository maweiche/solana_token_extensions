import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  PublicKey,
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
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createRemoveKeyInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import fs from "fs";
import path from "path";

type Data = {
  transaction: string;
  mint: string;
};

type Error = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>,
) {
    const base58 = require('bs58');
    const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
    const connection = new Connection(rpcEndpoint, "confirmed");
    // unpack the request body
    const { publicKey, mint, metaData } = req.body;
    console.log('req', req.body)
    console.log('publicKey', publicKey.toString())
    console.log('mint', mint)
    console.log('metaData', metaData)
    // get the mintKeypair from the file
    // const filePath = path.join(process.cwd(), 'lib', 'mint.json')

    // const mintKeypair = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    // const mint = mintKeypair._keypair.publicKey

    // const secretKey = Object.values(mintKeypair._keypair.secretKey)

    // console.log('publickey', publicKey.toString())
    // const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKey))
    // console.log('keypair public key', keypair.publicKey.toString())
    try {
      // Instruction to remove a key from the metadata
      const removeKeyInstruction = 
        createRemoveKeyInstruction({
          programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
          metadata: new PublicKey(mint), // Address of the metadata
          updateAuthority: new PublicKey(publicKey), // Authority that can update the metadata
          key: metaData.additionalMetadata[0][0], // Key to remove from the metadata
          idempotent: true, // If the idempotent flag is set to true, then the instruction will not error if the key does not exist
        });
        
    console.log('instruction', removeKeyInstruction)
      // Retrieve and log the metadata state
    //   const updatedMetadata = await getTokenMetadata(
    //     connection,
    //     new PublicKey(public_key), // Mint Account address
    //   );
    //   console.log("\nUpdated Metadata:", JSON.stringify(updatedMetadata, null, 2));

    //   console.log(
    //     "\nMint Account:",
    //     `https://solana.fm/address/${public_key}?cluster=devnet-solana`,
    //   );

         // Get a recent blockhash to include in the transaction
      const { blockhash } =
        await connection.getLatestBlockhash("finalized");

      const transaction = new Transaction({
        recentBlockhash: blockhash,
        // The buyer pays the transaction fee
        feePayer: new PublicKey(publicKey),
      });
        
        // Add instructions to new transaction
        transaction.add(removeKeyInstruction)

        // partial sign transaction with mint keypair
        // transaction.partialSign(keypair);

        // Serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
          // We will need the buyer to sign this transaction after it's returned to them
          requireAllSignatures: false,
        });
        const base64 = serializedTransaction.toString("base64");


        // Return the serialized transaction
        res.status(200).json({
          transaction: base64,
          mint: mint.toString(),
        });
      } catch (err) {
        console.error(err);
    
        res.status(500).json({ error: "error creating transaction" });
        return;
      }
  
}
