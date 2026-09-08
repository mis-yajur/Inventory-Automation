// CSV Templates and Sample Download Helper

export interface SampleTemplate {
  filename: string;
  headers: string[];
  sampleRows: string[][];
  description: string;
  dataTypes: { column: string; type: string; required: boolean; example: string; notes: string }[];
}

export const OPENING_STOCK_TEMPLATE: SampleTemplate = {
  filename: 'Opening_Stock_Sample_Template.csv',
  headers: ['Item Code', 'Item Name', 'Category', 'Opening Qty', 'Standard Rate', 'Unit', 'Store', 'Rack', 'Bin'],
  sampleRows: [
    ['BRG-6205-2RS', 'Deep Groove Ball Bearing 6205-2RS', 'Mechanical Spares', '45', '350.00', 'PCS', 'Main Store', 'Rack A', 'B01'],
    ['VBLT-B-54', 'Industrial V-Belt Section B-54', 'Mechanical Spares', '20', '420.00', 'NOS', 'Main Store', 'Rack B', 'B04'],
    ['MCB-3P-32A', 'Triple Pole 32A MCB C-Curve', 'Electrical & Electronics', '15', '850.00', 'PCS', 'Sub-Store Electrical', 'Rack E', 'B02'],
    ['OIL-VG-68', 'Industrial Hydraulic Oil ISO VG 68', 'Lubricants & Oils', '210', '185.00', 'LTR', 'Main Store', 'Rack D', 'B01'],
    ['PNEU-VLV-52', '5/2 Way Solenoid Valve 24V DC', 'Pneumatics & Hydraulics', '8', '1450.00', 'PCS', 'Main Store', 'Rack C', 'B03'],
    ['GLV-NIT-L', 'Heavy Duty Nitrile Safety Gloves', 'Consumables & PPE', '150', '65.00', 'PAIRS', 'Main Store', 'Rack F', 'B06']
  ],
  description: 'Use this template to establish baseline physical opening quantities and standard rates before live operations.',
  dataTypes: [
    { column: 'Item Code', type: 'Text (Alphanumeric)', required: true, example: 'BRG-6205-2RS', notes: 'Unique SKU / Part code' },
    { column: 'Item Name', type: 'Text', required: true, example: 'Ball Bearing 6205-2RS', notes: 'Full descriptive item name' },
    { column: 'Category', type: 'Text', required: false, example: 'Mechanical Spares', notes: 'Item category name' },
    { column: 'Opening Qty', type: 'Number (Decimal allowed for weight/length)', required: true, example: '45', notes: 'Physical verified quantity' },
    { column: 'Standard Rate', type: 'Number (Currency in INR ₹)', required: true, example: '350.00', notes: 'Valuation rate per unit' },
    { column: 'Unit', type: 'Text', required: false, example: 'PCS', notes: 'Unit of measurement (e.g. PCS, KGS, MTR)' },
    { column: 'Store', type: 'Text', required: false, example: 'Main Store', notes: 'Warehouse location' },
    { column: 'Rack', type: 'Text', required: false, example: 'Rack A', notes: 'Storage rack' },
    { column: 'Bin', type: 'Text', required: false, example: 'B01', notes: 'Storage bin' }
  ]
};

export const DEPARTMENTS_TEMPLATE: SampleTemplate = {
  filename: 'Departments_Sample_Template.csv',
  headers: ['Department Code', 'Department Name', 'Department Head', 'Cost Centre'],
  sampleRows: [
    ['DEP-01', 'Mechanical Maintenance', 'R. K. Sharma', 'CC-MECH'],
    ['DEP-02', 'Electrical & Automation', 'S. Roy', 'CC-ELEC'],
    ['DEP-03', 'Spinning Production', 'K. P. Patel', 'CC-SPIN'],
    ['DEP-04', 'Weaving Section', 'V. S. Verma', 'CC-WEAV'],
    ['DEP-05', 'Quality Assurance & Testing', 'Dr. A. Sen', 'CC-QUAL'],
    ['DEP-06', 'Civil & Utility Engineering', 'M. N. Das', 'CC-CIVIL']
  ],
  description: 'Use this template to upload factory departments and cost centres for material issue tracking.',
  dataTypes: [
    { column: 'Department Code', type: 'Text', required: false, example: 'DEP-01', notes: 'Unique code. Auto-generated if omitted.' },
    { column: 'Department Name', type: 'Text', required: true, example: 'Mechanical Maintenance', notes: 'Plant department name' },
    { column: 'Department Head', type: 'Text', required: false, example: 'R. K. Sharma', notes: 'Responsible manager / incharge' },
    { column: 'Cost Centre', type: 'Text', required: false, example: 'CC-MECH', notes: 'Accounting cost centre code' }
  ]
};

export const CATEGORIES_TEMPLATE: SampleTemplate = {
  filename: 'Categories_Sample_Template.csv',
  headers: ['Category Code', 'Category Name', 'Description'],
  sampleRows: [
    ['CAT-01', 'Mechanical Spares', 'Bearings, couplings, sprockets, pulleys and seals'],
    ['CAT-02', 'Electrical & Electronics', 'Contactors, relays, sensors, PLCs, VFDs and cables'],
    ['CAT-03', 'Pneumatics & Hydraulics', 'Cylinders, solenoid valves, pressure regulators, hoses'],
    ['CAT-04', 'Lubricants & Oils', 'Gear oils, hydraulic fluids, synthetic compressor oils'],
    ['CAT-05', 'Consumables & Hardware', 'Fasteners, grinding discs, welding electrodes and PPE'],
    ['CAT-06', 'Instrumentation & Controls', 'Temperature sensors, RTDs, flowmeters and pressure gauges']
  ],
  description: 'Classify inventory SKUs into functional categories for valuation and ABC analysis.',
  dataTypes: [
    { column: 'Category Code', type: 'Text', required: false, example: 'CAT-01', notes: 'Unique code. Auto-generated if omitted.' },
    { column: 'Category Name', type: 'Text', required: true, example: 'Mechanical Spares', notes: 'Category title' },
    { column: 'Description', type: 'Text', required: false, example: 'Bearings and seals', notes: 'Short description of items in group' }
  ]
};

export const UNITS_TEMPLATE: SampleTemplate = {
  filename: 'Units_Sample_Template.csv',
  headers: ['Unit Code', 'Unit Name', 'Decimal Allowed'],
  sampleRows: [
    ['PCS', 'Pieces', 'No'],
    ['NOS', 'Numbers', 'No'],
    ['KGS', 'Kilograms', 'Yes'],
    ['MTR', 'Meters', 'Yes'],
    ['LTR', 'Liters', 'Yes'],
    ['SET', 'Sets', 'No'],
    ['BOX', 'Boxes', 'No'],
    ['ROLL', 'Rolls', 'No'],
    ['DRUM', 'Drums', 'Yes'],
    ['PAIR', 'Pairs', 'No']
  ],
  description: 'Define units of measurement (UOM) for inventory counting, issues, and conversions.',
  dataTypes: [
    { column: 'Unit Code', type: 'Text (Uppercase)', required: true, example: 'KGS', notes: 'Standard unit abbreviation (e.g. PCS, KGS, LTR)' },
    { column: 'Unit Name', type: 'Text', required: true, example: 'Kilograms', notes: 'Full descriptive unit name' },
    { column: 'Decimal Allowed', type: 'Boolean (Yes/No)', required: false, example: 'Yes', notes: 'Yes for weight/volume; No for discrete counts' }
  ]
};

export const SUPPLIERS_TEMPLATE: SampleTemplate = {
  filename: 'Suppliers_Sample_Template.csv',
  headers: ['Supplier Code', 'Supplier Name', 'Contact Person', 'Phone', 'Email', 'Lead Time (Days)', 'Rating'],
  sampleRows: [
    ['SUP-01', 'Apex Industrial Supplies Ltd', 'Rajesh Kumar', '+91 9876543210', 'sales@apexindustrial.com', '7', '4.8'],
    ['SUP-02', 'Bharat Electricals Corporation', 'Amitabh Sen', '+91 9811223344', 'orders@bharatelec.com', '5', '4.9'],
    ['SUP-03', 'Standard Hardware & Tools', 'M. K. Joshi', '+91 9822334455', 'supply@standardhardware.in', '10', '4.5'],
    ['SUP-04', 'Pneumatics & Fluid Power India', 'Pooja Mehta', '+91 9833445566', 'info@pneumaticsindia.com', '14', '4.7'],
    ['SUP-05', 'Total Lubricants & Petrochemicals', 'Anil Sharma', '+91 9844556677', 'sales@totallubes.com', '4', '4.9']
  ],
  description: 'Maintain approved vendor directory for material sourcing and supplier performance.',
  dataTypes: [
    { column: 'Supplier Code', type: 'Text', required: false, example: 'SUP-01', notes: 'Unique code. Auto-generated if omitted.' },
    { column: 'Supplier Name', type: 'Text', required: true, example: 'Apex Industrial Supplies Ltd', notes: 'Vendor legal/trading name' },
    { column: 'Contact Person', type: 'Text', required: false, example: 'Rajesh Kumar', notes: 'Key account representative' },
    { column: 'Phone', type: 'Text', required: false, example: '+91 9876543210', notes: 'Phone or Mobile' },
    { column: 'Email', type: 'Email', required: false, example: 'sales@apex.com', notes: 'Official procurement email' },
    { column: 'Lead Time (Days)', type: 'Number', required: false, example: '7', notes: 'Average delivery lead time in days' },
    { column: 'Rating', type: 'Number (1.0 - 5.0)', required: false, example: '4.8', notes: 'Vendor audit rating' }
  ]
};

export const STORES_TEMPLATE: SampleTemplate = {
  filename: 'Stores_Sample_Template.csv',
  headers: ['Store Code', 'Store Name', 'Responsible Person', 'Location'],
  sampleRows: [
    ['STR-01', 'Main Plant Central Store', 'R. K. Gupta', 'Bay A-1 Ground Floor'],
    ['STR-02', 'Sub-Store Electrical', 'S. Roy', 'Building B 1st Floor'],
    ['STR-03', 'Lubricant & Chemical Shed', 'M. Das', 'Outside Hazard Shed 3'],
    ['STR-04', 'Finished Goods Yard', 'P. Verma', 'Warehouse Logistics Block']
  ],
  description: 'Define warehouse stores, sub-stores, and physical storage locations across the facility.',
  dataTypes: [
    { column: 'Store Code', type: 'Text', required: false, example: 'STR-01', notes: 'Unique store identifier' },
    { column: 'Store Name', type: 'Text', required: true, example: 'Main Plant Central Store', notes: 'Store name' },
    { column: 'Responsible Person', type: 'Text', required: false, example: 'R. K. Gupta', notes: 'Storekeeper or manager in charge' },
    { column: 'Location', type: 'Text', required: false, example: 'Bay A-1 Ground Floor', notes: 'Physical location or building' }
  ]
};

export const downloadCsvTemplate = (template: SampleTemplate) => {
  const csvContent = [
    template.headers.join(','),
    ...template.sampleRows.map(row => 
      row.map(val => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', template.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
