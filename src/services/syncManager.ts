import { AppState, isDummyItem, isDummyLedgerEntry } from './store';
import {
  saveToFirebase,
  deleteFromFirebase,
  saveSettingsToFirebase,
  COLLECTIONS,
  isCollectionEmpty,
  seedCollection,
  fetchCollection
} from './firebase';

// Helper to sanitize any Firestore data and ignore function types
function sanitizeDoc(doc: any) {
  return JSON.parse(JSON.stringify(doc));
}

// Purge any legacy dummy / placeholder documents directly from Firestore
export async function purgeLegacyDummyDataFromFirebase(): Promise<void> {
  try {
    const rawItems = await fetchCollection<any>(COLLECTIONS.items);
    for (const itm of rawItems) {
      if (isDummyItem(itm)) {
        await deleteFromFirebase(COLLECTIONS.items, itm.id);
      }
    }

    const rawLedger = await fetchCollection<any>(COLLECTIONS.ledger);
    for (const led of rawLedger) {
      if (isDummyLedgerEntry(led)) {
        await deleteFromFirebase(COLLECTIONS.ledger, led.id);
      }
    }

    const rawAlerts = await fetchCollection<any>(COLLECTIONS.alerts);
    for (const alt of rawAlerts) {
      if (alt.id && /^alt-[1-5]$/.test(alt.id)) {
        await deleteFromFirebase(COLLECTIONS.alerts, alt.id);
      }
    }

    const rawAudit = await fetchCollection<any>(COLLECTIONS.auditLogs);
    for (const aud of rawAudit) {
      if (aud.id && /^aud-[1-4]$/.test(aud.id)) {
        await deleteFromFirebase(COLLECTIONS.auditLogs, aud.id);
      }
    }
  } catch (err) {
    console.error('Error while purging legacy dummy data from Firebase:', err);
  }
}

// Full seeding helper to upload local state to Firebase Firestore
export async function seedInitialStateToFirebase(state: AppState): Promise<void> {
  try {
    console.log('Starting full Firebase Firestore state seeding...');
    
    if (state.items.length) await seedCollection(COLLECTIONS.items, state.items);
    if (state.categories.length) await seedCollection(COLLECTIONS.categories, state.categories);
    if (state.units.length) await seedCollection(COLLECTIONS.units, state.units);
    if (state.departments.length) await seedCollection(COLLECTIONS.departments, state.departments);
    if (state.stores.length) await seedCollection(COLLECTIONS.stores, state.stores);
    if (state.suppliers.length) await seedCollection(COLLECTIONS.suppliers, state.suppliers);
    if (state.ledger.length) await seedCollection(COLLECTIONS.ledger, state.ledger);
    if (state.stockInReceipts.length) await seedCollection(COLLECTIONS.stockInReceipts, state.stockInReceipts);
    if (state.materialIssues.length) await seedCollection(COLLECTIONS.materialIssues, state.materialIssues);
    if (state.materialReturns.length) await seedCollection(COLLECTIONS.materialReturns, state.materialReturns);
    if (state.stockTransfers.length) await seedCollection(COLLECTIONS.stockTransfers, state.stockTransfers);
    if (state.stockAdjustments.length) await seedCollection(COLLECTIONS.stockAdjustments, state.stockAdjustments);
    if (state.monthlyClosings.length) await seedCollection(COLLECTIONS.monthlyClosings, state.monthlyClosings);
    if (state.alerts.length) await seedCollection(COLLECTIONS.alerts, state.alerts);
    if (state.auditLogs.length) await seedCollection(COLLECTIONS.auditLogs, state.auditLogs);
    if (state.users.length) await seedCollection(COLLECTIONS.users, state.users);
    
    // Save settings singleton
    await saveSettingsToFirebase(state.settings);
    
    console.log('Firebase state seeding complete.');
  } catch (err) {
    console.error('Failed to seed initial state to Firebase:', err);
  }
}

// Hydrate local state from Firebase Firestore
export async function hydrateStateFromFirebase(): Promise<Partial<AppState>> {
  try {
    console.log('Hydrating state from Firebase Firestore...');
    const [
      items,
      categories,
      units,
      departments,
      stores,
      suppliers,
      ledger,
      stockInReceipts,
      materialIssues,
      materialReturns,
      stockTransfers,
      stockAdjustments,
      monthlyClosings,
      alerts,
      auditLogs,
      users,
      settingsList
    ] = await Promise.all([
      fetchCollection<any>(COLLECTIONS.items),
      fetchCollection<any>(COLLECTIONS.categories),
      fetchCollection<any>(COLLECTIONS.units),
      fetchCollection<any>(COLLECTIONS.departments),
      fetchCollection<any>(COLLECTIONS.stores),
      fetchCollection<any>(COLLECTIONS.suppliers),
      fetchCollection<any>(COLLECTIONS.ledger),
      fetchCollection<any>(COLLECTIONS.stockInReceipts),
      fetchCollection<any>(COLLECTIONS.materialIssues),
      fetchCollection<any>(COLLECTIONS.materialReturns),
      fetchCollection<any>(COLLECTIONS.stockTransfers),
      fetchCollection<any>(COLLECTIONS.stockAdjustments),
      fetchCollection<any>(COLLECTIONS.monthlyClosings),
      fetchCollection<any>(COLLECTIONS.alerts),
      fetchCollection<any>(COLLECTIONS.auditLogs),
      fetchCollection<any>(COLLECTIONS.users),
      fetchCollection<any>(COLLECTIONS.settings)
    ]);

    const settingsDoc = settingsList.find(s => s.id === 'company_profile');

    const cleanItems = (items || []).filter(i => !isDummyItem(i));
    const cleanLedger = (ledger || []).filter(l => !isDummyLedgerEntry(l));
    const cleanAlerts = (alerts || []).filter(a => !a.id || !/^alt-[1-5]$/.test(a.id));
    const cleanAuditLogs = (auditLogs || []).filter(al => !al.id || !/^aud-[1-4]$/.test(al.id));

    return {
      items: cleanItems,
      categories: categories.length ? categories : [],
      units: units.length ? units : [],
      departments: departments.length ? departments : [],
      stores: stores.length ? stores : [],
      suppliers: suppliers.length ? suppliers : [],
      ledger: cleanLedger,
      stockInReceipts: stockInReceipts.length ? stockInReceipts : [],
      materialIssues: materialIssues.length ? materialIssues : [],
      materialReturns: materialReturns.length ? materialReturns : [],
      stockTransfers: stockTransfers.length ? stockTransfers : [],
      stockAdjustments: stockAdjustments.length ? stockAdjustments : [],
      monthlyClosings: monthlyClosings.length ? monthlyClosings : [],
      alerts: cleanAlerts,
      auditLogs: cleanAuditLogs,
      users: users.length ? users : [],
      settings: settingsDoc ? { ...settingsDoc } : undefined
    };
  } catch (err) {
    console.error('Failed to hydrate state from Firebase:', err);
    return {};
  }
}

// Compare two collection arrays and sync additions, modifications, and deletions
async function syncCollectionDiff<T extends { id: string }>(
  collectionName: string,
  prevArray: T[],
  newArray: T[]
): Promise<void> {
  const prevMap = new Map(prevArray.map(item => [item.id, item]));
  const newMap = new Map(newArray.map(item => [item.id, item]));

  // Find added or updated items
  for (const [id, newItem] of newMap.entries()) {
    const prevItem = prevMap.get(id);
    if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(newItem)) {
      await saveToFirebase(collectionName, id, newItem);
    }
  }

  // Find deleted items
  for (const id of prevMap.keys()) {
    if (!newMap.has(id)) {
      await deleteFromFirebase(collectionName, id);
    }
  }
}

// Compare and sync full state diff
export async function syncStateDiffToFirebase(
  prevState: AppState,
  newState: AppState
): Promise<void> {
  try {
    // 1. Sync Standard collections
    await Promise.all([
      syncCollectionDiff(COLLECTIONS.items, prevState.items, newState.items),
      syncCollectionDiff(COLLECTIONS.categories, prevState.categories, newState.categories),
      syncCollectionDiff(COLLECTIONS.units, prevState.units, newState.units),
      syncCollectionDiff(COLLECTIONS.departments, prevState.departments, newState.departments),
      syncCollectionDiff(COLLECTIONS.stores, prevState.stores, newState.stores),
      syncCollectionDiff(COLLECTIONS.suppliers, prevState.suppliers, newState.suppliers),
      syncCollectionDiff(COLLECTIONS.ledger, prevState.ledger, newState.ledger),
      syncCollectionDiff(COLLECTIONS.stockInReceipts, prevState.stockInReceipts, newState.stockInReceipts),
      syncCollectionDiff(COLLECTIONS.materialIssues, prevState.materialIssues, newState.materialIssues),
      syncCollectionDiff(COLLECTIONS.materialReturns, prevState.materialReturns, newState.materialReturns),
      syncCollectionDiff(COLLECTIONS.stockTransfers, prevState.stockTransfers, newState.stockTransfers),
      syncCollectionDiff(COLLECTIONS.stockAdjustments, prevState.stockAdjustments, newState.stockAdjustments),
      syncCollectionDiff(COLLECTIONS.monthlyClosings, prevState.monthlyClosings, newState.monthlyClosings),
      syncCollectionDiff(COLLECTIONS.alerts, prevState.alerts, newState.alerts),
      syncCollectionDiff(COLLECTIONS.auditLogs, prevState.auditLogs, newState.auditLogs),
      syncCollectionDiff(COLLECTIONS.users, prevState.users, newState.users)
    ]);

    // 2. Sync settings singleton if changed
    if (JSON.stringify(prevState.settings) !== JSON.stringify(newState.settings)) {
      await saveSettingsToFirebase(newState.settings);
    }
  } catch (err) {
    console.error('Failed to sync state difference to Firebase:', err);
  }
}
