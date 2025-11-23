function UploadedFileList({ files, onToggleInclude, onCopyCid }) {
  if (files.length === 0) {
    return null;
  }

  const shortenCid = (cid) => {
    if (!cid) return '';
    if (cid.length <= 12) return cid;
    return `${cid.substring(0, 6)}...${cid.substring(cid.length - 6)}`;
  };

  return (
    <div className="space-y-2 mt-3">
      <label className="text-xs font-semibold text-gray-500 uppercase">Uploaded Files</label>
      <div className="space-y-2">
        {files.map((file, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <input
                type="checkbox"
                checked={file.includeInClaim !== false}
                onChange={(e) => onToggleInclude(idx, e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs font-mono text-gray-600">{shortenCid(file.cid)}</span>
                  <button
                    onClick={() => onCopyCid(file.cid)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                    title="Copy CID"
                  >
                    📋
                  </button>
                  <a
                    href={`https://ipfs.io/ipfs/${file.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Verify on IPFS
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UploadedFileList;

