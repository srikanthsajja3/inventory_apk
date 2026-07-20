const fs = require('fs');
const path = 'C:/Users/srika/development/inventory-manager/src/screens/DigitalSignScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace import statement to use the main database client path
content = content.replace(/import { supabase } from '\.\.\/\.\.\/supabase';/g, "import { supabase } from '../../supabase';");

// Define supabaseClient as any right under imports to bypass strict typing
const importMatch = "import { Theme } from '../theme';";
const replacement = "import { Theme } from '../theme';\n\nconst supabaseClient = supabase as any;";
content = content.replace(importMatch, replacement);

// Replace supabase references with supabaseClient
content = content.replace(/\bsubabase\.(from|storage)\b/g, 'supabaseClient.$1');

fs.writeFileSync(path, content, 'utf8');
console.log('supabaseClient replacement completed successfully.');
