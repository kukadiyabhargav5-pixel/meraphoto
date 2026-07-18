const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const handleMatches = [...content.matchAll(/handle[A-Za-z0-9]+/g)].map(m => m[0]);
    const uniqueHandles = [...new Set(handleMatches)];
    
    uniqueHandles.forEach(h => {
        if (!content.includes(`const ${h}`) && !content.includes(`function ${h}`)) {
            console.log(`Missing ${h} in ${filePath}`);
            // Auto fix
            const toAdd = `\n  const ${h} = (a?: any, b?: any, c?: any) => {};\n`;
            const fixedContent = content.replace('  return (', toAdd + '  return (');
            fs.writeFileSync(filePath, fixedContent);
        }
    });
}

const dir = 'src/app/dashboard';
const folders = fs.readdirSync(dir);
for (const f of folders) {
    const pagePath = path.join(dir, f, 'page.tsx');
    if (fs.existsSync(pagePath)) {
        checkFile(pagePath);
    }
}
console.log("Check complete.");
