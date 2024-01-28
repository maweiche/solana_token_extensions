import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  createRemoveKeyInstruction,
} from "@solana/spl-token-metadata";

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
    const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
    const connection = new Connection(rpcEndpoint, "confirmed");

    const { publicKey, mint, metaData } = req.body;
    
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
        
        const { blockhash } = await connection.getLatestBlockhash("finalized");

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            // The buyer pays the transaction fee
            feePayer: new PublicKey(publicKey),
        });
        
        // Add instructions to new transaction
        transaction.add(removeKeyInstruction)

        // Serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
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
