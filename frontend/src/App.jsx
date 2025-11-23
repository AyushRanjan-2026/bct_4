import { useState, useEffect } from 'react';
import PatientDashboard from './PatientDashboard';
import InsurerDashboard from './InsurerDashboard';
import ProviderDashboard from './ProviderDashboard';
import './index.css';

function App() {
  // Initialize state from localStorage or default to 'patient'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'patient';
  });

  // Update localStorage whenever activeTab changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const tabs = [
    { id: 'patient', label: 'Patient', icon: '👤' },
    { id: 'insurer', label: 'Insurer', icon: '🏢' },
    { id: 'provider', label: 'Provider', icon: '🏥' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-200 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4 group cursor-pointer" onClick={() => setActiveTab('patient')}>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                <span className="text-white text-2xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent">
                  MediChain
                </h1>
                <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Decentralized Insurance</p>
              </div>
            </div>
            
            <div className="flex bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
        <div className="transition-all duration-500 ease-in-out">
          {activeTab === 'patient' && <PatientDashboard key="patient" />}
          {activeTab === 'insurer' && <InsurerDashboard key="insurer" />}
          {activeTab === 'provider' && <ProviderDashboard key="provider" />}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} MediChain. Secure Medical Policy Automation.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;

