import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createCloseAccountInstruction
} from "@solana/spl-token";

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

    const closeAuthority = new PublicKey(publicKey);
    console.log('mint', mint)
    try {
        // Instruction to remove a key from the metadata
        const closeAccountInstruction = 
            createCloseAccountInstruction(
                new PublicKey(mint), // Mint Account address to close
                closeAuthority, // Destination account to receive lamports from closed account
                closeAuthority, // Close Authority for Mint Account
                undefined, // Signing Accounts if Close Authority is Multisig
                TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
            );
        
        const { blockhash } = await connection.getLatestBlockhash("finalized");

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: new PublicKey(publicKey),
        });
        
        // Add instructions to new transaction
        transaction.add(closeAccountInstruction)

        // Serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
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
