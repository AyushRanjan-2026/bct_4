
import { getStoredClaims, saveClaim } from './claims-storage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Current directory:', __dirname);
console.log('Testing claims storage...');

try {
    const claims = getStoredClaims();
    console.log('Stored claims:', claims);

    if (claims.length === 0) {
        console.log('No claims found. Saving a test claim...');
        saveClaim({
            providerWallet: '0x123',
            amount: '100',
            policyId: 'test-policy'
        });
        console.log('Test claim saved.');
    }

    const claimsAfter = getStoredClaims();
    console.log('Claims after save:', claimsAfter);

} catch (error) {
    console.error('Test failed:', error);
}
