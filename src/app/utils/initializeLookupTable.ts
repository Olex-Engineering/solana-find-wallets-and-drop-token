import * as web3 from '@solana/web3.js';
import { sendV0Transaction } from './sendV0Transaction';
import { Wallet } from '@solana/wallet-adapter-react';

export async function initializeLookupTable(
    user: web3.PublicKey,
    connection: web3.Connection,
    wallet: Wallet,
    addresses: web3.PublicKey[],
): Promise<web3.PublicKey> {
    // Get the current slot
    const slot = await connection.getSlot();

    // Create an instruction for creating a lookup table
    // and retrieve the address of the new lookup table
    const [lookupTableInst, lookupTableAddress] =
        web3.AddressLookupTableProgram.createLookupTable({
            authority: user, // The authority (i.e., the account with permission to modify the lookup table)
            payer: user, // The payer (i.e., the account that will pay for the transaction fees)
            recentSlot: slot - 1, // The recent slot to derive lookup table's address
        });
    console.log("lookup table address:", lookupTableAddress.toBase58());

    // Create an instruction to extend a lookup table with the provided addresses
    const extendInstruction = web3.AddressLookupTableProgram.extendLookupTable({
        payer: user, // The payer (i.e., the account that will pay for the transaction fees)
        authority: user, // The authority (i.e., the account with permission to modify the lookup table)
        lookupTable: lookupTableAddress, // The address of the lookup table to extend
        addresses: addresses.slice(0, 30), // The addresses to add to the lookup table
    });

    await sendV0Transaction(connection, user, wallet, [
        lookupTableInst,
        extendInstruction,
    ]);

    var remaining = addresses.slice(30);

    while (remaining.length > 0) {
        const toAdd = remaining.slice(0, 30);
        remaining = remaining.slice(30);
        const extendInstruction =
            web3.AddressLookupTableProgram.extendLookupTable({
                payer: user, // The payer (i.e., the account that will pay for the transaction fees)
                authority: user, // The authority (i.e., the account with permission to modify the lookup table)
                lookupTable: lookupTableAddress, // The address of the lookup table to extend
                addresses: toAdd, // The addresses to add to the lookup table
            });

        await sendV0Transaction(connection, user, wallet, [extendInstruction]);
    }

    console.log()

    return lookupTableAddress;
}