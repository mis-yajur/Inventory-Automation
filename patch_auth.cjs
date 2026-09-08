const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the auth block
content = content.replace(
  /if \(authChecking\) \{[\s\S]*?if \(!user\) \{[\s\S]*?\}\s*\)/,
  "// Login bypassed"
);

// We need to bypass the onAuthStateChanged
content = content.replace(
  /const unsubscribe = onAuthStateChanged[\s\S]*?\}, \[\]\);/,
  `useEffect(() => {
    // Fake user to bypass login
    setUser({ uid: 'admin', email: 'admin@yajurfibres.com' });
    setAuthChecking(false);
  }, []);`
);

fs.writeFileSync('src/App.tsx', content);
