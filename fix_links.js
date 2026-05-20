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

// Pages that should definitely link to /dashboard
const dashboardPages = [
  'buyer/page.tsx',
  'dashboard/manage/[softwareId]/page.tsx',
  'dashboard/page.tsx',
  'marketplace/page.tsx',
  'dashboard/profile/page.tsx',
  'dashboard/upload/page.tsx',
  'run/page.tsx'
];

files.forEach(file => {
  const normalizedFile = file.replace(/\\/g, '/');
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (dashboardPages.some(dp => normalizedFile.endsWith(dp))) {
    if (content.includes('<AppHeaderBrand href="/" />')) {
      content = content.replace(/<AppHeaderBrand href="\/" \/>/g, '<AppHeaderBrand href="/dashboard" />');
      changed = true;
    }
  }

  // Upload page back button
  if (normalizedFile.endsWith('dashboard/upload/page.tsx')) {
    if (!content.includes('absolute right-10 top-10')) {
      const headerPattern = /<div className="absolute left-10 top-10 z-20 flex flex-row items-center gap-3">\s*<AppHeaderBrand[^>]*\/>\s*<\/div>/g;
      const backBtnMarkup = `\n      <div className="absolute right-10 top-10 z-20">\n        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">\n          <Link href="/dashboard">\n            <ArrowLeft className="h-6 w-6" />\n          </Link>\n        </Button>\n      </div>`;
      
      content = content.replace(headerPattern, (match) => {
        return match + backBtnMarkup;
      });
      changed = true;
      
      if (!content.includes('import { ArrowLeft')) {
        if (content.includes('lucide-react')) {
            content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]lucide-react['"]/, (match, p1) => {
                if (!p1.includes('ArrowLeft')) {
                    return `import { ${p1.trim()}, ArrowLeft } from "lucide-react"`;
                }
                return match;
            });
        } else {
             content = content.replace('import ', 'import { ArrowLeft } from "lucide-react";\nimport ');
        }
      }
      
      if (!content.includes('import { Button }')) {
          content = content.replace('import ', 'import { Button } from "@/components/ui/button";\nimport ');
      }
      
      if (!content.includes('import Link from "next/link"')) {
          content = content.replace('import ', 'import Link from "next/link";\nimport ');
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
});
