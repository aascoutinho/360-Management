// Enums for Categorization
export enum IndexType {
  RENTAL = 'RENTAL',
  CONSTRUTORA = 'CONSTRUTORA',
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
  quantity: number;
  // CRITICAL: Financial Immutability Fields
  frozenPrice: number; // The price at the moment of launch
  totalValue: number; // quantity * frozenPrice
}

export interface RDO {
  id: string;
  projectId: string;
  date: string;
  status: 'DRAFT' | 'APPROVED';
  items: RDOItem[];
  totalDailyValue: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  rentalRevenue: number;
  constructionRevenue: number;
  totalCosts: number;
  equipmentHealth: {
    equipmentId: string;
    revenue: number;
    cost: number;
    margin: number;
  }[];
}