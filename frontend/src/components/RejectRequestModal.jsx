import { useState } from 'react';

function RejectRequestModal({ request, isOpen, onClose, onConfirm, loading }) {
    const [rejectionReason, setRejectionReason] = useState('');

    if (!isOpen || !request) return null;

    const handleSubmit = () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        onConfirm(request, rejectionReason);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-red-600 to-pink-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Reject Policy Request</h2>
                        <p className="text-sm text-white/80">Request #{request.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-red-200 text-2xl font-bold transition-colors"
                        disabled={loading}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Warning Alert */}
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-red-500 text-xl">⚠️</span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 font-medium">
                                    <strong>Warning:</strong> Rejecting this request will notify the patient and mark the request as rejected.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900">Request Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Patient DID</label>
                                <p className="font-mono text-xs text-gray-800 truncate" title={request.patientDid}>
                                    {request.patientDid || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Coverage Amount</label>
                                <p className="text-gray-800 font-semibold">
                                    {request.coverageAmount ? `${(Number(request.coverageAmount) / 1e18).toFixed(4)} ETH` : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Reason for Rejection <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="4"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                            placeholder="Please provide a detailed reason for rejecting this policy request..."
                            disabled={loading}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            This reason will be visible to the patient.
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
                        onClick={handleSubmit}
                        className="btn btn-danger"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <span className="animate-spin mr-2">⏳</span>
                                Rejecting...
                            </span>
                        ) : (
                            'Confirm Rejection'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default RejectRequestModal;
