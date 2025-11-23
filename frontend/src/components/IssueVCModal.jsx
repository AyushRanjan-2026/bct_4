import { useState } from 'react';
import { weiToEth, formatJSON } from '../utils/formatting';

function IssueVCModal({ request, isOpen, onClose, onConfirm, loading }) {
  const [createOnChainPolicy, setCreateOnChainPolicy] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  if (!isOpen || !request) return null;

  const handleConfirm = () => {
    const payload = {
      requestId: request.id,
      patientDid: request.patientDid,
      patientWallet: request.patientAddress,
      coverageAmountWei: request.coverageAmount,
      premium: request.details?.premium || '',
      durationMonths: request.details?.duration || '',
      deductible: request.details?.deductible || '',
      metadataJson: request.details || {},
      createOnChainPolicy: createOnChainPolicy,
    };
    onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Issue Verifiable Credential</h2>
            <p className="text-sm text-gray-500">Request #{request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Patient Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Patient Information</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Patient DID</label>
                <p className="text-sm text-gray-800 font-mono break-all mt-1">{request.patientDid || 'N/A'}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Patient Wallet</label>
                <p className="text-sm text-gray-800 font-mono break-all mt-1">{request.patientAddress || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Policy Details */}
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Policy Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Coverage Amount</label>
                <p className="text-sm text-gray-800 mt-1">
                  {weiToEth(request.coverageAmount)} ETH
                </p>
              </div>
              {request.details?.duration && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Duration</label>
                  <p className="text-sm text-gray-800 mt-1">{request.details.duration} months</p>
                </div>
              )}
              {request.details?.premium && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Premium</label>
                  <p className="text-sm text-gray-800 mt-1">{request.details.premium}</p>
                </div>
              )}
              {request.details?.deductible && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Deductible</label>
                  <p className="text-sm text-gray-800 mt-1">{request.details.deductible}</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata JSON (Collapsible) */}
          {request.details && Object.keys(request.details).length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowMetadata(!showMetadata)}
                className="flex items-center justify-between w-full text-left"
              >
                <h3 className="text-lg font-semibold text-gray-800">Metadata JSON</h3>
                <span className={`transform transition-transform ${showMetadata ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              {showMetadata && (
                <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto text-xs font-mono mt-3">
                  {formatJSON(request.details)}
                </pre>
              )}
            </div>
          )}

          {/* On-chain Policy Toggle */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createOnChainPolicy}
                onChange={(e) => setCreateOnChainPolicy(e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">
                Create on-chain policy while issuing VC
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-8">
              This will create a smart contract policy record on the blockchain
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-success"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⏳</span>
                Issuing...
              </span>
            ) : (
              'Confirm & Issue VC'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default IssueVCModal;
