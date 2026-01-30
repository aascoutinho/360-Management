import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Project, ContractIndex, IndexType, IndexRevision } from '../types';
import { TrendingUp, Clock, Edit2, Trash2, History, Plus, X, Save } from 'lucide-react';

export const IndexManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [indices, setIndices] = useState<ContractIndex[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals State
  const [selectedIdxForRevision, setSelectedIdxForRevision] = useState<ContractIndex | null>(null);
  const [revisions, setRevisions] = useState<IndexRevision[]>([]);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  
  // New Revision Form State
  const [newRevPrice, setNewRevPrice] = useState<number>(0);
  const [newRevQty, setNewRevQty] = useState<number>(0);
  const [newRevDate, setNewRevDate] = useState<string>('');
  const [newRevReason, setNewRevReason] = useState<string>('');

  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
  }, []);

  const loadIndices = () => {
    if (selectedProject) {
      setLoading(true);
      DataService.getIndices(selectedProject).then(data => {
        setIndices(data);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    loadIndices();
  }, [selectedProject]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este índice? Isso não afetará RDOs já lançados.')) {
      await DataService.deleteIndex(id);
      loadIndices();
    }
  };

  const handleEdit = (idx: ContractIndex) => {
    const newDesc = prompt("Editar Descrição:", idx.description);
    if (newDesc && newDesc !== idx.description) {
      DataService.updateIndex({ ...idx, description: newDesc }).then(loadIndices);
    }
  };

  const openRevisions = async (idx: ContractIndex) => {
    setSelectedIdxForRevision(idx);
    setNewRevPrice(idx.currentPrice);
    setNewRevQty(idx.totalQuantity);
    setNewRevDate(new Date().toISOString().split('T')[0]);
    
    const revs = await DataService.getRevisions(idx.id);
    setRevisions(revs);
    setShowRevisionModal(true);
  };

  const handleAddRevision = async () => {
    if (!selectedIdxForRevision) return;

    const revision: IndexRevision = {
      id: Math.random().toString(36).substr(2, 9),
      indexId: selectedIdxForRevision.id,
      price: newRevPrice,
      quantity: newRevQty,
      effectiveDate: newRevDate,
      reason: newRevReason || 'Reajuste Contratual'
    };

    await DataService.addRevision(revision);
    
    // Refresh modal list and main list
    const revs = await DataService.getRevisions(selectedIdxForRevision.id);
    setRevisions(revs);
    loadIndices();
    
    // Reset form
    setNewRevReason('');
  };

  return (
    <div className="space-y-6 relative">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dr-900">Gestão de Índices Contratuais</h2>
        <select 
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-sm"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 bg-gray-100">Cód. Item</th>
              <th className="px-6 py-4">Código SAP</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Unidade</th>
              <th className="px-6 py-4 text-right">Preço Unit.</th>
              <th className="px-6 py-4 text-right">Qtd. Total</th>
              <th className="px-6 py-4 text-right">Valor Total</th>
              <th className="px-6 py-4 text-center">Revisão</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {indices.map(idx => (
              <tr 
                key={idx.id} 
                className="hover:bg-blue-50 transition-colors cursor-pointer group"
                onClick={() => openRevisions(idx)}
              >
                <td className="px-6 py-4 font-bold text-gray-800 bg-gray-50/50">
                  {idx.itemCode}
                </td>
                <td className="px-6 py-4 font-medium text-dr-900">
                  <div className="flex items-center gap-2">
                    {idx.codeSAP}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      idx.type === IndexType.RENTAL ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {idx.type === IndexType.RENTAL ? 'R' : 'C'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">{idx.description}</td>
                <td className="px-6 py-4">{idx.unit}</td>
                <td className="px-6 py-4 text-right font-medium">
                  {idx.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {idx.totalQuantity.toLocaleString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-right font-bold text-dr-700 bg-gray-50/50">
                  {idx.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Rev. {idx.revision}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleEdit(idx)}
                      className="p-1 text-gray-400 hover:text-dr-primary hover:bg-blue-50 rounded"
                      title="Editar Descrição"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(idx.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Excluir Índice"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revision Modal */}
      {showRevisionModal && selectedIdxForRevision && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <History size={20} className="text-dr-primary" />
                  Histórico de Revisões
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Item {selectedIdxForRevision.itemCode} - {selectedIdxForRevision.codeSAP}
                </p>
                <p className="text-sm font-medium">{selectedIdxForRevision.description}</p>
              </div>
              <button onClick={() => setShowRevisionModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* New Revision Form */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Plus size={16} /> Nova Revisão / Reajuste
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Novo Preço ({selectedIdxForRevision.unit})</label>
                    <input 
                      type="number" 
                      className="w-full border-blue-200 rounded px-2 py-1.5 text-sm"
                      value={newRevPrice}
                      onChange={(e) => setNewRevPrice(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Nova Quantidade</label>
                    <input 
                      type="number" 
                      className="w-full border-blue-200 rounded px-2 py-1.5 text-sm"
                      value={newRevQty}
                      onChange={(e) => setNewRevQty(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Data Vigência</label>
                    <input 
                      type="date" 
                      className="w-full border-blue-200 rounded px-2 py-1.5 text-sm"
                      value={newRevDate}
                      onChange={(e) => setNewRevDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Motivo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Reajuste Anual"
                      className="w-full border-blue-200 rounded px-2 py-1.5 text-sm"
                      value={newRevReason}
                      onChange={(e) => setNewRevReason(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleAddRevision}
                    className="bg-dr-primary text-white text-xs px-3 py-2 rounded font-medium hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Save size={14} /> Salvar Revisão
                  </button>
                </div>
              </div>

              {/* History List */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Histórico Praticado</h4>
                {revisions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Nenhuma revisão registrada. Valores iniciais vigentes.</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Data Vigência</th>
                          <th className="px-4 py-2 text-right">Preço</th>
                          <th className="px-4 py-2 text-right">Qtd.</th>
                          <th className="px-4 py-2 text-left">Motivo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {revisions.map(rev => (
                          <tr key={rev.id} className="bg-white">
                            <td className="px-4 py-2 text-gray-900">{rev.effectiveDate}</td>
                            <td className="px-4 py-2 text-right font-medium">{rev.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td className="px-4 py-2 text-right text-gray-600">{rev.quantity.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-2 text-gray-500">{rev.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button 
                onClick={() => setShowRevisionModal(false)}
                className="text-gray-600 hover:text-gray-800 font-medium text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};