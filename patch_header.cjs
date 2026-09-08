const fs = require('fs');
let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

const alertsLogic = `
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Dynamically compute real-time alerts for critical items falling below reorder level
  const realTimeItemAlerts = state.items
    .filter(item => item.availableQty <= item.reorderLevel)
    .map(item => ({
      id: \`rt-alert-\${item.id}\`,
      severity: item.availableQty <= 0 ? 'CRITICAL' : 'WARNING' as any,
      title: item.availableQty <= 0 ? 'Out of Stock' : 'Low Stock Warning',
      message: \`\${item.itemCode} - \${item.itemName} has fallen to \${item.availableQty} \${item.unitName} (Reorder level: \${item.reorderLevel})\`,
      timestamp: 'Real-time',
      read: false,
    }));

  const allAlerts = [...realTimeItemAlerts, ...state.alerts];
  const unreadAlerts = allAlerts.filter(a => !a.read);
`;

content = content.replace(
  "  const [showNotifications, setShowNotifications] = useState(false);\n  const [showShortcuts, setShowShortcuts] = useState(false);\n\n  const unreadAlerts = state.alerts.filter(a => !a.read);",
  alertsLogic
);

content = content.replace(
  "                {state.alerts.length === 0 ? (",
  "                {allAlerts.length === 0 ? ("
);

content = content.replace(
  "                  state.alerts.slice(0, 6).map(alert => (",
  "                  allAlerts.slice(0, 8).map(alert => ("
);

fs.writeFileSync('src/components/Header.tsx', content);
