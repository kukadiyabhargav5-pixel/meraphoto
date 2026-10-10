const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src/app');
let modifiedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match placeholder="something" or placeholder='something'
  const regex = /placeholder\s*=\s*(?:"[^"]*"|'[^']*')/g;
  if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(file, content, 'utf8');
    modifiedFiles++;
    console.log('Modified:', file);
  }
});

console.log('Total files modified:', modifiedFiles);
