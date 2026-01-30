import React, { useState, useEffect } from 'react';
import { Project, AnalyticsSummary, IndexType } from '../types';
import { DataService } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Target, Truck } from 'lucide-react';

export const AnalyticsModule: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProject && selectedMonth) {
      loadAnalytics();
    }
  }, [selectedProject, selectedMonth]);

  const loadAnalytics = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    const data = await DataService.getAnalyticsSummary(selectedProject, month, year);
    setSummary(data);
    setLoading(false);
  };

  if (!summary && !loading) return <div className="p-12 text-center text-gray-400">Selecione uma obra e um mês.</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-dr-900">Analytics: Real x Planejado</h2>
           <p className="text-sm text-gray-500">Comparativo de performance física e financeira</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Obra / Contrato</label>
          <select 
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-dr-primary focus:ring-dr-primary h-10 border px-3"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mês de Referência</label>
          <div className="relative">
            <input 
              type="month" 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-dr-primary focus:ring-dr-primary h-10 border px-3 pl-10"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        <div className="flex items-end">
            <button 
                onClick={loadAnalytics} 
                className="w-full bg-dr-primary text-white h-10 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
                Atualizar Dados
            </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">Calculando indicadores...</div>
      ) : summary && (
        <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Planejado (Total)</p>
                    <div className="mt-2 text-2xl font-bold text-gray-800">
                        {summary.totalPlannedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Meta do Mês</div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Realizado (Total)</p>
                    <div className="mt-2 text-2xl font-bold text-dr-primary">
                        {summary.totalRealRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="mt-1 flex items-center text-xs">
                        {summary.totalRealRevenue >= summary.totalPlannedRevenue ? (
                            <span className="text-green-600 flex items-center font-bold"><ArrowUpRight size={14} className="mr-1"/> Acima da meta</span>
                        ) : (
                            <span className="text-red-500 flex items-center font-bold"><ArrowDownRight size={14} className="mr-1"/> Abaixo da meta</span>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aderência (%)</p>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className={`text-2xl font-bold ${summary.revenueCompliance >= 100 ? 'text-green-600' : summary.revenueCompliance >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {summary.revenueCompliance.toFixed(1)}%
                        </span>
                        <span className="text-sm text-gray-400">do cronograma</span>
                    </div>
                     {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                        <div 
                            className={`h-1.5 rounded-full ${summary.revenueCompliance >= 100 ? 'bg-green-500' : summary.revenueCompliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                            style={{ width: `${Math.min(summary.revenueCompliance, 100)}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Desvio de Custo</p>
                    <div className="mt-2 text-2xl font-bold text-gray-800">
                        {(summary.totalPlannedCost - summary.totalRealCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                        <span>Plan: {summary.totalPlannedCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        <span>Real: {summary.totalRealCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
            </div>

            {/* CHART SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                        <Target size={18} className="text-dr-primary"/> Comparativo Financeiro
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={[
                                    { name: 'Receita', Planejado: summary.totalPlannedRevenue, Realizado: summary.totalRealRevenue },
                                    { name: 'Custos', Planejado: summary.totalPlannedCost, Realizado: summary.totalRealCost }
                                ]}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                <Legend />
                                <Bar dataKey="Planejado" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Realizado" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Farol de Desempenho</h3>
                    <p className="text-sm text-gray-500 mb-6">Classificação dos itens contratuais por meta atingida</p>
                    
                    <div className="flex justify-center gap-8">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xl font-bold border-4 border-green-200">
                                {summary.items.filter(i => i.performance >= 100).length}
                            </div>
                            <span className="mt-2 text-sm font-medium text-gray-600">Meta Batida</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xl font-bold border-4 border-yellow-200">
                                {summary.items.filter(i => i.performance >= 80 && i.performance < 100).length}
                            </div>
                            <span className="mt-2 text-sm font-medium text-gray-600">Em Atenção</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xl font-bold border-4 border-red-200">
                                {summary.items.filter(i => i.performance < 80).length}
                            </div>
                            <span className="mt-2 text-sm font-medium text-gray-600">Crítico</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAILED TABLES */}
            
            {/* 1. Production Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <TrendingUp size={18} /> Detalhamento: Itens do Contrato (Físico x Financeiro)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Código</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3 text-center">Unid.</th>
                                <th className="px-4 py-3 text-right">Qtd Plan</th>
                                <th className="px-4 py-3 text-right text-blue-600">Qtd Real</th>
                                <th className="px-4 py-3 text-right bg-gray-50">R$ Plan</th>
                                <th className="px-4 py-3 text-right text-blue-700 bg-blue-50/30">R$ Real</th>
                                <th className="px-4 py-3 text-right font-bold">Delta R$</th>
                                <th className="px-4 py-3 text-center">% Ating.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary.items.map(item => (
                                <tr key={item.indexId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-700">{item.codeSAP}</td>
                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={item.description}>{item.description}</td>
                                    <td className="px-4 py-3 text-center text-gray-500">{item.unit}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{item.plannedQty.toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-3 text-right text-blue-600 font-medium">{item.realQty.toLocaleString('pt-BR')}</td>
                                    <td className="px-4 py-3 text-right bg-gray-50 text-gray-600">{item.plannedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="px-4 py-3 text-right font-bold text-blue-700 bg-blue-50/30">{item.realValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className={`px-4 py-3 text-right font-bold ${item.deltaValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.deltaValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            item.performance >= 100 ? 'bg-green-100 text-green-800' :
                                            item.performance >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {item.performance.toFixed(0)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. Fleet Analysis Table */}
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Truck size={18} /> Detalhamento: Frota (Real vs Orçado)
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Equipamento</th>
                                <th className="px-4 py-3 text-right bg-gray-50">Rec. Plan</th>
                                <th className="px-4 py-3 text-right text-blue-700 bg-blue-50/30">Rec. Real</th>
                                <th className="px-4 py-3 text-right bg-gray-50">Custo Plan</th>
                                <th className="px-4 py-3 text-right text-red-700 bg-red-50/30">Custo Real</th>
                                <th className="px-4 py-3 text-right font-bold">Margem Real</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {summary.fleet.map(eq => (
                                <tr key={eq.equipmentId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-gray-800">{eq.internalCode}</div>
                                        <div className="text-xs text-gray-500">{eq.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right bg-gray-50 text-gray-600">
                                        {eq.plannedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-blue-700 font-medium bg-blue-50/30">
                                        {eq.realRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-4 py-3 text-right bg-gray-50 text-gray-600">
                                        {eq.plannedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-4 py-3 text-right text-red-700 font-medium bg-red-50/30">
                                        {eq.realCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${eq.realMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {eq.realMargin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
      )}
    </div>
  );
};