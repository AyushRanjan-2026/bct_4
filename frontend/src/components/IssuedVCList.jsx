import React from 'react';
import CollapsibleCard from './CollapsibleCard';
import { formatDate } from '../utils/formatting';

const IssuedVCList = ({ vcs, onViewVC, onDownloadVC }) => {
  return (
    <CollapsibleCard title="Issued Credentials" defaultOpen={false} icon="📜">
      {vcs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-4xl mb-3 opacity-20">📇</div>
          <p className="text-gray-500">No credentials issued yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vcs.map((vc) => (
            <div
              key={vc.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs font-bold rounded border border-indigo-200">
                      POLICY
                    </span>
                    <h4 className="font-semibold text-gray-900">Policy #{vc.policyId}</h4>
                  </div>
                  <p className="text-xs text-gray-500">Issued: {formatDate(vc.issuedAt)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onViewVC(vc)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Credential"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDownloadVC(vc)}
                    className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Download JSON"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 break-all border border-gray-100">
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <span className="font-semibold text-gray-500 uppercase text-[10px]">Subject DID:</span>
                    <div className="truncate">{vc.patientDid}</div>
                  </div>
                  {vc.cid && (
                    <div>
                      <span className="font-semibold text-gray-500 uppercase text-[10px]">IPFS CID:</span>
                      <div className="truncate text-blue-600">{vc.cid}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CollapsibleCard>
  );
};

export default IssuedVCList;
