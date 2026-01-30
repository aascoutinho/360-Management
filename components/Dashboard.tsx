import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Project, DashboardMetrics, FinancialSplit } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { TrendingUp, FileCheck, Layers, CalendarCheck, DollarSign, Wallet, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) {
      DataService.getDashboardMetrics(selectedProject).then(setMetrics);
    }
  }, [selectedProject]);

  if (!metrics) return (
    <div className="flex flex-col items-center justify-center h-64 animate-pulse">
        <div className="w-12 h-12 border-4 border-dr-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500">Consolidando dados dos Boletins de Medição (BM)...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-dr-900">Dashboard de Medição</h2>
          <p className="text-sm text-gray-500">Indicadores Financeiros baseados nos Boletins Oficiais</p>
        </div>
        <select 
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-sm font-medium"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* --- CARDS ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 01 - VALOR TOTAL CONTRATO */}
        <FinancialCard 
            title="Valor Total do Contrato"
            icon={<Layers size={20} />}
            data={metrics.contractTotal}
            colorClass="text-dr-900"
            bgColorClass="bg-gray-100"
            subLabel="Previsto (Col O)"
        />

        {/* CARD 02 - VALOR MEDIDO ACUMULADO */}
        <FinancialCard 
            title="Total Medido (Acumulado)"
            icon={<FileCheck size={20} />}
            data={metrics.measuredTotal}
            colorClass="text-emerald-600"
            bgColorClass="bg-emerald-50"
            subLabel="Realizado (Col N)"
        />

        {/* CARD 03 - SALDO */}
        <FinancialCard 
            title="Saldo Contratual"
            icon={<Wallet size={20} />}
            data={metrics.balanceTotal}
            colorClass="text-blue-600"
            bgColorClass="bg-blue-50"
            subLabel="A Medir (Col P)"
        />

        {/* CARD 04 - MEDIA MENSAL */}
        <FinancialCard 
            title="Média Mensal de Medição"
            icon={<Activity size={20} />}
            data={metrics.monthlyAverage}
            colorClass="text-amber-600"
            bgColorClass="bg-amber-50"
            subLabel="Performance Média"
        />

      </div>

      {/* --- EVOLUTION CHART --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-dr-primary"/> Evolução Físico-Financeira
              </h3>
              <p className="text-sm text-gray-500">Acompanhamento do Valor Medido Mensal vs. Curva Acumulada e Saldo</p>
          </div>
          
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={metrics.evolutionHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    tickFormatter={(val) => {
                        const [y, m] = val.split('-');
                        return `${m}/${y}`;
                    }}
                />
                <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    tickFormatter={(val) => `R$${(val/1000000).toFixed(1)}M`} 
                />
                <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11}} 
                    tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                
                {/* Monthly Measurement Bar */}
                <Bar 
                    yAxisId="right"
                    name="Medição Mensal (R$)" 
                    dataKey="measuredMonthly" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    barSize={30}
                    opacity={0.8}
                />
                
                {/* Accumulated Line */}
                <Line 
                    yAxisId="left"
                    type="monotone" 
                    name="Total Acumulado (R$)" 
                    dataKey="accumulated" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{r: 4, fill: '#10b981'}} 
                />

                {/* Balance Line */}
                <Line 
                    yAxisId="left"
                    type="monotone" 
                    name="Saldo de Contrato (R$)" 
                    dataKey="balance" 
                    stroke="#64748b" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={{r: 3}} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

// Reusable Card Component
const FinancialCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    data: FinancialSplit;
    colorClass: string;
    bgColorClass: string;
    subLabel: string;
}> = ({ title, icon, data, colorClass, bgColorClass, subLabel }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
                    <span className="text-[10px] text-gray-400">{subLabel}</span>
                </div>
                <div className={`p-2 rounded-lg ${bgColorClass} ${colorClass.replace('text-', 'text-opacity-80 text-')}`}>
                    {icon}
                </div>
            </div>
            
            <div className="mb-4">
                <span className={`text-2xl font-bold ${colorClass}`}>
                    {data.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                <div className="flex flex-col">
                    <span className="text-gray-400 font-medium">Rental</span>
                    <span className="font-semibold text-emerald-600">
                        {data.rental.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
                <div className="h-6 w-px bg-gray-100 mx-2"></div>
                <div className="flex flex-col text-right">
                    <span className="text-gray-400 font-medium">Construtora</span>
                    <span className="font-semibold text-amber-600">
                        {data.construction.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                </div>
            </div>
        </div>
    );
};