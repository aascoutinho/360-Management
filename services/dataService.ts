import { 
  Project, ContractIndex, Equipment, RDO, IndexType, EquipmentOwner, 
  CostType, EquipmentCost, RDOItem, DashboardMetrics, IndexRevision, ProjectSegment, MeasurementType, Company, MonthlyPlan, AnalyticsSummary, ItemAnalytics, FleetAnalytics, MeasurementBulletin
} from '../types';

// --- MOCK DATA SEED ---

const COMPANIES: Company[] = [
  { id: 'c1', name: 'Grupo DR - Matriz', isGroupMember: true },
  { id: 'c2', name: 'Locadora XYZ', isGroupMember: false },
  { id: 'c3', name: 'Transportadora Silva', isGroupMember: false },
];

const PROJECTS: Project[] = [
  { id: 'p1', name: 'Obra Rodovia Ferrovia', location: 'Maranhão / Tocantins', contractValue: 150000000 },
  { id: 'p2', name: 'Ampliação Galpão Industrial', location: 'Minas Gerais', contractValue: 4500000 },
];

const SEGMENTS: ProjectSegment[] = [
  // T-01
  { id: 's1', projectId: 'p1', startKm: 0.001, endKm: 16, city: 'Açailândia', segmentName: 'T-01' },
  { id: 's2', projectId: 'p1', startKm: 16.001, endKm: 44, city: 'S.F. Brejão', segmentName: 'T-01' },
  { id: 's3', projectId: 'p1', startKm: 44.001, endKm: 78, city: 'João Lisboa', segmentName: 'T-01' },
  { id: 's4', projectId: 'p1', startKm: 78.001, endKm: 96.397, city: 'Imperatriz', segmentName: 'T-01' },
  { id: 's5', projectId: 'p1', startKm: 96.398, endKm: 122.82, city: 'Edson Lobão', segmentName: 'T-01' },
  { id: 's6', projectId: 'p1', startKm: 122.821, endKm: 152.303, city: 'Ribamar Fiquene', segmentName: 'T-01' },
  { id: 's7', projectId: 'p1', startKm: 152.304, endKm: 172.403, city: 'Campestre', segmentName: 'T-01' },
  { id: 's8', projectId: 'p1', startKm: 172.404, endKm: 195, city: 'Porto Franco', segmentName: 'T-01' },
  
  // T-02
  { id: 's9', projectId: 'p1', startKm: 195.1, endKm: 213.603, city: 'Estreito', segmentName: 'T-02' },
  { id: 's10', projectId: 'p1', startKm: 213.604, endKm: 218.976, city: 'Aguiarnópolis', segmentName: 'T-02' },
  { id: 's11', projectId: 'p1', startKm: 218.977, endKm: 253.5, city: 'Palmeiras Do Tocantins', segmentName: 'T-02' },
  { id: 's12', projectId: 'p1', startKm: 253.501, endKm: 274.15, city: 'Darcinópolis', segmentName: 'T-02' },
  { id: 's13', projectId: 'p1', startKm: 274.151, endKm: 299.999, city: 'Babaçulândia', segmentName: 'T-02' },
  { id: 's14', projectId: 'p1', startKm: 300.001, endKm: 356.619, city: 'Babaçulândia', segmentName: 'T-02' },
  { id: 's15', projectId: 'p1', startKm: 356.62, endKm: 385.4, city: 'Araguaína', segmentName: 'T-02' },
  { id: 's16', projectId: 'p1', startKm: 385.4, endKm: 465.4, city: 'Palmeirante', segmentName: 'T-02' },

  // T-03
  { id: 's17', projectId: 'p1', startKm: 465.401, endKm: 520.455, city: 'Tupiratins', segmentName: 'T-03' },
  { id: 's18', projectId: 'p1', startKm: 520.456, endKm: 536.741, city: 'Guaraí', segmentName: 'T-03' },
  { id: 's19', projectId: 'p1', startKm: 536.742, endKm: 580.293, city: 'Tupirama', segmentName: 'T-03' },
  { id: 's20', projectId: 'p1', startKm: 580.294, endKm: 608.637, city: 'Rio Dos Bois', segmentName: 'T-03' },
  { id: 's21', projectId: 'p1', startKm: 608.638, endKm: 698.981, city: 'Miracema', segmentName: 'T-03' },
  { id: 's22', projectId: 'p1', startKm: 698.982, endKm: 735.6, city: 'Porto Nacional', segmentName: 'T-03' },

  // T-04
  { id: 's23', projectId: 'p1', startKm: 300, endKm: 300, city: 'São Luís', segmentName: 'T-04' },
  { id: 's24', projectId: 'p1', startKm: 900, endKm: 902, city: 'Eng. VLI', segmentName: 'T-04' },
];

let EQUIPMENT: Equipment[] = [
  { id: 'eq1', internalCode: 'EQ-001', name: 'Escavadeira CAT 320', category: 'Linha Amarela', owner: EquipmentOwner.GRUPO_DR, responsibleCompanyId: 'c1' },
  { id: 'eq2', internalCode: 'EQ-002', name: 'Caminhão Basculante', category: 'Transporte', owner: EquipmentOwner.GRUPO_DR, responsibleCompanyId: 'c1' },
  { id: 'eq3', internalCode: 'EQ-999', name: 'Gerador 500kVA', category: 'Energia', owner: EquipmentOwner.TERCEIRO, responsibleCompanyId: 'c2' },
];

let INDICES: ContractIndex[] = [
  // Rental Indices
  { id: 'idx1', projectId: 'p1', itemCode: '1.0', codeSAP: 'R-1001', description: 'Locação Escavadeira (Hora)', unit: 'H', type: IndexType.RENTAL, currentPrice: 250.00, totalQuantity: 1000, totalValue: 250000, revision: 0, lastRevisionDate: '2023-01-01' },
  { id: 'idx2', projectId: 'p1', itemCode: '2.0', codeSAP: 'R-1002', description: 'Locação Caminhão (Diária)', unit: 'D', type: IndexType.RENTAL, currentPrice: 1200.00, totalQuantity: 200, totalValue: 240000, revision: 0, lastRevisionDate: '2023-01-01' },
  
  // SHARED ITEM EXAMPLE (Item 3.0 exists in both Rental and Construction)
  // Rental Component of Item 3.0
  { id: 'idx5', projectId: 'p1', itemCode: '3.0', codeSAP: 'R-3000', description: 'Apoio Rental - Escavação', unit: 'H', type: IndexType.RENTAL, currentPrice: 150.00, totalQuantity: 5000, totalValue: 750000, revision: 0, lastRevisionDate: '2023-01-01' },
  
  // Construction Indices
  // Construction Component of Item 3.0
  { id: 'idx3', projectId: 'p1', itemCode: '3.0', codeSAP: 'C-5001', description: 'Escavação de Solo 1ª Cat', unit: 'm3', type: IndexType.CONSTRUTORA, currentPrice: 45.00, totalQuantity: 50000, totalValue: 2250000, revision: 1, lastRevisionDate: '2023-06-01' },
  
  { id: 'idx4', projectId: 'p1', itemCode: '4.0', codeSAP: 'C-5002', description: 'Aterro Compactado', unit: 'm3', type: IndexType.CONSTRUTORA, currentPrice: 65.50, totalQuantity: 30000, totalValue: 1965000, revision: 0, lastRevisionDate: '2023-01-01' },
];

const REVISIONS: IndexRevision[] = [
  { id: 'rev1', indexId: 'idx3', price: 42.00, quantity: 50000, effectiveDate: '2023-01-01', reason: 'Contrato Inicial' },
  { id: 'rev2', indexId: 'idx3', price: 45.00, quantity: 50000, effectiveDate: '2023-06-01', reason: 'Reajuste Anual INCC' }
];

let COSTS: EquipmentCost[] = [
  { id: 'cost1', equipmentId: 'eq1', type: CostType.MANUTENCAO, value: 5000, date: '2023-10-05', description: 'Troca de óleo e filtros' },
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
    impacts: [
        { id: 'imp1', type: 'CLIMA', description: 'Chuva forte no período da tarde', duration: '14:00 - 18:00' }
    ],
    items: [
      { id: 'item1', rdoId: 'rdo1', indexId: 'idx1', equipmentId: 'eq1', quantity: 8, frozenPrice: 250.00, totalValue: 2000, km: 50, city: 'João Lisboa', segment: 'T-01', measurementType: MeasurementType.PRODUTIVO, observation: 'Serviço concluído com êxito' }, 
      { id: 'item2', rdoId: 'rdo1', indexId: 'idx3', quantity: 200, frozenPrice: 42.00, totalValue: 8400, km: 50.5, city: 'João Lisboa', segment: 'T-01', measurementType: MeasurementType.PRODUTIVO },
    ]
  }
];

// Plans Store
let PLANS: MonthlyPlan[] = [
    {
        id: 'plan_old',
        projectId: 'p1',
        month: 10, // October
        year: 2023,
        items: [
             { indexId: 'idx1', plannedQuantity: 200, totalValue: 50000 },
             { indexId: 'idx3', plannedQuantity: 4000, totalValue: 180000 }
        ],
        fleet: [
           { 
             equipmentId: 'eq1', 
             status: 'ATIVO', 
             targetProductive: 25000, 
             targetUnproductive: 2000, 
             estimatedCost: 3500 
           },
           { 
             equipmentId: 'eq2', 
             status: 'ATIVO', 
             targetProductive: 18000, 
             targetUnproductive: 500, 
             estimatedCost: 1200 
           }
        ],
        totalValue: 230000
    }
];

// Measurement Bulletins Store
let BULLETINS: MeasurementBulletin[] = [];

// --- SERVICE LAYER ---

// Simulating API latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DataService = {
  getProjects: async (): Promise<Project[]> => {
    await delay(300);
    return [...PROJECTS];
  },
  
  getCompanies: async (): Promise<Company[]> => {
    await delay(200);
    return [...COMPANIES];
  },
  
  // New Method for Segments
  getSegments: async (projectId: string): Promise<ProjectSegment[]> => {
    await delay(300);
    return SEGMENTS.filter(s => s.projectId === projectId).sort((a,b) => a.startKm - b.startKm);
  },

  getIndices: async (projectId: string): Promise<ContractIndex[]> => {
    await delay(300);
    return INDICES.filter(i => i.projectId === projectId);
  },

  updateIndex: async (updatedIndex: ContractIndex): Promise<void> => {
    await delay(400);
    INDICES = INDICES.map(idx => idx.id === updatedIndex.id ? updatedIndex : idx);
  },

  deleteIndex: async (indexId: string): Promise<void> => {
    await delay(400);
    INDICES = INDICES.filter(idx => idx.id !== indexId);
  },

  getRevisions: async (indexId: string): Promise<IndexRevision[]> => {
    await delay(300);
    return REVISIONS.filter(r => r.indexId === indexId).sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  },

  addRevision: async (revision: IndexRevision): Promise<void> => {
    await delay(500);
    REVISIONS.push(revision);
    
    // Update the Parent Index with new current values
    const index = INDICES.find(i => i.id === revision.indexId);
    if (index) {
      index.currentPrice = revision.price;
      index.totalQuantity = revision.quantity;
      index.totalValue = revision.price * revision.quantity;
      index.revision += 1;
      index.lastRevisionDate = revision.effectiveDate;
    }
  },

  // --- EQUIPMENT METHODS ---
  getEquipment: async (): Promise<Equipment[]> => {
    await delay(300);
    return [...EQUIPMENT];
  },

  addEquipment: async (eq: Equipment): Promise<void> => {
    await delay(300);
    EQUIPMENT.push(eq);
  },

  updateEquipment: async (eq: Equipment): Promise<void> => {
    await delay(300);
    EQUIPMENT = EQUIPMENT.map(e => e.id === eq.id ? eq : e);
  },

  deleteEquipment: async (id: string): Promise<void> => {
    await delay(300);
    EQUIPMENT = EQUIPMENT.filter(e => e.id !== id);
  },

  // --- COST METHODS ---
  getEquipmentCosts: async (): Promise<EquipmentCost[]> => {
    await delay(300);
    return [...COSTS];
  },

  addCost: async (cost: EquipmentCost): Promise<void> => {
    await delay(300);
    COSTS.push(cost);
  },

  updateCost: async (updatedCost: EquipmentCost): Promise<void> => {
    await delay(300);
    COSTS = COSTS.map(c => c.id === updatedCost.id ? updatedCost : c);
  },

  deleteCost: async (id: string): Promise<void> => {
    await delay(300);
    COSTS = COSTS.filter(c => c.id !== id);
  },

  // --- PLANNING METHODS ---
  getPlan: async (projectId: string, month: number, year: number): Promise<MonthlyPlan | undefined> => {
    await delay(300);
    
    const currentPlan = PLANS.find(p => p.projectId === projectId && p.month === month && p.year === year);
    
    // IF plan exists, return it
    if (currentPlan) return currentPlan;

    // IF plan does not exist, try to find PREVIOUS month to copy equipment list
    let prevMonth = month - 1;
    let prevYear = year;
    if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = year - 1;
    }

    const prevPlan = PLANS.find(p => p.projectId === projectId && p.month === prevMonth && p.year === prevYear);
    
    // Return a DRAFT plan with previous equipment
    if (prevPlan) {
        // Deep copy fleet so we can edit without affecting history
        const fleetDraft = prevPlan.fleet.map(f => ({...f, status: 'ATIVO' as const })); // Default to Active on copy
        
        return {
            id: '', // Draft ID
            projectId,
            month,
            year,
            items: [],
            fleet: fleetDraft,
            totalValue: 0
        };
    }

    // Completely new, nothing to copy
    return undefined;
  },

  savePlan: async (plan: MonthlyPlan): Promise<void> => {
    await delay(500);
    const existingIndex = PLANS.findIndex(p => p.projectId === plan.projectId && p.month === plan.month && p.year === plan.year);
    if (existingIndex !== -1) {
      PLANS[existingIndex] = plan;
    } else {
      PLANS.push(plan);
    }
  },

  // Critical Logic: Saving RDO ensures immutability of prices
  saveRDO: async (rdo: RDO): Promise<void> => {
    await delay(500);
    console.log("Saving RDO to Firestore...", rdo);
    RDOS.push(rdo);
  },

  updateRDO: async (updatedRDO: RDO): Promise<void> => {
    await delay(500);
    const index = RDOS.findIndex(r => r.id === updatedRDO.id);
    if (index !== -1) {
      RDOS[index] = updatedRDO;
    }
  },

  deleteRDO: async (rdoId: string): Promise<void> => {
    await delay(500);
    const index = RDOS.findIndex(r => r.id === rdoId);
    if (index !== -1) {
      RDOS.splice(index, 1);
    }
  },

  getRDOs: async (projectId?: string): Promise<RDO[]> => {
    await delay(400);
    if (projectId) {
      return RDOS.filter(r => r.projectId === projectId);
    }
    return [...RDOS];
  },

  // --- BULLETIN METHODS ---
  getBulletins: async (projectId: string): Promise<MeasurementBulletin[]> => {
    await delay(300);
    return BULLETINS.filter(b => b.projectId === projectId).sort((a,b) => new Date(b.referenceDate).getTime() - new Date(a.referenceDate).getTime());
  },

  saveBulletin: async (bulletin: MeasurementBulletin): Promise<void> => {
    await delay(600);
    BULLETINS.push(bulletin);
  },

  deleteBulletin: async (id: string): Promise<void> => {
      await delay(300);
      BULLETINS = BULLETINS.filter(b => b.id !== id);
  },

  // --- ANALYTICS LOGIC ---
  getAnalyticsSummary: async (projectId: string, month: number, year: number): Promise<AnalyticsSummary> => {
    await delay(800);

    // 1. Get Plan
    const plan = PLANS.find(p => p.projectId === projectId && p.month === month && p.year === year);

    // 2. Get Real RDOs
    const relevantRDOs = RDOS.filter(r => {
        const d = new Date(r.date);
        return r.projectId === projectId && (d.getMonth() + 1) === month && d.getFullYear() === year;
    });

    // 3. Get Real Costs
    const relevantCosts = COSTS.filter(c => {
        const d = new Date(c.date);
        // Note: Costs don't have projectId link directly in this mock, assuming global/linked via Equipment which are linked to project context conceptually
        // For simplicity, we filter only by date. In real app, filter by equipment assigned to this project.
        return (d.getMonth() + 1) === month && d.getFullYear() === year;
    });

    // 4. Aggregate Real Data per Index
    const realItemMap: Record<string, { qty: number, value: number }> = {};
    const realFleetRevenueMap: Record<string, number> = {};

    let totalRealRevenue = 0;

    relevantRDOs.forEach(rdo => {
        totalRealRevenue += rdo.totalDailyValue;
        
        rdo.items.forEach(item => {
            // Aggregate Item Stats
            if (!realItemMap[item.indexId]) {
                realItemMap[item.indexId] = { qty: 0, value: 0 };
            }
            realItemMap[item.indexId].qty += item.quantity;
            realItemMap[item.indexId].value += item.totalValue;

            // Aggregate Fleet Stats
            if (item.equipmentId) {
                realFleetRevenueMap[item.equipmentId] = (realFleetRevenueMap[item.equipmentId] || 0) + item.totalValue;
            }
        });
    });

    // 5. Aggregate Real Costs per Equipment
    const realFleetCostMap: Record<string, number> = {};
    let totalRealCost = 0;
    
    relevantCosts.forEach(c => {
        realFleetCostMap[c.equipmentId] = (realFleetCostMap[c.equipmentId] || 0) + c.value;
        totalRealCost += c.value;
    });

    // 6. Build Items Comparison List
    const projectIndices = INDICES.filter(i => i.projectId === projectId);
    const itemAnalytics: ItemAnalytics[] = projectIndices.map(idx => {
        const planItem = plan?.items.find(pi => pi.indexId === idx.id);
        const realStats = realItemMap[idx.id] || { qty: 0, value: 0 };
        
        const plannedValue = planItem?.totalValue || 0;
        
        return {
            indexId: idx.id,
            codeSAP: idx.codeSAP,
            description: idx.description,
            unit: idx.unit,
            type: idx.type,
            plannedQty: planItem?.plannedQuantity || 0,
            plannedValue: plannedValue,
            realQty: realStats.qty,
            realValue: realStats.value,
            deltaValue: realStats.value - plannedValue,
            performance: plannedValue > 0 ? (realStats.value / plannedValue) * 100 : 0
        };
    }).sort((a,b) => b.plannedValue - a.plannedValue); // Sort by highest planned value

    // 7. Build Fleet Comparison List
    const fleetAnalytics: FleetAnalytics[] = EQUIPMENT.map(eq => {
        const planFleet = plan?.fleet.find(f => f.equipmentId === eq.id);
        const plannedRevenue = (planFleet?.targetProductive || 0) + (planFleet?.targetUnproductive || 0);
        const plannedCost = planFleet?.estimatedCost || 0;
        
        const realRevenue = realFleetRevenueMap[eq.id] || 0;
        const realCost = realFleetCostMap[eq.id] || 0;

        return {
            equipmentId: eq.id,
            internalCode: eq.internalCode,
            name: eq.name,
            category: eq.category,
            plannedRevenue,
            realRevenue,
            plannedCost,
            realCost,
            plannedMargin: plannedRevenue - plannedCost,
            realMargin: realRevenue - realCost
        };
    }).filter(f => f.plannedRevenue > 0 || f.realRevenue > 0 || f.realCost > 0); // Only relevant equipment

    // 8. Final Summaries
    const totalPlannedRevenue = plan?.totalValue || 0;
    const totalPlannedCost = plan?.fleet.reduce((acc, f) => acc + f.estimatedCost, 0) || 0;

    return {
        month,
        year,
        totalPlannedRevenue,
        totalRealRevenue,
        revenueCompliance: totalPlannedRevenue > 0 ? (totalRealRevenue / totalPlannedRevenue) * 100 : 0,
        totalPlannedCost,
        totalRealCost,
        items: itemAnalytics,
        fleet: fleetAnalytics
    };
  },

  // Aggregation Logic (Cloud Function simulation)
  getDashboardMetrics: async (projectId: string): Promise<DashboardMetrics> => {
    await delay(600); // Heavier calculation
    
    const relevantRDOs = RDOS.filter(r => r.projectId === projectId);
    const relevantIndices = INDICES.filter(i => i.projectId === projectId);
    
    let totalRevenue = 0;
    let rentalRevenue = 0;
    let constructionRevenue = 0;
    
    // Aggregation Maps
    const eqRevenueMap: Record<string, number> = {};
    const categoryRevMap: Record<string, number> = {};
    const cityRevMap: Record<string, number> = {};
    const segmentRevMap: Record<string, number> = {};

    relevantRDOs.forEach(rdo => {
      totalRevenue += rdo.totalDailyValue;
      rdo.items.forEach(item => {
        // Index Type Revenue
        const idx = relevantIndices.find(i => i.id === item.indexId);
        if (idx) {
          if (idx.type === IndexType.RENTAL) {
            rentalRevenue += item.totalValue;
          } else {
            constructionRevenue += item.totalValue;
          }
        }
        
        // Equipment Revenue
        if (item.equipmentId) {
          eqRevenueMap[item.equipmentId] = (eqRevenueMap[item.equipmentId] || 0) + item.totalValue;
          
          // Category Revenue (Derived from Equipment)
          const eq = EQUIPMENT.find(e => e.id === item.equipmentId);
          if (eq) {
             categoryRevMap[eq.category] = (categoryRevMap[eq.category] || 0) + item.totalValue;
          }
        }

        // City & Segment Revenue (Regardless of equipment)
        if (item.city) {
            cityRevMap[item.city] = (cityRevMap[item.city] || 0) + item.totalValue;
        }
        if (item.segment) {
            segmentRevMap[item.segment] = (segmentRevMap[item.segment] || 0) + item.totalValue;
        }
      });
    });

    // Costs Aggregation
    const eqCostsMap: Record<string, number> = {};
    const categoryCostMap: Record<string, number> = {};
    let totalCosts = 0;

    COSTS.forEach(cost => {
      // NOTE: In a real app, verify cost is related to the project/timeframe. 
      // For now, assuming costs are global per equipment.
      eqCostsMap[cost.equipmentId] = (eqCostsMap[cost.equipmentId] || 0) + cost.value;
      totalCosts += cost.value;

      const eq = EQUIPMENT.find(e => e.id === cost.equipmentId);
      if (eq) {
        categoryCostMap[eq.category] = (categoryCostMap[eq.category] || 0) + cost.value;
      }
    });

    // Transform Maps to Arrays

    // 1. Equipment Health
    const equipmentHealth = EQUIPMENT.map(eq => ({
      equipmentId: eq.id,
      equipmentName: `${eq.internalCode} - ${eq.name}`,
      category: eq.category,
      revenue: eqRevenueMap[eq.id] || 0,
      cost: eqCostsMap[eq.id] || 0,
      margin: (eqRevenueMap[eq.id] || 0) - (eqCostsMap[eq.id] || 0)
    })).sort((a, b) => b.revenue - a.revenue);

    // 2. Category Metrics
    const allCategories = Array.from(new Set([...Object.keys(categoryRevMap), ...Object.keys(categoryCostMap)]));

    const categoryMetrics = allCategories.map(cat => ({
        name: cat,
        revenue: categoryRevMap[cat] || 0,
        cost: categoryCostMap[cat] || 0,
        margin: (categoryRevMap[cat] || 0) - (categoryCostMap[cat] || 0)
    })).sort((a, b) => b.revenue - a.revenue);

    // 3. City Metrics
    const cityMetrics = Object.entries(cityRevMap).map(([name, value]) => ({
        name, value
    })).sort((a,b) => b.value - a.value);

    // 4. Segment Metrics
    const segmentMetrics = Object.entries(segmentRevMap).map(([name, value]) => ({
        name, value
    })).sort((a,b) => b.value - a.value);

    return {
      totalRevenue,
      rentalRevenue,
      constructionRevenue,
      totalCosts,
      equipmentHealth,
      categoryMetrics,
      cityMetrics,
      segmentMetrics
    };
  }
};