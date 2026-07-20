const fs = require('fs');
let content = fs.readFileSync('C:/Users/srika/development/inventory-manager/src/screens/DigitalSignScreen.tsx', 'utf8');
const regex = /\bsubabase\s*\.\s*(from|storage)\b/g;
content = content.replace(regex, 'supabaseClient.$1');
fs.writeFileSync('C:/Users/srika/development/inventory-manager/src/screens/DigitalSignScreen.tsx', content, 'utf8');
console.log('Replaced content successfully!');
