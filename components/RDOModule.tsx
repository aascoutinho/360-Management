import React, { useState, useEffect } from 'react';
import { Project, ContractIndex, Equipment, RDOItem, RDO, IndexType } from '../types';
import { DataService } from '../services/dataService';
import { Plus, Trash2, Save, Calendar, AlertCircle } from 'lucide-react';

export const RDOModule: React.FC = () => {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [indices, setIndices] = useState<ContractIndex[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  
  const [rdoDate, setRdoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<RDOItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Initial Load
  useEffect(() => {
    DataService.getProjects().then(setProjects);
    DataService.getEquipment().then(setEquipment);
  }, []);

  // Load Indices when Project Changes
  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      DataService.getIndices(selectedProject).then(data => {
        setIndices(data);
        setLoading(false);
      });
    }
  }, [selectedProject]);

  // Handler: Add Item Line
  const addItem = () => {
    const newItem: RDOItem = {
      id: Math.random().toString(36).substr(2, 9),
      rdoId: '',
      indexId: '',
      quantity: 0,
      frozenPrice: 0,
      totalValue: 0
    };
    setItems([...items, newItem]);
  };

  // Handler: Update Item
  const updateItem = (id: string, field: keyof RDOItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      // Critical Business Logic: 
      // When Index is selected, we MUST freeze the price immediately from the source.
      if (field === 'indexId') {
        const selectedIndex = indices.find(i => i.id === value);
        if (selectedIndex) {
          updated.frozenPrice = selectedIndex.currentPrice;
        }
      }

      // Recalculate Total Value automatically
      if (field === 'quantity' || field === 'indexId') {
        updated.totalValue = updated.quantity * updated.frozenPrice;
      }

      return updated;
    }));
  };

  // Handler: Remove Item
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // Handler: Save RDO
  const handleSave = async () => {
    if (!selectedProject || items.length === 0) return;

    setSaving(true);
    
    const rdo: RDO = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: selectedProject,
      date: rdoDate,
      status: 'APPROVED', // Direct approval for simplicity in this demo
      items: items,
      totalDailyValue: items.reduce((acc, curr) => acc + curr.totalValue, 0)
    };

    await DataService.saveRDO(rdo);
    setSaving(false);
    setSuccessMsg('RDO Salvo com sucesso!');
    setItems([]);
    
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const grandTotal = items.reduce((acc, curr) => acc + curr.totalValue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dr-900">Lançamento de RDO Diário</h2>
        {successMsg && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-md font-medium border border-green-200">
            {successMsg}
          </div>
        )}
      </div>

      {/* Header Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Obra / Contrato</label>
          <select 
            className="w-full border-gray-300 rounded-lg shadow-sm focus:border-dr-primary focus:ring-dr-primary h-10 border px-3"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Selecione a Obra...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data de Execução</label>
          <div className="relative">
            <input 
              type="date" 
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-dr-primary focus:ring-dr-primary h-10 border px-3 pl-10"
              value={rdoDate}
              onChange={(e) => setRdoDate(e.target.value)}
            />
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>

        <div className="flex items-end">
          <div className="bg-dr-50 p-3 rounded-lg w-full flex justify-between items-center border border-dr-100">
             <span className="text-sm text-dr-700 font-medium">Total do Dia</span>
             <span className="text-xl font-bold text-dr-primary">
               {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
             </span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Itens Executados</h3>
          <button 
            onClick={addItem}
            disabled={!selectedProject}
            className="flex items-center gap-2 text-sm bg-dr-800 text-white px-4 py-2 rounded-lg hover:bg-dr-700 transition-colors disabled:opacity-50"
          >
            <Plus size={16} /> Adicionar Item
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p>Nenhum item lançado para este dia.</p>
            <p className="text-sm mt-1">Selecione uma obra e clique em "Adicionar Item" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-1/3">Índice Contratual</th>
                  <th className="px-4 py-3">Equipamento (Opcional)</th>
                  <th className="px-4 py-3 w-24">Qtd.</th>
                  <th className="px-4 py-3 text-right">Preço Unit. (Congelado)</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <select 
                        className="w-full border-gray-300 rounded text-sm h-9 border px-2"
                        value={item.indexId}
                        onChange={(e) => updateItem(item.id, 'indexId', e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {indices.map(idx => (
                          <option key={idx.id} value={idx.id}>
                            {idx.codeSAP} - {idx.description} ({idx.unit}) - {idx.type === IndexType.RENTAL ? 'RENTAL' : 'CONST'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select 
                        className="w-full border-gray-300 rounded text-sm h-9 border px-2"
                        value={item.equipmentId || ''}
                        onChange={(e) => updateItem(item.id, 'equipmentId', e.target.value)}
                      >
                        <option value="">Nenhum</option>
                        {equipment.map(eq => (
                          <option key={eq.id} value={eq.id}>
                            {eq.internalCode} - {eq.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="number" 
                        className="w-full border-gray-300 rounded text-sm h-9 border px-2 text-center"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {item.frozenPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-dr-900">
                      {item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving || items.length === 0}
          className="bg-dr-primary text-white px-8 py-3 rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
        >
          {saving ? 'Salvando...' : (
            <>
              <Save size={20} /> Encerrar RDO do Dia
            </>
          )}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3 text-sm text-yellow-800">
        <AlertCircle size={20} className="shrink-0" />
        <p>
          <strong>Regra de Negócio:</strong> Os preços unitários serão congelados no momento do salvamento. 
          Revisões contratuais futuras não afetarão o valor deste RDO (Imutabilidade Financeira).
        </p>
      </div>
    </div>
  );
};