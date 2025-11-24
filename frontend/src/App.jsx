import { useState, useEffect } from 'react';
import PatientDashboard from './PatientDashboard';
import InsurerDashboard from './InsurerDashboard';
import ProviderDashboard from './ProviderDashboard';
import './index.css';

function App() {
  // Initialize activeTab from localStorage or default to 'patient'
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'patient';
  });

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const renderDashboard = () => {
    switch (activeTab) {
      case 'patient':
        return <PatientDashboard />;
      case 'insurer':
        return <InsurerDashboard />;
      case 'provider':
        return <ProviderDashboard />;
      default:
        return <PatientDashboard />;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90"></div>
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>

      <div className="relative z-10">
        {/* Header with Glass Effect */}
        <header className="glass-effect shadow-2xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 animate-slide-in-right">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg animate-float">
                  <span className="text-2xl">🏥</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">MediChain</h1>
                  <p className="text-xs text-white/80">Decentralized Healthcare Insurance</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex space-x-2 bg-white/10 backdrop-blur-md rounded-xl p-1.5 border border-white/20">
                {['patient', 'insurer', 'provider'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2.5 rounded-lg font-medium capitalize transition-all duration-300 ${activeTab === tab
                        ? 'bg-white text-purple-600 shadow-lg transform scale-105'
                        : 'text-white hover:bg-white/20 hover:scale-105'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {renderDashboard()}
        </main>

        {/* Footer */}
        <footer className="mt-16 pb-8 text-center text-white/60 text-sm">
          <p className="glass-effect inline-block px-6 py-3 rounded-full border border-white/20">
            © 2024 MediChain • Powered by Blockchain Technology 🔗
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
