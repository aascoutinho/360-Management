import React, { useState, useEffect } from 'react';
import { Project, IndexType, MeasurementBulletin, MeasurementItem } from '../types';
import { DataService } from '../services/dataService';
import { FileSpreadsheet, Upload, Calendar, CheckCircle, AlertCircle, Trash2, Eye } from 'lucide-react';
import { read, utils } from 'xlsx';

export const MeasurementModule: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [referenceDate, setReferenceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<IndexType>(IndexType.CONSTRUTORA);
  
  const [dragActive, setDragActive] = useState(false);
  const [parsedItems, setParsedItems] = useState<MeasurementItem[]>([]);
  const [fileName, setFileName] = useState('');
  
  const [history, setHistory] = useState<MeasurementBulletin[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  // --- FILE HANDLING ---

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Parse Logic based on screenshot columns (0-based index)
    // A=0 (SAP), D=3 (Desc), F=5 (Unit), G=6 (Price), J=9 (Qty Month)
    
    const items: MeasurementItem[] = [];
    
    // Start from row 2 (index 1 or 2 depending on header rows). 
    // Usually Excel exports have headers in row 1 (index 0).
    // Let's assume Row 1 is header, data starts Row 2.
    
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 10) continue; // Skip empty rows

        const codeSAP = String(row[0] || '').trim();
        if (!codeSAP || codeSAP.startsWith('Total')) continue; // Skip totals or empty codes

        const qtyMonth = typeof row[9] === 'number' ? row[9] : parseFloat(String(row[9]).replace(',', '.') || '0');
        
        // Only import lines with measurement > 0 or at least valid metadata
        if (codeSAP) {
            const unitPrice = typeof row[6] === 'number' ? row[6] : parseFloat(String(row[6]).replace(',', '.') || '0');
            const measuredVal = qtyMonth * unitPrice;

            items.push({
                codeSAP,
                description: String(row[3] || ''),
                unit: String(row[5] || ''),
                unitPrice: unitPrice,
                measuredQuantity: qtyMonth,
                measuredValue: measuredVal
            });
        }
    }
    setParsedItems(items);
  };

  const handleSave = async () => {
    if (!selectedProject || parsedItems.length === 0) return;
    setUploading(true);

    const bulletin: MeasurementBulletin = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: selectedProject,
        referenceDate: referenceDate,
        type: type,
        items: parsedItems,
        totalValue: parsedItems.reduce((acc, i) => acc + i.measuredValue, 0),
        uploadDate: new Date().toISOString(),
        fileName: fileName
    };

    await DataService.saveBulletin(bulletin);
    
    setUploading(false);
    setParsedItems([]);
    setFileName('');
    loadHistory();
  };

  const handleDelete = async (id: string) => {
      if(window.confirm('Excluir este boletim?')) {
          await DataService.deleteBulletin(id);
          loadHistory();
      }
  };

  const totalParsedValue = parsedItems.reduce((acc, i) => acc + i.measuredValue, 0);

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-dr-900">Boletim de Medição</h2>
           <p className="text-sm text-gray-500">Importação do documento oficial de medição (Cliente)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* UPLOAD PANEL */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Upload size={18} /> Importar Arquivo
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Obra</label>
                        <select 
                            className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data de Referência (Mês/Ano)</label>
                        <input 
                            type="month" 
                            className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border"
                            value={referenceDate.slice(0, 7)}
                            onChange={(e) => setReferenceDate(e.target.value + "-01")}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                        <select 
                            className="w-full border-gray-300 rounded-lg px-3 py-2 text-sm border"
                            value={type}
                            onChange={(e) => setType(e.target.value as IndexType)}
                        >
                            <option value={IndexType.CONSTRUTORA}>Construtora (Serviços)</option>
                            <option value={IndexType.RENTAL}>Rental (Locação)</option>
                        </select>
                    </div>

                    {/* Drag & Drop Zone */}
                    <div 
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragActive ? 'border-dr-primary bg-blue-50' : 'border-gray-300 hover:border-dr-primary hover:bg-gray-50'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input 
                            type="file" 
                            id="file-upload" 
                            className="hidden" 
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                            <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-700">Clique ou arraste a planilha aqui</p>
                            <p className="text-xs text-gray-500 mt-1">Formatos suportados: .xlsx, .xls</p>
                        </label>
                    </div>

                    {fileName && (
                        <div className="flex items-center gap-2 bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm border border-green-200">
                            <CheckCircle size={16} />
                            <span className="truncate flex-1">{fileName}</span>
                        </div>
                    )}
                    
                    {parsedItems.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                             <div className="flex justify-between text-sm mb-1">
                                 <span className="text-gray-500">Itens Identificados:</span>
                                 <span className="font-bold">{parsedItems.length}</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-gray-500">Valor Total Medido:</span>
                                 <span className="font-bold text-dr-primary">{totalParsedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                             </div>
                        </div>
                    )}

                    <button 
                        onClick={handleSave}
                        disabled={parsedItems.length === 0 || uploading}
                        className="w-full bg-dr-primary text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {uploading ? 'Salvando...' : 'Confirmar Importação'}
                    </button>

                    <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-100 flex gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <p>O sistema processará as colunas: A (Código), D (Desc), F (Unid), G (Preço) e J (Qtd Mês).</p>
                    </div>
                  </div>
              </div>
          </div>

          {/* HISTORY & PREVIEW */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* If previewing items, show table */}
              {parsedItems.length > 0 ? (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">
                        Pré-visualização da Importação
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                             <thead className="bg-white text-gray-500 border-b border-gray-200 sticky top-0">
                                 <tr>
                                     <th className="px-4 py-2">Código SAP</th>
                                     <th className="px-4 py-2">Descrição</th>
                                     <th className="px-4 py-2 text-right">Preço</th>
                                     <th className="px-4 py-2 text-right">Qtd Mês</th>
                                     <th className="px-4 py-2 text-right">Valor Medido</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                 {parsedItems.map((item, idx) => (
                                     <tr key={idx} className="hover:bg-gray-50">
                                         <td className="px-4 py-2 font-medium">{item.codeSAP}</td>
                                         <td className="px-4 py-2 text-xs text-gray-600">{item.description}</td>
                                         <td className="px-4 py-2 text-right text-gray-500">{item.unitPrice.toFixed(2)}</td>
                                         <td className="px-4 py-2 text-right font-medium">{item.measuredQuantity}</td>
                                         <td className="px-4 py-2 text-right font-bold text-dr-primary">
                                             {item.measuredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                        </table>
                    </div>
                 </div>
              ) : (
                /* Show History List */
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 font-bold text-gray-700">
                        Histórico de Importações
                    </div>
                    {history.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            Nenhum boletim importado para esta obra.
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-gray-500 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Ref.</th>
                                    <th className="px-6 py-4">Tipo</th>
                                    <th className="px-6 py-4">Arquivo Original</th>
                                    <th className="px-6 py-4">Itens</th>
                                    <th className="px-6 py-4 text-right">Valor Total</th>
                                    <th className="px-6 py-4 text-right">Importado em</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.map(b => (
                                    <tr key={b.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-bold text-gray-800">
                                            {b.referenceDate.slice(0, 7)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                b.type === IndexType.RENTAL ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {b.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 truncate max-w-xs">{b.fileName}</td>
                                        <td className="px-6 py-4 text-gray-500">{b.items.length}</td>
                                        <td className="px-6 py-4 text-right font-bold text-dr-primary">
                                            {b.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs text-gray-400">
                                            {new Date(b.uploadDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDelete(b.id)} className="text-gray-400 hover:text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
              )}
          </div>
      </div>
    </div>
  );
};