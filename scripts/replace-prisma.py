#!/usr/bin/env python3
"""Replace `new PrismaClient()` pattern with `db` singleton across all route files."""
import os
import re
from pathlib import Path

ROOT = Path('/home/z/my-project/src/app')
SKIP_FILES = []  # add specific files to skip if needed

# Pattern: import { PrismaClient } from '@prisma/client'  ...  const prisma = new PrismaClient()
# We want to replace with:
# import { db } from '@/lib/db'
# const prisma = db

IMPORT_PATTERN = re.compile(r"import\s+\{\s*PrismaClient\s*\}\s+from\s+'@prisma/client'\s*\n")
NEW_INSTANCE_PATTERN = re.compile(r"const\s+prisma\s*=\s*new\s+PrismaClient\s*\(\s*\)\s*\n")

count = 0
for path in ROOT.rglob('*.ts'):
    if path.name in SKIP_FILES:
        continue
    if 'node_modules' in str(path):
        continue
    
    text = path.read_text(encoding='utf-8')
    original = text
    
    # Check if file has both patterns
    has_import = bool(IMPORT_PATTERN.search(text))
    has_instance = bool(NEW_INSTANCE_PATTERN.search(text))
    
    if has_import and has_instance:
        # Replace import
        text = IMPORT_PATTERN.sub("import { db } from '@/lib/db'\n", text)
        # Replace instance
        text = NEW_INSTANCE_PATTERN.sub("const prisma = db\n", text)
        
        if text != original:
            path.write_text(text, encoding='utf-8')
            count += 1
            print(f"  ✓ {path.relative_to(ROOT)}")

print(f"\nTotal: {count} files updated")
