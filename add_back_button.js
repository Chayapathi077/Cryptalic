const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/app/signup/page.tsx',
  'src/app/signup/details/page.tsx',
  'src/app/forgot-password/page.tsx',
  'src/app/recover-account/page.tsx',
  'src/app/reset-password/page.tsx',
  'src/app/security-phrase/page.tsx',
  'src/app/verify-phrase/page.tsx',
  'src/app/verify-recovery-otp/page.tsx'
];

targetFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const headerPattern = /<div className="absolute left-10 top-10 z-20 flex flex-row items-center gap-3">\s*<AppHeaderBrand href="\/" \/>\s*<\/div>/g;
  
  if (headerPattern.test(content) && !content.includes('absolute right-10 top-10')) {
    const backBtnMarkup = `\n      <div className="absolute right-10 top-10 z-20">\n        <Button asChild variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">\n          <Link href="/">\n            <ArrowLeft className="h-6 w-6" />\n          </Link>\n        </Button>\n      </div>`;
    
    content = content.replace(headerPattern, (match) => {
      return match + backBtnMarkup;
    });
    
    // Add imports if missing
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
    
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Added back button to ' + file);
  }
});
