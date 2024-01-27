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
  createMintToInstruction,
  createBurnInstruction,
  createInitializeMintInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction,
  getMint,
  getMetadataPointerState,
  getTokenMetadata,
  TYPE_SIZE,
  LENGTH_SIZE,
  createTransferCheckedInstruction,
  closeAccount,

  createCloseAccountInstruction
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
};

type Error = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>,
) {
    const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
    const connection = new Connection(rpcEndpoint, "confirmed");

    const { publicKey, mint } = req.body;
    const public_key = new PublicKey(publicKey);
    const mint_authority = public_key;
    console.log('mint', mint)
    try {

        const { blockhash } = await connection.getLatestBlockhash("finalized");

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: new PublicKey(publicKey),
        });
        
        const burnInstruction = await createBurnInstruction(
            public_key, // Account to burn tokens from
            mint, // Mint Account address
            public_key, // Destination address
            100, // Amount
            [public_key], // Signers
            TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
          );
        
        transaction.add(burnInstruction);

        // Serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
            // We will need the buyer to sign this transaction after it's returned to them
            requireAllSignatures: false,
        });
        
        const base64 = serializedTransaction.toString("base64");

        // Return the serialized transaction
        res.status(200).json({
            transaction: base64,
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({ error: "error creating transaction" });
        return;
    }
  
}
