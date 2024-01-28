import { useEffect, useState } from 'react';
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
    updateRateInterestBearingMint,
    createInitializeInterestBearingMintInstruction,
    createInitializeMintInstruction,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    amountToUiAmount,
    getInterestBearingMintConfigState,
    getMint,
  } from "@solana/spl-token";

// Mint Config: {
//   "rateAuthority": "7wK3jPMYjpZHZAghjersW6hBNMgi9VAGr75AhYRqR2n",
//   "initializationTimestamp": 1706433803,
//   "preUpdateAverageRate": 32767,
//   "lastUpdateTimestamp": 1706433803,
//   "currentRate": 32767
// }

type MintConfig = {
    rateAuthority: string;
    initializationTimestamp: bigint;
    preUpdateAverageRate: number;
    lastUpdateTimestamp: bigint;
    currentRate: number;
}

export default function InterestUi(
    { mint }: { mint: string },
) {
    const [interestConfig, setInterestConfig] = useState<MintConfig>();
    const { publicKey } = useWallet();
    const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
    const connection = new Connection(rpcEndpoint, "confirmed");

    async function updateInterest() {
        try {
            console.log('mint', mint)
            // send the metadata to the /api/mint endpoint
            const res = await fetch("/api/updateInterest", {
            method: "POST",
            body: JSON.stringify({ 
                mint: mint, // Mint Account address
                publicKey: publicKey, // Wallet address
            }),
            headers: {
                "Content-Type": "application/json",
            },
            });
    
            const mintData = await res.json();
    
            console.log('mintData', mintData)
    
    
        } catch (err) {
            // unpack the response
            console.log('err', err)
        }
          
    }

    async function getInterestDetails() {
        // Fetch Mint Account data
        const mintAccount = await getMint(
            connection,
            new PublicKey(mint), // Mint Account Address
            undefined, // Optional commitment
            TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
        );
        
        // Get Interest Config for Mint Account
        const interestBearingMintConfig = await getInterestBearingMintConfigState(
            mintAccount, // Mint Account data
        );

        if (!interestBearingMintConfig) {
            throw new Error("Interest Bearing Mint Config not found");
        }

        const config = {
            rateAuthority: interestBearingMintConfig.rateAuthority.toString(),
            initializationTimestamp: interestBearingMintConfig.initializationTimestamp,
            preUpdateAverageRate: interestBearingMintConfig.preUpdateAverageRate,
            lastUpdateTimestamp: interestBearingMintConfig.lastUpdateTimestamp,
            currentRate: interestBearingMintConfig.currentRate,
        }
        
        console.log(
            "\nMint Config:",
            JSON.stringify(interestBearingMintConfig, null, 2),
        );
        
        setInterestConfig(config);
    }

    useEffect(() => {
        if(!interestConfig){
            getInterestDetails();
        }
    }, []);

    return (
        <div className='flex flex-col border-2 border-black rounded-md p-4 space-y-2 justify-center items-center'>
            <h1>Interest</h1>
            <table className='table-auto'>
                <thead>
                    <tr>
                        <th>Rate Authority</th>
                        <th>Initialization Timestamp</th>
                        <th>Pre-Update Average Rate</th>
                        <th>Last Update Timestamp</th>
                        <th>Current Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{interestConfig?.rateAuthority.slice(0,4)}...{interestConfig?.rateAuthority.slice(-4)}</td>
                        <td>{new Date(Number(interestConfig?.initializationTimestamp) * 1000).toLocaleString()}</td> 
                        <td>{interestConfig?.preUpdateAverageRate}</td>
                        <td>{new Date(Number(interestConfig?.lastUpdateTimestamp) * 1000).toLocaleString()}</td>
                        <td>{interestConfig?.currentRate}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}