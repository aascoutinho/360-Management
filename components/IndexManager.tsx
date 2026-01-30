import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Project, ContractIndex, IndexType } from '../types';
import { TrendingUp, Clock } from 'lucide-react';

export const IndexManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [indices, setIndices] = useState<ContractIndex[]>([]);

  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) {
      DataService.getIndices(selectedProject).then(setIndices);
    }
  }, [selectedProject]);

  return (
    <div className="space-y-6">
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
              <th className="px-6 py-4">Código SAP</th>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Unidade</th>
              <th className="px-6 py-4 text-right">Preço Atual</th>
              <th className="px-6 py-4 text-center">Revisão</th>
              <th className="px-6 py-4">Última Atualização</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {indices.map(idx => (
              <tr key={idx.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-dr-900">{idx.codeSAP}</td>
                <td className="px-6 py-4">{idx.description}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    idx.type === IndexType.RENTAL ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {idx.type}
                  </span>
                </td>
                <td className="px-6 py-4">{idx.unit}</td>
                <td className="px-6 py-4 text-right font-medium">
                  {idx.currentPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-6 py-4 text-center text-gray-500">
                  Rev. {idx.revision}
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs flex items-center gap-1">
                  <Clock size={12} /> {idx.lastRevisionDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};