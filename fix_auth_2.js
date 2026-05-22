const fs = require('fs');
const path = require('path');

const filesToFix = [
  {
    path: 'src/app/api/auth/logout/route.ts',
    replacements: [
      { search: /as import\('mongoose'\)\.FilterQuery<import\('@\/models\/Application'\)\.IApplication>/g, replace: 'as Record<string, unknown>' }
    ]
  },
  {
    path: 'src/app/api/auth/session/verify/route.ts',
    replacements: [
      { search: /as import\('mongoose'\)\.FilterQuery<import\('@\/models\/Application'\)\.IApplication>/g, replace: 'as Record<string, unknown>' }
    ]
  },
  {
    path: 'src/app/api/internal/users/route.ts',
    replacements: [
      { search: /as import\('mongoose'\)\.UpdateQuery<import\('@\/models\/User'\)\.IUser>/g, replace: 'as Record<string, unknown>' },
      { search: /error\.message/g, replace: '(error as Error).message' }
    ]
  },
  {
    path: 'src/app/[locale]/activate/actions.ts',
    replacements: [
      { search: /as import\('mongoose'\)\.FilterQuery<import\('@\/models\/User'\)\.IUser>/g, replace: 'as Record<string, unknown>' },
      { search: /as import\('mongoose'\)\.UpdateQuery<import\('@\/models\/User'\)\.IUser>/g, replace: 'as Record<string, unknown>' }
    ]
  },
  {
    path: 'src/components/admin/users/sections/MembershipsSection.tsx',
    replacements: [
      { search: /role: e\.target\.value as "ADMIN" \| "USER"/g, replace: 'role: e.target.value as "owner" | "admin" | "student"' }
    ]
  },
  {
    path: 'src/lib/repositories/FederatedCodeRepository.ts',
    replacements: [
      { search: /as import\('mongoose'\)\.UpdateQuery<any>/g, replace: 'as Record<string, unknown>' }
    ]
  },
  {
    path: 'src/lib/repositories/RateLimitRepository.ts',
    replacements: [
      { search: /as import\('mongoose'\)\.FilterQuery<any>/g, replace: 'as Record<string, unknown>' }
    ]
  }
];

filesToFix.forEach(fileDef => {
  const fullPath = path.join(__dirname, fileDef.path);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    fileDef.replacements.forEach(repl => {
      content = content.replace(repl.search, repl.replace);
    });
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed', fullPath);
  } else {
    console.log('File not found', fullPath);
  }
});
