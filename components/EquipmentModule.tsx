import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentCost, EquipmentOwner, CostType, Company } from '../types';
import { DataService } from '../services/dataService';
import { Truck, DollarSign, Plus, Trash2, Edit2, Wrench, Shield, FileText, AlertTriangle, X, Save } from 'lucide-react';

export const EquipmentModule: React.FC = () => {
  const [view, setView] = useState<'assets' | 'costs'>('assets');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [costList, setCostList] = useState<EquipmentCost[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Equipment | null>(null);

  // Form State - Asset
  const [assetForm, setAssetForm] = useState<Partial<Equipment>>({
    owner: EquipmentOwner.GRUPO_DR,
    category: 'Linha Amarela'
  });

  // Form State - Cost
  const [costForm, setCostForm] = useState<Partial<EquipmentCost>>({
    type: CostType.MANUTENCAO,
    date: new Date().toISOString().split('T')[0]
  });

  const CATEGORIES = ['Linha Amarela', 'Caminhões', 'Veículos Leves', 'Geradores', 'Equip. Pequeno Porte'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eq, costs, comps] = await Promise.all([
      DataService.getEquipment(),
      DataService.getEquipmentCosts(),
      DataService.getCompanies()
    ]);
    setEquipmentList(eq);
    setCostList(costs);
    setCompanies(comps);
    setLoading(false);
  };

  // --- ASSET HANDLERS ---

  const handleOpenAssetModal = (asset?: Equipment) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetForm(asset);
    } else {
      setEditingAsset(null);
      setAssetForm({ owner: EquipmentOwner.GRUPO_DR, category: 'Linha Amarela', responsibleCompanyId: companies[0]?.id });
    }
    setIsAssetModalOpen(true);
  };

  const handleSaveAsset = async () => {
    if (!assetForm.name || !assetForm.internalCode || !assetForm.responsibleCompanyId) return;

    const payload = {
        ...assetForm,
        id: editingAsset ? editingAsset.id : Math.random().toString(36).substr(2, 9)
    } as Equipment;

    if (editingAsset) {
      await DataService.updateEquipment(payload);
    } else {
      await DataService.addEquipment(payload);
    }
    setIsAssetModalOpen(false);
    loadData();
  };

  const handleDeleteAsset = async (id: string) => {
    if (window.confirm('Tem certeza? Custos associados não serão apagados automaticamente.')) {
      await DataService.deleteEquipment(id);
      loadData();
    }
  };

  // --- COST HANDLERS ---

  const handleOpenCostModal = () => {
    setCostForm({
      type: CostType.MANUTENCAO,
      date: new Date().toISOString().split('T')[0],
      equipmentId: equipmentList[0]?.id
    });
    setIsCostModalOpen(true);
  };

  const handleSaveCost = async () => {
    if (!costForm.equipmentId || !costForm.value) return;

    const payload = {
      ...costForm,
      id: Math.random().toString(36).substr(2, 9)
    } as EquipmentCost;

    await DataService.addCost(payload);
    setIsCostModalOpen(false);
    loadData();
  };

  const handleDeleteCost = async (id: string) => {
    if (window.confirm('Excluir este custo?')) {
      await DataService.deleteCost(id);
      loadData();
    }
  };

  // --- HELPERS ---
  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || id;
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
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dr-900">Gestão de Ativos & Custos</h2>
          <p className="text-sm text-gray-500">Controle da frota e despesas operacionais</p>
        </div>
        <div className="flex bg-white p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setView('assets')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
              view === 'assets' ? 'bg-dr-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Truck size={16} /> Frota
          </button>
          <button
            onClick={() => setView('costs')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
              view === 'costs' ? 'bg-dr-primary text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign size={16} /> Custos
          </button>
        </div>
      </div>

      {/* --- ASSETS VIEW --- */}
      {view === 'assets' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-semibold text-gray-700">Equipamentos Cadastrados</h3>
             <button 
               onClick={() => handleOpenAssetModal()}
               className="bg-dr-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-dr-700 flex items-center gap-2"
             >
               <Plus size={16} /> Novo Ativo
             </button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-white text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Equipamento</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Propriedade</th>
                <th className="px-6 py-4">Responsável</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipmentList.map(eq => (
                <tr key={eq.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">{eq.internalCode}</td>
                  <td className="px-6 py-4 text-gray-800">{eq.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{eq.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    {eq.owner === EquipmentOwner.GRUPO_DR ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-xs font-bold border border-emerald-100">Próprio</span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-bold border border-amber-100">Terceiro</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-xs">
                    {getCompanyName(eq.responsibleCompanyId)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleOpenAssetModal(eq)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                         <Edit2 size={16} />
                       </button>
                       <button onClick={() => handleDeleteAsset(eq.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- COSTS VIEW --- */}
      {view === 'costs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <h3 className="font-semibold text-gray-700">Lançamento de Custos</h3>
             <button 
               onClick={handleOpenCostModal}
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
                       <button onClick={() => handleDeleteCost(cost.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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

      {/* --- ASSET MODAL --- */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{editingAsset ? 'Editar Equipamento' : 'Novo Equipamento'}</h3>
              <button onClick={() => setIsAssetModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno</label>
                 <input 
                   type="text" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border"
                   placeholder="Ex: EQ-001"
                   value={assetForm.internalCode || ''}
                   onChange={(e) => setAssetForm({...assetForm, internalCode: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Nome / Modelo</label>
                 <input 
                   type="text" className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border"
                   placeholder="Ex: Escavadeira CAT 320"
                   value={assetForm.name || ''}
                   onChange={(e) => setAssetForm({...assetForm, name: e.target.value})}
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select 
                      className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border bg-white"
                      value={assetForm.category}
                      onChange={(e) => setAssetForm({...assetForm, category: e.target.value})}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Propriedade</label>
                    <select 
                      className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border bg-white"
                      value={assetForm.owner}
                      onChange={(e) => setAssetForm({...assetForm, owner: e.target.value as EquipmentOwner})}
                    >
                      <option value={EquipmentOwner.GRUPO_DR}>Grupo DR</option>
                      <option value={EquipmentOwner.TERCEIRO}>Terceiro</option>
                    </select>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Empresa Responsável</label>
                 <select 
                    className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border bg-white"
                    value={assetForm.responsibleCompanyId}
                    onChange={(e) => setAssetForm({...assetForm, responsibleCompanyId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
               </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
               <button onClick={() => setIsAssetModalOpen(false)} className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-800">Cancelar</button>
               <button onClick={handleSaveAsset} className="bg-dr-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- COST MODAL --- */}
      {isCostModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Lançar Novo Custo</h3>
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
               <button onClick={handleSaveCost} className="bg-dr-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Lançar Custo</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};