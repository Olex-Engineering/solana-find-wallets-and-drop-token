'use client';

import { Button, Input, Spinner, Textarea } from "@nextui-org/react";
import { FormEventHandler, useState } from "react";
import { NDOGE_DECIMALS, TARGET_TOKEN_MINT_DEFAULT, USDC_MINT, USDT_MINT } from "./utils/constants";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AddressLookupTableProgram, ConfirmedSignatureInfo, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, amountToUiAmount, createAssociatedTokenAccountInstruction, createTransferInstruction, getAccount, getAssociatedTokenAddressSync, getMultipleAccounts, getOrCreateAssociatedTokenAccount, transfer, transferInstructionData } from "@solana/spl-token";
import { initializeLookupTable } from "./utils/initializeLookupTable";
import { waitForNewBlock } from "./utils/waitForNewBlock";
import { sendV0Transaction } from "./utils/sendV0Transaction";

export default function Home() {
  const [targetTokenMint, setTargetTokenMint] = useState<string>(TARGET_TOKEN_MINT_DEFAULT);
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
  const [walletToFindAmount, setWalletToFindAmount] = useState('50');
  const [tokenToSendAmount, setTokenToSendAmount] = useState('1');
  const [walletMinUSDT, setWalletMinUSDT] = useState('500');
  const [walletMinSOL, setWalletMinSOL] = useState('5');
  const [walletsAddresses, setWalletAddresses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabelMessage, setLoadingLabelMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [heliusApiKey, setHeliusApiKey] = useState('ef34019b-972a-4eb3-9f91-a079c504b73f');

  const { connection } = useConnection();
  const { wallet } = useWallet();

  const onTokesAddressChange = (val: string) => {
    let addresses = val.split(',').map((address) => address.trim());
    setTokenAddresses(addresses)
  }

  const findWallets = async (): Promise<string[]> => {
    let walletsToSend: string[] = [];

    for (let tokenAddressIndex = 0; tokenAddressIndex < tokenAddresses.length; tokenAddressIndex++) {
      const address = tokenAddresses[tokenAddressIndex];

      let latesTransfer;

      while(walletsToSend.length <= +walletToFindAmount) {
        let url = `https://api.helius.xyz/v0/addresses/${address}/transactions?type=SWAP&api-key=${heliusApiKey}`
        
        if (latesTransfer) {
          url += `&before=${latesTransfer}`;
        }

        let transfers = [];

        try {
          const response = await fetch(url);
          transfers = await response.json();
        } catch (error) {
          await new Promise(r => setTimeout(r, 4000));
        }
   
        const onlyBuyTransfers = transfers.filter((transfer: { feePayer: any; tokenTransfers: any; nativeTransfers: any; }) => {
          const userAccount = transfer.feePayer;
          const targetTransfer = [...transfer.tokenTransfers, ...transfer.nativeTransfers].find((tranfer) => tranfer.mint === address);

          return targetTransfer?.toUserAccount === userAccount;
        });

        latesTransfer = transfers[transfers.length - 1]?.signature;

        let wallets = onlyBuyTransfers
          .map((transfer: { feePayer: any; }) => transfer.feePayer);

        const filteredWallets: string[] = [];

        for (let i = 0; i < wallets.length; i++) {
          const balance = await connection.getBalance(new PublicKey(wallets[i]));
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallets[i]), {
            programId: TOKEN_PROGRAM_ID
          });
          
          const targetTokenAccount = tokenAccounts.value.find((tokenAccount) => tokenAccount.account.data.parsed?.info?.mint === TARGET_TOKEN_MINT_DEFAULT);
          const USDTTokenAccount = tokenAccounts.value.find((tokenAccount) => tokenAccount.account.data.parsed?.info?.mint === USDT_MINT);
          const USDCTokenAccount = tokenAccounts.value.find((tokenAccount) => tokenAccount.account.data.parsed?.info?.mint === USDC_MINT);

          const USDCAmount = USDCTokenAccount?.account.data.parsed.info.tokenAmount.uiAmount || 0;
          const USDTAmount = USDTTokenAccount?.account.data.parsed.info.tokenAmount.uiAmount || 0;
          const SOLAmount = balance / LAMPORTS_PER_SOL;

          if (
            !targetTokenAccount
            && PublicKey.isOnCurve(new PublicKey(wallets[i]))
            && !filteredWallets.includes(wallets[i])
            && !walletsToSend.includes(wallets[i])
            && (USDCAmount > +walletMinUSDT || USDTAmount > +walletMinUSDT || SOLAmount > +walletMinSOL)) {
            filteredWallets.push(wallets[i]);
          }
        }

        walletsToSend = [...walletsToSend, ...filteredWallets];
        console.log(walletsToSend.length);
      }
    }

    return walletsToSend;
  }

  const sendTransactions = async (walletsToSend: string[]) => {
    if (!wallet?.adapter.publicKey) {
      return;
    }

    const senderWallet = wallet?.adapter.publicKey;

    const senderAtaAccount = getAssociatedTokenAddressSync(new PublicKey(targetTokenMint), senderWallet);
    const ataToSend: PublicKey[] = [];

    const createTokenAccountInstructions = [];

    for (let i = 0; i < walletsToSend.length; i++) {
      const ata = getAssociatedTokenAddressSync(new PublicKey(targetTokenMint), new PublicKey(walletsToSend[i]));
      ataToSend.push(ata);

      createTokenAccountInstructions.push(createAssociatedTokenAccountInstruction(
        senderWallet,
        ata,
        new PublicKey(walletsToSend[i]),
        new PublicKey(targetTokenMint))
      );
    }

    setLoadingLabelMessage('Being ready to drop...');

    const lookupTableAddress = await initializeLookupTable(
        senderWallet,
        connection,
        wallet,
        ataToSend,
    );


    await waitForNewBlock(connection, 1);

    const lookupTableAccount = (
        await connection.getAddressLookupTable(lookupTableAddress)
    ).value;

    if (!lookupTableAccount) {
        throw new Error("Lookup table not found");
    }

    try {
      const toSendAmount = (+tokenToSendAmount) * Math.pow(10, NDOGE_DECIMALS);
      console.log(toSendAmount);

      const transferInstructions = ataToSend.map((recipient) => {
          return createTransferInstruction(senderAtaAccount, recipient, senderWallet, toSendAmount || 100)
      });

      setLoadingLabelMessage('Sending!');

      // await sendV0Transaction(connection, senderWallet, wallet, createTokenAccountInstructions, [
      //   lookupTableAccount,
      // ]);

      // await waitForNewBlock(connection, 1);

      await sendV0Transaction(connection, senderWallet, wallet, [...createTokenAccountInstructions, ...transferInstructions], [
          lookupTableAccount,
      ]);
    } catch (error) {
      console.warn(error);
    }

    setLoadingLabelMessage('Get your money back (for lookup table)...');

    const deactivateLookupTableInst = AddressLookupTableProgram.deactivateLookupTable({
      lookupTable: lookupTableAddress,
      authority: senderWallet
    });

    const closeLookupTableInst = AddressLookupTableProgram.closeLookupTable({
      lookupTable: lookupTableAddress,
      authority: senderWallet,
      recipient: senderWallet
    });

    try {
      await sendV0Transaction(connection, senderWallet, wallet, [deactivateLookupTableInst]);
      await waitForNewBlock(connection, 513);
      await sendV0Transaction(connection, senderWallet, wallet, [closeLookupTableInst]);
    } catch {
      setIsLoading(false);
      setErrorMessage(`Failed to close table, please do this action manually. Table address: ${lookupTableAddress.toBase58()}`)
    }
    
  }

  const onFormSubmit: FormEventHandler = async (event) => {
    event.preventDefault();

    setLoadingLabelMessage('Fetching accounts...');
    setIsLoading(true);
    setWalletAddresses([]);
    const walletsToSend = await findWallets();
    setWalletAddresses(walletsToSend);
    await sendTransactions(walletsToSend);
    setIsLoading(false);
  }

  return (
    <div className={'max-w-6xl py-2 px-4 mt-6 mx-auto'}>
      <h1 className={'mb-6'}>Send tokens to wallets with high value($)</h1>
      <form onSubmit={onFormSubmit}>
        <Textarea
          label={'Token addresses'}
          isRequired={true}
          variant={'bordered'}
          placeholder={'Split token addresses by coma'}
          onValueChange={onTokesAddressChange}
          className={'mb-4'}
        >
        </Textarea>
        <div className={'flex mb-4'}>
          <Input
            label={'Token to send mint'}
            isRequired={true}
            variant={'bordered'}
            value={targetTokenMint}
            onValueChange={setTargetTokenMint}
            className={'mr-2'}
          ></Input>
          <Input
            label={'Token to send amount (per wallet)'}
            isRequired={true}
            variant={'bordered'}
            type={'number'}
            value={tokenToSendAmount}
            onValueChange={setTokenToSendAmount}
          ></Input>
          <Input
            label={'Wallets to find amount (per token)'}
            isRequired={true}
            variant={'bordered'}
            value={walletToFindAmount}
            onValueChange={setWalletToFindAmount}
            type={'number'}
            className={'mr-2'}
          ></Input>
        </div>
        <div className={'flex mb-4'}>
          <Input
            label={'Wallet min USDC/USDT'}
            isRequired={true}
            variant={'bordered'}
            type={'number'}
            value={walletMinUSDT}
            className={'mr-2'}
            onValueChange={setWalletMinUSDT}
          ></Input>
          <Input
            label={'Wallet min SOL'}
            isRequired={true}
            variant={'bordered'}
            type={'number'}
            value={walletMinSOL}
            onValueChange={setWalletMinSOL}
          ></Input>
        </div>
        <div className={'mb-4'}>
        <Input
            label={'Helius api key'}
            isRequired={true}
            variant={'bordered'}
            value={heliusApiKey}
            onValueChange={setHeliusApiKey}
          ></Input>
        </div>
        <Textarea
          label={'Wallet addresses'}
          isDisabled={!walletsAddresses.length}
          variant={'bordered'}
          value={walletsAddresses.join(',')}
          className={'mb-4'}
        ></Textarea>
        <div className={'flex mt-6'}>
          { isLoading ? <Spinner label={loadingLabelMessage} color={'secondary'}></Spinner> :
            <Button className={'mr-4'} variant={'shadow'} color={'primary'} type={'submit'}>
              Find addresses and send
            </Button>
          }
        </div>
        {!!errorMessage && 
          <div className={'flex mt-6'}>
            {errorMessage}
          </div>
        }
      </form>
    </div>
    
  );
}
