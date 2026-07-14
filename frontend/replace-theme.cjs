const fs = require('fs');
const path = require('path');

const replacements = {
  '--brown-dark': '--primary-dark',
  '--brown': '--primary',
  '--brown-light': '--primary-light',
  '--brown-pale': '--primary-pale',
  '--mint-dark': '--secondary-dark',
  '--mint': '--secondary',
  '--mint-light': '--secondary-light',
  '--mint-pale': '--secondary-pale',
  '--cream-dark': '--accent-light',
  '--cream': '--bg-base'
};

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const [oldVar, newVar] of Object.entries(replacements)) {
        if (content.includes(oldVar)) {
          content = content.split(oldVar).join(newVar);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src', 'pages'));
processDirectory(path.join(__dirname, 'src', 'components'));
