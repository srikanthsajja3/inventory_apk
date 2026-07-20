const fs = require('fs');
const path = 'C:/Users/srika/development/inventory-manager/src/screens/DigitalSignScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace supabaseSign with supabase
content = content.replace(/supabaseSign/g, 'supabase');

// Update import statement to use the main database client path
content = content.replace(/import { supabase } from '\.\.\/utils\/supabase';/g, "import { supabase } from '../../supabase';");
content = content.replace(/'\.\.\/utils\/supabaseSign'/g, "'../../supabase'");

fs.writeFileSync(path, content, 'utf8');
console.log('Replacement completed successfully.');
