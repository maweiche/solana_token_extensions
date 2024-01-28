import {
    TokenMetadata,
} from "@solana/spl-token-metadata";


export default function MetadataUi(
    { metadata }: { metadata: TokenMetadata },
) {
    return (
        <code
            style={{
                display: "block",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
            }}
            className='bg-gray-100 p-4 shadow-lg'
        >
            {JSON.stringify(metadata, null, 2)}
        </code>
    );
}