const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /if \(authChecking\) \{\s*\}/,
  ""
);

fs.writeFileSync('src/App.tsx', content);
