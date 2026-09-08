const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /useEffect\(\(\) => \{\s*useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/,
  `useEffect(() => {
    setUser({ uid: 'admin', email: 'admin@yajurfibres.com', displayName: 'Admin User' } as User);
    setAuthChecking(false);
  }, []);`
);

fs.writeFileSync('src/App.tsx', content);
