import {
  Item, Category, Unit, Department, Store, Supplier,
  StockLedgerEntry, StockInReceipt, MaterialIssue, MaterialReturn,
  StockTransfer, StockAdjustment, MonthlyClosing, AlertNotification,
  AuditLog, UserRole, CompanySettings, PluginModule
} from '../types';
import { calculateWeightedAverageRate, getItemInventoryStatus } from '../utils/calculations';

// Key for LocalStorage
export const STORAGE_KEY = 'ims_automation_yajur_live_v2';
export const LEGACY_STORAGE_KEYS = ['ims_automation_yajur_data_v1', 'ims_automation_yajur_state'];

export const DUMMY_ITEM_CODES = new Set([
  'ITM-0001', 'ITM-0002', 'ITM-0003', 'ITM-0004', 'ITM-0005', 'ITM-0006',
  'ITM-0007', 'ITM-0008', 'ITM-0009', 'ITM-0010', 'ITM-0011', 'ITM-0012'
]);

export const DUMMY_ITEM_NAMES = new Set([
  'bearing 6205', 'lubricant abc', 'cotton waste', 'spare gearbox', 'fuse 63a',
  'safety gloves', 'v-belt b72', 'cable tie 200mm', 'gland 25mm', 'seal 45mm',
  'plc module x2', 'old motor coupling'
]);

export function isDummyItem(item: any): boolean {
  if (!item) return false;
  const id = String(item.id || '').toLowerCase().trim();
  const code = String(item.itemCode || '').toUpperCase().trim();
  const name = String(item.itemName || '').toLowerCase().trim();

  if (/^itm-([1-9]|1[0-2])$/.test(id)) return true;
  if (/^itm-00(0[1-9]|1[0-2])$/.test(code)) return true;
  if (DUMMY_ITEM_CODES.has(code)) return true;
  if (DUMMY_ITEM_NAMES.has(name)) return true;
  for (const dummyName of DUMMY_ITEM_NAMES) {
    if (name === dummyName || name.startsWith(dummyName)) return true;
  }
  return false;
}

export function isDummyLedgerEntry(entry: any): boolean {
  if (!entry) return false;
  const id = String(entry.id || '').toLowerCase().trim();
  const code = String(entry.itemCode || '').toUpperCase().trim();
  const itemId = String(entry.itemId || '').toLowerCase().trim();

  if (/^led-[1-6]$/.test(id)) return true;
  if (id.startsWith('led-open-itm-') || id.includes('itm-')) return true;
  if (/^itm-([1-9]|1[0-2])$/.test(itemId)) return true;
  if (DUMMY_ITEM_CODES.has(code)) return true;
  return false;
}

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
  // Clear legacy storage keys
  try {
    LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    // Ignore storage access errors
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const rawItems = Array.isArray(parsed.items) ? parsed.items : initialItems;
      const cleanItems = rawItems.filter((i: any) => !isDummyItem(i));

      const rawLedger = Array.isArray(parsed.ledger) ? parsed.ledger : initialLedger;
      const cleanLedger = rawLedger.filter((l: any) => !isDummyLedgerEntry(l));

      const rawAlerts = Array.isArray(parsed.alerts) ? parsed.alerts : initialAlerts;
      const cleanAlerts = rawAlerts.filter((a: any) => !a.id || !/^alt-[1-5]$/.test(a.id));

      const rawAuditLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : initialAuditLogs;
      const cleanAuditLogs = rawAuditLogs.filter((al: any) => !al.id || !/^aud-[1-4]$/.test(al.id));

      const rawCategories = Array.isArray(parsed.categories) ? parsed.categories : initialCategories;
      const cleanCategories = rawCategories.filter((c: any) => !c.id || !/^cat-[1-5]$/.test(c.id));

      const rawDepartments = Array.isArray(parsed.departments) ? parsed.departments : initialDepartments;
      const cleanDepartments = rawDepartments.filter((d: any) => !d.id || !/^dep-[1-5]$/.test(d.id));

      const rawSuppliers = Array.isArray(parsed.suppliers) ? parsed.suppliers : initialSuppliers;
      const cleanSuppliers = rawSuppliers.filter((s: any) => !s.id || !/^sup-[1-3]$/.test(s.id));

      const cleanedState: AppState = {
        items: cleanItems,
        categories: cleanCategories,
        units: parsed.units || initialUnits,
        departments: cleanDepartments,
        stores: parsed.stores || initialStores,
        suppliers: cleanSuppliers,
        ledger: cleanLedger,
        stockInReceipts: parsed.stockInReceipts || [],
        materialIssues: parsed.materialIssues || [],
        materialReturns: parsed.materialReturns || [],
        stockTransfers: parsed.stockTransfers || [],
        stockAdjustments: parsed.stockAdjustments || [],
        monthlyClosings: parsed.monthlyClosings || [],
        alerts: cleanAlerts,
        auditLogs: cleanAuditLogs,
        users: parsed.users || initialUsers,
        settings: parsed.settings || initialSettings,
        activeStoreId: parsed.activeStoreId || 'str-1',
        activeUser: parsed.activeUser || initialUsers[0],
        isOfflineMode: false,
        isFirebaseSynced: true,
        plugins: parsed.plugins || []
      };

      if (rawItems.length !== cleanItems.length || rawLedger.length !== cleanLedger.length) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedState));
        } catch (e) {
          // ignore
        }
      }

      return cleanedState;
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
