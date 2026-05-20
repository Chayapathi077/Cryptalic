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

  // Pattern for the old zap logo block in headers
  const logoBlockPattern = /<div className="flex items-center gap-2">\s*<div\s*className={cn\(\s*"relative flex items-center justify-center h-10 w-10"\s*\)}\s*>\s*<div\s*className={cn\(\s*"relative flex items-center justify-center bg-white\/10 backdrop-blur-md border border-white\/20 shadow-lg transition-all duration-1000 ease-in-out rounded-lg",\s*"h-10 w-10 p-2"\s*\)}\s*>\s*<div className="flex items-center justify-center w-full h-full">\s*<Zap[^>]*>\s*<\/Zap>|<Zap[^>]*\/>\s*(<Zap[^>]*>\s*<\/Zap>|<Zap[^>]*\/>)\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g;
  
  // Actually, a simpler regex is just matching <div className="flex items-center gap-2"> down to the first four closing divs that contain two <Zap /> elements
  // Let's use a simpler pattern based on the exact string
  
  const searchStr = `<div className="flex items-center gap-2">
              <div
                  className={cn(
                  "relative flex items-center justify-center h-10 w-10"
                  )}
              >
                  <div
                  className={cn(
                      "relative flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-1000 ease-in-out rounded-lg",
                      "h-10 w-10 p-2" 
                  )}
                  >
                  <div className="flex items-center justify-center w-full h-full">
                      <Zap
                      className={cn(
                          "text-white transition-all duration-1000 ease-in-out absolute",
                          "h-5 w-5 -translate-x-1" 
                      )}
                      />
                      <Zap
                      className={cn(
                          "text-white transition-all duration-1000 ease-in-out absolute",
                          "h-5 w-5 translate-x-1" 
                      )}
                      />
                  </div>
                  </div>
              </div>
          </div>`;

  // Standardize spaces to allow matching
  const standardize = (s) => s.replace(/\s+/g, ' ');
  
  if (standardize(content).includes(standardize(searchStr))) {
    // We'll just replace it using regex on standardized string is risky.
    // Let's use a generic regex for this specific block:
    const regex = /<div className="flex items-center gap-2">[\s\S]*?h-5 w-5 translate-x-1[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
    
    content = content.replace(regex, '<AppHeaderBrand href="/" />');
    changed = true;
    
    if (!content.includes('import { AppHeaderBrand }')) {
      // add import at top
      content = content.replace('import ', 'import { AppHeaderBrand } from "@/components/brand/AppHeaderBrand";\nimport ');
    }
  }
  
  // Handle other variations if any
  const searchStr2 = `<div className="flex items-center gap-2">
                <div
                    className={cn(
                    "relative flex items-center justify-center h-10 w-10"
                    )}
                >
                    <div
                    className={cn(
                        "relative flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-1000 ease-in-out rounded-lg",
                        "h-10 w-10 p-2" 
                    )}
                    >
                    <div className="flex items-center justify-center w-full h-full">
                        <Zap
                        className={cn(
                            "text-white transition-all duration-1000 ease-in-out absolute",
                            "h-5 w-5 -translate-x-1" 
                        )}
                        />
                        <Zap
                        className={cn(
                            "text-white transition-all duration-1000 ease-in-out absolute",
                            "h-5 w-5 translate-x-1" 
                        )}
                        />
                    </div>
                    </div>
                </div>
            </div>`;
            
    if (standardize(content).includes(standardize(searchStr2)) && !changed) {
        const regex = /<div className="flex items-center gap-2">[\s\S]*?h-5 w-5 translate-x-1[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
        content = content.replace(regex, '<AppHeaderBrand href="/" />');
        changed = true;
        if (!content.includes('import { AppHeaderBrand }')) {
          content = content.replace('import ', 'import { AppHeaderBrand } from "@/components/brand/AppHeaderBrand";\nimport ');
        }
    }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Replaced logo in ' + file);
  }
});
