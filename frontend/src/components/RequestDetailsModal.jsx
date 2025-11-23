import { formatDate, weiToEth, formatJSON } from '../utils/formatting';

function RequestDetailsModal({ request, isOpen, onClose }) {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Request Details</h2>
            <p className="text-sm text-gray-500">Request #{request.id}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-gray-600">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              request.status === 'approved' ? 'bg-green-100 text-green-800' :
              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {request.status || 'pending'}
            </span>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Created At</label>
              <p className="text-sm text-gray-800 mt-1">{formatDate(request.createdAt)}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Patient DID</label>
              <p className="text-sm text-gray-800 font-mono break-all mt-1">{request.patientDid || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Patient Wallet</label>
              <p className="text-sm text-gray-800 font-mono break-all mt-1">{request.patientAddress || 'N/A'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Coverage Amount</label>
              <p className="text-sm text-gray-800 mt-1">
                {weiToEth(request.coverageAmount)} ETH
                <span className="text-xs text-gray-500 ml-2">({request.coverageAmount} wei)</span>
              </p>
            </div>
          </div>

          {/* Policy Details */}
          {request.details && Object.keys(request.details).length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Policy Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {request.details.premium && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Premium</label>
                    <p className="text-sm text-gray-800 mt-1">{request.details.premium}</p>
                  </div>
                )}
                {request.details.duration && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Duration</label>
                    <p className="text-sm text-gray-800 mt-1">{request.details.duration} months</p>
                  </div>
                )}
                {request.details.coverageType && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Coverage Type</label>
                    <p className="text-sm text-gray-800 mt-1 capitalize">{request.details.coverageType}</p>
                  </div>
                )}
                {request.details.deductible && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase">Deductible</label>
                    <p className="text-sm text-gray-800 mt-1">{request.details.deductible}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata JSON */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Metadata</h3>
            <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto text-xs font-mono">
              {formatJSON(request.details || {})}
            </pre>
          </div>

          {/* Timeline */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Submitted</p>
                  <p className="text-xs text-gray-500">{formatDate(request.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  request.status === 'approved' ? 'bg-green-500' :
                  request.status === 'rejected' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {request.status === 'approved' ? 'Approved' :
                     request.status === 'rejected' ? 'Rejected' :
                     'Pending Issuance'}
                  </p>
                  {request.status === 'approved' && (
                    <p className="text-xs text-gray-500">VC issued successfully</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RequestDetailsModal;
