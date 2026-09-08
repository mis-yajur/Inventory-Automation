import { useState } from 'react';
import Papa from 'papaparse';
import { Unit, Department, Item } from '../types';

type ImportType = 'units' | 'departments' | 'items';

export function useCsvParser() {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseCsv = <T,>(file: File, type: ImportType, onSuccess: (data: T[]) => void) => {
    setIsParsing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        
        try {
          if (type === 'units') {
            const mapped = data.map((row: any) => ({
              id: row.id || `u-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              code: row.code || '',
              name: row.name || '',
              decimalAllowed: String(row.decimalAllowed).toLowerCase() === 'true',
              active: row.active !== undefined ? String(row.active).toLowerCase() !== 'false' : true,
            })) as T[];
            onSuccess(mapped);
          } else if (type === 'departments') {
            const mapped = data.map((row: any) => ({
              id: row.id || `d-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              code: row.code || '',
              name: row.name || '',
              departmentHead: row.departmentHead || '',
              costCentre: row.costCentre || '',
              active: row.active !== undefined ? String(row.active).toLowerCase() !== 'false' : true,
            })) as T[];
            onSuccess(mapped);
          } else if (type === 'items') {
            const mapped = data.map((row: any) => ({
              id: row.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              itemCode: row.itemCode || '',
              itemName: row.itemName || '',
              description: row.description || '',
              categoryId: row.categoryId || 'cat-1',
              categoryName: row.categoryName || 'General',
              unitId: row.unitId || 'u-1',
              unitName: row.unitName || 'Nos',
              defaultStoreId: row.defaultStoreId || 'str-1',
              defaultStoreName: row.defaultStoreName || 'Main Store',
              minStock: Number(row.minStock) || 0,
              maxStock: Number(row.maxStock) || 0,
              reorderLevel: Number(row.reorderLevel) || 0,
              reorderQty: Number(row.reorderQty) || 0,
              safetyFactor: Number(row.safetyFactor) || 0,
              safetyStock: Number(row.safetyStock) || 0,
              leadTimeDays: Number(row.leadTimeDays) || 0,
              avgDailyConsumption: Number(row.avgDailyConsumption) || 0,
              avgMonthlyConsumption: Number(row.avgMonthlyConsumption) || 0,
              standardRate: Number(row.standardRate) || 0,
              lastPurchaseRate: Number(row.lastPurchaseRate) || 0,
              averageRate: Number(row.averageRate) || 0,
              criticalItem: String(row.criticalItem).toLowerCase() === 'true',
              consumable: String(row.consumable).toLowerCase() === 'true',
              active: row.active !== undefined ? String(row.active).toLowerCase() !== 'false' : true,
              currentQty: Number(row.currentQty) || 0,
              reservedQty: Number(row.reservedQty) || 0,
              availableQty: Number(row.availableQty) || 0,
              stockValue: Number(row.stockValue) || 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })) as T[];
            onSuccess(mapped);
          }
        } catch (e: any) {
          setError(e.message || 'Error mapping CSV data');
        } finally {
          setIsParsing(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setIsParsing(false);
      }
    });
  };

  return { parseCsv, isParsing, error };
}
