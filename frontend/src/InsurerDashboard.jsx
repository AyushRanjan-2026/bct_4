import { useState, useEffect } from 'react';
import { getPolicyRequests, createDID, issueCredential, getClaims, approveClaim, rejectClaim, getVCByPolicyId, verifyVC, verifyDID } from './api';
import { ethers } from 'ethers';
import QRCode from 'qrcode';
import { getDID, storeDIDUnique, getAnyDIDForWallet, removeDID } from './did-storage';
import CollapsibleCard from './components/CollapsibleCard';
import Toast from './components/Toast';
import RequestDetailsModal from './components/RequestDetailsModal';
import IssueVCModal from './components/IssueVCModal';
import RejectRequestModal from './components/RejectRequestModal';
import IssuedVCList from './components/IssuedVCList';
import { weiToEth, formatDate } from './utils/formatting';
import ConnectWallet from './ConnectWallet';

function InsurerDashboard() {
  const [wallet, setWallet] = useState(null);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [insurerDid, setInsurerDid] = useState(null);
  const [vcForm, setVcForm] = useState({ organization: '', permission: '' });
  const [vcInfo, setVcInfo] = useState(null);
  const [vcQr, setVcQr] = useState('');
  const [issuedVCs, setIssuedVCs] = useState([]);

  // Claim Management state
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [settlementVC, setSettlementVC] = useState(null);
  const [rejectionVC, setRejectionVC] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyingClaim, setVerifyingClaim] = useState(null);

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadRequests();
    loadIssuedVCs();
    loadClaims();
    const interval = setInterval(() => {
      loadRequests();
      loadIssuedVCs();
      loadClaims();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-retrieve DID when wallet connects
  useEffect(() => {
    if (wallet?.account) {
      const storedDID = getDID(wallet.account, 'insurer');
      if (storedDID) {
        setInsurerDid(storedDID);
      } else {
        setInsurerDid(null);
      }
    } else {
      setInsurerDid(null);
    }
  }, [wallet?.account]);

  // Filter and sort requests
  useEffect(() => {
    let filtered = [...requests];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((req) => (req.status || 'pending') === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.id?.toString().toLowerCase().includes(query) ||
          req.patientDid?.toLowerCase().includes(query) ||
          req.patientAddress?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'coverage':
          return Number(BigInt(b.coverageAmount || 0)) - Number(BigInt(a.coverageAmount || 0));
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [requests, statusFilter, sortOption, searchQuery]);

  // Update issued VCs when requests change
  useEffect(() => {
    loadIssuedVCs();
  }, [requests]);

  const handleWalletConnected = (newWallet) => {
    setWallet(newWallet);
    if (!newWallet.account) {
      setInsurerDid(null);
    }
  };

  // Check for existing DID when wallet connects
  useEffect(() => {
    const checkExistingDID = async () => {
      if (wallet?.account) {
        // Try to get from local storage first
        const localDid = getDID(wallet.account, 'insurer');
        if (localDid) {
          setInsurerDid(localDid);
          return;
        }

        // If not in local storage, check backend (optional, but good practice)
        try {
          // const result = await getIdentityByWallet(wallet.account);
          // if (result.ok && result.did) {
          //   setInsurerDid(result.did);
          //   storeDID(wallet.account, 'insurer', result.did);
          // }
        } catch (error) {
          console.log('Error checking DID:', error);
        }
      }
    };
    checkExistingDID();
  }, [wallet?.account]);

  const loadRequests = async () => {
    try {
      const result = await getPolicyRequests();
      if (result.success) {
        setRequests(result.requests || []);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const loadIssuedVCs = async () => {
    try {
      const approvedRequests = requests.filter(req => (req.status || 'pending') === 'approved');
      setIssuedVCs(approvedRequests.map(req => ({
        id: req.id,
        patientDid: req.patientDid,
        policyId: req.id,
        issuedAt: req.createdAt,
        credentialSubject: {
          id: req.patientDid,
          policyId: req.id,
          coverageAmount: req.coverageAmount,
          ...req
        },
        cid: req.vcCid
      })));
    } catch (error) {
      console.log('Error loading issued VCs:', error);
    }
  };

  const loadClaims = async () => {
    try {
      const result = await getClaims();
      if (result.success) {
        // Show all claims - insurers review all submitted claims
        setClaims(result.claims || []);
      }
    } catch (error) {
      console.error('Error loading claims:', error);
    }
  };

  const handleViewVC = (vc) => {
    const vcContent = JSON.stringify(vc, null, 2);
    const blob = new Blob([vcContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleDownloadVC = (vc) => {
    const vcContent = JSON.stringify(vc, null, 2);
    const blob = new Blob([vcContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VC-${vc.id || 'policy'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('VC Downloaded', 'success');
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleIssueVC = async (data) => {
    if (!wallet?.account) {
      showToast('Please connect wallet first', 'error');
      return;
    }

    if (!insurerDid) {
      showToast('Please create DID first', 'error');
      return;
    }

    setLoading(true);
    try {
      const policyNumber = `POLICY-${Date.now().toString().slice(-5)}`;
      const validTill = new Date();
      validTill.setFullYear(validTill.getFullYear() + 1);

      const patientDid = data.patientDid || `did:example:${data.patientWallet}`;
      const payload = {
        issuerDid: insurerDid,
        subjectDid: patientDid,
        role: 'InsurancePolicy',
        data: {
          credentialType: 'Insurance Policy',
          policyNumber: policyNumber,
          policyId: data.requestId,
          issuedTo: patientDid,
          insurer: wallet.account,
          beneficiary: data.patientWallet,
          coverageAmount: data.coverageAmountWei,
          premium: data.premium,
          duration: data.durationMonths,
          deductible: data.deductible,
          validTill: validTill.toISOString().split('T')[0],
          issuedAt: new Date().toISOString(),
          metadata: data.metadataJson,
          createOnChainPolicy: data.createOnChainPolicy,
        },
      };

      const result = await issueCredential(payload);

      if (result.success) {
        // Check if on-chain transaction was created
        if (result.txHash) {
          showToast(
            `VC issued successfully! On-chain policy created. TX: ${result.txHash.substring(0, 10)}...`,
            'success'
          );
          console.log('🔗 Blockchain Transaction:', result.txHash);
          console.log('🔍 View on Explorer:', `https://etherscan.io/tx/${result.txHash}`);
        } else {
          showToast('VC issued successfully!', 'success');
        }
        setShowIssueModal(false);
        loadRequests();
        loadIssuedVCs();
      } else {
        showToast(result.error || 'Failed to issue VC', 'error');
      }
    } catch (error) {
      console.error('Issue VC error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to issue VC';

      if (errorMessage.includes('Identifier not found') || errorMessage.includes('managed by this agent')) {
        showToast('Backend cannot find your DID. Please click "Reset Identity" above and recreate your DID.', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request, rejectionReason) => {
    if (!wallet?.account || !insurerDid) {
      showToast('Please connect wallet and create DID first', 'error');
      return;
    }

    setLoading(true);
    try {
      // Call backend to reject the request (to be implemented)
      const response = await fetch(`http://localhost:3001/policy/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: request.id,
          reason: rejectionReason,
          insurerDid,
        }),
      });

      const result = await response.json();

      if (result.success || result.ok) {
        showToast('Request rejected successfully!', 'success');
        setShowRejectModal(false);
        setSelectedRequest(null);
        loadRequests();
      } else {
        showToast(result.error || 'Failed to reject request', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Failed to reject request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDID = async (did) => {
    if (!did) {
      showToast('No DID provided', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/verification/did?did=${encodeURIComponent(did)}`);
      const result = await response.json();

      if (result.verified) {
        showToast('✔ DID Verified', 'success');
      } else {
        showToast(`❌ Verification Failed: ${result.reason || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      showToast('Failed to verify DID', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsurerVC = async () => {
    if (!insurerDid) {
      showToast('Create your insurer DID first', 'error');
      return;
    }
    setLoading(true);
    try {
      const { issueCredential } = await import('./api');
      const payload = {
        issuerDid: insurerDid,
        subjectDid: insurerDid,
        role: 'Insurer',
        data: {
          organization: vcForm.organization || 'Insurance Provider',
          permission: vcForm.permission || 'Standard Issuer',
          generatedAt: new Date().toISOString(),
        },
      };
      const result = await issueCredential(payload);
      setVcInfo(result.vc);
      const qr = await QRCode.toDataURL(JSON.stringify(result.vc));
      setVcQr(qr);
      showToast('Insurer credential generated!', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to generate credential', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTreatmentVC = async (claim) => {
    if (!claim.vcCid) {
      showToast('Treatment VC CID not available', 'error');
      return;
    }
    setVerifyingClaim(claim.claimId);
    try {
      const vcUrl = `https://ipfs.io/ipfs/${claim.vcCid}`;
      const response = await fetch(vcUrl);
      const vcData = await response.json();

      if (typeof vcData === 'string') {
        const result = await verifyVC(vcData);
        if (result.verified) {
          showToast('Treatment VC verified successfully!', 'success');
        } else {
          showToast('Treatment VC verification failed', 'error');
        }
      } else {
        showToast('Treatment VC loaded (verification may require JWT format)', 'success');
      }
    } catch (error) {
      showToast('Failed to verify treatment VC', 'error');
    } finally {
      setVerifyingClaim(null);
    }
  };

  const handleApproveClaim = async (claim) => {
    if (!wallet?.account) {
      showToast('Please connect wallet first', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await approveClaim(claim.claimId);
      if (result.success) {
        showToast('Claim approved successfully!', 'success');
        loadClaims();
      } else {
        showToast(result.error || 'Failed to approve claim', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Failed to approve claim', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClaim = async (claim) => {
    if (!wallet?.account) {
      showToast('Please connect wallet first', 'error');
      return;
    }
    setLoading(true);
    try {
      const result = await rejectClaim(claim.claimId, rejectReason || 'Rejected by insurer');
      if (result.success) {
        showToast('Claim rejected successfully!', 'success');
        loadClaims();
      } else {
        showToast(result.error || 'Failed to reject claim', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Failed to reject claim', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInsurerDID = async () => {
    if (!wallet?.account) {
      showToast('Please connect wallet first before creating DID', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating Insurer DID...');
      const result = await createDID();
      console.log('DID creation result:', result);
      if (result.success) {
        const stored = storeDIDUnique(wallet.account, 'insurer', result.did);
        if (stored) {
          setInsurerDid(result.did);
          showToast('Insurer DID created successfully!', 'success');
        } else {
          showToast('Failed to store DID - wallet may already have a DID for another role', 'error');
        }
      } else {
        showToast(result.error || 'Failed to create DID', 'error');
      }
    } catch (error) {
      console.error('Insurer DID creation error:', error);
      showToast(error.message || 'Failed to create DID', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetIdentity = () => {
    if (wallet?.account) {
      removeDID(wallet.account, 'insurer');
      setInsurerDid(null);
      showToast('Identity reset. You can now create a new DID.', 'success');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  const getClaimStatusBadge = (status) => {
    const statusLower = (status || '').toLowerCase();
    const colors = {
      submitted: 'bg-gray-100 text-gray-800',
      underreview: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      paid: 'bg-green-200 text-green-900',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[statusLower] || 'bg-gray-100 text-gray-800'}`}>
        {status?.toUpperCase() || 'UNKNOWN'}
      </span>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Main Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Insurer Dashboard</h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Manage policy requests, issue verifiable credentials, and process claims efficiently.
        </p>
      </div>

      {/* Toast Notification */}
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Wallet & Identity */}
        <div className="space-y-6">
          <ConnectWallet onWalletConnected={handleWalletConnected} />

          {/* Insurer Identity Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-3 text-xl">🏢</div>
              <h2 className="text-xl font-bold text-gray-900">Insurer Identity</h2>
            </div>

            {insurerDid ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Your DID</label>
                  <p className="font-mono text-xs text-gray-700 break-all bg-white p-3 rounded border border-gray-100">
                    {insurerDid}
                  </p>
                  <button
                    onClick={handleResetIdentity}
                    className="text-xs text-red-500 hover:text-red-700 mt-2 underline"
                  >
                    Reset Identity (Use if DID is invalid)
                  </button>
                </div>
                <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 p-3 rounded-lg">
                  <span className="mr-2">✓</span> Identity Verified
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm mb-4">Create a Decentralized Identifier (DID) to issue policies.</p>
                <button
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
                  onClick={async () => {
                    if (!wallet?.account) {
                      showToast('Please connect wallet first', 'error');
                      return;
                    }

                    setLoading(true);
                    try {
                      const result = await createDID();
                      if (result && result.success) {
                        setInsurerDid(result.did);
                        storeDIDUnique(wallet.account, 'insurer', result.did);
                        showToast('Insurer DID created successfully!', 'success');
                      } else {
                        showToast(result?.error || 'Failed to create DID', 'error');
                      }
                    } catch (error) {
                      const errorMessage = error.response?.data?.error || error.message || 'Failed to create DID.';
                      showToast(errorMessage, 'error');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading || !wallet?.account}
                >
                  {loading ? 'Creating Identity...' : 'Create Insurer DID'}
                </button>
              </div>
            )}
          </div>

          {/* Credential Generator */}
          <CollapsibleCard title="Generate Credential" defaultOpen={false} icon="📄">
            <div className="space-y-4">
              <div>
                <label className="label">Organization Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={vcForm.organization}
                  onChange={(e) => setVcForm({ ...vcForm, organization: e.target.value })}
                  placeholder="MPA Insurance"
                />
              </div>
              <div>
                <label className="label">Permission / Role</label>
                <input
                  type="text"
                  className="input-field"
                  value={vcForm.permission}
                  onChange={(e) => setVcForm({ ...vcForm, permission: e.target.value })}
                  placeholder="Policy Issuer"
                />
              </div>
              <button
                className="btn btn-primary w-full"
                onClick={handleGenerateInsurerVC}
                disabled={loading || !insurerDid}
              >
                {loading ? 'Generating...' : 'Generate Credential'}
              </button>

              {vcInfo && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {vcQr && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={vcQr}
                        alt="Insurer VC QR"
                        className="w-40 h-40 object-contain border rounded-lg bg-white p-2"
                      />
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Credential Generated</p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleCard>
        </div>

        {/* Right Column: Requests & VCs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Policy Requests Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-xl">📋</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Policy Requests</h2>
                  <p className="text-sm text-gray-500">Manage incoming insurance applications</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ID or DID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="coverage">Highest Coverage</option>
              </select>
            </div>

            {/* Request List */}
            <div className="divide-y divide-gray-100">
              {paginatedRequests.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4 opacity-20">📭</div>
                  <p className="text-gray-500 text-lg">No requests found</p>
                  <p className="text-gray-400 text-sm mt-2">Try adjusting your filters</p>
                </div>
              ) : (
                paginatedRequests.map((request) => (
                  <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">Request #{request.id}</h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs text-gray-500">{formatDate(request.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Coverage</p>
                        <p className="text-lg font-bold text-blue-600">
                          {weiToEth(request.coverageAmount)} ETH
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Patient DID</label>
                        <p className="font-mono text-xs text-gray-700 break-all mt-1 truncate" title={request.patientDid}>
                          {request.patientDid || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Patient Wallet</label>
                        <p className="font-mono text-xs text-gray-700 break-all mt-1 truncate" title={request.patientAddress}>
                          {request.patientAddress || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailsModal(true);
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleVerifyDID(request.patientDid)}
                        disabled={loading || !request.patientDid}
                        className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors"
                      >
                        Verify DID
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowIssueModal(true);
                            }}
                            disabled={loading || !insurerDid}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                          >
                            Issue Policy
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            disabled={loading || !insurerDid}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex justify-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Issued VCs List */}
          <IssuedVCList
            vcs={issuedVCs}
            onViewVC={handleViewVC}
            onDownloadVC={handleDownloadVC}
          />

          {/* Claim Requests Section */}
          <CollapsibleCard title="Claim Requests" defaultOpen={true} icon="💼">
            {!insurerDid ? (
              <div className="text-center py-8 text-gray-500">
                <p>Please create your Insurer DID first to manage claims</p>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-gray-500 text-lg">No claims found</p>
                <p className="text-gray-400 text-sm mt-2">Claims will appear here when providers submit them</p>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim.claimId}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">Claim #{claim.claimId}</h3>
                          {getClaimStatusBadge(claim.status)}
                        </div>
                        <p className="text-xs text-gray-500">Submitted: {formatDate(claim.createdAt)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Policy ID</label>
                        <p className="text-sm font-mono text-gray-800 mt-1">{claim.policyId || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Bill Amount</label>
                        <p className="text-sm font-semibold text-primary-600 mt-1">
                          {weiToEth(claim.amount)} ETH
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Patient DID</label>
                        <p className="text-xs font-mono text-gray-700 break-all mt-1">
                          {claim.beneficiary ? `did:example:${claim.beneficiary}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Provider DID</label>
                        <p className="text-xs font-mono text-gray-700 break-all mt-1">
                          {claim.provider ? `did:example:${claim.provider}` : 'N/A'}
                        </p>
                      </div>
                      {claim.treatmentDescription && (
                        <div className="md:col-span-2">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Treatment Description</label>
                          <p className="text-sm text-gray-800 mt-1">{claim.treatmentDescription}</p>
                        </div>
                      )}
                    </div>

                    {/* Attachments */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Attachments</label>
                      <div className="flex flex-wrap gap-2">
                        {claim.vcCid && (
                          <button
                            onClick={() => handleVerifyTreatmentVC(claim)}
                            disabled={verifyingClaim === claim.claimId}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {verifyingClaim === claim.claimId ? 'Verifying...' : 'View Treatment VC'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {claim.status === 'submitted' && (
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleApproveClaim(claim)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Approve Claim
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClaim(claim);
                            setRejectReason('');
                            // Logic to show reject modal would go here if implemented fully
                            const reason = prompt("Enter rejection reason:");
                            if (reason) {
                              setRejectReason(reason);
                              handleRejectClaim(claim);
                            }
                          }}
                          disabled={loading}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Reject Claim
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleCard>
        </div>
      </div>


      {/* Modals */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
      />

      <IssueVCModal
        request={selectedRequest}
        isOpen={showIssueModal}
        onClose={() => {
          setShowIssueModal(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleIssueVC}
        loading={loading}
      />

      <RejectRequestModal
        request={selectedRequest}
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
        }}
        onConfirm={handleRejectRequest}
        loading={loading}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default InsurerDashboard;
