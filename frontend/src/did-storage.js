// Utility functions for storing and retrieving DIDs by wallet address and role

const STORAGE_KEY_PREFIX = 'mpa_did_';

/**
 * Store DID for a wallet address and role
 * @param {string} walletAddress - The wallet address
 * @param {string} role - The role (patient, insurer, provider)
 * @param {string} did - The DID to store
 */
export function storeDID(walletAddress, role, did) {
  if (!walletAddress || !role || !did) {
    console.warn('Cannot store DID: missing walletAddress, role, or did');
    return;
  }
  const key = `${STORAGE_KEY_PREFIX}${role}_${walletAddress.toLowerCase()}`;
  try {
    localStorage.setItem(key, did);
    console.log(`✅ Stored DID for ${role} at ${walletAddress}`);
  } catch (error) {
    console.error('Error storing DID:', error);
  }
}

/**
 * Retrieve DID for a wallet address and role
 * @param {string} walletAddress - The wallet address
 * @param {string} role - The role (patient, insurer, provider)
 * @returns {string|null} The stored DID or null if not found
 */
export function getDID(walletAddress, role) {
  if (!walletAddress || !role) {
    return null;
  }
  const key = `${STORAGE_KEY_PREFIX}${role}_${walletAddress.toLowerCase()}`;
  try {
    const did = localStorage.getItem(key);
    if (did) {
      console.log(`✅ Retrieved DID for ${role} at ${walletAddress}`);
    }
    return did;
  } catch (error) {
    console.error('Error retrieving DID:', error);
    return null;
  }
}

/**
 * Remove DID for a wallet address and role
 * @param {string} walletAddress - The wallet address
 * @param {string} role - The role (patient, insurer, provider)
 */
export function removeDID(walletAddress, role) {
  if (!walletAddress || !role) {
    return;
  }
  const key = `${STORAGE_KEY_PREFIX}${role}_${walletAddress.toLowerCase()}`;
  try {
    localStorage.removeItem(key);
    console.log(`✅ Removed DID for ${role} at ${walletAddress}`);
  } catch (error) {
    console.error('Error removing DID:', error);
  }
}

/**
 * Check if wallet already has a DID for ANY role
 * @param {string} walletAddress - The wallet address
 * @returns {object|null} Object with {role, did} if found, null otherwise
 */
export function getAnyDIDForWallet(walletAddress) {
  if (!walletAddress) {
    return null;
  }
  const roles = ['patient', 'insurer', 'provider'];
  for (const role of roles) {
    const did = getDID(walletAddress, role);
    if (did) {
      return { role, did };
    }
  }
  return null;
}

/**
 * Store DID for a wallet address and role (enforces one DID per wallet)
 * @param {string} walletAddress - The wallet address
 * @param {string} role - The role (patient, insurer, provider)
 * @param {string} did - The DID to store
 * @returns {boolean} Success status
 */
export function storeDIDUnique(walletAddress, role, did) {
  if (!walletAddress || !role || !did) {
    console.warn('Cannot store DID: missing walletAddress, role, or did');
    return false;
  }

  // Check if wallet already has a DID for a different role
  // const existing = getAnyDIDForWallet(walletAddress);
  // if (existing && existing.role !== role) {
  //   console.error(`❌ Wallet ${walletAddress} already has a DID for role: ${existing.role}`);
  //   return false;
  // }

  const key = `${STORAGE_KEY_PREFIX}${role}_${walletAddress.toLowerCase()}`;
  try {
    localStorage.setItem(key, did);
    console.log(`✅ Stored DID for ${role} at ${walletAddress}`);
    return true;
  } catch (error) {
    console.error('Error storing DID:', error);
    return false;
  }
}

/**
 * Clear all DIDs (useful for testing or reset)
 */
export function clearAllDIDs() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('✅ Cleared all DIDs');
  } catch (error) {
    console.error('Error clearing DIDs:', error);
  }
}



