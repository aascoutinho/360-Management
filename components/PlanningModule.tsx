import React, { useState, useEffect } from 'react';
import { Project, ContractIndex, IndexType, MonthlyPlan, PlanItem, Equipment, PlanEquipment, FleetStatus } from '../types';
import { DataService } from '../services/dataService';
import { Save, Calendar, BarChart3, TrendingUp, AlertCircle, Truck, Plus, Minus, X, CheckSquare, Trash2, DollarSign } from 'lucide-react';

export const PlanningModule: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  // Contract Items State
  const [indices, setIndices] = useState<ContractIndex[]>([]);
  const [planItems, setPlanItems] = useState<Record<string, number>>({}); // IndexID -> Quantity
  
  // Equipment State
  const [allEquipment, setAllEquipment] = useState<Equipment[]>([]);
  const [fleetPlan, setFleetPlan] = useState<PlanEquipment[]>([]);
  
  const [showEqModal, setShowEqModal] = useState(false);
  const [selectedForMobilization, setSelectedForMobilization] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
    DataService.getEquipment().then(setAllEquipment);
  }, []);

  useEffect(() => {
    if (selectedProject && selectedMonth) {
      loadPlanningData();
    }
  }, [selectedProject, selectedMonth]);

  const loadPlanningData = async () => {
    setLoading(true);
    const [projectIndices, existingPlan] = await Promise.all([
      DataService.getIndices(selectedProject),
      DataService.getPlan(selectedProject, parseInt(selectedMonth.split('-')[1]), parseInt(selectedMonth.split('-')[0]))
    ]);
    
    setIndices(projectIndices);
    
    // Initialize Item Quantities
    const initialValues: Record<string, number> = {};
    projectIndices.forEach(idx => {
      const savedItem = existingPlan?.items.find(pi => pi.indexId === idx.id);
      initialValues[idx.id] = savedItem ? savedItem.plannedQuantity : 0;
    });
    setPlanItems(initialValues);

    // Initialize Fleet Plan (Auto-loaded from previous month via DataService if new)
    if (existingPlan && existingPlan.fleet) {
        setFleetPlan(existingPlan.fleet);
    } else {
        setFleetPlan([]);
    }

    setLoading(false);
  };

  const handleQuantityChange = (indexId: string, qty: number) => {
    setPlanItems(prev => ({
      ...prev,
      [indexId]: qty
    }));
  };

  // --- Equipment Mobilization Logic ---

  const demobilizeEquipment = (id: string) => {
      setFleetPlan(prev => prev.filter(item => item.equipmentId !== id));
  };

  const updateFleetItem = (eqId: string, field: keyof PlanEquipment, value: any) => {
      setFleetPlan(prev => prev.map(item => {
          if (item.equipmentId === eqId) {
              return { ...item, [field]: value };
          }
          return item;
      }));
  };

  const toggleSelectionForMobilization = (id: string) => {
      setSelectedForMobilization(prev => 
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  const commitMobilization = () => {
      const newItems: PlanEquipment[] = selectedForMobilization.map(id => ({
          equipmentId: id,
          status: 'MOBILIZACAO',
          targetProductive: 0,
          targetUnproductive: 0,
          estimatedCost: 0
      }));
      
      setFleetPlan(prev => [...prev, ...newItems]);
      setSelectedForMobilization([]);
      setShowEqModal(false);
  };

  // --- Totals Calculation ---

  const calculateTotals = () => {
    // 1. Production Contract Items
    let rentalTotal = 0;
    let constructionTotal = 0;

    indices.forEach(idx => {
      const qty = planItems[idx.id] || 0;
      const val = qty * idx.currentPrice;
      if (idx.type === IndexType.RENTAL) rentalTotal += val;
      else constructionTotal += val;
    });

    // 2. Fleet Financials
    const fleetProductive = fleetPlan.reduce((acc, i) => acc + (i.targetProductive || 0), 0);
    const fleetUnproductive = fleetPlan.reduce((acc, i) => acc + (i.targetUnproductive || 0), 0);
    const fleetRevenue = fleetProductive + fleetUnproductive;
    const fleetCost = fleetPlan.reduce((acc, i) => acc + (i.estimatedCost || 0), 0);
    const fleetMargin = fleetRevenue - fleetCost;

    return { 
        rentalTotal, 
        constructionTotal, 
        grandTotalContract: rentalTotal + constructionTotal, // Total from the Index table
        
        // Fleet Specific
        fleetProductive,
        fleetUnproductive,
        fleetRevenue,
        fleetCost,
        fleetMargin
    };
  };

  const handleSave = async () => {
    setSaving(true);
    const [year, month] = selectedMonth.split('-').map(Number);
    
    const itemsToSave: PlanItem[] = indices.map(idx => ({
      indexId: idx.id,
      plannedQuantity: planItems[idx.id] || 0,
      totalValue: (planItems[idx.id] || 0) * idx.currentPrice
    })).filter(item => item.plannedQuantity > 0);

    const plan: MonthlyPlan = {
      id: Math.random().toString(36).substr(2, 9), 
      projectId: selectedProject,
      month,
      year,
      items: itemsToSave,
      fleet: fleetPlan,
      totalValue: itemsToSave.reduce((acc, i) => acc + i.totalValue, 0)
    };

    await DataService.savePlan(plan);
    setSaving(false);
    setSuccessMsg('Planejamento salvo com sucesso!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const totals = calculateTotals();
  
  // Helper to filter out already planned equipment from the modal list
  const availableFleet = allEquipment.filter(eq => !fleetPlan.some(fp => fp.equipmentId === eq.id));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-dr-900">Planejamento Mensal</h2>
           <p className="text-sm text-gray-500">Definição de frota ativa e metas de produção (Baseline)</p>
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
        
        {/* Quick Summary in Control Bar */}
        <div className="flex flex-col justify-center border-l pl-6 border-gray-100">
           <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Receita Contratual (Itens)</span>
           <span className="text-2xl font-bold text-dr-primary">
             {totals.grandTotalContract.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
           </span>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg font-medium border border-green-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          {successMsg}
        </div>
      )}
      
      {/* SECTION 1: EQUIPMENT PLANNING (MOBILIZATION) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Enhanced Header with Detailed Metrics */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex flex-col gap-2">
             <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                 <Truck size={18} /> Planejamento de Frota
             </h3>
             <div className="flex flex-wrap gap-2 text-[10px] md:text-xs">
                 <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 flex flex-col md:block">
                    <span className="font-semibold uppercase mr-1">Produtivo:</span>
                    {totals.fleetProductive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </div>
                 <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100 flex flex-col md:block">
                    <span className="font-semibold uppercase mr-1">Improdutivo:</span>
                    {totals.fleetUnproductive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </div>
                 <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100 flex flex-col md:block">
                    <span className="font-semibold uppercase mr-1">Total Receita:</span>
                    {totals.fleetRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </div>
                 <div className="bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 flex flex-col md:block">
                    <span className="font-semibold uppercase mr-1">Custos:</span>
                    {totals.fleetCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </div>
                 <div className={`${totals.fleetMargin >= 0 ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'} px-2 py-1 rounded border flex flex-col md:block`}>
                    <span className="font-semibold uppercase mr-1">Margem:</span>
                    <strong>{totals.fleetMargin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                 </div>
             </div>
           </div>
           <button 
             onClick={() => setShowEqModal(true)}
             disabled={!selectedProject}
             className="bg-dr-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-dr-700 flex items-center gap-2 disabled:opacity-50 h-fit"
           >
             <Plus size={14} /> Planejar Equipamento
           </button>
        </div>

        {fleetPlan.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
                Nenhum equipamento planejado para este mês. <br/>
                Os equipamentos do mês anterior são carregados automaticamente ao iniciar um novo plano.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-500 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 min-w-[200px]">Equipamento</th>
                            <th className="px-4 py-3">Categoria</th>
                            <th className="px-4 py-3 w-40">Status</th>
                            <th className="px-4 py-3 text-right text-blue-700 w-32">Prev. Produtivo (R$)</th>
                            <th className="px-4 py-3 text-right text-amber-700 w-32">Prev. Improdutivo (R$)</th>
                            <th className="px-4 py-3 text-right text-red-700 w-32">Prev. Custos (R$)</th>
                            <th className="px-4 py-3 text-right font-bold w-32 bg-gray-50">Margem Prevista</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {fleetPlan.map(item => {
                            const eq = allEquipment.find(e => e.id === item.equipmentId);
                            if (!eq) return null;
                            
                            const rowRevenue = (item.targetProductive || 0) + (item.targetUnproductive || 0);
                            const rowMargin = rowRevenue - (item.estimatedCost || 0);

                            return (
                                <tr key={item.equipmentId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{eq.internalCode}</div>
                                        <div className="text-xs text-gray-500">{eq.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{eq.category}</span></td>
                                    <td className="px-4 py-3">
                                        <select 
                                            className={`w-full text-xs font-bold rounded border px-2 py-1.5 focus:ring-2 focus:ring-blue-500 ${
                                                item.status === 'ATIVO' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.status === 'MOBILIZACAO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}
                                            value={item.status}
                                            onChange={(e) => updateFleetItem(item.equipmentId, 'status', e.target.value)}
                                        >
                                            <option value="ATIVO">ATIVO</option>
                                            <option value="MOBILIZACAO">MOBILIZAÇÃO</option>
                                            <option value="DESMOBILIZACAO">DESMOBILIZAÇÃO</option>
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="number"
                                            className="w-full text-right border-gray-300 rounded text-sm px-2 py-1 focus:border-blue-500 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={item.targetProductive || ''}
                                            placeholder="0,00"
                                            onChange={(e) => updateFleetItem(item.equipmentId, 'targetProductive', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="number"
                                            className="w-full text-right border-gray-300 rounded text-sm px-2 py-1 focus:border-amber-500 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={item.targetUnproductive || ''}
                                            placeholder="0,00"
                                            onChange={(e) => updateFleetItem(item.equipmentId, 'targetUnproductive', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="number"
                                            className="w-full text-right border-red-200 bg-red-50/20 rounded text-sm px-2 py-1 focus:border-red-500 focus:ring-red-500 font-medium text-red-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            value={item.estimatedCost || ''}
                                            placeholder="0,00"
                                            onChange={(e) => updateFleetItem(item.equipmentId, 'estimatedCost', parseFloat(e.target.value) || 0)}
                                        />
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold bg-gray-50 ${rowMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {rowMargin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => demobilizeEquipment(item.equipmentId)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Remover do plano"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* SECTION 2: PRODUCTION/INDEX PLANNING */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
           <h3 className="font-semibold text-gray-700 flex items-center gap-2"><BarChart3 size={18} /> Metas de Produção (Itens do Contrato)</h3>
           <div className="flex gap-4 text-sm">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
               Rental: <strong>{totals.rentalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
             </div>
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-amber-500"></span>
               Construtora: <strong>{totals.constructionTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
             </div>
           </div>
        </div>

        {loading ? (
            <div className="p-12 text-center text-gray-400">Carregando itens do contrato...</div>
        ) : indices.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Selecione uma obra para iniciar o planejamento.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-20">Tipo</th>
                  <th className="px-6 py-4">Item (SAP)</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4 text-center">Unid.</th>
                  <th className="px-6 py-4 text-right">Preço Unit.</th>
                  <th className="px-6 py-4 text-center bg-blue-50/30 font-bold text-blue-800">Qtd. Planejada</th>
                  <th className="px-6 py-4 text-right font-bold">Total Planejado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {indices.map(idx => {
                   const qty = planItems[idx.id] || 0;
                   const total = qty * idx.currentPrice;
                   
                   return (
                    <tr key={idx.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            idx.type === IndexType.RENTAL ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {idx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-700">{idx.codeSAP}</td>
                      <td className="px-6 py-4 text-gray-600">{idx.description}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{idx.unit}</td>
                      <td className="px-6 py-4 text-right text-gray-500">
                        {idx.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="px-6 py-4 bg-blue-50/10">
                        <input 
                          type="number"
                          min="0"
                          className="w-full border-gray-300 rounded text-sm h-9 border px-2 text-center font-bold text-dr-900 focus:ring-blue-500 focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={qty}
                          onChange={(e) => handleQuantityChange(idx.id, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">
                        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
            onClick={handleSave}
            disabled={saving || loading || indices.length === 0}
            className="bg-dr-primary text-white px-8 py-3 rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2 font-medium disabled:opacity-50 transition-all transform hover:-translate-y-0.5"
        >
            {saving ? 'Salvando...' : (
            <>
                <Save size={20} /> Salvar Planejamento
            </>
            )}
        </button>
      </div>

      {/* MOBILIZATION MODAL */}
      {showEqModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col animate-fade-in">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Selecionar Equipamentos para Planejamento</h3>
                      <button onClick={() => setShowEqModal(false)}><X size={20} className="text-gray-400" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {availableFleet.length === 0 ? (
                          <p className="p-6 text-center text-gray-500">Todos os equipamentos já estão mobilizados.</p>
                      ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 w-10"></th>
                                    <th className="px-4 py-2">Equipamento</th>
                                    <th className="px-4 py-2">Categoria</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {availableFleet.map(eq => (
                                    <tr 
                                        key={eq.id} 
                                        className="hover:bg-blue-50 cursor-pointer"
                                        onClick={() => toggleSelectionForMobilization(eq.id)}
                                    >
                                        <td className="px-4 py-3">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedForMobilization.includes(eq.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                                                {selectedForMobilization.includes(eq.id) && <CheckSquare size={14} />}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{eq.internalCode}</div>
                                            <div className="text-xs text-gray-500">{eq.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{eq.category}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                      )}
                  </div>
                  <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                      <button onClick={() => setShowEqModal(false)} className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800">Cancelar</button>
                      <button 
                        onClick={commitMobilization} 
                        disabled={selectedForMobilization.length === 0}
                        className="bg-dr-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                          Adicionar ({selectedForMobilization.length})
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
        <AlertCircle size={20} className="shrink-0" />
        <p>
            <strong>Nota:</strong> O planejamento de frota e produção serve como <em>Baseline</em>. 
            Os valores preenchidos aqui serão comparados com o realizado (RDO) nos dashboards.
        </p>
      </div>
    </div>
  );
};