const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { PluginArchitectureView } from './views/PluginArchitectureView';",
  "import { PluginArchitectureView } from './views/PluginArchitectureView';\nimport { SystemSettingsView } from './views/SystemSettingsView';"
);

content = content.replace(
  "        return <PluginArchitectureView state={state} setState={setState} />;",
  "        return <PluginArchitectureView state={state} setState={setState} />;\n      case 'system_settings':\n        return <SystemSettingsView state={state} setState={setState} />;"
);

fs.writeFileSync('src/App.tsx', content);
