import { useEffect, useState } from 'react';
import {
    Connection,
    PublicKey
} from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    getInterestBearingMintConfigState,
    getMint,
} from "@solana/spl-token";

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
    const rpcEndpoint = process.env.NEXT_PUBLIC_HELIUS_RPC!;
    const connection = new Connection(rpcEndpoint, "confirmed");

    async function getInterestDetails() {
        // Fetch Mint Account data
        const mintAccount = await getMint(
            connection,
            new PublicKey(mint), // Mint Account Address
            undefined, // Optional commitment
            TOKEN_2022_PROGRAM_ID, // Token Extension Program ID
        );
        
        // Get Interest Config for Mint Account
        const interestBearingMintConfig = getInterestBearingMintConfigState(
            mintAccount,
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
        <table className='table-auto shadow-lg bg-white border-collapse'>
            <thead>
                <tr>
                    <th className='bg-blue-100 border text-left px-8 py-4'>Rate Authority</th>
                    <th className='bg-blue-100 border text-left px-8 py-4'>Init Time</th>
                    <th className='bg-blue-100 border text-left px-8 py-4'>Init Avg Rate</th>
                    <th className='bg-blue-100 border text-left px-8 py-4'>Last Update Time</th>
                    <th className='bg-blue-100 border text-left px-8 py-4'>Current Rate</th>
                </tr>
            </thead>
            <tbody>
                <tr className='hover:bg-gray-50 focus:bg-gray-300 active:bg-red-200' tabIndex={0}>
                    <td className='border px-8 py-4'>{interestConfig?.rateAuthority.slice(0,4)}...{interestConfig?.rateAuthority.slice(-4)}</td>
                    <td className='border px-8 py-4'>{new Date(Number(interestConfig?.initializationTimestamp) * 1000).toLocaleString()}</td> 
                    <td className='border px-8 py-4'>{interestConfig?.preUpdateAverageRate}</td>
                    <td className='border px-8 py-4'>{new Date(Number(interestConfig?.lastUpdateTimestamp) * 1000).toLocaleString()}</td>
                    <td className='border px-8 py-4'>{interestConfig?.currentRate}</td>
                </tr>
            </tbody>
        </table>
    );
}