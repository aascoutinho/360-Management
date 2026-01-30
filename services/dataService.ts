import { 
  Project, ContractIndex, Equipment, RDO, IndexType, EquipmentOwner, 
  CostType, EquipmentCost, RDOItem, DashboardMetrics 
} from '../types';

// --- MOCK DATA SEED ---

const PROJECTS: Project[] = [
  { id: 'p1', name: 'Obra Rodovia SP-300', location: 'São Paulo', contractValue: 15000000 },
  { id: 'p2', name: 'Ampliação Galpão Industrial', location: 'Minas Gerais', contractValue: 4500000 },
];

const EQUIPMENT: Equipment[] = [
  { id: 'eq1', internalCode: 'EQ-001', name: 'Escavadeira CAT 320', category: 'Linha Amarela', owner: EquipmentOwner.GRUPO_DR, responsibleCompanyId: 'c1' },
  { id: 'eq2', internalCode: 'EQ-002', name: 'Caminhão Basculante', category: 'Transporte', owner: EquipmentOwner.GRUPO_DR, responsibleCompanyId: 'c1' },
  { id: 'eq3', internalCode: 'EQ-999', name: 'Gerador 500kVA', category: 'Energia', owner: EquipmentOwner.TERCEIRO, responsibleCompanyId: 'c2' },
];

const INDICES: ContractIndex[] = [
  // Rental Indices
  { id: 'idx1', projectId: 'p1', codeSAP: 'R-1001', description: 'Locação Escavadeira (Hora)', unit: 'H', type: IndexType.RENTAL, currentPrice: 250.00, totalQuantity: 1000, totalValue: 250000, revision: 0, lastRevisionDate: '2023-01-01' },
  { id: 'idx2', projectId: 'p1', codeSAP: 'R-1002', description: 'Locação Caminhão (Diária)', unit: 'D', type: IndexType.RENTAL, currentPrice: 1200.00, totalQuantity: 200, totalValue: 240000, revision: 0, lastRevisionDate: '2023-01-01' },
  // Construction Indices
  { id: 'idx3', projectId: 'p1', codeSAP: 'C-5001', description: 'Escavação de Solo 1ª Cat', unit: 'm3', type: IndexType.CONSTRUTORA, currentPrice: 45.00, totalQuantity: 50000, totalValue: 2250000, revision: 1, lastRevisionDate: '2023-06-01' },
  { id: 'idx4', projectId: 'p1', codeSAP: 'C-5002', description: 'Aterro Compactado', unit: 'm3', type: IndexType.CONSTRUTORA, currentPrice: 65.50, totalQuantity: 30000, totalValue: 1965000, revision: 0, lastRevisionDate: '2023-01-01' },
];

const COSTS: EquipmentCost[] = [
  { id: 'cost1', equipmentId: 'eq1', type: CostType.MANUTENCAO, value: 5000, date: '2023-05-10', description: 'Troca de óleo e filtros' },
  { id: 'cost2', equipmentId: 'eq1', type: CostType.IPVA, value: 3200, date: '2023-01-15', description: 'IPVA 2023' },
];

// Historical RDOs (Simulating past entries)
const RDOS: RDO[] = [
  {
    id: 'rdo1',
    projectId: 'p1',
    date: '2023-10-01',
    status: 'APPROVED',
    totalDailyValue: 12500,
    items: [
      { id: 'item1', rdoId: 'rdo1', indexId: 'idx1', equipmentId: 'eq1', quantity: 8, frozenPrice: 250.00, totalValue: 2000 }, // 8h excavator
      { id: 'item2', rdoId: 'rdo1', indexId: 'idx3', quantity: 200, frozenPrice: 42.00, totalValue: 8400 }, // Pre-revision price simulation (old price)
      { id: 'item3', rdoId: 'rdo1', indexId: 'idx2', equipmentId: 'eq2', quantity: 1, frozenPrice: 1200.00, totalValue: 1200 },
    ]
  }
];

// --- SERVICE LAYER ---

// Simulating API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DataService = {
  getProjects: async (): Promise<Project[]> => {
    await delay(300);
    return [...PROJECTS];
  },

  getIndices: async (projectId: string): Promise<ContractIndex[]> => {
    await delay(300);
    return INDICES.filter(i => i.projectId === projectId);
  },

  getEquipment: async (): Promise<Equipment[]> => {
    await delay(300);
    return [...EQUIPMENT];
  },

  getEquipmentCosts: async (): Promise<EquipmentCost[]> => {
    await delay(300);
    return [...COSTS];
  },

  // Critical Logic: Saving RDO ensures immutability of prices
  saveRDO: async (rdo: RDO): Promise<void> => {
    await delay(500);
    console.log("Saving RDO to Firestore...", rdo);
    RDOS.push(rdo);
  },

  getRDOs: async (projectId: string): Promise<RDO[]> => {
    await delay(400);
    return RDOS.filter(r => r.projectId === projectId);
  },

  // Aggregation Logic (Cloud Function simulation)
  getDashboardMetrics: async (projectId: string): Promise<DashboardMetrics> => {
    await delay(600); // Heavier calculation
    
    const relevantRDOs = RDOS.filter(r => r.projectId === projectId);
    const relevantIndices = INDICES.filter(i => i.projectId === projectId);
    
    let totalRevenue = 0;
    let rentalRevenue = 0;
    let constructionRevenue = 0;
    const eqRevenueMap: Record<string, number> = {};

    relevantRDOs.forEach(rdo => {
      totalRevenue += rdo.totalDailyValue;
      rdo.items.forEach(item => {
        // Find original index to determine type
        const idx = relevantIndices.find(i => i.id === item.indexId);
        if (idx) {
          if (idx.type === IndexType.RENTAL) {
            rentalRevenue += item.totalValue;
          } else {
            constructionRevenue += item.totalValue;
          }
        }
        
        // Equipment Revenue Attribution
        if (item.equipmentId) {
          eqRevenueMap[item.equipmentId] = (eqRevenueMap[item.equipmentId] || 0) + item.totalValue;
        }
      });
    });

    // Calculate Costs
    const eqCostsMap: Record<string, number> = {};
    let totalCosts = 0;
    COSTS.forEach(cost => {
      eqCostsMap[cost.equipmentId] = (eqCostsMap[cost.equipmentId] || 0) + cost.value;
      totalCosts += cost.value;
    });

    // Merge for Health Check
    const equipmentHealth = EQUIPMENT.map(eq => ({
      equipmentId: eq.name,
      revenue: eqRevenueMap[eq.id] || 0,
      cost: eqCostsMap[eq.id] || 0,
      margin: (eqRevenueMap[eq.id] || 0) - (eqCostsMap[eq.id] || 0)
    })).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue,
      rentalRevenue,
      constructionRevenue,
      totalCosts,
      equipmentHealth
    };
  }
};