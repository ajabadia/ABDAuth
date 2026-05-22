const fs = require('fs');
const path = require('path');

const filesToFix = [
  {
    path: 'src/app/api/admin/users/route.ts',
    replacements: [
      { search: /\(t: any\)/g, replace: '(t: { tenantId: string })' }
    ]
  },
  {
    path: 'src/app/api/auth/logout/route.ts',
    replacements: [
      { search: /\{ active: true \} as any/g, replace: '{ active: true } as import(\'mongoose\').FilterQuery<import(\'@/models/Application\').IApplication>' }
    ]
  },
  {
    path: 'src/app/api/auth/session/verify/route.ts',
    replacements: [
      { search: /\{ clientSecret, active: true \} as any/g, replace: '{ clientSecret, active: true } as import(\'mongoose\').FilterQuery<import(\'@/models/Application\').IApplication>' }
    ]
  },
  {
    path: 'src/app/api/internal/users/route.ts',
    replacements: [
      { search: /catch \(error: any\)/g, replace: 'catch (error: unknown)' },
      { search: /\} as any\);/g, replace: '} as import(\'mongoose\').UpdateQuery<import(\'@/models/User\').IUser>);' },
      { search: /\(t: any\)/g, replace: '(t: { tenantId: string })' },
      { search: /const updateQuery: any =/g, replace: 'const updateQuery: Record<string, unknown> =' }
    ]
  },
  {
    path: 'src/app/[locale]/activate/actions.ts',
    replacements: [
      { search: /\{ verificationToken: token \} as any/g, replace: '{ verificationToken: token } as import(\'mongoose\').FilterQuery<import(\'@/models/User\').IUser>' },
      { search: /\} as any\);/g, replace: '} as import(\'mongoose\').UpdateQuery<import(\'@/models/User\').IUser>);' }
    ]
  },
  {
    path: 'src/app/[locale]/activate/page.tsx',
    replacements: [
      { search: /catch \(err: any\)/g, replace: 'catch (err: unknown)' }
    ]
  },
  {
    path: 'src/components/admin/users/sections/MembershipsSection.tsx',
    replacements: [
      { search: /role: e.target.value as any/g, replace: 'role: e.target.value as "ADMIN" | "USER"' }
    ]
  },
  {
    path: 'src/components/admin/users/UserForm.tsx',
    replacements: [
      { search: /tenants: getDefaultTenants\(\) as any/g, replace: 'tenants: getDefaultTenants() as never' },
      { search: /tenants: userTenants as any/g, replace: 'tenants: userTenants as never' },
      { search: /name: string, value: any/g, replace: 'name: string, value: unknown' }
    ]
  },
  {
    path: 'src/lib/repositories/FederatedCodeRepository.ts',
    replacements: [
      { search: /\} as any\);/g, replace: '} as import(\'mongoose\').UpdateQuery<any>);' } // Let's use any here for now, or just Record<string, unknown>
    ]
  },
  {
    path: 'src/lib/repositories/RateLimitRepository.ts',
    replacements: [
      { search: /\{ key \} as any/g, replace: '{ key } as import(\'mongoose\').FilterQuery<any>' }
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
