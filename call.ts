import {
    MultiSigValidation,
} from './src/contracts/ministate';
import {
    bsv,
    WhatsonchainProvider,
    MethodCallOptions,
    PubKey,
    findSigs,
    FixedArray,
    Addr,
    hash160,
} from 'scrypt-ts';
import { getDefaultSigner } from './tests/utils/txHelper'
import * as dotenv from 'dotenv';

// Load the .env file
dotenv.config();

if (!process.env.PRIVATE_KEY) {
    throw new Error('No "PRIVATE_KEY" found in .env, Please run "npm run genprivkey" to generate a private key');
}

const signerPrivateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '');

async function main(txId: string, atOutputIndex = 0) {
    await MultiSigValidation.loadArtifact();

    const provider = new WhatsonchainProvider(bsv.Networks.mainnet);
    const txResponse = await provider.getTransaction(txId);

    // Reconstruct the contract instance from the existing transaction
    const instance = MultiSigValidation.fromTx(txResponse, atOutputIndex);

    const privateKeys: bsv.PrivateKey[] = [
        bsv.PrivateKey.fromWIF(signerPrivateKey.toString()),
        bsv.PrivateKey.fromWIF('L3rjyArDQLsB3vCtX31rdyyxWyX21rJLHPxYbLmECjNRh7yA3bsu')
    ];
    
    await instance.connect(getDefaultSigner(privateKeys));

    const publicKeys = privateKeys.map(pk => pk.publicKey);

    const newPrivateKeys: bsv.PrivateKey[] = [
        bsv.PrivateKey.fromWIF(signerPrivateKey.toString()),
        bsv.PrivateKey.fromWIF('Kx9gABYDpmjCTf1YqgumSJ7ADV2hWXqQZKL4i6TxMXzAqda339Kk')
    ];

    const newPublicKeys = newPrivateKeys.map(pk => pk.publicKey);
    const newAddresses: FixedArray<Addr, 2> = newPublicKeys.map(pubKey => Addr(hash160(pubKey.toString()))) as FixedArray<Addr, 2>;

    try {
        // 1. Create the next instance
        const nextInstance = instance.next();

        // 2. Apply the state updates (update addresses and isValid)
        nextInstance.addresses = newAddresses;
        nextInstance.isValid = true; // Update the `isValid` property

        // 3. Call the unlockAndTransfer method to update the state on-chain
        const callContract = async () =>
            instance.methods.unlockAndTransfer(
                (sigResps) => findSigs(sigResps, publicKeys),
                publicKeys.map((publicKey) => PubKey(publicKey.toByteString())),
                newAddresses,
                {
                    // Pass updated state
                    next: {
                        instance: nextInstance,
                        balance: 10,
                    },
                    pubKeyOrAddrToSign: publicKeys
                } as MethodCallOptions<MultiSigValidation>
            );

        const { tx: unlockTx } = await callContract();

        console.log(`Called "unlockAndTransfer". TxId: ${unlockTx.id}`);

        if (unlockTx && unlockTx.id) {
            console.log(`Transaction successfully published with ID: ${unlockTx.id}`);
        } else {
            console.error('Transaction was not published successfully.');
        }

    } catch (error) {
        console.error('Contract call failed:', error);
    }
}

// Replace with your actual transaction ID
main('85e492ee948d48808d53cb4466e43de7593e2a663c997fb8b8afbb8c4840558a');
