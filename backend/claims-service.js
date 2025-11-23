import { getProvider, getContract, getSigner } from './contract-service.js';
import { issueVC, createRoleCredential } from './vc-service.js';
import { getFromIPFS } from './ipfs-service.js';

/**
 * Get all claims from the blockchain
 * Note: This is a simplified version. In production, you'd use events or indexer
 */
export async function getAllClaims() {
  try {
    const provider = getProvider();
    const claimContract = getContract('ClaimContract', provider);
    
    // Get all claims by iterating (in production, use events or indexer)
    // For now, we'll try to get claims up to a reasonable limit
    const claims = [];
    const maxClaims = 100; // Reasonable limit
    
    for (let i = 1; i <= maxClaims; i++) {
      try {
        const claimData = await claimContract.getClaim(i);
        // Check if claim exists (claimId will be 0 for non-existent claims)
        if (claimData && BigInt(claimData.claimId.toString()) > 0n) {
          claims.push({
            claimId: claimData.claimId.toString(),
            policyId: claimData.policyId.toString(),
            provider: claimData.provider,
            beneficiary: claimData.beneficiary,
            insurer: claimData.insurer,
            ipfsHash: claimData.ipfsHash,
            vcCid: claimData.vcCid,
            amount: claimData.amount.toString(),
            state: getClaimStateName(claimData.state),
            status: getClaimStateName(claimData.state), // Alias for UI
            submitDate: claimData.submitDate.toString(),
            createdAt: new Date(Number(claimData.submitDate) * 1000).toISOString(),
            rejectionReason: claimData.rejectionReason,
          });
        } else {
          // No more claims, break
          break;
        }
      } catch (error) {
        // Claim doesn't exist, break the loop
        if (error.message && error.message.includes('Claim does not exist')) {
          break;
        }
        console.warn(`Error fetching claim ${i}:`, error.message);
        break; // Stop on error
      }
    }
    
    return claims;
  } catch (error) {
    console.error('Error getting all claims:', error);
    throw error;
  }
}

/**
 * Get claim state name from enum
 */
function getClaimStateName(state) {
  const states = ['Submitted', 'UnderReview', 'Approved', 'Rejected', 'Paid'];
  return states[state] || 'Unknown';
}

/**
 * Approve a claim and generate settlement VC
 */
export async function approveClaim(claimId, insurerDid, insurerAddress, privateKey) {
  try {
    const signer = await getSigner(privateKey);
    const claimContract = getContract('ClaimContract', signer);
    
    // Get claim details first
    const claimData = await claimContract.getClaim(claimId);
    
    // Verify insurer matches
    if (claimData.insurer.toLowerCase() !== insurerAddress.toLowerCase()) {
      throw new Error('Only the assigned insurer can approve this claim');
    }
    
    // Set under review first (if needed)
    if (claimData.state === 0) { // Submitted
      const setReviewTx = await claimContract.setUnderReview(claimId);
      await setReviewTx.wait();
    }
    
    // Approve the claim
    const approveTx = await claimContract.approveClaim(claimId);
    await approveTx.wait();
    
    // Generate Settlement VC
    const settlementVC = await generateClaimSettlementVC({
      claimId: claimId.toString(),
      policyId: claimData.policyId.toString(),
      patientDid: `did:example:${claimData.beneficiary}`,
      providerAddress: claimData.provider,
      amount: claimData.amount.toString(),
      insurerDid,
      treatmentVcCid: claimData.vcCid,
    });
    
    return {
      success: true,
      claimId: claimId.toString(),
      txHash: approveTx.hash,
      settlementVC,
    };
  } catch (error) {
    console.error('Error approving claim:', error);
    throw error;
  }
}

/**
 * Reject a claim and generate rejection VC
 */
export async function rejectClaim(claimId, reason, insurerDid, insurerAddress, privateKey) {
  try {
    const signer = await getSigner(privateKey);
    const claimContract = getContract('ClaimContract', signer);
    
    // Get claim details first
    const claimData = await claimContract.getClaim(claimId);
    
    // Verify insurer matches
    if (claimData.insurer.toLowerCase() !== insurerAddress.toLowerCase()) {
      throw new Error('Only the assigned insurer can reject this claim');
    }
    
    // Set under review first (if needed)
    if (claimData.state === 0) { // Submitted
      const setReviewTx = await claimContract.setUnderReview(claimId);
      await setReviewTx.wait();
    }
    
    // Reject the claim
    const rejectTx = await claimContract.rejectClaim(claimId, reason);
    await rejectTx.wait();
    
    // Generate Rejection VC
    const rejectionVC = await generateClaimRejectionVC({
      claimId: claimId.toString(),
      policyId: claimData.policyId.toString(),
      patientDid: `did:example:${claimData.beneficiary}`,
      providerAddress: claimData.provider,
      amount: claimData.amount.toString(),
      reason,
      insurerDid,
      treatmentVcCid: claimData.vcCid,
    });
    
    return {
      success: true,
      claimId: claimId.toString(),
      txHash: rejectTx.hash,
      rejectionVC,
    };
  } catch (error) {
    console.error('Error rejecting claim:', error);
    throw error;
  }
}

/**
 * Generate Claim Settlement VC
 */
async function generateClaimSettlementVC({ claimId, policyId, patientDid, providerAddress, amount, insurerDid, treatmentVcCid }) {
  try {
    // Fetch treatment VC from IPFS if CID is available
    let treatmentDetails = null;
    if (treatmentVcCid) {
      try {
        const treatmentVCData = await getFromIPFS(treatmentVcCid);
        if (treatmentVCData) {
          treatmentDetails = typeof treatmentVCData === 'string' 
            ? JSON.parse(treatmentVCData) 
            : treatmentVCData;
        }
      } catch (error) {
        console.warn('Could not fetch treatment VC from IPFS:', error);
      }
    }
    
    const credential = createRoleCredential({
      issuerDid,
      subjectDid: patientDid,
      role: 'ClaimSettlement',
      data: {
        credentialType: 'Claim Settlement Credential',
        claimId,
        policyId,
        providerAddress,
        settlementAmount: amount,
        settlementAmountWei: amount,
        treatmentDescription: treatmentDetails?.credentialSubject?.treatmentDescription || 'N/A',
        billAmount: treatmentDetails?.credentialSubject?.billAmount || 'N/A',
        treatmentVcCid,
        status: 'Approved',
        settlementDate: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
      },
    });
    
    const result = await issueVC(credential, insurerDid);
    
    return {
      vc: result.vc,
      cid: result.cid,
    };
  } catch (error) {
    console.error('Error generating settlement VC:', error);
    throw error;
  }
}

/**
 * Generate Claim Rejection VC
 */
async function generateClaimRejectionVC({ claimId, policyId, patientDid, providerAddress, amount, reason, insurerDid, treatmentVcCid }) {
  try {
    // Fetch treatment VC from IPFS if CID is available
    let treatmentDetails = null;
    if (treatmentVcCid) {
      try {
        const treatmentVCData = await getFromIPFS(treatmentVcCid);
        if (treatmentVCData) {
          treatmentDetails = typeof treatmentVCData === 'string' 
            ? JSON.parse(treatmentVCData) 
            : treatmentVCData;
        }
      } catch (error) {
        console.warn('Could not fetch treatment VC from IPFS:', error);
      }
    }
    
    const credential = createRoleCredential({
      issuerDid,
      subjectDid: patientDid,
      role: 'ClaimRejection',
      data: {
        credentialType: 'Claim Rejection Credential',
        claimId,
        policyId,
        providerAddress,
        claimAmount: amount,
        claimAmountWei: amount,
        treatmentDescription: treatmentDetails?.credentialSubject?.treatmentDescription || 'N/A',
        billAmount: treatmentDetails?.credentialSubject?.billAmount || 'N/A',
        treatmentVcCid,
        status: 'Rejected',
        rejectionReason: reason,
        rejectionDate: new Date().toISOString(),
        issuedAt: new Date().toISOString(),
      },
    });
    
    const result = await issueVC(credential, insurerDid);
    
    return {
      vc: result.vc,
      cid: result.cid,
    };
  } catch (error) {
    console.error('Error generating rejection VC:', error);
    throw error;
  }
}

