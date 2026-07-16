const fs = require('fs');
const path = require('path');

const dashboardFile = path.join(__dirname, 'src/app/dashboard/page.tsx');
const code = fs.readFileSync(dashboardFile, 'utf8');

// Find where the main return statement starts
const returnIndex = code.indexOf('return (');
if (returnIndex === -1) {
  console.log("Could not find 'return ('");
  process.exit(1);
}

const beforeReturn = code.slice(0, returnIndex);
const returnStatementAndAfter = code.slice(returnIndex);

// Save to scratch for analysis
fs.mkdirSync(path.join(__dirname, 'scratch'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'scratch/beforeReturn.txt'), beforeReturn);
fs.writeFileSync(path.join(__dirname, 'scratch/returnStatement.txt'), returnStatementAndAfter);

console.log("Files written to scratch for analysis.");
