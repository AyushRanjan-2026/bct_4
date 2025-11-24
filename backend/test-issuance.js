
import { issueVC, createRoleCredential, addPolicyRequest, getPolicyRequests, updatePolicyRequest } from './vc-service.js';
import { createDID } from './vc-service.js';

console.log('Testing policy issuance...');

async function testIssuance() {
    try {
        // 1. Create DIDs
        const issuerDid = await createDID();
        const subjectDid = await createDID();
        console.log('Issuer DID:', issuerDid);
        console.log('Subject DID:', subjectDid);

        // 2. Create a policy request
        const request = addPolicyRequest({
            patientDid: subjectDid,
            patientAddress: '0x123',
            coverageAmount: '100',
            details: {}
        });
        console.log('Policy Request created:', request);

        // 3. Issue VC
        const credential = createRoleCredential({
            issuerDid,
            subjectDid,
            role: 'InsurancePolicy',
            data: {
                policyId: request.id,
                coverageAmount: '100'
            }
        });

        console.log('Issuing VC...');
        const result = await issueVC(credential, issuerDid);
        console.log('VC Issued:', result.vc.id);

        // 4. Verify Policy Request Status
        const requests = getPolicyRequests();
        const updatedRequest = requests.find(r => r.id === request.id);
        console.log('Updated Request Status:', updatedRequest.status);

        if (updatedRequest.status === 'approved') {
            console.log('✅ Test PASSED: Policy request approved.');
        } else {
            console.error('❌ Test FAILED: Policy request status not updated.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testIssuance();
