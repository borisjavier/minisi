import {
    MultiSigValidation
} from './src/contracts/ministate'
import {
    bsv,
    TestWallet,
    DefaultProvider,
    Addr,
    FixedArray,
    hash160,
    PubKey
} from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Cargar el archivo .env
dotenv.config()

if (!process.env.PRIVATE_KEY) {
    throw new Error("No \"PRIVATE_KEY\" found in .env, Please run \"npm run genprivkey\" to generate a private key")
}

// Leer la clave privada del archivo .env
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// Preparar el signer
const signer = new TestWallet(
    privateKey,
    new DefaultProvider({
        network: bsv.Networks.mainnet,
    })
)

async function main() {
    await MultiSigValidation.loadArtifact()

    // Cantidad de satoshis a bloquear en el contrato
    const amount = 10;

    // Claves públicas para el multisig
    const publicKeys: PubKey[] = [
        PubKey(bsv.PublicKey.fromString('02756124ad22f010cbb995161df7652e6a223d6875cf50e3d6580b75d86d7ff06d').toHex()),
        PubKey(bsv.PublicKey.fromString('02d9b4d8362ac9ed90ef2a7433ffbeeb1a14f1e6a0db7e3d9963f6c0629f43e2db').toHex())
    ]

    // Convertir las claves públicas a direcciones usando hash160 y envolviendo en Addr
    const addresses: FixedArray<Addr, 2> = publicKeys.map(pubKey => Addr(hash160(pubKey.toString()))) as FixedArray<Addr, 2>

    const instance = new MultiSigValidation(addresses)

    // Conectar al signer
    await instance.connect(signer)

    // Desplegar el contrato
    const deployTx = await instance.deploy(amount)
    console.log(`MultiSigValidation contract deployed: ${deployTx.id}`)
}

main()

