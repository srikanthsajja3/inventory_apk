const fs = require('fs');
const path = 'C:/Users/srika/development/inventory-manager/src/screens/DigitalSignScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace supabase references with supabaseClient, allowing for whitespace and newlines
content = content.replace(/\bsubabase\s*\.\s*(from|storage)\b/g, 'supabaseClient.$1');

fs.writeFileSync(path, content, 'utf8');
console.log('supabaseClient v2 replacement completed successfully.');
