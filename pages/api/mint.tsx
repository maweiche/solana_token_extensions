import type { NextApiRequest, NextApiResponse } from "next";
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  PublicKey
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getMintLen,
  createInitializeMetadataPointerInstruction, // UPDATEABLE METADATA INSTRUCTIONS
  createInitializeMintCloseAuthorityInstruction, // CLOSEABLE MINT ACCOUNT INSTRUCTIONS
  createInitializeNonTransferableMintInstruction, //NON TRANSFERABLE MINT ACCOUNT INSTRUCTIONS
  TYPE_SIZE,
  LENGTH_SIZE,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  createUpdateFieldInstruction, 
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
  const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
  const connection = new Connection(rpcEndpoint, "confirmed");

  const { publicKey } = req.body;
  const public_key = new PublicKey(publicKey);
  // Generate new keypair for Mint Account
  const mintKeypair = Keypair.generate();

  // use fs to create a file with the mintKeypair in the lib folder
  const filePath = path.join(process.cwd(), 'lib', 'mint.json')

  fs.writeFile(filePath, JSON.stringify(mintKeypair), function (err) {
    if (err) throw err;
    console.log('Saved!');
  })
  
  // Address for Mint Account
  const mint = mintKeypair.publicKey;
  // Decimals for Mint Account
  const decimals = 2;
  // Authority that can mint new tokens
  const mintAuthority = public_key;
  // Authority that can update the metadata pointer and token metadata
  const updateAuthority = public_key;
  // Close Authority that can close the mint account
  const closeAuthority = public_key;

  // Metadata to store in Mint Account
  const metaData: TokenMetadata = {
    updateAuthority: public_key,
    mint: mint,
    name: "RetroSol",
    symbol: "RETRO",
    uri: "https://raw.githubusercontent.com/solana-developers/opos-asset/main/assets/DeveloperPortal/metadata.json",
    additionalMetadata: [["description", "Only Possible On Solana"]],
  };
  
  // Size of MetadataExtension 2 bytes for type, 2 bytes for length
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  // Size of metadata
  const metadataLen = pack(metaData).length;

  // Size of Mint Account with extension
  const mintLen = getMintLen([
    ExtensionType.MetadataPointer,  //UPDATEABLE METADATA
    ExtensionType.MintCloseAuthority, //CLOSEABLE MINT ACCOUNT
    ExtensionType.NonTransferable
  ]);

  // Minimum lamports required for Mint Account
  async function calculateRentExemption() {
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataExtension + metadataLen,
    );
    return lamports;
  }

  try {
    const lamports = await calculateRentExemption();

    // Instruction to invoke System Program to create new account
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: public_key, // Account that will transfer lamports to created account
      newAccountPubkey: metaData.mint, // Address of the account to create
      space: mintLen, // Amount of bytes to allocate to the created account
      lamports, // Amount of lamports transferred to created account
      programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
    });

    const initializeMetadataPointerInstruction =
      createInitializeMetadataPointerInstruction(
        mint, // Mint Account address
        updateAuthority, // Authority that can set the metadata address
        mint, // Account address that holds the metadata
        TOKEN_2022_PROGRAM_ID,
      );

    // Instruction to initialize Mint Account data
    const initializeMintInstruction = 
      createInitializeMintInstruction(
        mint, // Mint Account Address
        decimals, // Decimals of Mint
        mintAuthority, // Designated Mint Authority
        null, // Optional Freeze Authority
        TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
      );

    // Instruction to initialize Metadata Account data
    const initializeMetadataInstruction = 
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
        metadata: mint, // Account address that holds the metadata
        updateAuthority: updateAuthority, // Authority that can update the metadata
        mint: mint, // Mint Account address
        mintAuthority: mintAuthority, // Designated Mint Authority
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.uri,
      });


    // UPDATEABLE METADATA INSTRUCTIONS//////////////////////////////////////////////////

    // Instruction to update metadata, adding custom field
    // This instruction will either update the value of an existing field or add it to additional_metadata if it does not already exist. 
    // Note that you may need to reallocate more space to the account to accommodate the additional data. In this example, 
    // we allocated all the lamports required for rent up front when creating the account.
    const updateFieldInstruction = 
      createUpdateFieldInstruction({
        programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
        metadata: metaData.mint, // Account address that holds the metadata
        updateAuthority: updateAuthority, // Authority that can update the metadata
        field: metaData.additionalMetadata[0][0], // key
        value: metaData.additionalMetadata[0][1], // value
      });
    
    //////////////////////////////////////////////////////////////////////////////////////
    //***********************************************************************************/
    // CLOSEABLE MINT ACCOUNT INSTRUCTIONS////////////////////////////////////////////////
    // Instruction to initialize the MintCloseAuthority Extension
    const initializeMintCloseAuthorityInstruction =
      createInitializeMintCloseAuthorityInstruction(
        mint, // Mint Account address
        closeAuthority, // Designated Close Authority
        TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
      );

    //////////////////////////////////////////////////////////////////////////////////////
    //***********************************************************************************/
    // NON TRANSFERABLE MINT ACCOUNT INSTRUCTIONS (SOL-BOUND)/////////////////////////////
    // Instruction to initialize the NonTransferable Extension
    const initializeNonTransferableMintInstruction =
      createInitializeNonTransferableMintInstruction(
        mint, // Mint Account address
        TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
      );
    //////////////////////////////////////////////////////////////////////////////////////
    //***********************************************************************************/


    // Get a recent blockhash to include in the transaction
    const { blockhash } =
      await connection.getLatestBlockhash("finalized");

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      // The buyer pays the transaction fee
      feePayer: updateAuthority,
    });
      
    // Add instructions to new transaction, the token extensions MUST be added before the initialize mint instruction
    // otherwise the transaction will fail
    transaction.add(
      createAccountInstruction,
      initializeMetadataPointerInstruction, // UPDATEABLE METADATA INSTRUCTIONS
      initializeMintCloseAuthorityInstruction, // CLOSEABLE MINT ACCOUNT INSTRUCTIONS
      initializeNonTransferableMintInstruction, // NON TRANSFERABLE MINT ACCOUNT INSTRUCTIONS
      // note: the above instructions are required before initializing the mint
      initializeMintInstruction,
      initializeMetadataInstruction,
      updateFieldInstruction, // UPDATEABLE METADATA INSTRUCTIONS
    );

      // partial sign transaction with mint keypair
      transaction.partialSign(mintKeypair);

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
