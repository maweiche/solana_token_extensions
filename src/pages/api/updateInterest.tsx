import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createUpdateRateInterestBearingMintInstruction,
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

    try {
        const { blockhash } = await connection.getLatestBlockhash("finalized");

        const transaction = new Transaction({
            recentBlockhash: blockhash,
            feePayer: new PublicKey(publicKey),
        });

        // New interest rate in basis points
        const updateRate = 0;
        
        // Update interest rate on Mint Account
        const updateInterestInstruction = createUpdateRateInterestBearingMintInstruction(
            new PublicKey(mint), // Mint Account address
            public_key, // Rate Authority       
            updateRate, // Updated interest rate
            undefined, // Additional Signers (multisig)
            TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
          );
        
        transaction.add(updateInterestInstruction);

        // Serialize the transaction and convert to base64 to return it
        const serializedTransaction = transaction.serialize({
            requireAllSignatures: false,
        });
        
        const base64 = serializedTransaction.toString("base64");
        console.log('returning tx')
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
