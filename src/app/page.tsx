'use client'
import { ContextProvider } from "../contexts/ContextProvider";
import {
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
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
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createRemoveKeyInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";


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

export default function Home() {
  const { publicKey, sendTransaction } = useWallet();
  const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
  const connection = new Connection(rpcEndpoint, "confirmed");
  // Generate new keypair for Mint Account
  const mintKeypair = Keypair.generate();
  // Address for Mint Account
  const mint = mintKeypair.publicKey;
  // Decimals for Mint Account
  const decimals = 2;
  // Authority that can mint new tokens
  const mintAuthority = publicKey!;
  // Authority that can update the metadata pointer and token metadata
  const updateAuthority = publicKey!;

  // Metadata to store in Mint Account
  const metaData: TokenMetadata = {
    updateAuthority: updateAuthority,
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
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);

  // Minimum lamports required for Mint Account
  async function calculateRentExemption() {
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataExtension + metadataLen,
    );
    return lamports;
  }

  async function createMint(){
    const lamports = await calculateRentExemption();
    // Instruction to invoke System Program to create new account
    const createAccountInstruction = SystemProgram.createAccount({
      fromPubkey: publicKey!, // Account that will transfer lamports to created account
      newAccountPubkey: mint, // Address of the account to create
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

      // Instruction to update metadata, adding custom field
      // This instruction will either update the value of an existing field or add it to additional_metadata if it does not already exist. 
      // Note that you may need to reallocate more space to the account to accommodate the additional data. In this example, 
      // we allocated all the lamports required for rent up front when creating the account.
      const updateFieldInstruction = 
        createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
          metadata: mint, // Account address that holds the metadata
          updateAuthority: updateAuthority, // Authority that can update the metadata
          field: metaData.additionalMetadata[0][0], // key
          value: metaData.additionalMetadata[0][1], // value
        });

      // Add instructions to new transaction
      const transaction = new Transaction().add(
        createAccountInstruction,
        initializeMetadataPointerInstruction,
        // note: the above instructions are required before initializing the mint
        initializeMintInstruction,
        initializeMetadataInstruction,
        updateFieldInstruction,
      );

      const txHash = await sendTransaction(transaction, connection);

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      // Send transaction
      const transactionSignature = await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature: txHash,
      });

      console.log(
        "\nCreate Mint Account:",
        `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
      );
  }

  // Remove a key from the metadata account
  async function removeMetadata() {
    // Instruction to remove a key from the metadata
    const removeKeyInstruction = 
      createRemoveKeyInstruction({
        programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
        metadata: mint, // Address of the metadata
        updateAuthority: updateAuthority, // Authority that can update the metadata
        key: metaData.additionalMetadata[0][0], // Key to remove from the metadata
        idempotent: true, // If the idempotent flag is set to true, then the instruction will not error if the key does not exist
      });

    // Add instruction to new transaction
    const transaction = new Transaction().add(removeKeyInstruction);

    // Send transaction
    const txHash = await sendTransaction(transaction, connection);

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    //Confirm transaction
    const transactionSignature = await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature: txHash,
    });

    console.log(
      "\nRemove Additional Metadata Field:",
      `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`,
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
      mint,
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );

    // Retrieve and log the metadata pointer state
    const metadataPointer = getMetadataPointerState(mintInfo);
    console.log("\nMetadata Pointer:", JSON.stringify(metadataPointer, null, 2));

    // Retrieve and log the metadata state
    const metadata = await getTokenMetadata(
      connection,
      mint, // Mint Account address
    );
    console.log("\nMetadata:", JSON.stringify(metadata, null, 2));
  }
  

  return (
      <ContextProvider>
        <div>
          <h1>Token Metadata</h1>
        </div>
      </ContextProvider>
      
  )
}