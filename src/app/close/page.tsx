'use client';

import { Button, Input, Spinner } from "@nextui-org/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AddressLookupTableProgram, PublicKey } from "@solana/web3.js";
import { FormEventHandler, useState } from "react";
import { sendV0Transaction } from "../utils/sendV0Transaction";

export default function CloseTable() {
    const [lookupTableAddress, setLookupTableAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { wallet } = useWallet();
    const { connection } = useConnection();

    const onFormSubmit: FormEventHandler = async (event) => {
        event.preventDefault();

        if (!wallet?.adapter.publicKey) {
            return;
        }

        setIsLoading(true);

        const closeLookupTableInst = AddressLookupTableProgram.closeLookupTable({
            lookupTable: new PublicKey(lookupTableAddress),
            authority: wallet.adapter.publicKey,
            recipient: wallet.adapter.publicKey
        });
        
        sendV0Transaction(connection, wallet.adapter.publicKey, wallet, [closeLookupTableInst]);
        setIsLoading(false);
    }

    return (
        <div className={'max-w-6xl py-2 px-4 mt-6 mx-auto'}>
            <h1 className={'mb-6'}>Close lookup table manually and get money back $</h1>
            <form onSubmit={onFormSubmit}>
                <Input
                    label={'Lookup table address'}
                    placeholder={'Enter'}
                    variant={'faded'}
                    value={lookupTableAddress}
                    onValueChange={setLookupTableAddress}
                >
                </Input>

                { isLoading ?
                    <Spinner className={'mt-5'}></Spinner> :
                    <Button color={'primary'} variant={'shadow'} className={'mt-5'} type={'submit'}>
                        Close table
                    </Button>
                }
            </form>
        </div>
    );
}