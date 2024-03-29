import * as web3 from '@solana/web3.js';

export function waitForNewBlock(connection: web3.Connection, targetHeight: number) {
    console.log(`Waiting for ${targetHeight} new blocks`);
    return new Promise(async (resolve: any) => {
        // Get the last valid block height of the blockchain
        const { lastValidBlockHeight } = await connection.getLatestBlockhash();

        // Set an interval to check for new blocks every 1000ms
        const intervalId = setInterval(async () => {
            // Get the new valid block height
            const { lastValidBlockHeight: newValidBlockHeight } =
                await connection.getLatestBlockhash();
            // console.log(newValidBlockHeight)

            // Check if the new valid block height is greater than the target block height
            if (newValidBlockHeight > lastValidBlockHeight + targetHeight) {
                // If the target block height is reached, clear the interval and resolve the promise
                clearInterval(intervalId);
                resolve();
            }
        }, 1000);
    });
}