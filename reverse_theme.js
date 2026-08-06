const fs = require('fs');
const path = require('path');

function reverseLayout() {
    const layoutPath = 'src/app/dashboard/layout.tsx';
    if (fs.existsSync(layoutPath)) {
        let content = fs.readFileSync(layoutPath, 'utf8');
        content = content.replace(/bg-white text-black/g, 'bg-[#09090b] text-[#faf9f6]');
        content = content.replace(/border-slate-200/g, 'border-white/5');
        fs.writeFileSync(layoutPath, content, 'utf8');
        console.log("Reversed layout.tsx");
    }
}

function reversePages(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            reversePages(fullPath);
        } else if (file === 'page.tsx' && dir !== 'src/app/dashboard') {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(/bg-white text-black/g, 'bg-[#09090b] text-white');
            content = content.replace(/text-slate-700/g, 'text-slate-300');
            content = content.replace(/text-slate-600/g, 'text-slate-400');
            content = content.replace(/bg-slate-50/g, 'bg-white/[0.02]');
            content = content.replace(/border-slate-200/g, 'border-white/10');
            content = content.replace(/text-slate-900/g, 'text-white');
            content = content.replace(/bg-white/g, 'bg-[#0c0c0e]');
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`Reversed ${fullPath}`);
        }
    }
}

reverseLayout();
reversePages('src/app/dashboard');
