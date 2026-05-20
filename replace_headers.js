const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if(file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // We are looking for files that have the absolute header
  const headerRegex = /<header className="absolute top-0 left-0 right-0[\s\S]*?<\/header>/g;
  
  if (headerRegex.test(content)) {
    content = content.replace(headerRegex, `<div className="absolute left-10 top-10 z-20 flex flex-row items-center gap-3">\n        <AppHeaderBrand href="/" />\n      </div>`);
    changed = true;
    
    // add import if not there
    if (!content.includes('AppHeaderBrand')) {
      content = content.replace('import', 'import { AppHeaderBrand } from "@/components/brand/AppHeaderBrand";\nimport');
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
