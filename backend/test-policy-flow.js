
import { addPolicyRequest, getPolicyRequests, updatePolicyRequest } from './vc-service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const POLICY_FILE = path.join(__dirname, 'policy-requests.json');

console.log('Testing policy request flow...');

try {
    // 1. Check file access
    console.log('Policy file path:', POLICY_FILE);
    if (fs.existsSync(POLICY_FILE)) {
        console.log('Policy file exists.');
    } else {
        console.log('Policy file does not exist. It should be created.');
    }

    // 2. Add a request
    console.log('Adding new policy request...');
    const newRequest = addPolicyRequest({
        patientDid: 'did:test:patient',
        patientAddress: '0x123',
        coverageAmount: '1000',
        details: { note: 'test' }
    });
    console.log('Request added:', newRequest.id);

    // 3. Verify it's saved
    const requests = getPolicyRequests();
    const saved = requests.find(r => r.id === newRequest.id);

    if (saved) {
        console.log('✅ Request persisted successfully.');
    } else {
        console.error('❌ Request NOT found in storage.');
    }

    // 4. Update status (simulating issuance)
    console.log('Updating request status to approved...');
    updatePolicyRequest(newRequest.id, { status: 'approved' });

    const updatedRequests = getPolicyRequests();
    const updated = updatedRequests.find(r => r.id === newRequest.id);

    if (updated.status === 'approved') {
        console.log('✅ Request status updated successfully.');
    } else {
        console.error('❌ Request status update FAILED.');
    }

} catch (error) {
    console.error('Test failed:', error);
}
