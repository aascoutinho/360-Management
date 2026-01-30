import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentCost, CostType } from '../types';
import { DataService } from '../services/dataService';
import { DollarSign, Plus, Trash2, Edit2, Wrench, Shield, FileText, AlertTriangle, X } from 'lucide-react';

export const CostManager: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [costList, setCostList] = useState<EquipmentCost[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<EquipmentCost | null>(null);

  // Form State
  const [costForm, setCostForm] = useState<Partial<EquipmentCost>>({
    type: CostType.MANUTENCAO,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eq, costs] = await Promise.all([
      DataService.getEquipment(),
      DataService.getEquipmentCosts(),
    ]);
    setEquipmentList(eq);
    setCostList(costs);
    setLoading(false);
  };

  const handleOpenCostModal = (cost?: EquipmentCost) => {
    if (cost) {
      setEditingCost(cost);
      setCostForm(cost);
    } else {
      setEditingCost(null);
      setCostForm({
        type: CostType.MANUTENCAO,
        date: new Date().toISOString().split('T')[0],
        equipmentId: equipmentList[0]?.id
      });
    }
    setIsCostModalOpen(true);
  };

  const handleSaveCost = async () => {
    if (!costForm.equipmentId || !costForm.value) return;

    const payload = {
      ...costForm,
      id: editingCost ? editingCost.id : Math.random().toString(36).substr(2, 9)
    } as EquipmentCost;

    if (editingCost) {
      await DataService.updateCost(payload);
    } else {
      await DataService.addCost(payload);
    }
    
    setIsCostModalOpen(false);
    loadData();
  };

  const handleDeleteCost = async (id: string) => {
    if (window.confirm('Excluir este custo permanentemente?')) {
      await DataService.deleteCost(id);
      loadData();
    }
  };

  const getCostIcon = (type: CostType) => {
    switch (type) {
      case CostType.MANUTENCAO: return <Wrench size={16} className="text-orange-500" />;
      case CostType.SEGURO: return <Shield size={16} className="text-blue-500" />;
      case CostType.IPVA: return <FileText size={16} className="text-purple-500" />;
      default: return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dr-900">Custos & Despesas</h2>
          <p className="text-sm text-gray-500">Lançamento de manutenções, impostos e locações</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <DollarSign size={20} /> Histórico de Despesas
             </div>
             <button 
               onClick={() => handleOpenCostModal()}
               className="bg-dr-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-dr-700 flex items-center gap-2"
             >
               <Plus size={16} /> Novo Custo
             </button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Equipamento</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4 text-right">Valor</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {costList.map(cost => {
              const eq = equipmentList.find(e => e.id === cost.equipmentId);
              return (
                <tr key={cost.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-600">{new Date(cost.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-700 font-medium">
                      {getCostIcon(cost.type)}
                      {cost.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-gray-900 font-medium">{eq?.internalCode}</div>
                     <div className="text-xs text-gray-500">{eq?.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{cost.description}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    - {cost.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenCostModal(cost)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                          <Edit2 size={16} />
                       </button>
                       <button onClick={() => handleDeleteCost(cost.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                          <Trash2 size={16} />
                       </button>
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- COST MODAL --- */}
      {isCostModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{editingCost ? 'Editar Custo' : 'Lançar Novo Custo'}</h3>
              <button onClick={() => setIsCostModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento</label>
                 <select 
                    className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border bg-white"
                    value={costForm.equipmentId}
                    onChange={(e) => setCostForm({...costForm, equipmentId: e.target.value})}
                  >
                    {equipmentList.map(e => <option key={e.id} value={e.id}>{e.internalCode} - {e.name}</option>)}
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Custo</label>
                    <select 
                      className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border bg-white"
                      value={costForm.type}
                      onChange={(e) => setCostForm({...costForm, type: e.target.value as CostType})}
                    >
                      {Object.values(CostType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                     <input 
                       type="number" step="0.01" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border"
                       value={costForm.value || ''}
                       onChange={(e) => setCostForm({...costForm, value: parseFloat(e.target.value)})}
                     />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input 
                       type="date" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border"
                       value={costForm.date}
                       onChange={(e) => setCostForm({...costForm, date: e.target.value})}
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <textarea 
                     className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border h-20 resize-none"
                     placeholder="Detalhes do serviço ou custo..."
                     value={costForm.description || ''}
                     onChange={(e) => setCostForm({...costForm, description: e.target.value})}
                  />
               </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
               <button onClick={() => setIsCostModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800">Cancelar</button>
               <button onClick={handleSaveCost} className="bg-dr-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                 {editingCost ? 'Atualizar Custo' : 'Lançar Custo'}
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};