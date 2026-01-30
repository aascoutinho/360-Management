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
  
  // Quantities
  plannedQuantity: number;      // Col H: Qtd. TOTAL PREVISTO
  accumulatedPreviousQty: number; // Col I: Qtd. ACUMULADO ANTERIOR
  measuredQuantity: number;     // Col J: Qtd. DO MÊS
  totalAccumulatedQty: number;  // Col K: Qtd. TOTAL ACUMULADO

  // Values
  accumulatedPreviousValue: number; // Col L: Valor R$ ACUMULADO ANTERIOR
  measuredValue: number;            // Col M: Valor R$ DO MÊS
  totalAccumulatedValue: number;    // Col N: Valor R$ TOTAL ACUMULADO
  totalContractValue: number;       // Col O: Valor R$ PREVISTO CONTRATO
  balanceValue: number;             // Col P: Valor R$ SALDO
  executionPercentage: number;      // Col Q: EXEC.%
}

export interface MeasurementBulletin {
  id: string;
  projectId: string;
  referenceDate: string; // The "Data de Referência" (Month/Year sorting)
  measurementPeriod: string; // The specific period text (e.g. "21/09 a 20/10")
  type: IndexType; // Rental or Construtora
  items: MeasurementItem[];
  totalValue: number;
  uploadDate: string;
  fileName: string;
}

// Helper Interface for Financial Splits
export interface FinancialSplit {
  total: number;
  rental: number;
  construction: number;
}

export interface DashboardMetrics {
  // Card 1: Valor Total Contrato (Col O)
  contractTotal: FinancialSplit;
  
  // Card 2: Valor Total Medido Acumulado (Col N)
  measuredTotal: FinancialSplit;

  // Card 3: Saldo Total (Col P)
  balanceTotal: FinancialSplit;

  // Card 4: Média Mensal (Sum of Col M / Count)
  monthlyAverage: FinancialSplit;

  // Chart Data
  evolutionHistory: {
    month: string; // YYYY-MM
    measuredMonthly: number; // Bar: Col M
    balance: number; // Line: Col P (Snapshot at that month)
    accumulated: number; // Line: Col N
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