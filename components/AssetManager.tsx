import React, { useState, useEffect } from 'react';
import { Equipment, EquipmentOwner, Company } from '../types';
import { DataService } from '../services/dataService';
import { Truck, Plus, Trash2, Edit2, X, Search } from 'lucide-react';

export const AssetManager: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Equipment | null>(null);

  // Form State
  const [assetForm, setAssetForm] = useState<Partial<Equipment>>({
    owner: EquipmentOwner.GRUPO_DR,
    category: 'Linha Amarela'
  });

  const CATEGORIES = ['Linha Amarela', 'Caminhões', 'Veículos Leves', 'Geradores', 'Equip. Pequeno Porte'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eq, comps] = await Promise.all([
      DataService.getEquipment(),
      DataService.getCompanies()
    ]);
    setEquipmentList(eq);
    setCompanies(comps);
    setLoading(false);
  };

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

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || id;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dr-900">Gestão da Frota (Ativos)</h2>
          <p className="text-sm text-gray-500">Cadastro de máquinas, caminhões e equipamentos</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
             <div className="flex items-center gap-2 text-gray-700 font-semibold">
               <Truck size={20} /> Frota Atual
             </div>
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
                      <button onClick={() => handleOpenAssetModal(eq)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteAsset(eq.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};