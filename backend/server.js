import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createDID, addPolicyRequest, getPolicyRequests, issueVC, createRoleCredential } from './vc-service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Health -------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- DID creation ------------------------------------------
app.post('/did/create', async (_req, res) => {
  try {
    const did = await createDID();
    res.json({ success: true, did });
  } catch (error) {
    console.error('DID creation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create DID',
    });
  }
});

// --- Policy requests (lightweight JSON store) ---------------
app.post('/policy/request', (req, res) => {
  try {
    const { patientDid, patientAddress, coverageAmount, details } = req.body;
    if (!patientDid || !patientAddress || !coverageAmount) {
      return res
        .status(400)
        .json({ success: false, error: 'patientDid, patientAddress and coverageAmount are required' });
    }

    const request = addPolicyRequest({
      patientDid,
      patientAddress,
      coverageAmount,
      details: details || {},
    });

    res.json({ success: true, request });
  } catch (error) {
    console.error('Policy request failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/policy/requests', (_req, res) => {
  try {
    res.json({ success: true, requests: getPolicyRequests() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- Generic VC issuance ------------------------------------
app.post('/vc/issue', async (req, res) => {
  try {
    const { issuerDid, subjectDid, role, data } = req.body;
    if (!issuerDid || !subjectDid || !role) {
      return res.status(400).json({
        success: false,
        error: 'issuerDid, subjectDid, and role are required',
      });
    }

    const credential = createRoleCredential({ issuerDid, subjectDid, role, data });
    const result = await issueVC(credential, issuerDid);

    res.json({
      success: true,
      vc: result.vc,
      cid: result.cid,
    });
  } catch (error) {
    console.error('VC issuance failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to issue credential',
    });
  }
});

// --- Get VC by policy ID ------------------------------------
app.get('/vc/policy/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const { getVCByPolicyId } = await import('./vc-service.js');
    const vc = getVCByPolicyId(policyId);
    
    if (vc) {
      res.json({ success: true, vc });
    } else {
      res.json({ success: false, vc: null });
    }
  } catch (error) {
    console.error('Get VC by policy ID failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get VC',
    });
  }
});

// --- DID Verification ------------------------------------
app.get('/verification/did', async (req, res) => {
  try {
    const { did } = req.query;
    if (!did) {
      return res.status(400).json({
        success: false,
        verified: false,
        reason: 'DID parameter is required',
      });
    }

    // Import Veramo agent
    const getVeramoAgent = (await import('./veramo-setup.js')).default;
    const agent = await getVeramoAgent();

    try {
      // Resolve DID document
      const didDocument = await agent.resolveDid({ didUrl: did });
      
      if (didDocument && didDocument.didDocument) {
        res.json({
          success: true,
          verified: true,
          reason: 'DID document resolved successfully',
          didDocument: didDocument.didDocument,
        });
      } else {
        res.json({
          success: true,
          verified: false,
          reason: 'DID document not found or invalid',
        });
      }
    } catch (resolveError) {
      res.json({
        success: true,
        verified: false,
        reason: resolveError.message || 'Failed to resolve DID',
      });
    }
  } catch (error) {
    console.error('DID verification failed:', error);
    res.status(500).json({
      success: false,
      verified: false,
      reason: error.message || 'Verification service error',
    });
  }
});

// --- File Upload (supports both JSON base64 and multipart) ------------------------------------
app.post('/file/upload', async (req, res) => {
  try {
    const { uploadToIPFS } = await import('./ipfs-service.js');
    let buffer;
    
    // Check if it's multipart form data (FormData sends as raw body)
    if (req.is('multipart/form-data') || req.headers['content-type']?.includes('multipart/form-data')) {
      // For multipart, we need to parse it manually or use a library
      // For now, fall back to base64 approach - frontend will send as base64 in FormData
      // This is a simplified handler - in production use multer or express-fileupload
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'Multipart upload requires file upload library. Please use base64 format.',
      });
    } else if (req.body.data) {
      // JSON base64 format (existing)
      buffer = Buffer.from(req.body.data, 'base64');
    } else if (req.body.file) {
      // Alternative: file as base64 string
      buffer = Buffer.from(req.body.file, 'base64');
    } else {
      return res.status(400).json({
        ok: false,
        success: false,
        error: 'File data required (base64 encoded)',
      });
    }
    
    const cid = await uploadToIPFS(buffer);
    res.json({ ok: true, success: true, cid });
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({
      ok: false,
      success: false,
      error: error.message || 'Failed to upload file',
    });
  }
});

// --- Identity by Wallet ------------------------------------
app.get('/identity/byWallet/:address', async (req, res) => {
  try {
    const { address } = req.params;
    // Check if DID exists for this wallet (stub - implement with actual storage)
    // For now, return null - in production, check a DID registry
    res.json({ ok: true, did: null });
  } catch (error) {
    console.error('Get identity by wallet failed:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to get identity',
    });
  }
});

// --- Claims Management ------------------------------------
app.get('/claims', async (_req, res) => {
  try {
    const { getAllClaims } = await import('./claims-service.js');
    const claims = await getAllClaims();
    res.json({ success: true, claims });
  } catch (error) {
    console.error('Get claims failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get claims',
    });
  }
});

app.post('/claims/submit', async (req, res) => {
  try {
    const { providerWallet, patientDidOrWallet, policyId, amountWei, fileCids, treatmentVcCid } = req.body;
    
    if (!providerWallet || !patientDidOrWallet || !policyId || !amountWei) {
      return res.status(400).json({
        ok: false,
        error: 'providerWallet, patientDidOrWallet, policyId, and amountWei are required',
      });
    }

    // Call the existing onchain submit claim logic
    const { onchainSubmitClaim } = await import('./contract-service.js');
    // This is a stub - implement actual claim submission
    // For now, return a mock response
    res.json({
      ok: true,
      claimId: `clm-${Date.now()}`,
      txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    });
  } catch (error) {
    console.error('Submit claim failed:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to submit claim',
    });
  }
});

app.get('/claims/provider/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    // Get claims for this provider from blockchain
    const { getAllClaims } = await import('./claims-service.js');
    const allClaims = await getAllClaims();
    const providerClaims = allClaims.filter(
      claim => claim.provider?.toLowerCase() === wallet.toLowerCase()
    );
    res.json({ ok: true, claims: providerClaims });
  } catch (error) {
    console.error('Get provider claims failed:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to get provider claims',
    });
  }
});

app.post('/claims/approve', async (req, res) => {
  try {
    const { claimId, insurerDid, insurerAddress, privateKey } = req.body;
    
    if (!claimId || !insurerDid || !insurerAddress || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'claimId, insurerDid, insurerAddress, and privateKey are required',
      });
    }
    
    const { approveClaim } = await import('./claims-service.js');
    const result = await approveClaim(claimId, insurerDid, insurerAddress, privateKey);
    
    res.json(result);
  } catch (error) {
    console.error('Approve claim failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to approve claim',
    });
  }
});

app.post('/claims/reject', async (req, res) => {
  try {
    const { claimId, reason, insurerDid, insurerAddress, privateKey } = req.body;
    
    if (!claimId || !reason || !insurerDid || !insurerAddress || !privateKey) {
      return res.status(400).json({
        success: false,
        error: 'claimId, reason, insurerDid, insurerAddress, and privateKey are required',
      });
    }
    
    const { rejectClaim } = await import('./claims-service.js');
    const result = await rejectClaim(claimId, reason, insurerDid, insurerAddress, privateKey);
    
    res.json(result);
  } catch (error) {
    console.error('Reject claim failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject claim',
    });
  }
});

// --- start server ------------------------------------------
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

