const fs = require('fs');
const path = require('path');

function fixTextColors(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixTextColors(fullPath);
    } else if (entry.name === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      // Fix text colors for white bg readability
      // Be careful NOT to change button text-white or bg-based text-white (inside colored buttons)
      // Only change text-white that is used for headings, labels, body text
      
      // Replace heading text-white with dark
      content = content.replace(/text-white(?=["'\s>}])/g, 'text-slate-900');
      
      // Fix dark-theme specific backgrounds used inside cards/containers
      content = content.replace(/bg-white\/\[0\.02\]/g, 'bg-white');
      content = content.replace(/bg-white\/\[0\.03\]/g, 'bg-white');
      content = content.replace(/bg-white\/\[0\.04\]/g, 'bg-slate-50');
      content = content.replace(/bg-white\/\[0\.05\]/g, 'bg-slate-50');
      content = content.replace(/bg-\[#0c0c0e\]/g, 'bg-white');
      content = content.replace(/bg-\[#09090b\]/g, 'bg-white');
      content = content.replace(/bg-\[#1a1a1d\]/g, 'bg-slate-50');
      content = content.replace(/bg-\[#111113\]/g, 'bg-slate-50');
      content = content.replace(/bg-\[#18181b\]/g, 'bg-slate-50');
      
      // Fix border colors from dark theme
      content = content.replace(/border-white\/5/g, 'border-slate-200');
      content = content.replace(/border-white\/10/g, 'border-slate-200');
      content = content.replace(/border-white\/20/g, 'border-slate-300');
      
      // Fix text colors
      content = content.replace(/text-slate-300(?=["'\s>}])/g, 'text-slate-600');
      content = content.replace(/text-slate-200(?=["'\s>}])/g, 'text-slate-700');
      content = content.replace(/text-slate-100(?=["'\s>}])/g, 'text-slate-800');
      
      // Fix placeholder/secondary text
      content = content.replace(/placeholder-slate-600/g, 'placeholder-slate-400');
      
      // Fix hover states for dark theme
      content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-100');
      content = content.replace(/hover:bg-white\/10/g, 'hover:bg-slate-100');
      content = content.replace(/hover:text-slate-900/g, 'hover:text-slate-700');
      
      // Fix divide colors
      content = content.replace(/divide-white\/5/g, 'divide-slate-200');
      content = content.replace(/divide-white\/10/g, 'divide-slate-200');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed text colors: ${path.relative(process.cwd(), fullPath)}`);
      } else {
        console.log(`No changes needed: ${path.relative(process.cwd(), fullPath)}`);
      }
    }
  }
}

fixTextColors(path.join(__dirname, 'src/app/dashboard'));
