import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_2022_PROGRAM_ID,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress
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
    const public_key = new PublicKey(publicKey);
    const mint_authority = public_key;
    console.log('mint', mint)
    try {

        const { blockhash } = await connection.getLatestBlockhash("finalized");

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: new PublicKey(publicKey),
        });

        // Create associated token account for the mint
        const associatedTokenAccount = await getAssociatedTokenAddress(
            new PublicKey(mint),
            public_key,
            false,
            TOKEN_2022_PROGRAM_ID,
          );

        // Create the associated token account instruction to add to the transaction since the wallet does not have the associated token account yet
        const destinationTokenAccount = await createAssociatedTokenAccountInstruction(
            public_key, // Payer to create Token Account
            associatedTokenAccount, // Token Account owner
            public_key,
            new PublicKey(mint), // Mint Account address
            TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
          );

        const mintToInstruction = await createMintToInstruction(
            new PublicKey(mint), // Mint Account address
            associatedTokenAccount, // Destination address
            mint_authority, // Mint token authority
            100, // Amount (100 for 2 decimal place mint = 1.00 tokens)
            undefined, // Signers if multisig
            TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
          );
        
        transaction.add(destinationTokenAccount, mintToInstruction);

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
