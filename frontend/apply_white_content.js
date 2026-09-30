const fs = require('fs');
const path = require('path');

// Update the main layout wrapper: keep sidebar black, make content area white
function updateLayout() {
  const layoutPath = path.join(__dirname, 'src/app/dashboard/layout.tsx');
  let content = fs.readFileSync(layoutPath, 'utf8');
  
  // Change the outer wrapper from dark to neutral (sidebar stays black via its own classes)
  content = content.replace(
    'h-screen bg-[#09090b] text-[#faf9f6] flex overflow-hidden',
    'h-screen bg-[#f8f7f4] text-[#09090b] flex overflow-hidden'
  );
  
  // Change the content area wrapper to white background
  content = content.replace(
    '<div className="flex-1 overflow-y-auto">',
    '<div className="flex-1 overflow-y-auto bg-[#f8f7f4]">'
  );
  
  fs.writeFileSync(layoutPath, content, 'utf8');
  console.log('Updated layout.tsx');
}

// Update all dashboard page backgrounds to white
function updatePages(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      updatePages(fullPath);
    } else if (entry.name === 'page.tsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Replace dark backgrounds with white/light background
      const darkPatterns = [
        /bg-\[#09090b\]\s*text-white/g,
        /bg-\[#0c0c0e\]\s*text-white/g,
        /bg-\[#0c0c0e\]\/\[0\.02\]\/50\s*text-black/g,
        /bg-\[#0c0c0e\]\/\[0\.02\]/g,
      ];
      
      for (const pattern of darkPatterns) {
        if (pattern.test(content)) {
          changed = true;
          content = content.replace(pattern, 'bg-[#f8f7f4] text-slate-900');
        }
      }
      
      // Also fix text colors that reference white in content areas
      // Replace text-white used for headings/labels with dark equivalents
      // But only in the main container div, not everywhere
      
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${path.relative(__dirname, fullPath)}`);
      } else {
        console.log(`Skipped (no dark bg): ${path.relative(__dirname, fullPath)}`);
      }
    }
  }
}

updateLayout();
updatePages(path.join(__dirname, 'src/app/dashboard'));
