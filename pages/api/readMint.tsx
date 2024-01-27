import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  PublicKey
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getMetadataPointerState,
  getTokenMetadata,
} from "@solana/spl-token";
import {
  TokenMetadata,
} from "@solana/spl-token-metadata";


type Data = {
  metadata: TokenMetadata;
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

    const { mint } = req.body;

    try{
        const metadata = await getTokenMetadata(
            connection,
            new PublicKey(mint), // Mint Account address
        );
        
        if(metadata != null){
            res.status(200).json({
                metadata: metadata,
            });
        }else{
            res.status(200).json({
                error: "no metadata found",
            });
        }
    } catch (err) {
        console.error(err);

        res.status(500).json({ error: "error creating transaction" });
        return;
    }
  

  
  // res.status(200).json({ name: "John Doe" });
}
