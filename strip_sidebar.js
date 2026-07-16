const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/app/dashboard/page.tsx');
let code = fs.readFileSync(file, 'utf8');

// The original file returns a big div containing an aside and a main content area.
// We just need to remove the <aside> tag completely.

// Find the start of the aside
const asideStart = code.indexOf('<aside className="w-64 bg-[#0c0c0e]');
if (asideStart !== -1) {
    let braceCount = 1; // Assuming aside is one tag
    let endIndex = -1;
    // We can just find the closing </aside> tag.
    const asideEnd = code.indexOf('</aside>', asideStart) + '</aside>'.length;
    
    if (asideEnd !== -1) {
        // Also remove the wrapper div that has min-h-screen because layout.tsx has it now
        // But let's just replace the <aside> with empty string for now to avoid breaking the flex layout of page.tsx
        // Wait, if we keep the flex layout, it will just take full width.
        const newCode = code.slice(0, asideStart) + code.slice(asideEnd);
        fs.writeFileSync(file, newCode);
        console.log("Successfully removed sidebar from page.tsx");
    }
}
