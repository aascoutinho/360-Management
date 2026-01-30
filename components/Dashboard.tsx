import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Project, DashboardMetrics } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

  if (!metrics) return <div className="p-8 text-center">Carregando indicadores...</div>;

  const revenueData = [
    { name: 'Rental', value: metrics.rentalRevenue, color: '#10b981' }, // Emerald
    { name: 'Construtora', value: metrics.constructionRevenue, color: '#f59e0b' }, // Amber
  ];

  // Prepare data for Health Chart (Top 5 equipment)
  const healthData = metrics.equipmentHealth.slice(0, 5).map(eq => ({
    name: eq.equipmentId.split(' ')[0], // Short name
    Receita: eq.revenue,
    Custo: eq.cost
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dr-900">Dashboard Executivo</h2>
        <select 
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-sm"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KpiCard 
          title="Receita Total (Real)" 
          value={metrics.totalRevenue} 
          color="text-dr-primary"
        />
        <KpiCard 
          title="Faturamento Rental" 
          value={metrics.rentalRevenue} 
          color="text-dr-success"
        />
        <KpiCard 
          title="Faturamento Construtora" 
          value={metrics.constructionRevenue} 
          color="text-dr-accent"
        />
        <KpiCard 
          title="Custo Manutenção/Ativos" 
          value={metrics.totalCosts} 
          color="text-red-500" 
          isNegative
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rental vs Construction Mix */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Composição de Receita</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Equipment Health (Revenue vs Cost) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Saúde Financeira dos Ativos (Top 5)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Bar dataKey="Receita" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custo" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard = ({ title, value, color, isNegative = false }: { title: string, value: number, color: string, isNegative?: boolean }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
    <div className="mt-4 flex items-end justify-between">
      <span className={`text-2xl font-bold ${color}`}>
        {isNegative ? '-' : ''}{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </span>
    </div>
  </div>
);