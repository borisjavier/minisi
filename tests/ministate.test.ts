import { expect, use } from 'chai'
import { Ministate } from '../src/contracts/ministate'
import { getDefaultSigner } from './utils/txHelper'
import { MethodCallOptions } from 'scrypt-ts'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test SmartContract `Ministate`', () => {
    before(async () => {
        await Ministate.loadArtifact()
    })

    it('should pass the public method unit test successfully.', async () => {
        // Create an initial instance of the counter smart contract.
        const counter = new Ministate(0n)
        await counter.connect(getDefaultSigner())

        // Deploy the instance.
        const deployTx = await counter.deploy(1)
        console.log(`Deployed contract "Ministate": ${deployTx.id}`)

        let prevInstance = counter

        // Perform multiple contract calls:
        for (let i = 0; i < 3; i++) {
            // 1. Build a new contract instance.
            const newMinistate = prevInstance.next()

            // 2. Apply updates on the new instance in accordance to the contracts requirements.
            newMinistate.increment()

            // 3. Perform the contract call.
            const call = async () => {
                const callRes = await prevInstance.methods.incrementOnChain({
                    next: {
                        instance: newMinistate,
                        balance: 1,
                    },
                } as MethodCallOptions<Ministate>)
                
                console.log(`Called "incrementOnChain" method: ${callRes.tx.id}`)
            }
            await expect(call()).not.to.be.rejected

            // Set new instance as the current one.
            prevInstance = newMinistate
        }
    })
})
