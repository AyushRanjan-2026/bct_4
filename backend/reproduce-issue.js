
import { createDID, issueVC } from './vc-service.js';

async function test() {
    try {
        console.log('1. Creating new DID...');
        const did = await createDID();
        console.log('   DID Created:', did);

        console.log('2. Attempting to issue VC with this DID...');
        const credential = {
            credentialSubject: {
                id: 'did:example:123',
                role: 'test',
                data: { foo: 'bar' }
            }
        };

        const result = await issueVC(credential, did);
        console.log('✅ VC Issued successfully!');
        console.log('   VC ID:', result.vc.id);

    } catch (error) {
        console.error('❌ Test Failed:', error.message);
    }
}

test();
