const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

content = content.replace(
  "{ id: 'plugin_architecture', label: 'Modular Plugins', icon: Settings, allowedRoles: ['Admin'] }",
  "{ id: 'plugin_architecture', label: 'Modular Plugins', icon: Settings, allowedRoles: ['Admin'] },\n        { id: 'system_settings', label: 'System Settings', icon: Settings, allowedRoles: ['Admin'] }"
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
