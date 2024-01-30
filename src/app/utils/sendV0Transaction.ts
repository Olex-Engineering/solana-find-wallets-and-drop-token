import { Wallet } from '@solana/wallet-adapter-react';
import * as web3 from '@solana/web3.js';

export async function sendV0Transaction(
    connection: web3.Connection,
    user: web3.PublicKey,
    wallet: Wallet,
    instructions: web3.TransactionInstruction[],
    lookupTableAccounts?: web3.AddressLookupTableAccount[],
) {
    // Get the latest blockhash and last valid block height
    const { lastValidBlockHeight, blockhash } =
        await connection.getLatestBlockhash();

    // Create a new transaction message with the provided instructions
    const messageV0 = new web3.TransactionMessage({
        payerKey: user, // The payer (i.e., the account that will pay for the transaction fees)
        recentBlockhash: blockhash, // The blockhash of the most recent block
        instructions, // The instructions to include in the transaction
    }).compileToV0Message(
        lookupTableAccounts ? lookupTableAccounts : undefined,
    );

    // Create a new transaction object with the message
    const transaction = new web3.VersionedTransaction(messageV0);

    // Send the transaction to the cluster
    const txid = await wallet.adapter.sendTransaction(transaction, connection);

    // Confirm the transaction
    await connection.confirmTransaction(
        {
            blockhash: blockhash,
            lastValidBlockHeight: lastValidBlockHeight,
            signature: txid,
        },
        "finalized",
    );

    // Log the transaction URL on the Solana Explorer
    console.log(`https://explorer.solana.com/tx/${txid}`);
}