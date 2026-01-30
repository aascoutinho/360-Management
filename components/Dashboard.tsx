import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Project, DashboardMetrics } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapPin, Truck, TrendingUp, AlertTriangle } from 'lucide-react';

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

  if (!metrics) return <div className="p-8 text-center animate-pulse">Calculando indicadores financeiros...</div>;

  const revenueData = [
    { name: 'Rental', value: metrics.rentalRevenue, color: '#10b981' }, // Emerald
    { name: 'Construtora', value: metrics.constructionRevenue, color: '#f59e0b' }, // Amber
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
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

      {/* Row 2: Category Analysis & Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Revenue vs Cost */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Truck size={18} className="text-dr-600"/> Resultado por Categoria
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.categoryMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend />
                <Bar name="Receita" dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar name="Custo" dataKey="cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Mix */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Composição de Receita</h3>
          <div className="h-72">
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
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Geographic Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
             <MapPin size={18} className="text-dr-600"/> Receita por Cidade
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.cityMetrics} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
             <TrendingUp size={18} className="text-dr-600"/> Receita por Trecho
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={metrics.segmentMetrics} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Detailed Equipment Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
           <h3 className="font-semibold text-gray-800 flex items-center gap-2">
             <AlertTriangle size={18} className="text-dr-600"/> Análise Financeira por Equipamento
           </h3>
           <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">Ordenado por Margem</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Equipamento</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right text-blue-600">Receita Total</th>
                <th className="px-6 py-4 text-right text-red-600">Custos Totais</th>
                <th className="px-6 py-4 text-right">Margem R$</th>
                <th className="px-6 py-4 text-right">Margem %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metrics.equipmentHealth.map((eq, idx) => {
                const marginPercent = eq.revenue > 0 ? (eq.margin / eq.revenue) * 100 : 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{eq.equipmentName}</td>
                    <td className="px-6 py-4 text-gray-500">{eq.category}</td>
                    <td className="px-6 py-4 text-right font-medium text-blue-700">
                      {eq.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600">
                      - {eq.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${eq.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {eq.margin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                         marginPercent >= 20 ? 'bg-green-100 text-green-800' :
                         marginPercent >= 0 ? 'bg-yellow-100 text-yellow-800' :
                         'bg-red-100 text-red-800'
                       }`}>
                         {marginPercent.toFixed(1)}%
                       </span>
                    </td>
                  </tr>
                );
              })}
              {metrics.equipmentHealth.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    Nenhum dado financeiro de equipamento registrado para esta obra.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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