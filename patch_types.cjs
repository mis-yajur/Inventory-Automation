const fs = require('fs');
let content = fs.readFileSync('src/types/index.ts', 'utf8');
content = content.replace("| 'role_management'", "| 'role_management'\n  | 'system_settings'");
fs.writeFileSync('src/types/index.ts', content);
