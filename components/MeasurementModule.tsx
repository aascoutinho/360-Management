import React, { useState, useEffect } from 'react';
import { Project, IndexType, MeasurementBulletin, MeasurementItem } from '../types';
import { DataService } from '../services/dataService';
import { FileSpreadsheet, Upload, Calendar, CheckCircle, AlertCircle, Trash2, Eye, Plus, Edit2, X, Download } from 'lucide-react';
import { read, utils } from 'xlsx';

export const MeasurementModule: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [history, setHistory] = useState<MeasurementBulletin[]>([]);
  const [loading, setLoading] = useState(false);

  // -- Modal States --
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // -- Selection State --
  const [selectedBulletin, setSelectedBulletin] = useState<MeasurementBulletin | null>(null);

  // -- Upload Form State --
  const [uploadForm, setUploadForm] = useState({
      referenceDate: new Date().toISOString().slice(0, 7),
      periodText: '',
      type: IndexType.CONSTRUTORA
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // -- Edit Form State --
  const [editForm, setEditForm] = useState({
      referenceDate: '',
      periodText: '',
      type: IndexType.CONSTRUTORA
  });


  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadHistory();
    }
  }, [selectedProject]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await DataService.getBulletins(selectedProject);
    setHistory(data);
    setLoading(false);
  };

  // --- ACTIONS ---

  const handleOpenDetail = (bulletin: MeasurementBulletin) => {
      setSelectedBulletin(bulletin);
      setShowDetailModal(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, bulletin: MeasurementBulletin) => {
      e.stopPropagation();
      setSelectedBulletin(bulletin);
      setEditForm({
          referenceDate: bulletin.referenceDate,
          periodText: bulletin.measurementPeriod || '',
          type: bulletin.type
      });
      setShowEditModal(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(window.confirm('Excluir este boletim de medição permanentemente?')) {
          await DataService.deleteBulletin(id);
          loadHistory();
      }
  };

  const handleSaveEdit = async () => {
      if(!selectedBulletin) return;
      await DataService.updateBulletin(selectedBulletin.id, editForm.referenceDate, editForm.periodText, editForm.type);
      setShowEditModal(false);
      loadHistory();
  };

  // --- UPLOAD LOGIC ---

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setUploadFile(e.dataTransfer.files[0]);
  };

  // Helper to safely parse numbers from Excel which might be strings with commas
  const parseNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        // Remove 'R$', spaces, dots (thousand separator), then replace comma with dot
        const clean = val.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
        return parseFloat(clean) || 0;
    }
    return 0;
  };

  const parseExcelAndSave = async () => {
      if(!uploadFile || !selectedProject) return;
      setUploading(true);
      
      try {
        const data = await uploadFile.arrayBuffer();
        const workbook = read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        const items: MeasurementItem[] = [];
        
        // --- PARSING LOGIC based on provided Columns ---
        // A (0): Código SAP
        // B (1): DESCRIÇÃO (Fixed: Was previously mapped to D/3)
        // F (5): UNID.
        // G (6): PREÇO UNITÁRIO
        // H (7): Qtd. TOTAL PREVISTO
        // I (8): Qtd. ACUMULADO ANTERIOR
        // J (9): Qtd. DO MÊS
        // K (10): Qtd. TOTAL ACUMULADO
        // L (11): Valor R$ ACUMULADO ANTERIOR
        // M (12): Valor R$ DO MÊS
        // N (13): Valor R$ TOTAL ACUMULADO
        // O (14): Valor R$ PREVISTO CONTRATO
        // P (15): Valor R$ SALDO
        // Q (16): EXEC.%
        
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 10) continue; 
            const codeSAP = String(row[0] || '').trim();
            if (!codeSAP || codeSAP.startsWith('Total')) continue;

            if (codeSAP) {
                // Determine description - usually col B (1), but check C,D,E if B is empty just in case of formatting
                const desc = String(row[1] || row[2] || row[3] || '');

                const item: MeasurementItem = {
                    codeSAP: codeSAP,
                    description: desc,
                    unit: String(row[5] || ''),
                    unitPrice: parseNum(row[6]),
                    
                    plannedQuantity: parseNum(row[7]),
                    accumulatedPreviousQty: parseNum(row[8]),
                    measuredQuantity: parseNum(row[9]),
                    totalAccumulatedQty: parseNum(row[10]),
                    
                    accumulatedPreviousValue: parseNum(row[11]),
                    measuredValue: parseNum(row[12]),
                    totalAccumulatedValue: parseNum(row[13]),
                    totalContractValue: parseNum(row[14]),
                    balanceValue: parseNum(row[15]),
                    executionPercentage: parseNum(row[16])
                };
                
                items.push(item);
            }
        }

        const bulletin: MeasurementBulletin = {
            id: Math.random().toString(36).substr(2, 9),
            projectId: selectedProject,
            referenceDate: uploadForm.referenceDate + "-01", // YYYY-MM-DD
            measurementPeriod: uploadForm.periodText,
            type: uploadForm.type,
            items: items,
            totalValue: items.reduce((acc, i) => acc + i.measuredValue, 0),
            uploadDate: new Date().toISOString(),
            fileName: uploadFile.name
        };

        await DataService.saveBulletin(bulletin);
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadForm({ referenceDate: new Date().toISOString().slice(0,7), periodText: '', type: IndexType.CONSTRUTORA });
        loadHistory();

      } catch (error) {
          alert("Erro ao processar arquivo. Verifique o formato das colunas (A até Q).");
          console.error(error);
      } finally {
          setUploading(false);
      }
  };

  const constructionBulletins = history.filter(b => b.type === IndexType.CONSTRUTORA);
  const rentalBulletins = history.filter(b => b.type === IndexType.RENTAL);

  return (
    <div className="space-y-6 animate-fade-in relative pb-12">
       <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-dr-900">Boletins de Medição</h2>
           <p className="text-sm text-gray-500">Gestão dos arquivos oficiais de medição do cliente</p>
        </div>
        <div className="flex gap-4">
             <select 
                className="border-gray-300 rounded-lg px-3 py-2 text-sm border shadow-sm"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
            >
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button 
                onClick={() => setShowUploadModal(true)}
                disabled={!selectedProject}
                className="bg-dr-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
                <Plus size={18} /> Novo Boletim
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COLUMN 1: CONSTRUCTION */}
          <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2 border-gray-200">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Boletins Construtora (Serviços)
              </h3>
              {constructionBulletins.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">Nenhum boletim registrado.</p>
              ) : (
                  constructionBulletins.map(b => (
                      <BulletinCard 
                        key={b.id} 
                        bulletin={b} 
                        onClick={() => handleOpenDetail(b)} 
                        onEdit={(e) => handleOpenEdit(e, b)}
                        onDelete={(e) => handleDelete(e, b.id)}
                      />
                  ))
              )}
          </div>

          {/* COLUMN 2: RENTAL */}
          <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2 border-gray-200">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Boletins Rental (Locação)
              </h3>
              {rentalBulletins.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">Nenhum boletim registrado.</p>
              ) : (
                  rentalBulletins.map(b => (
                      <BulletinCard 
                        key={b.id} 
                        bulletin={b} 
                        onClick={() => handleOpenDetail(b)} 
                        onEdit={(e) => handleOpenEdit(e, b)}
                        onDelete={(e) => handleDelete(e, b.id)}
                      />
                  ))
              )}
          </div>
      </div>

      {/* --- UPLOAD MODAL --- */}
      {showUploadModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-fade-in">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Importar Novo Boletim</h3>
                      <button onClick={() => setShowUploadModal(false)}><X size={20} className="text-gray-400" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mês de Referência</label>
                            <input 
                                type="month" 
                                className="w-full border-gray-300 rounded px-3 py-2 text-sm border"
                                value={uploadForm.referenceDate}
                                onChange={(e) => setUploadForm({...uploadForm, referenceDate: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                            <select 
                                className="w-full border-gray-300 rounded px-3 py-2 text-sm border"
                                value={uploadForm.type}
                                onChange={(e) => setUploadForm({...uploadForm, type: e.target.value as IndexType})}
                            >
                                <option value={IndexType.CONSTRUTORA}>Construtora</option>
                                <option value={IndexType.RENTAL}>Rental</option>
                            </select>
                          </div>
                      </div>
                      <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Período de Medição (Texto)</label>
                            <input 
                                type="text" 
                                placeholder="Ex: 21/09/2023 a 20/10/2023"
                                className="w-full border-gray-300 rounded px-3 py-2 text-sm border"
                                value={uploadForm.periodText}
                                onChange={(e) => setUploadForm({...uploadForm, periodText: e.target.value})}
                            />
                      </div>

                      {/* File Drop */}
                      <div 
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragActive ? 'border-dr-primary bg-blue-50' : 'border-gray-300 hover:border-dr-primary hover:bg-gray-50'}`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                        <input type="file" id="file-upload" className="hidden" accept=".xlsx, .xls" onChange={(e) => e.target.files && setUploadFile(e.target.files[0])} />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700">Clique ou arraste a planilha aqui</p>
                        </label>
                    </div>
                    {uploadFile && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm border border-green-200">
                            <CheckCircle size={16} /> <span className="truncate">{uploadFile.name}</span>
                        </div>
                    )}
                  </div>
                  <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                      <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-gray-600 text-sm font-medium">Cancelar</button>
                      <button onClick={parseExcelAndSave} disabled={!uploadFile || uploading} className="bg-dr-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                          {uploading ? 'Importando...' : 'Processar Arquivo'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-fade-in">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800">Editar Dados do Boletim</h3>
                      <button onClick={() => setShowEditModal(false)}><X size={20} className="text-gray-400" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Mês de Referência</label>
                          <input type="date" className="w-full border-gray-300 rounded px-3 py-2 text-sm border" value={editForm.referenceDate} onChange={(e) => setEditForm({...editForm, referenceDate: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Período (Texto)</label>
                          <input type="text" className="w-full border-gray-300 rounded px-3 py-2 text-sm border" value={editForm.periodText} onChange={(e) => setEditForm({...editForm, periodText: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                          <select className="w-full border-gray-300 rounded px-3 py-2 text-sm border" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value as IndexType})}>
                                <option value={IndexType.CONSTRUTORA}>Construtora</option>
                                <option value={IndexType.RENTAL}>Rental</option>
                          </select>
                      </div>
                  </div>
                  <div className="p-5 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                      <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 text-sm font-medium">Cancelar</button>
                      <button onClick={handleSaveEdit} className="bg-dr-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Salvar Alterações</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- DETAIL MODAL (FULL TABLE) --- */}
      {showDetailModal && selectedBulletin && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-[95vw] h-[90vh] flex flex-col animate-fade-in">
                   <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                      <div>
                          <h3 className="font-bold text-xl text-gray-800">Detalhamento do Boletim</h3>
                          <div className="flex gap-4 text-sm text-gray-500 mt-1">
                              <span>Ref: {selectedBulletin.referenceDate.slice(0, 7)}</span>
                              <span>|</span>
                              <span>Período: {selectedBulletin.measurementPeriod}</span>
                              <span>|</span>
                              <span className="font-medium text-dr-primary">Total: {selectedBulletin.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                          </div>
                      </div>
                      <button onClick={() => setShowDetailModal(false)}><X size={24} className="text-gray-400" /></button>
                  </div>
                  
                  {/* SCROLLABLE TABLE CONTAINER */}
                  <div className="flex-1 overflow-auto bg-gray-50 p-6">
                       <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden min-w-[1500px]">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100 text-gray-600 border-b border-gray-200 font-medium">
                                    <tr>
                                        {/* A: Código SAP */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 min-w-[100px] z-10 border-r border-gray-200">Código SAP</th>
                                        
                                        {/* B: DESCRIÇÃO */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 min-w-[250px] z-10 border-r border-gray-200">Descrição</th>
                                        
                                        {/* F: UNID. */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-center w-12 border-r border-gray-200">Unid.</th>
                                        
                                        {/* G: PREÇO UNITÁRIO */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[100px] border-r border-gray-200">Preço Unit.</th>
                                        
                                        {/* H: Qtd. TOTAL PREVISTO */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[90px]">Qtd. Prevista</th>
                                        
                                        {/* I: Qtd. ACUMULADO ANTERIOR */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[90px]">Qtd. Acum. Ant.</th>
                                        
                                        {/* J: Qtd. DO MÊS */}
                                        <th className="px-3 py-3 sticky top-0 bg-yellow-50 text-right min-w-[90px] font-bold text-gray-800 border-x border-yellow-200">Qtd. Mês</th>
                                        
                                        {/* K: Qtd. TOTAL ACUMULADO */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[90px] border-r border-gray-200">Qtd. Total Acum.</th>
                                        
                                        {/* L: Valor R$ ACUMULADO ANTERIOR */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[110px]">R$ Acum. Ant.</th>
                                        
                                        {/* M: Valor R$ DO MÊS */}
                                        <th className="px-3 py-3 sticky top-0 bg-yellow-50 text-right min-w-[110px] font-bold text-gray-800 border-x border-yellow-200">R$ Mês</th>
                                        
                                        {/* N: Valor R$ TOTAL ACUMULADO */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[110px]">R$ Total Acum.</th>
                                        
                                        {/* O: Valor R$ PREVISTO CONTRATO */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[110px] font-semibold text-gray-700">R$ Contrato</th>
                                        
                                        {/* P: Valor R$ SALDO */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right min-w-[110px]">R$ Saldo</th>
                                        
                                        {/* Q: EXEC.% */}
                                        <th className="px-3 py-3 sticky top-0 bg-gray-100 text-right w-16">Exec %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedBulletin.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50">
                                            {/* Code & Desc */}
                                            <td className="px-3 py-2 font-medium text-gray-700 border-r border-gray-100 bg-white sticky left-0">{item.codeSAP}</td>
                                            <td className="px-3 py-2 text-gray-600 border-r border-gray-100 truncate max-w-xs" title={item.description}>{item.description}</td>
                                            <td className="px-3 py-2 text-center text-gray-500 border-r border-gray-100">{item.unit}</td>
                                            <td className="px-3 py-2 text-right text-gray-600 border-r border-gray-100">{item.unitPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                            
                                            {/* Quantities */}
                                            <td className="px-3 py-2 text-right text-gray-500">{item.plannedQuantity.toLocaleString('pt-BR')}</td>
                                            <td className="px-3 py-2 text-right text-gray-500">{item.accumulatedPreviousQty.toLocaleString('pt-BR')}</td>
                                            <td className="px-3 py-2 text-right font-bold text-dr-primary bg-yellow-50/30 border-x border-yellow-100">{item.measuredQuantity.toLocaleString('pt-BR')}</td>
                                            <td className="px-3 py-2 text-right text-gray-600 font-medium border-r border-gray-100">{item.totalAccumulatedQty.toLocaleString('pt-BR')}</td>
                                            
                                            {/* Values */}
                                            <td className="px-3 py-2 text-right text-gray-500">{item.accumulatedPreviousValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-3 py-2 text-right font-bold text-dr-primary bg-yellow-50/30 border-x border-yellow-100">{item.measuredValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-3 py-2 text-right text-gray-600 font-medium">{item.totalAccumulatedValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                            <td className="px-3 py-2 text-right text-gray-800 font-semibold bg-gray-50">{item.totalContractValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                            <td className={`px-3 py-2 text-right font-medium ${item.balanceValue < 0 ? 'text-red-500' : 'text-green-600'}`}>{item.balanceValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                            
                                            {/* Percentage */}
                                            <td className="px-3 py-2 text-right font-bold">
                                                <span className={`px-1 rounded ${item.executionPercentage >= 1 ? 'bg-green-100 text-green-700' : 'text-gray-600'}`}>
                                                    {(item.executionPercentage * 100).toFixed(0)}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                       </div>
                  </div>
                  <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-xl">
                       <button onClick={() => setShowDetailModal(false)} className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Fechar</button>
                  </div>
              </div>
           </div>
      )}

    </div>
  );
};

// Sub-component for the card
const BulletinCard: React.FC<{
    bulletin: MeasurementBulletin, 
    onClick: () => void,
    onEdit: (e: React.MouseEvent) => void,
    onDelete: (e: React.MouseEvent) => void
}> = ({ bulletin, onClick, onEdit, onDelete }) => {
    const isRental = bulletin.type === IndexType.RENTAL;
    return (
        <div 
            onClick={onClick}
            className={`bg-white p-4 rounded-xl shadow-sm border-l-4 cursor-pointer hover:shadow-md transition-shadow group flex justify-between items-center ${isRental ? 'border-l-emerald-500' : 'border-l-amber-500'}`}
        >
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 text-lg">
                        {new Date(bulletin.referenceDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                    {bulletin.measurementPeriod && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                            {bulletin.measurementPeriod}
                        </span>
                    )}
                </div>
                <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
                    <FileSpreadsheet size={14} />
                    {bulletin.fileName}
                </div>
                <div className={`font-bold text-xl ${isRental ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {bulletin.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
            </div>
            
            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar Metadados">
                    <Edit2 size={18} />
                </button>
                <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Excluir Boletim">
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}