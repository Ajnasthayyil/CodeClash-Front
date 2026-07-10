const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const dir = 'c:/Users/user/source/repos/CodeClash - Front/src/app';
walkDir(dir, (filePath) => {
  if (filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/import\s*\{\s*ApiResponse\s*\}\s*from\s*'[^']+';\n?/g, '');
    
    content = content.replace(/Observable<ApiResponse<(.+?)>>/g, 'Observable<$1>');
    content = content.replace(/ApiResponse<(.+?)>/g, '$1');
    
    content = content.replace(/res\s*&&\s*res\.success\s*&&\s*res\.data/g, 'res');
    content = content.replace(/res\s*&&\s*res\.success/g, 'res');
    content = content.replace(/res\.success\s*&&\s*res\.data/g, 'res');
    
    content = content.replace(/if\s*\(\s*res\.success\s*\)/g, 'if (res)');
    content = content.replace(/if\s*\(\s*!res\.success\s*\)/g, 'if (!res)');

    content = content.replace(/res\.data/g, 'res');
    
    content = content.replace(/res\.message/g, '(res as any)?.message');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
