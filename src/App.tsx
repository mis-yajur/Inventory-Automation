import React, { useState, useEffect, useRef } from 'react';
import { loadInitialState, saveStateToStorage, AppState } from './services/store';
import { Item, ViewType } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { ItemFormModal } from './components/ItemFormModal';
import { ApiDocModal } from './components/ApiDocModal';

import { isCollectionEmpty, COLLECTIONS } from './services/firebase';
import { seedInitialStateToFirebase, hydrateStateFromFirebase, syncStateDiffToFirebase } from './services/syncManager';

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

  // Initialize and check Firestore on startup
  useEffect(() => {
    const initFirebaseSync = async () => {
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
  }, []);

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
            onSelectItem={setSelectedItemForView}
            onEditItem={handleEditItem}
            onCreateNew={handleCreateNewItem}
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
        return <StockLedgerView state={state} />;
      case 'stock_valuation':
        return <StockValuationReportView state={state} />;
      case 'abc_analysis':
        return <AbcAnalysisView state={state} />;
      case 'fast_slow_moving':
        return <FastSlowMovingView state={state} />;
      case 'audit_trail':
        return <AuditTrailView state={state} />;
      case 'role_management':
        return <RoleManagementView state={state} setState={setState} />;
      case 'plugin_architecture':
        return <PluginArchitectureView state={state} setState={setState} />;
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
      {isSearchOpen && (
        <GlobalSearchModal
          items={state.items}
          onSelectItem={(item) => {
            setSelectedItemForView(item);
            setIsSearchOpen(false);
          }}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {isScannerOpen && (
        <BarcodeScannerModal
          onScanResult={handleBarcodeScanResult}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {selectedItemForView && (
        <ItemDetailModal
          item={selectedItemForView}
          ledger={state.ledger.filter(l => l.itemId === selectedItemForView.id)}
          onClose={() => setSelectedItemForView(null)}
          onEdit={(item) => {
            setSelectedItemForView(null);
            handleEditItem(item);
          }}
        />
      )}

      {isItemFormOpen && (
        <ItemFormModal
          item={selectedItemForEdit}
          categories={state.categories}
          units={state.units}
          stores={state.stores}
          suppliers={state.suppliers}
          onSave={handleSaveItem}
          onClose={() => setIsItemFormOpen(false)}
        />
      )}

      {isApiDocOpen && (
        <ApiDocModal onClose={() => setIsApiDocOpen(false)} />
      )}
    </div>
  );
};

export default App;
