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

  if (content.includes('<AppHeaderBrand') && !content.includes('import { AppHeaderBrand }')) {
    // Find the first import statement and put it before that
    content = content.replace('import ', 'import { AppHeaderBrand } from "@/components/brand/AppHeaderBrand";\nimport ');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed imports in ' + file);
  }
});
