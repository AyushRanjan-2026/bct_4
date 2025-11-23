import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function ConnectWallet({ onWalletConnected }) {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      // Listen for account changes
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else if (accounts[0] !== account) {
          // Account changed, reconnect with new account
          connectWallet();
        }
      };

      // Listen for chain changes
      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account]);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          // Don't auto-connect if we already have the correct account
          if (accounts[0] !== account) {
            await connectWallet();
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // Request accounts (this will prompt user if not connected)
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);

      if (onWalletConnected) {
        onWalletConnected({ account: address, provider, signer });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // alert('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    if (onWalletConnected) {
      onWalletConnected({ account: null, provider: null, signer: null });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 text-lg">🔗</span>
          Wallet Connection
        </h2>
        {account && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Active
          </span>
        )}
      </div>

      {!account ? (
        <div className="space-y-4">
          <button
            className={`
              w-full py-3 px-4 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 
              flex items-center justify-center space-x-3 transition-all duration-300
              ${isConnecting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02]'
              }
            `}
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🦊</span>
                <span>Connect MetaMask</span>
              </>
            )}
          </button>

          {!window.ethereum && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <p className="text-sm text-amber-800">
                MetaMask is not detected. Please install the browser extension to use this application.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 group hover:border-blue-200 transition-colors">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Connected Account</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-900 font-mono font-medium truncate mr-2">
                {account}
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(account)}
                className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                title="Copy Address"
              >
                📋
              </button>
            </div>
          </div>

          <button
            className="w-full py-2.5 px-4 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-200"
            onClick={handleDisconnect}
          >
            Disconnect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

export default ConnectWallet;

