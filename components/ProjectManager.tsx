import React, { useEffect, useState } from 'react';
import { DataService } from '../services/dataService';
import { Project, ProjectSegment } from '../types';
import { MapPin, Building2, Milestone } from 'lucide-react';

export const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [segments, setSegments] = useState<ProjectSegment[]>([]);

  useEffect(() => {
    DataService.getProjects().then(data => {
      setProjects(data);
      if (data.length > 0) setSelectedProject(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedProject) {
      DataService.getSegments(selectedProject).then(setSegments);
    } else {
      setSegments([]);
    }
  }, [selectedProject]);

  const currentProjectDetails = projects.find(p => p.id === selectedProject);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-dr-900">Cadastro de Obras e Trechos</h2>
        <select 
          className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm shadow-sm"
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {currentProjectDetails && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold text-gray-800">{currentProjectDetails.name}</h3>
                <p className="text-gray-500 flex items-center gap-1 mt-1"><MapPin size={16}/> {currentProjectDetails.location}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500">Valor Contratual</p>
                <p className="text-xl font-bold text-dr-primary">
                    {currentProjectDetails.contractValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                </p>
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Milestone size={20} className="text-dr-primary" />
            <h3 className="font-semibold text-gray-800">Tabela de Trechos e Cidades (KM)</h3>
        </div>
        
        {segments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">Nenhum trecho cadastrado para esta obra.</div>
        ) : (
            <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4">Trecho</th>
                    <th className="px-6 py-4">Cidade</th>
                    <th className="px-6 py-4 text-right">KM Inicial</th>
                    <th className="px-6 py-4 text-right">KM Final</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {segments.map(seg => (
                <tr key={seg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-dr-primary">{seg.segmentName}</td>
                    <td className="px-6 py-4 text-gray-900">{seg.city}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{seg.startKm.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right text-gray-600">{seg.endKm.toLocaleString('pt-BR')}</td>
                </tr>
                ))}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
};