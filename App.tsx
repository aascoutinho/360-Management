import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RDOModule } from './components/RDOModule';
import { IndexManager } from './components/IndexManager';
import { ProjectManager } from './components/ProjectManager';
import { AssetManager } from './components/AssetManager';
import { CostManager } from './components/CostManager';
import { PlanningModule } from './components/PlanningModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { MeasurementModule } from './components/MeasurementModule';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard />;
      case 'planning': return <PlanningModule />;
      case 'analytics': return <AnalyticsModule />;
      case 'measurement': return <MeasurementModule />;
      case 'rdo': return <RDOModule />;
      case 'indices': return <IndexManager />;
      case 'projects': return <ProjectManager />;
      case 'assets': return <AssetManager />;
      case 'costs': return <CostManager />;
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