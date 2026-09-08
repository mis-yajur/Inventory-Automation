import {
  Item, Category, Unit, Department, Store, Supplier,
  StockLedgerEntry, StockInReceipt, MaterialIssue, MaterialReturn,
  StockTransfer, StockAdjustment, MonthlyClosing, AlertNotification,
  AuditLog, UserRole, CompanySettings, PluginModule
} from '../types';
import { calculateWeightedAverageRate, getItemInventoryStatus } from '../utils/calculations';

// Key for LocalStorage
export const STORAGE_KEY = 'ims_automation_yajur_data_v1';

export interface AppState {
  items: Item[];
  categories: Category[];
  units: Unit[];
  departments: Department[];
  stores: Store[];
  suppliers: Supplier[];
  ledger: StockLedgerEntry[];
  stockInReceipts: StockInReceipt[];
  materialIssues: MaterialIssue[];
  materialReturns: MaterialReturn[];
  stockTransfers: StockTransfer[];
  stockAdjustments: StockAdjustment[];
  monthlyClosings: MonthlyClosing[];
  alerts: AlertNotification[];
  auditLogs: AuditLog[];
  users: UserRole[];
  settings: CompanySettings;
  activeStoreId: string;
  activeUser: UserRole;
  isOfflineMode: boolean;
  isFirebaseSynced: boolean;
  plugins: PluginModule[];
}

export const initialCategories: Category[] = [];

export const initialUnits: Unit[] = [
  { id: 'u-1', code: 'PCS', name: 'Pieces', decimalAllowed: false, active: true },
  { id: 'u-2', code: 'KG', name: 'Kilograms', decimalAllowed: true, active: true }
];

export const initialDepartments: Department[] = [];

export const initialStores: Store[] = [
  { id: 'str-1', code: 'STR-01', name: 'Main Store', responsiblePerson: 'Admin', location: 'Warehouse', active: true }
];

export const initialSuppliers: Supplier[] = [];

export const initialItems: Item[] = [];

export const initialLedger: StockLedgerEntry[] = [];

export const initialAlerts: AlertNotification[] = [];

export const initialAuditLogs: AuditLog[] = [];

export const initialUsers: UserRole[] = [
  {
    id: 'u-viewer',
    name: 'Management Viewer',
    email: 'mis@yajurfibres.com',
    role: 'Admin',
    assignedStoreId: 'All Stores',
    status: 'Active',
    lastLogin: 'Just now',
    mfaEnabled: false
  }
];

export const initialSettings: CompanySettings = {
  companyName: 'YAJUR FIBRES & TEXTILES LTD.',
  companyLogo: '',
  address: 'Plot 42, Industrial Growth Center, Sector 3, Phase II',
  gstReference: 'PENDING',
  financialYearStart: 'April',
  currency: 'INR (₹)',
  defaultStoreId: 'str-1',
  valuationMethod: 'Weighted Average',
  enableNegativeStock: false,
  defaultLeadTimeDays: 7,
  defaultSafetyFactor: 25,
  reorderMethod: 'Lead Time + Safety Stock',
  nonMovingDays: 90,
  deadStockDays: 365,
  consumptionSpikeThreshold: 30,
  quantityPrecision: 2,
  valuePrecision: 2,
  financialYear: '2026-27',
  defaultLeadTime: 7,
  ageingBands: ['0-30', '31-60', '61-90', '90+'],
  monthlyCloseLock: true,
  darkMode: true
};

export function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        items: parsed.items || initialItems,
        categories: parsed.categories || initialCategories,
        units: parsed.units || initialUnits,
        departments: parsed.departments || initialDepartments,
        stores: parsed.stores || initialStores,
        suppliers: parsed.suppliers || initialSuppliers,
        ledger: parsed.ledger || initialLedger,
        stockInReceipts: parsed.stockInReceipts || [],
        materialIssues: parsed.materialIssues || [],
        materialReturns: parsed.materialReturns || [],
        stockTransfers: parsed.stockTransfers || [],
        stockAdjustments: parsed.stockAdjustments || [],
        monthlyClosings: parsed.monthlyClosings || [],
        alerts: parsed.alerts || initialAlerts,
        auditLogs: parsed.auditLogs || initialAuditLogs,
        users: parsed.users || initialUsers,
        settings: parsed.settings || initialSettings,
        activeStoreId: parsed.activeStoreId || 'str-1',
        activeUser: parsed.activeUser || initialUsers[0],
        isOfflineMode: false,
        isFirebaseSynced: true,
        plugins: parsed.plugins || []
      };
    }
  } catch (err) {
    console.error('Failed to load local storage state:', err);
  }

  return {
    items: initialItems,
    categories: initialCategories,
    units: initialUnits,
    departments: initialDepartments,
    stores: initialStores,
    suppliers: initialSuppliers,
    ledger: initialLedger,
    stockInReceipts: [],
    materialIssues: [],
    materialReturns: [],
    stockTransfers: [],
    stockAdjustments: [],
    monthlyClosings: [],
    alerts: initialAlerts,
    auditLogs: initialAuditLogs,
    users: initialUsers,
    settings: initialSettings,
    activeStoreId: 'str-1',
    activeUser: initialUsers[0],
    isOfflineMode: false,
    isFirebaseSynced: true,
    plugins: []
  };
}

export function saveStateToStorage(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      items: state.items,
      categories: state.categories,
      units: state.units,
      departments: state.departments,
      stores: state.stores,
      suppliers: state.suppliers,
      ledger: state.ledger,
      stockInReceipts: state.stockInReceipts,
      materialIssues: state.materialIssues,
      materialReturns: state.materialReturns,
      stockTransfers: state.stockTransfers,
      stockAdjustments: state.stockAdjustments,
      monthlyClosings: state.monthlyClosings,
      alerts: state.alerts,
      auditLogs: state.auditLogs,
      users: state.users,
      settings: state.settings,
      activeStoreId: state.activeStoreId,
      activeUser: state.activeUser,
      plugins: state.plugins
    }));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

/**
 * Aggregates consumption data (Material Issues minus Returns) by month.
 * Returns an array suitable for recharts: [{ month: 'Jan 2026', consumption: 500 }, ...]
 */
export function getMonthlyConsumption(state: AppState): { month: string; consumption: number; value: number }[] {
  const consumptionMap = new Map<string, { qty: number; value: number }>();

  // Use the ledger to calculate accurate consumption over time
  // Filter for ISSUE and RETURN
  const relevantLedger = state.ledger.filter(entry => 
    entry.transactionType === 'ISSUE' || entry.transactionType === 'RETURN'
  );

  relevantLedger.forEach(entry => {
    const date = new Date(entry.transactionDate);
    // Format as "MMM YYYY", e.g., "Aug 2026"
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!consumptionMap.has(month)) {
      consumptionMap.set(month, { qty: 0, value: 0 });
    }
    
    const current = consumptionMap.get(month)!;
    if (entry.transactionType === 'ISSUE') {
      current.qty += entry.outwardQty;
      current.value += entry.outwardValue;
    } else if (entry.transactionType === 'RETURN') {
      // Returns reduce consumption
      current.qty -= entry.inwardQty;
      current.value -= entry.inwardValue;
    }
  });

  // Sort chronologically
  const result = Array.from(consumptionMap.entries()).map(([month, data]) => ({
    month,
    consumption: data.qty,
    value: data.value
  })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  return result;
}

/**
 * Maps ledger entries to monthly intervals to calculate month-wise closing stock and value.
 * Used for the 'Month Wise Stock' summary.
 */
export function getMonthlyStock(state: AppState): { month: string; totalQty: number; totalValue: number }[] {
  const monthlyMap = new Map<string, { qty: number; value: number }>();
  let runningQty = 0;
  let runningValue = 0;

  // Ledger should be sorted chronologically by default, but let's ensure
  const sortedLedger = [...state.ledger].sort((a, b) => 
    new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  sortedLedger.forEach(entry => {
    const date = new Date(entry.transactionDate);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    // In our simplified logic, we track the final running stock in each month.
    // The last ledger entry in a month represents its closing stock.
    runningQty = entry.runningQty;
    runningValue = entry.runningStockValue;
    
    // Update or set the month's closing
    monthlyMap.set(month, { qty: runningQty, value: runningValue });
  });

  return Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    totalQty: data.qty,
    totalValue: data.value
  }));
}
