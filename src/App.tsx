import React, { useState, useEffect, useRef } from 'react';
import { loadInitialState, saveStateToStorage, AppState } from './services/store';
import { Item, ViewType, StockLedgerEntry } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { ApiDocModal } from './components/ApiDocModal';
import { Lock } from 'lucide-react';

import { isCollectionEmpty, COLLECTIONS, auth } from './services/firebase';
import { seedInitialStateToFirebase, hydrateStateFromFirebase, syncStateDiffToFirebase } from './services/syncManager';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User } from 'firebase/auth';

import { DashboardView } from './views/DashboardView';
import { ItemMasterView } from './views/ItemMasterView';
import { CategoriesView } from './views/CategoriesView';
import { UnitsView } from './views/UnitsView';
import { DepartmentsView } from './views/DepartmentsView';
import { StoresView } from './views/StoresView';
import { SuppliersView } from './views/SuppliersView';
import { OpeningStockView } from './views/OpeningStockView';
import { StockInView } from './views/StockInView';
import { MaterialIssueView } from './views/MaterialIssueView';
import { MaterialReturnView } from './views/MaterialReturnView';
import { StockTransferView } from './views/StockTransferView';
import { StockAdjustmentView } from './views/StockAdjustmentView';
import { CurrentStockView } from './views/CurrentStockView';
import { ConsumptionView } from './views/ConsumptionView';
import { ReorderManagementView } from './views/ReorderManagementView';
import { StockPlanningView } from './views/StockPlanningView';
import { MonthlyClosingView } from './views/MonthlyClosingView';
import { StockLedgerView } from './views/StockLedgerView';
import { StockValuationReportView } from './views/StockValuationReportView';
import { AbcAnalysisView } from './views/AbcAnalysisView';
import { FastSlowMovingView } from './views/FastSlowMovingView';
import { AuditTrailView } from './views/AuditTrailView';
import { RoleManagementView } from './views/RoleManagementView';
import { PluginArchitectureView } from './views/PluginArchitectureView';
import { SystemSettingsView } from './views/SystemSettingsView';
import { ReportsView } from './views/ReportsView';
import { DataQualityView } from './views/DataQualityView';

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadInitialState);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isApiDocOpen, setIsApiDocOpen] = useState(false);
  const [selectedItemForView, setSelectedItemForView] = useState<Item | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<Item | null>(null);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);

  const prevStateRef = useRef<AppState>(state);
  const [isSyncing, setIsSyncing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    setUser({ uid: 'admin', email: 'admin@yajurfibres.com', displayName: 'Admin User' } as User);
    setAuthChecking(false);
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    
    const cleanUsername = loginUsername.trim();
    const cleanPassword = loginPassword.trim();
    
    let email = '';
    let role = '';
    let name = '';
    
    if (cleanUsername === 'Admin' && cleanPassword === 'Admin@1234') {
      email = 'admin@yajurfibres.com';
      role = 'Super Admin';
      name = 'Admin User';
    } else if (cleanUsername === 'User' && cleanPassword === 'User@1234') {
      email = 'user@yajurfibres.com';
      role = 'Store User';
      name = 'Standard User';
    } else {
      setLoginError('Invalid username or password');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, cleanPassword);
      updateUserRoleState(email, name, role);
    } catch (error: any) {
      // In newer Firebase versions, user-not-found and wrong-password are combined into invalid-credential or invalid-login-credentials
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        try {
          await createUserWithEmailAndPassword(auth, email, cleanPassword);
          updateUserRoleState(email, name, role);
        } catch (createError: any) {
          console.error('Account creation error:', createError);
          setLoginError(createError.message || 'Could not create account automatically.');
        }
      } else {
        console.error('Login error:', error);
        setLoginError(error.message || 'Authentication failed.');
      }
    }
  };

  const updateUserRoleState = (email: string, name: string, role: string) => {
    setState(prev => ({
      ...prev,
      activeUser: {
        id: email,
        name,
        email,
        role: role as any,
        assignedStoreId: 'str-1',
        status: 'Active',
        lastLogin: new Date().toISOString()
      }
    }));
  };

  // Initialize and check Firestore on startup
  useEffect(() => {
    const initFirebaseSync = async () => {
      if (!user) return; // Only sync if authenticated
      try {
        setIsSyncing(true);
        setState(prev => ({ ...prev, isFirebaseSynced: false }));
        
        const isEmpty = await isCollectionEmpty(COLLECTIONS.items);
        if (isEmpty) {
          console.log('Firebase Firestore is empty. Seeding initial state...');
          await seedInitialStateToFirebase(state);
          setState(prev => ({ ...prev, isFirebaseSynced: true }));
        } else {
          console.log('Firebase Firestore has data. Hydrating state...');
          const hydratedData = await hydrateStateFromFirebase();
          setState(prev => {
            const updated = {
              ...prev,
              ...hydratedData,
              settings: hydratedData.settings ? { ...prev.settings, ...hydratedData.settings } : prev.settings,
              isFirebaseSynced: true
            };
            saveStateToStorage(updated);
            prevStateRef.current = updated;
            return updated;
          });
        }
      } catch (err) {
        console.error('Failed to initialize Firebase Sync:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    initFirebaseSync();
  }, [user]);

  // Save to localStorage on state changes and sync diffs to Firebase
  useEffect(() => {
    saveStateToStorage(state);
    
    // Sync diff to Firebase if connection is active and we are not in initial hydrating phase
    if (state.isFirebaseSynced && !isSyncing) {
      syncStateDiffToFirebase(prevStateRef.current, state);
    }
    
    prevStateRef.current = state;
  }, [state, isSyncing]);

  const handleActiveViewChange = (view: ViewType) => {
    setState(prev => ({ ...prev, activeView: view }));
  };

  const handleSelectStore = (storeId: string) => {
    setState(prev => ({ ...prev, selectedStoreId: storeId }));
  };

  const handleCreateNewItem = () => {
    setSelectedItemForEdit(null);
    setIsItemFormOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setSelectedItemForEdit(item);
    setIsItemFormOpen(true);
  };

  const handleReverseTransaction = (entry: StockLedgerEntry) => {
    const reverseRef = `REV-${entry.referenceNumber}`;
    const timestamp = new Date().toISOString();
    const date = timestamp.split('T')[0];

    setState(prev => {
      const item = prev.items.find(i => i.id === entry.itemId);
      if (!item) return prev;

      // Calculate stock change (neutralize the original effect)
      // Original Inward 50 -> New Outward 50
      // Original Outward 30 -> New Inward 30
      const inwardQty = entry.outwardQty;
      const outwardQty = entry.inwardQty;
      
      const newQty = item.currentQty + inwardQty - outwardQty;
      const newValue = newQty * item.averageRate;

      const newLedgerEntry: StockLedgerEntry = {
        id: `led-${Date.now()}`,
        transactionDate: date,
        transactionType: entry.transactionType,
        referenceNumber: reverseRef,
        itemId: entry.itemId,
        itemCode: entry.itemCode,
        itemName: entry.itemName,
        storeId: entry.storeId,
        storeName: entry.storeName,
        departmentId: entry.departmentId,
        departmentName: entry.departmentName,
        inwardQty,
        outwardQty,
        runningQty: newQty,
        rate: entry.rate,
        inwardValue: inwardQty * entry.rate,
        outwardValue: outwardQty * entry.rate,
        runningStockValue: newValue,
        userId: prev.activeUser.id,
        userName: prev.activeUser.name,
        timestamp
      };

      return {
        ...prev,
        items: prev.items.map(i => i.id === entry.itemId ? {
          ...i,
          currentQty: newQty,
          availableQty: newQty - (i.reservedQty || 0),
          stockValue: newValue,
          updatedAt: date
        } : i),
        ledger: [newLedgerEntry, ...prev.ledger],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Inventory Control',
            action: 'REVERSE',
            record: entry.referenceNumber,
            previousValue: 'POSTED',
            newValue: 'REVERSED',
            reason: `Transaction reversal created with ref: ${reverseRef}`
          },
          ...prev.auditLogs
        ]
      };
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setState(prev => {
      const itemToDelete = prev.items.find(i => i.id === itemId);
      if (!itemToDelete) return prev;

      return {
        ...prev,
        items: prev.items.filter(i => i.id !== itemId),
        ledger: prev.ledger.filter(l => l.itemId !== itemId),
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Item Master',
            action: 'DELETE',
            record: itemToDelete.itemCode,
            previousValue: itemToDelete.itemName,
            newValue: 'DELETED',
            reason: 'Item deleted from master catalog'
          },
          ...prev.auditLogs
        ]
      };
    });
  };

  const handleSaveItem = (itemData: Partial<Item>) => {
    const now = new Date().toISOString().split('T')[0];

    if (selectedItemForEdit) {
      // Edit existing
      const updatedItems = state.items.map(i => {
        if (i.id === selectedItemForEdit.id) {
          const cat = state.categories.find(c => c.id === itemData.categoryId);
          const unit = state.units.find(u => u.id === itemData.unitId);
          const str = state.stores.find(s => s.id === itemData.defaultStoreId);
          const currentQty = itemData.currentQty !== undefined ? itemData.currentQty : i.currentQty;
          const avgRate = itemData.averageRate !== undefined ? itemData.averageRate : i.averageRate;

          return {
            ...i,
            ...itemData,
            categoryName: cat?.name || i.categoryName,
            unitName: unit?.code || i.unitName,
            defaultStoreName: str?.name || i.defaultStoreName,
            availableQty: currentQty - (i.reservedQty || 0),
            stockValue: currentQty * avgRate,
            updatedAt: now
          };
        }
        return i;
      });

      setState(prev => ({
        ...prev,
        items: updatedItems,
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Item Master',
            action: 'UPDATE',
            record: selectedItemForEdit.itemCode,
            previousValue: selectedItemForEdit.itemName,
            newValue: itemData.itemName || selectedItemForEdit.itemName,
            reason: 'Item parameters edited by user'
          },
          ...prev.auditLogs
        ]
      }));
    } else {
      // Create new item
      const cat = state.categories.find(c => c.id === itemData.categoryId);
      const unit = state.units.find(u => u.id === itemData.unitId);
      const str = state.stores.find(s => s.id === itemData.defaultStoreId);

      const qty = itemData.currentQty || 0;
      const rate = itemData.averageRate || 0;

      const newItem: Item = {
        id: `item-${Date.now()}`,
        itemCode: itemData.itemCode || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        itemName: itemData.itemName || 'New Inventory Item',
        description: itemData.description || '',
        categoryId: itemData.categoryId || state.categories[0]?.id || 'cat-1',
        categoryName: cat?.name || 'General',
        unitId: itemData.unitId || state.units[0]?.id || 'u-1',
        unitName: unit?.code || 'PCS',
        defaultStoreId: itemData.defaultStoreId || state.stores[0]?.id || 'str-1',
        defaultStoreName: str?.name || 'Main Store',
        rack: itemData.rack || 'A01',
        bin: itemData.bin || 'B01',
        minStock: itemData.minStock || 10,
        maxStock: itemData.maxStock || 100,
        reorderLevel: itemData.reorderLevel || 25,
        reorderQty: itemData.reorderQty || 50,
        leadTimeDays: itemData.leadTimeDays || 7,
        safetyFactor: 25,
        safetyStock: itemData.safetyStock || 15,
        barcode: itemData.barcode || `8901234${Math.floor(100000 + Math.random() * 900000)}`,
        standardRate: rate,
        currentQty: qty,
        reservedQty: 0,
        availableQty: qty,
        averageRate: rate,
        lastPurchaseRate: rate,
        stockValue: qty * rate,
        avgDailyConsumption: 2,
        avgMonthlyConsumption: 60,
        criticalItem: false,
        consumable: true,
        abcClass: 'B',
        active: true,
        createdAt: now,
        updatedAt: now
      };

      setState(prev => ({
        ...prev,
        items: [newItem, ...prev.items],
        auditLogs: [
          {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            userId: prev.activeUser.id,
            userName: prev.activeUser.name,
            module: 'Item Master',
            action: 'CREATE',
            record: newItem.itemCode,
            previousValue: 'None',
            newValue: newItem.itemName,
            reason: 'New SKU created in master catalog'
          },
          ...prev.auditLogs
        ]
      }));
    }

    setIsItemFormOpen(false);
  };

  const handleBarcodeScanResult = (code: string) => {
    const match = state.items.find(i => i.barcode === code || i.itemCode === code);
    if (match) {
      setSelectedItemForView(match);
    } else {
      alert(`Scanned Barcode [${code}] not found in Item Master catalog.`);
    }
    setIsScannerOpen(false);
  };

  const renderActiveView = () => {
    switch (state.activeView) {
      case 'dashboard':
        return (
          <DashboardView
            state={state}
            onNavigateTab={handleActiveViewChange}
            onSelectItem={setSelectedItemForView}
          />
        );
      case 'items':
        return (
          <ItemMasterView
            state={state}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            onOpenAddItem={handleCreateNewItem}
          />
        );
      case 'categories':
        return <CategoriesView state={state} setState={setState} />;
      case 'units':
        return <UnitsView state={state} setState={setState} />;
      case 'departments':
        return <DepartmentsView state={state} setState={setState} />;
      case 'stores':
        return <StoresView state={state} setState={setState} />;
      case 'suppliers':
        return <SuppliersView state={state} setState={setState} />;
      case 'opening_stock':
        return <OpeningStockView state={state} setState={setState} />;
      case 'stock_in':
        return <StockInView state={state} setState={setState} />;
      case 'material_issue':
        return <MaterialIssueView state={state} setState={setState} />;
      case 'material_return':
        return <MaterialReturnView state={state} setState={setState} />;
      case 'stock_transfer':
        return <StockTransferView state={state} setState={setState} />;
      case 'stock_adjustment':
        return <StockAdjustmentView state={state} setState={setState} />;
      case 'current_stock':
        return <CurrentStockView state={state} onSelectItem={setSelectedItemForView} />;
      case 'consumption':
        return <ConsumptionView state={state} />;
      case 'reorder_management':
        return <ReorderManagementView state={state} />;
      case 'stock_planning':
        return <StockPlanningView state={state} setState={setState} />;
      case 'monthly_closing':
        return <MonthlyClosingView state={state} setState={setState} />;
      case 'stock_ledger':
        return <StockLedgerView state={state} onReverse={handleReverseTransaction} />;
      case 'stock_valuation':
        return <StockValuationReportView state={state} />;
      case 'abc_analysis':
        return <AbcAnalysisView state={state} />;
      case 'fast_slow_moving':
        return <FastSlowMovingView state={state} />;
      case 'audit_trail':
        return <AuditTrailView state={state} />;
      case 'reports':
        return <ReportsView state={state} onNavigate={handleActiveViewChange} />;
      case 'data_quality':
        return <DataQualityView state={state} />;
      case 'role_management':
        return <RoleManagementView state={state} setState={setState} />;
      case 'plugin_architecture':
        return <PluginArchitectureView state={state} setState={setState} />;
      case 'system_settings':
        return <SystemSettingsView state={state} setState={setState} />;
      default:
        return (
          <DashboardView
            state={state}
            onNavigateTab={handleActiveViewChange}
            onSelectItem={setSelectedItemForView}
          />
        );
    }
  };

  

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header Navigation */}
      <Header
        state={state}
        setState={setState}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenApiDocs={() => setIsApiDocOpen(true)}
        activeTab={state.activeView}
        setActiveTab={handleActiveViewChange}
      />

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeView={state.activeView}
          onViewChange={handleActiveViewChange}
          userRole={state.activeUser?.role || 'Super Admin'}
        />

        {/* View Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        state={state}
        onSelectItem={(item) => {
          setSelectedItemForView(item);
          setIsSearchOpen(false);
        }}
        onNavigateTab={handleActiveViewChange}
      />

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        state={state}
        onSelectItem={(item) => {
          setSelectedItemForView(item);
          setIsScannerOpen(false);
        }}
      />

      <ItemDetailModal
        isOpen={!!selectedItemForView}
        item={selectedItemForView}
        onClose={() => setSelectedItemForView(null)}
        state={state}
        onEdit={(item) => {
          setSelectedItemForView(null);
          handleEditItem(item);
        }}
        onStockIn={(item) => {
          setSelectedItemForView(null);
          handleActiveViewChange('stock_in');
          // In a real app, we'd pass the item to the StockIn view via state
        }}
        onIssue={(item) => {
          setSelectedItemForView(null);
          handleActiveViewChange('material_issue');
        }}
      />

      <ItemFormModal
        isOpen={isItemFormOpen}
        onClose={() => setIsItemFormOpen(false)}
        state={state}
        onSave={handleSaveItem}
        editingItem={selectedItemForEdit}
      />

      <ApiDocModal 
        isOpen={isApiDocOpen}
        onClose={() => setIsApiDocOpen(false)} 
      />
    </div>
  );
};

export default App;
