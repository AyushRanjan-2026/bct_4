// Simple JSON-based claims storage for development/demo
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLAIMS_FILE = path.join(__dirname, 'claims-storage.json');

// Initialize claims storage
function initClaimsStorage() {
    if (!fs.existsSync(CLAIMS_FILE)) {
        fs.writeFileSync(CLAIMS_FILE, JSON.stringify([], null, 2));
    }
}

// Get all claims from JSON storage
export function getStoredClaims() {
    try {
        initClaimsStorage();
        const data = fs.readFileSync(CLAIMS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading claims:', error);
        return [];
    }
}

// Save a new claim
export function saveClaim(claimData) {
    try {
        initClaimsStorage();
        const claims = getStoredClaims();

        // Generate claim ID if not provided
        if (!claimData.claimId) {
            claimData.claimId = `claim-${Date.now()}`;
        }

        // Add timestamp if not provided
        if (!claimData.createdAt) {
            claimData.createdAt = new Date().toISOString();
        }

        // Set default status if not provided
        if (!claimData.status) {
            claimData.status = 'Submitted';
        }

        claims.push(claimData);
        fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));

        return claimData;
    } catch (error) {
        console.error('Error saving claim:', error);
        throw error;
    }
}

// Get claims by provider wallet
export function getClaimsByProvider(providerWallet) {
    try {
        const claims = getStoredClaims();
        return claims.filter(
            claim => claim.providerWallet?.toLowerCase() === providerWallet.toLowerCase() ||
                claim.provider?.toLowerCase() === providerWallet.toLowerCase()
        );
    } catch (error) {
        console.error('Error getting claims by provider:', error);
        return [];
    }
}

// Update claim status
export function updateClaimStatus(claimId, status, additionalData = {}) {
    try {
        const claims = getStoredClaims();
        const claimIndex = claims.findIndex(c => c.claimId === claimId);

        if (claimIndex === -1) {
            throw new Error('Claim not found');
        }

        claims[claimIndex] = {
            ...claims[claimIndex],
            status,
            ...additionalData,
            updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(CLAIMS_FILE, JSON.stringify(claims, null, 2));
        return claims[claimIndex];
    } catch (error) {
        console.error('Error updating claim status:', error);
        throw error;
    }
}
