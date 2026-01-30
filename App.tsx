import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RDOModule } from './components/RDOModule';
import { IndexManager } from './components/IndexManager';

// Placeholder components for sections not fully detailed in this sprint
const Construction = () => <div className="p-8 text-gray-500 text-center">Módulo em Desenvolvimento: Cadastro de Obras</div>;
const Equipment = () => <div className="p-8 text-gray-500 text-center">Módulo em Desenvolvimento: Gestão de Ativos e Custos</div>;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard />;
      case 'rdo': return <RDOModule />;
      case 'indices': return <IndexManager />;
      case 'projects': return <Construction />;
      case 'equipment': return <Equipment />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      
      <main className="ml-64 flex-1 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;