// Enums for Categorization
export enum IndexType {
  RENTAL = 'RENTAL',
  CONSTRUTORA = 'CONSTRUTORA',
}

export enum MeasurementType {
  PRODUTIVO = 'PRODUTIVO',
  IMPRODUTIVO = 'IMPRODUTIVO',
}

export enum EquipmentOwner {
  GRUPO_DR = 'GRUPO_DR',
  TERCEIRO = 'TERCEIRO',
}

export enum CostType {
  MANUTENCAO = 'MANUTENCAO',
  SEGURO = 'SEGURO',
  IPVA = 'IPVA',
  LOCACAO_EXTERNA = 'LOCACAO_EXTERNA',
}

// Entities

export interface Company {
  id: string;
  name: string;
  isGroupMember: boolean;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  contractValue: number;
}

export interface ProjectSegment {
  id: string;
  projectId: string;
  startKm: number;
  endKm: number;
  city: string;
  segmentName: string; // "Trecho" (e.g., T-01)
}

export interface Equipment {
  id: string;
  internalCode: string;
  name: string;
  category: string;
  owner: EquipmentOwner;
  responsibleCompanyId: string;
}

export interface ContractIndex {
  id: string;
  itemCode: string; // Internal Item Code (e.g. "3.0") distinct from SAP
  codeSAP: string;
  description: string;
  unit: string;
  type: IndexType;
  currentPrice: number;
  totalQuantity: number;
  totalValue: number;
  projectId: string;
  revision: number; // Current revision number
  lastRevisionDate: string;
}

export interface IndexRevision {
  id: string;
  indexId: string;
  price: number;
  quantity: number; // Support for quantity adjustments
  effectiveDate: string;
  reason: string;
}

export interface EquipmentCost {
  id: string;
  equipmentId: string;
  type: CostType;
  value: number;
  date: string;
  description: string;
}

// RDO (The Core Transactional Entity)
export interface RDOItem {
  id: string;
  rdoId: string;
  indexId: string;
  equipmentId?: string; // Optional link to equipment
  
  // Location Data
  km?: number;
  city?: string;     // Auto-resolved from KM
  segment?: string;  // Auto-resolved from KM (Trecho)

  // Measurement Data
  measurementType: MeasurementType;
  quantity: number;
  
  // CRITICAL: Financial Immutability Fields
  frozenPrice: number; // The price at the moment of launch
  totalValue: number; // quantity * frozenPrice

  // New Field
  observation?: string;
}

export interface RDOImpact {
  id: string;
  type: 'CLIMA' | 'MANUTENCAO' | 'MATERIAL' | 'INTERFERENCIA' | 'OUTROS';
  description: string;
  duration: string; // e.g., "2h", "Manhã", "14:00-16:00"
}

export interface RDO {
  id: string;
  projectId: string;
  date: string;
  status: 'DRAFT' | 'APPROVED';
  items: RDOItem[];
  impacts: RDOImpact[]; // New Field
  totalDailyValue: number;
}

// Planning Entities

export type FleetStatus = 'ATIVO' | 'MOBILIZACAO' | 'DESMOBILIZACAO';

export interface PlanEquipment {
  equipmentId: string;
  status: FleetStatus;
  targetProductive: number;   // Meta R$ Produtivo
  targetUnproductive: number; // Meta R$ Improdutivo
  estimatedCost: number;      // Previsão de Custos
}

export interface PlanItem {
  indexId: string;
  plannedQuantity: number;
  totalValue: number; // calculated based on current index price
}

export interface MonthlyPlan {
  id: string;
  projectId: string;
  month: number; // 1-12
  year: number;
  items: PlanItem[];
  // Tracks the detailed fleet plan for this month
  fleet: PlanEquipment[]; 
  totalValue: number;
}

// Measurement Bulletin Entities

export interface MeasurementItem {
  codeSAP: string;
  description: string;
  unit: string;
  unitPrice: number;
  measuredQuantity: number; // 'Qtd. DO MÊS'
  measuredValue: number;    // Calculated or 'Valor R$ DO MÊS'
}

export interface MeasurementBulletin {
  id: string;
  projectId: string;
  referenceDate: string; // The "Data de Referência"
  type: IndexType; // Rental or Construtora
  items: MeasurementItem[];
  totalValue: number;
  uploadDate: string;
  fileName: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  rentalRevenue: number;
  constructionRevenue: number;
  totalCosts: number;
  
  // Detailed Breakdowns
  equipmentHealth: {
    equipmentId: string; // ID
    equipmentName: string; // Name for display
    category: string;
    revenue: number;
    cost: number;
    margin: number;
  }[];

  categoryMetrics: {
    name: string;
    revenue: number;
    cost: number;
    margin: number;
  }[];

  cityMetrics: {
    name: string;
    value: number;
  }[];

  segmentMetrics: {
    name: string;
    value: number;
  }[];
}

// --- NEW ANALYTICS INTERFACES ---

export interface ItemAnalytics {
  indexId: string;
  codeSAP: string;
  description: string;
  unit: string;
  type: IndexType;
  
  plannedQty: number;
  plannedValue: number;
  
  realQty: number;
  realValue: number;
  
  deltaValue: number; // Real - Planned
  performance: number; // Real / Planned %
}

export interface FleetAnalytics {
  equipmentId: string;
  internalCode: string;
  name: string;
  category: string;
  
  plannedRevenue: number;
  realRevenue: number;
  
  plannedCost: number;
  realCost: number;
  
  plannedMargin: number;
  realMargin: number;
}

export interface AnalyticsSummary {
  month: number;
  year: number;
  
  // High Level
  totalPlannedRevenue: number;
  totalRealRevenue: number;
  revenueCompliance: number; // %
  
  totalPlannedCost: number;
  totalRealCost: number;
  
  items: ItemAnalytics[];
  fleet: FleetAnalytics[];
}