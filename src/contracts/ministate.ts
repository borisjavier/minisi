import {
    SmartContract,
    method,
    assert,
    FixedArray,
    Addr,
    Sig,
    PubKey,
    prop,
    hash160,
    Ripemd160,
    hash256,
    ByteString
} from 'scrypt-ts';


export class MultiSigValidation extends SmartContract {
    @prop(true)
    addresses: FixedArray<Addr, 2>;

    @prop(true)
    isValid: boolean;

    constructor(addresses: FixedArray<Addr, 2>) {
        super(addresses);
        this.addresses = addresses;
        this.isValid = true;
    }

    @method()
    public unlock(signatures: FixedArray<Sig, 2>, publicKeys: FixedArray<PubKey, 2>) {
        // Verificar que las llaves públicas coincidan con las direcciones proporcionadas.
        for (let i = 0; i < 2; i++) {
            const pubKeyHash: Ripemd160 = hash160(publicKeys[i]);
            assert(pubKeyHash == this.addresses[i], 'Address mismatch');
        }
        // Verificar firmas usando checkMultiSig.
        assert(this.checkMultiSig(signatures, publicKeys), 'Signature verification failed');
    }

@method()
public unlockAndTransfer(
    signatures: FixedArray<Sig, 2>,
    publicKeys: FixedArray<PubKey, 2>,
    newAddresses: FixedArray<Addr, 2>
) {   
    // Verificar que las llaves públicas coincidan con las direcciones proporcionadas.
    for (let i = 0; i < 2; i++) {
        const pubKeyHash: Ripemd160 = hash160(publicKeys[i]);
        assert(pubKeyHash == this.addresses[i], 'Address mismatch');
    }

    // Verificar firmas usando checkMultiSig.
    assert(this.checkMultiSig(signatures, publicKeys), 'Signature verification failed');
    
    // Cambiar la propiedad y actualizar el estado.
    this.addresses = newAddresses;
    // Obtener el valor del UTXO actual.
    const amount: bigint = this.ctx.utxo.value;//1n;

    //console.log('this.ctx: ', this.ctx)
    // Construir el output con el nuevo estado.

    let outputs: ByteString = this.buildStateOutput(amount);

    // Construir el output de cambio.
    if(this.changeAmount > 0n) {
        outputs += this.buildChangeOutput()
    }
    this.debug.diffOutputs(outputs);
    // Verificar que los outputs coinciden.
    assert(this.ctx.hashOutputs === hash256(outputs), `Hash mismatch: expected ${this.ctx.hashOutputs}, got ${hash256(outputs)}`);
}
}
