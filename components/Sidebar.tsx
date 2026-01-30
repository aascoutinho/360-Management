import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Truck, 
  TrendingUp, 
  Building2,
  DollarSign,
  CalendarRange,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planning', label: 'Planejamento', icon: CalendarRange },
    { id: 'measurement', label: 'Boletim Medição', icon: FileSpreadsheet }, // New Item
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'rdo', label: 'Lançamento RDO', icon: FileText },
    { id: 'projects', label: 'Obras & Contratos', icon: Building2 },
    { id: 'indices', label: 'Índices & Revisões', icon: TrendingUp },
    { id: 'assets', label: 'Frota / Ativos', icon: Truck },
    { id: 'costs', label: 'Custos de Equip.', icon: DollarSign },
  ];

  return (
    <div className="w-64 bg-dr-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 border-b border-dr-800">
        <h1 className="text-2xl font-bold tracking-tight text-white">Grupo<span className="text-dr-primary">DR</span></h1>
        <p className="text-xs text-gray-400 mt-1">Portal RDO Integrado</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-dr-primary text-white shadow-md' 
                  : 'text-gray-400 hover:bg-dr-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-dr-800">
        <div className="flex items-center space-x-3 text-sm text-gray-400">
          <div className="w-8 h-8 rounded-full bg-dr-700 flex items-center justify-center">
            <span className="font-bold text-white">ENG</span>
          </div>
          <div>
            <p className="text-white">Eng. Residente</p>
            <p className="text-xs">Obra SP-300</p>
          </div>
        </div>
      </div>
    </div>
  );
};