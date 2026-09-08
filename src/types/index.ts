export type ItemStatus = 'Normal' | 'Low' | 'Critical' | 'Out of Stock' | 'Overstock' | 'Non-moving' | 'Negative' | 'Dead Stock';

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  shortName?: string;
  description: string;
  categoryId: string;
  categoryName: string;
  unitId: string;
  unitName: string;
  departmentId?: string;
  departmentName?: string;
  defaultStoreId: string;
  defaultStoreName: string;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
  partNumber?: string;
  brand?: string;
  model?: string;
  specification?: string;
  barcode?: string;
  rack?: string;
  bin?: string;
  
  // Stock planning
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  reorderQty: number;
  safetyFactor: number; // percentage, e.g. 25
  safetyStock: number;
  leadTimeDays: number;
  avgDailyConsumption: number;
  avgMonthlyConsumption: number;
  
  // Costing
  standardRate: number;
  lastPurchaseRate: number;
  averageRate: number;
  
  // Control
  criticalItem: boolean;
  consumable: boolean;
  active: boolean;
  
  // Current calculated balances
  currentQty: number;
  reservedQty: number;
  availableQty: number;
  stockValue: number;
  abcClass?: 'A' | 'B' | 'C';
  lastReceiptDate?: string;
  lastIssueDate?: string;
  
  createdAt: string;
  updatedAt: string;
}

export type ViewType =
  | 'dashboard'
  | 'items'
  | 'categories'
  | 'units'
  | 'departments'
  | 'stores'
  | 'suppliers'
  | 'opening_stock'
  | 'stock_in'
  | 'material_issue'
  | 'material_return'
  | 'stock_transfer'
  | 'stock_adjustment'
  | 'current_stock'
  | 'consumption'
  | 'reorder_management'
  | 'stock_planning'
  | 'monthly_closing'
  | 'stock_ledger'
  | 'stock_valuation'
  | 'abc_analysis'
  | 'fast_slow_moving'
  | 'audit_trail'
  | 'role_management'
  | 'system_settings'
  | 'reports'
  | 'data_quality'
  | 'plugin_architecture';


export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  decimalAllowed: boolean;
  active: boolean;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  departmentHead: string;
  costCentre: string;
  active: boolean;
}

export interface Store {
  id: string;
  code: string;
  name: string;
  responsiblePerson: string;
  location: string;
  address?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  leadTimeDays: number;
  preferred: boolean;
  active: boolean;
}

export interface StockLedgerEntry {
  id: string;
  transactionDate: string;
  transactionType: 'OPENING' | 'STOCK_IN' | 'ISSUE' | 'RETURN' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'MONTHLY_CLOSE';
  referenceNumber: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  storeId: string;
  storeName: string;
  departmentId?: string;
  departmentName?: string;
  inwardQty: number;
  outwardQty: number;
  runningQty: number;
  rate: number;
  inwardValue: number;
  outwardValue: number;
  runningStockValue: number;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface StockInItem {
  itemId: string;
  qty: number;
  unit: string;
  rate: number;
  value: number;
  batch?: string;
  expiry?: string;
}

export interface StockInReceipt {
  id: string;
  receiptNo: string;
  date: string;
  storeId: string;
  supplierId: string;
  poReference: string;
  challanNo: string;
  invoiceNo: string;
  status: 'Draft' | 'Posted' | 'Quarantine Hold';
  items: StockInItem[];
  remarks: string;
  createdBy: string;
  createdAt: string;
}

export interface MaterialIssueItem {
  itemId: string;
  availableQty: number;
  reqQty: number;
  issueQty: number;
  unit: string;
  rate: number;
  issueValue: number;
}

export interface MaterialIssue {
  id: string;
  issueNo: string;
  issueDate: string;
  storeId: string;
  departmentId: string;
  requestedBy: string;
  issuedBy: string;
  machineJob?: string;
  purpose?: string;
  status: 'Draft' | 'Posted';
  items: MaterialIssueItem[];
  remarks: string;
  createdBy: string;
  createdAt: string;
}

export interface MaterialReturnItem {
  itemId: string;
  issuedQty: number;
  returnQty: number;
  condition: 'Unused' | 'Partially Used' | 'Damaged' | 'Scrap';
  rate: number;
  returnValue: number;
}

export interface MaterialReturn {
  id: string;
  returnNo: string;
  date: string;
  originalIssueRef: string;
  departmentId: string;
  storeId: string;
  items: MaterialReturnItem[];
  remarks: string;
  status: 'Draft' | 'Posted';
  createdAt: string;
}

export interface StockTransferItem {
  itemId: string;
  sourceAvail: number;
  transferQty: number;
  unit: string;
  rate: number;
  value: number;
}

export interface StockTransfer {
  id: string;
  transferNo: string;
  date: string;
  fromStoreId: string;
  toStoreId: string;
  status: 'Draft' | 'Pending Approval' | 'In Transit' | 'Posted' | 'Cancelled';
  items: StockTransferItem[];
  remarks: string;
  createdBy: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNo: string;
  date: string;
  storeId: string;
  adjustmentType: 'Physical Verification Excess' | 'Physical Verification Shortage' | 'Damage' | 'Scrap' | 'Expired' | 'Data Correction';
  itemId: string;
  systemQty: number;
  physicalQty: number;
  differenceQty: number;
  rate: number;
  valueDifference: number;
  reason: string;
  status: 'Draft' | 'Posted';
  approvedBy: string;
  createdAt: string;
}

export interface MonthlyClosing {
  id: string;
  monthYear: string; // e.g. "2026-08"
  monthName: string; // "August 2026"
  storeId: string;
  storeName: string;
  closingValue: number;
  status: 'Open' | 'Closed' | 'Reopened';
  closedBy?: string;
  closedAt?: string;
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    openingQty: number;
    inwardQty: number;
    outwardQty: number;
    adjustQty: number;
    closingQty: number;
    closingRate: number;
    closingValue: number;
  }[];
}

export interface AlertNotification {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'REORDER';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedItemId?: string;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  time: string;
  userId: string;
  userName: string;
  module: string;
  action: 'CREATE' | 'POST' | 'UPDATE' | 'DELETE' | 'REVERSE' | 'LOGIN' | 'MONTHLY_CLOSE';
  record: string;
  previousValue: string;
  newValue: string;
  reason: string;
}

export interface UserRole {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Store Manager' | 'Store Incharge' | 'Maintenance Engineer' | 'Finance Auditor' | 'Viewer';
  assignedStoreId: string; // 'All Stores' or store ID
  status: 'Active' | 'Inactive';
  lastLogin: string;
  mfaEnabled?: boolean;
}

export interface CompanySettings {
  companyName: string;
  companyLogo?: string;
  address: string;
  gstReference: string;
  financialYearStart: string; // "April"
  currency: string; // "INR (₹)"
  defaultStoreId: string;
  valuationMethod: 'Weighted Average' | 'FIFO' | 'Standard Cost';
  enableNegativeStock: boolean;
  defaultLeadTimeDays: number;
  defaultSafetyFactor: number;
  reorderMethod: string;
  nonMovingDays: number;
  deadStockDays: number;
  consumptionSpikeThreshold: number; // percentage
  quantityPrecision: number;
  valuePrecision: number;
  financialYear: string;
  defaultLeadTime: number;
  ageingBands: string[];
  monthlyCloseLock: boolean;
  darkMode: boolean;
}

export interface PluginModule {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  author: string;
}
