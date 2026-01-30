import React, { useState, useEffect, useMemo } from 'react';
import { Project, ContractIndex, Equipment, RDOItem, RDO, IndexType, ProjectSegment, MeasurementType, RDOImpact } from '../types';
import { DataService } from '../services/dataService';
import { Plus, Trash2, Save, Calendar, AlertCircle, TrendingUp, Clock, MapPin, FileText, List, Pencil, ArrowLeft, CloudRain, AlertTriangle, Wrench, X } from 'lucide-react';

export const RDOModule: React.FC = () => {
  // View State
  const [viewMode, setViewMode] = useState<'create' | 'list' | 'edit'>('create');
  
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [indices, setIndices] = useState<ContractIndex[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [segments, setSegments] = useState<ProjectSegment[]>([]); 
  const [historyList, setHistoryList] = useState<RDO[]>([]);

  // Form State - Items
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rdoDate, setRdoDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<RDOItem[]>([]);
  
  // Form State - Impacts
  const [impacts, setImpacts] = useState<RDOImpact[]>([]);
  const [newImpact, setNewImpact] = useState<Partial<RDOImpact>>({ type: 'CLIMA' });

  // Status
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Initial Load
  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      // Default to first project if none selected
      if(data.length > 0 && !selectedProject) setSelectedProject(data[0].id);
    });
    DataService.getEquipment().then(setEquipment);
  }, []);

  // Load Indices and Segments when Project Changes
  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      DataService.getIndices(selectedProject).then(data => {
        setIndices(data);
      });
      DataService.getSegments(selectedProject).then(data => {
        setSegments(data);
      });
      setLoading(false);
    }
  }, [selectedProject]);

  // Load History when switching to List mode or changing project in list mode
  useEffect(() => {
    if (viewMode === 'list') {
      DataService.getRDOs(selectedProject).then(setHistoryList);
    }
  }, [viewMode, selectedProject]);

  // --- ACTIONS ---

  const handleCreateNew = () => {
    setEditingId(null);
    setItems([]);
    setImpacts([]);
    setRdoDate(new Date().toISOString().split('T')[0]);
    setViewMode('create');
  };

  const handleEditRDO = (rdo: RDO) => {
    setEditingId(rdo.id);
    setSelectedProject(rdo.projectId);
    setRdoDate(rdo.date);
    setItems(JSON.parse(JSON.stringify(rdo.items))); // Deep copy
    setImpacts(rdo.impacts ? JSON.parse(JSON.stringify(rdo.impacts)) : []); // Load impacts if exist
    setViewMode('edit');
  };

  const handleDeleteRDO = async (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir este RDO permanentemente?')) {
      await DataService.deleteRDO(id);
      DataService.getRDOs(selectedProject).then(setHistoryList);
    }
  };

  // --- ITEMS MANAGEMENT ---

  const addItem = () => {
    const newItem: RDOItem = {
      id: Math.random().toString(36).substr(2, 9),
      rdoId: editingId || '',
      indexId: '',
      quantity: 0,
      frozenPrice: 0,
      totalValue: 0,
      km: undefined,
      city: '',
      segment: '',
      measurementType: MeasurementType.PRODUTIVO,
      observation: ''
    };
    setItems([...items, newItem]);
  };

  const resolveLocation = (km: number): { city: string, segment: string } => {
    const found = segments.find(s => km >= s.startKm && km <= s.endKm);
    return found ? { city: found.city, segment: found.segmentName } : { city: 'N/A', segment: 'N/A' };
  };

  const updateItem = (id: string, field: keyof RDOItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item, [field]: value };

      if (field === 'indexId') {
        const selectedIndex = indices.find(i => i.id === value);
        if (selectedIndex) {
          updated.frozenPrice = selectedIndex.currentPrice;
        }
      }

      if (field === 'km') {
        const kmVal = parseFloat(value);
        if (!isNaN(kmVal)) {
          const loc = resolveLocation(kmVal);
          updated.city = loc.city;
          updated.segment = loc.segment;
        } else {
          updated.city = '';
          updated.segment = '';
        }
      }

      if (field === 'quantity' || field === 'indexId') {
        updated.totalValue = updated.quantity * updated.frozenPrice;
      }

      return updated;
    }));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // --- IMPACTS MANAGEMENT ---
  
  const addImpact = () => {
    if (!newImpact.description) return;
    
    const imp: RDOImpact = {
      id: Math.random().toString(36).substr(2, 9),
      type: newImpact.type as any || 'CLIMA',
      description: newImpact.description,
      duration: newImpact.duration || ''
    };
    
    setImpacts([...impacts, imp]);
    setNewImpact({ type: 'CLIMA', description: '', duration: '' });
  };

  const removeImpact = (id: string) => {
    setImpacts(prev => prev.filter(i => i.id !== id));
  };

  // --- SAVE ---

  const handleSave = async () => {
    if (!selectedProject || items.length === 0) return;

    setSaving(true);
    
    const rdoPayload: RDO = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      projectId: selectedProject,
      date: rdoDate,
      status: 'APPROVED', 
      items: items,
      impacts: impacts,
      totalDailyValue: items.reduce((acc, curr) => acc + curr.totalValue, 0)
    };

    if (viewMode === 'edit') {
      await DataService.updateRDO(rdoPayload);
      setSuccessMsg('RDO Atualizado com sucesso!');
    } else {
      await DataService.saveRDO(rdoPayload);
      setSuccessMsg('RDO Salvo com sucesso!');
    }

    setSaving(false);
    
    if(viewMode === 'edit') {
       setTimeout(() => {
         setSuccessMsg('');
         setViewMode('list');
       }, 1000);
    } else {
       setItems([]);
       setImpacts([]);
       setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // --- CALCULATIONS ---

  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
      const idx = indices.find(i => i.id === item.indexId);
      if (idx) {
        if (idx.type === IndexType.RENTAL) acc.rentalTotal += item.totalValue;
        else if (idx.type === IndexType.CONSTRUTORA) acc.constructionTotal += item.totalValue;
      }
      
      if (item.measurementType === MeasurementType.PRODUTIVO) {
        acc.productiveTotal += item.totalValue;
      } else {
        acc.unproductiveTotal += item.totalValue;
      }

      acc.grandTotal += item.totalValue;
      return acc;
    }, { rentalTotal: 0, constructionTotal: 0, productiveTotal: 0, unproductiveTotal: 0, grandTotal: 0 });
  }, [items, indices]);

  const groupedSummary = useMemo(() => {
    type SummaryRow = { key: string; city: string; equipmentName: string; productive: number; unproductive: number; total: number; };
    type SegmentGroup = { name: string; productive: number; unproductive: number; total: number; rows: SummaryRow[]; };
    const groups: Record<string, SegmentGroup> = {};

    items.forEach(item => {
      const segName = item.segment || 'Sem Trecho Definido';
      const city = item.city || '-';
      const eqName = equipment.find(e => e.id === item.equipmentId)?.name || 'Sem Equipamento / Outros';
      const isProd = item.measurementType === MeasurementType.PRODUTIVO;
      const val = item.totalValue;

      if (!groups[segName]) groups[segName] = { name: segName, productive: 0, unproductive: 0, total: 0, rows: [] };

      groups[segName].total += val;
      if (isProd) groups[segName].productive += val; else groups[segName].unproductive += val;

      const rowKey = `${item.equipmentId || 'none'}-${city}`;
      let row = groups[segName].rows.find(r => r.key === rowKey);
      if (!row) {
        row = { key: rowKey, city: city, equipmentName: eqName, productive: 0, unproductive: 0, total: 0 };
        groups[segName].rows.push(row);
      }
      row.total += val;
      if (isProd) row.productive += val; else row.unproductive += val;
    });
    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
  }, [items, equipment]);


  // --- RENDER ---

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-dr-900">
             {viewMode === 'list' ? 'Histórico de RDOs' : viewMode === 'edit' ? 'Editar RDO' : 'Novo Lançamento'}
           </h2>
           <p className="text-sm text-gray-500">Gestão diária de produção e equipamentos</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={handleCreateNew}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'create' ? 'bg-white text-dr-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FileText size={16} /> Novo RDO
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-dr-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={16} /> Histórico
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-100 text-green-800 px-4 py-3 rounded-lg font-medium border border-green-200 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          {successMsg}
        </div>
      )}

      {/* --- LIST MODE --- */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><List size={18} /> RDOs Lançados</h3>
            <select 
              className="bg-white border border-gray-300 rounded text-sm h-8 px-2"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
               <option value="">Todas as Obras</option>
               {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          
          {historyList.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>Nenhum RDO encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Obra</th>
                  <th className="px-6 py-4 text-center">Itens</th>
                  <th className="px-6 py-4 text-center">Ocorrências</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historyList.map(rdo => (
                  <tr key={rdo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Date(rdo.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {projects.find(p => p.id === rdo.projectId)?.name || rdo.projectId}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">{rdo.items.length}</td>
                    <td className="px-6 py-4 text-center">
                        {rdo.impacts && rdo.impacts.length > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                {rdo.impacts.length} Reg.
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs">-</span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-dr-primary">
                      {rdo.totalDailyValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                         {rdo.status}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         <button 
                           onClick={() => handleEditRDO(rdo)}
                           className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                           title="Editar"
                         >
                           <Pencil size={16} />
                         </button>
                         <button 
                           onClick={() => handleDeleteRDO(rdo.id)}
                           className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                           title="Excluir"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* --- FORM MODE (Create or Edit) --- */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <div className="space-y-6">
          
          {/* Header Controls & Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {viewMode === 'edit' && (
              <button 
                onClick={() => setViewMode('list')}
                className="absolute top-4 right-4 text-gray-400 hover:text-dr-primary"
                title="Voltar para lista"
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Obra / Contrato</label>
                  <select 
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-dr-primary focus:ring-dr-primary h-10 border px-3"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    disabled={viewMode === 'edit'} // Disable changing project during edit to avoid index mismatches
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
              </div>
            </div>

            {/* Produtividade Breakdown */}
            <div className="flex flex-col justify-center space-y-2 border-l pl-6 border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <TrendingUp size={14} className="text-dr-primary"/> Produtivo
                </span>
                <span className="font-bold text-gray-800">
                  {totals.productiveTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 flex items-center gap-2">
                  <Clock size={14} className="text-amber-500"/> Improdutivo
                </span>
                <span className="font-bold text-gray-800">
                  {totals.unproductiveTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="flex flex-col justify-end space-y-2 border-l pl-6 border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700 font-medium text-xs">Rental</span>
                <span className="font-bold text-emerald-700 text-sm">
                  {totals.rentalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-amber-700 font-medium text-xs">Construtora</span>
                <span className="font-bold text-amber-700 text-sm">
                  {totals.constructionTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="bg-dr-50 px-3 py-2 rounded-lg w-full flex justify-between items-center border border-dr-100 mt-1">
                 <span className="text-xs text-dr-700 font-bold uppercase">Total</span>
                 <span className="text-lg font-bold text-dr-primary">
                   {totals.grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                 </span>
              </div>
            </div>
          </div>

          {/* Items List Container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-end items-center gap-4">
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
                      <th className="px-3 py-3 min-w-[180px]">Índice Contratual</th>
                      <th className="px-3 py-3 min-w-[120px]">Equipamento</th>
                      <th className="px-3 py-3 w-28">Tipo</th>
                      <th className="px-3 py-3 w-20 text-center bg-blue-50/50">KM</th>
                      <th className="px-3 py-3 min-w-[100px] text-gray-500">Local (Auto)</th>
                      <th className="px-3 py-3 w-20 text-center">Produção</th>
                      <th className="px-3 py-3 text-right">Preço Unit.</th>
                      <th className="px-3 py-3 text-right">Total</th>
                      <th className="px-3 py-3 min-w-[150px]">Observação</th>
                      <th className="px-3 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <select 
                            className="w-full border-gray-300 rounded text-sm h-9 border px-2"
                            value={item.indexId}
                            onChange={(e) => updateItem(item.id, 'indexId', e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            {indices.map(idx => (
                              <option key={idx.id} value={idx.id}>
                                [{idx.itemCode}] {idx.codeSAP} - {idx.description}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
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
                        
                        {/* Measurement Type */}
                        <td className="px-3 py-2">
                          <select 
                            className={`w-full rounded text-xs h-9 border px-2 font-medium ${
                              item.measurementType === MeasurementType.PRODUTIVO 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                            value={item.measurementType}
                            onChange={(e) => updateItem(item.id, 'measurementType', e.target.value)}
                          >
                            <option value={MeasurementType.PRODUTIVO}>PRODUTIVO</option>
                            <option value={MeasurementType.IMPRODUTIVO}>IMPRODUTIVO</option>
                          </select>
                        </td>

                        {/* Clean KM Input (No Spinners) */}
                        <td className="px-3 py-2 bg-blue-50/30">
                            <input 
                                type="number" 
                                step="0.001"
                                className="w-full border-blue-200 rounded text-sm h-9 border px-2 text-center focus:border-blue-500 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0.000"
                                value={item.km === undefined ? '' : item.km}
                                onChange={(e) => updateItem(item.id, 'km', e.target.value)}
                            />
                        </td>
                        <td className="px-3 py-2">
                            <div className="flex flex-col text-xs text-gray-500">
                              <span>{item.city || '-'}</span>
                              <span className="font-bold text-gray-400">{item.segment}</span>
                            </div>
                        </td>

                        {/* Clean Quantity Input (No Spinners) */}
                        <td className="px-3 py-2">
                          <input 
                            type="number" 
                            className="w-full border-gray-300 rounded text-sm h-9 border px-2 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600 text-sm">
                          {item.frozenPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-dr-900 text-sm">
                          {item.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        {/* OBSERVATION FIELD */}
                        <td className="px-3 py-2">
                          <input 
                             type="text"
                             className="w-full border-gray-300 rounded text-xs h-9 border px-2 placeholder-gray-400"
                             placeholder="Obs. da atividade..."
                             value={item.observation || ''}
                             onChange={(e) => updateItem(item.id, 'observation', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
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
          
          {/* --- IMPACTS & OCCURRENCES SECTION --- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-orange-50 flex items-center gap-2 text-orange-800 font-semibold">
                <AlertTriangle size={18} /> Registro de Ocorrências e Impactos
             </div>
             
             <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50 border-b border-gray-100">
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                    <select 
                      className="w-full border-gray-300 rounded text-sm h-9 border px-2"
                      value={newImpact.type}
                      onChange={(e) => setNewImpact({...newImpact, type: e.target.value as any})}
                    >
                        <option value="CLIMA">Chuva / Clima</option>
                        <option value="MANUTENCAO">Manutenção / Quebra</option>
                        <option value="MATERIAL">Falta de Material</option>
                        <option value="INTERFERENCIA">Interferência</option>
                        <option value="OUTROS">Outros</option>
                    </select>
                </div>
                <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Descrição do Evento</label>
                    <input 
                       type="text"
                       className="w-full border-gray-300 rounded text-sm h-9 border px-2"
                       placeholder="Ex: Chuva forte paralisou frente de serviço"
                       value={newImpact.description || ''}
                       onChange={(e) => setNewImpact({...newImpact, description: e.target.value})}
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Duração / Horário</label>
                    <input 
                       type="text"
                       className="w-full border-gray-300 rounded text-sm h-9 border px-2"
                       placeholder="Ex: 14:00 - 16:30"
                       value={newImpact.duration || ''}
                       onChange={(e) => setNewImpact({...newImpact, duration: e.target.value})}
                    />
                </div>
                <div className="md:col-span-1">
                    <button 
                       onClick={addImpact}
                       disabled={!newImpact.description}
                       className="w-full bg-dr-700 text-white rounded h-9 flex items-center justify-center hover:bg-dr-900 disabled:opacity-50"
                    >
                        <Plus size={16} />
                    </button>
                </div>
             </div>

             {impacts.length > 0 && (
                 <div className="p-0">
                     <table className="w-full text-sm">
                         <tbody className="divide-y divide-gray-100">
                             {impacts.map(imp => (
                                 <tr key={imp.id} className="bg-white">
                                     <td className="px-4 py-3 w-32">
                                         <span className={`px-2 py-1 rounded text-xs font-bold border ${
                                             imp.type === 'CLIMA' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                             imp.type === 'MANUTENCAO' ? 'bg-red-50 text-red-700 border-red-100' :
                                             'bg-gray-100 text-gray-700 border-gray-200'
                                         }`}>
                                             {imp.type}
                                         </span>
                                     </td>
                                     <td className="px-4 py-3 text-gray-800">{imp.description}</td>
                                     <td className="px-4 py-3 text-gray-500 w-40 text-right">{imp.duration}</td>
                                     <td className="px-4 py-3 w-10 text-center">
                                         <button onClick={() => removeImpact(imp.id)} className="text-gray-400 hover:text-red-500">
                                             <X size={16} />
                                         </button>
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}
          </div>
          
          {/* --- FOOTER SUMMARIES (Grouped by Segment) --- */}
          {items.length > 0 && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                  <MapPin size={18} /> Resumo Financeiro por Trecho e Equipamento
                </div>
                
                <table className="w-full text-xs">
                  <thead className="bg-white text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">Local / Equipamento</th>
                      <th className="px-4 py-3 text-right text-blue-700">R$ Produtivo</th>
                      <th className="px-4 py-3 text-right text-amber-700">R$ Improdutivo</th>
                      <th className="px-4 py-3 text-right font-bold text-gray-800">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {groupedSummary.map((group) => (
                      <React.Fragment key={group.name}>
                        <tr className="bg-gray-100">
                          <td className="px-4 py-2 font-bold text-dr-800 flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-dr-primary"></span>
                             {group.name}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-blue-800">
                            {group.productive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-amber-800">
                            {group.unproductive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-4 py-2 text-right font-bold text-gray-900">
                            {group.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                        {group.rows.map((row) => (
                          <tr key={row.key} className="hover:bg-gray-50">
                            <td className="px-4 py-2 pl-8 text-gray-600">
                               <span className="text-gray-400 font-medium mr-2">{row.city}</span>
                               <span className="text-gray-300 mx-1">|</span>
                               <span className="text-gray-800">{row.equipmentName}</span>
                            </td>
                            <td className="px-4 py-2 text-right text-blue-600">
                              {row.productive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-2 text-right text-amber-600">
                              {row.unproductive.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="px-4 py-2 text-right font-medium text-gray-700">
                              {row.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Main Save Action */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="bg-dr-primary text-white px-8 py-3 rounded-lg shadow-lg hover:bg-blue-700 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
            >
              {saving ? 'Salvando...' : (
                <>
                  <Save size={20} /> {viewMode === 'edit' ? 'Atualizar RDO' : 'Encerrar RDO do Dia'}
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
      )}
    </div>
  );
};