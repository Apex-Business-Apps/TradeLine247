#!/usr/bin/env node
// Ensures the ios-marketing (1024x1024) icon is present and referenced.
// Idempotent: safe to run multiple times. Fails fast with clear errors.

import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const DEFAULT_SRC = path.join(
  ROOT,
  'public',
  'assets',
  'brand',
  'App_Icons',
  'ios',
  'AppStore1024.png'
);

const IGNORED_DIRS = new Set(['.git', 'node_modules', 'build', 'dist', 'android']);

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function findFiles(startDir, predicate) {
  const results = [];
  const stack = [startDir];

  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (err) {
      // Skip unreadable directories
      continue;
    }

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const fullPath = path.join(current, entry.name);
      const matches = await predicate(fullPath, entry);
      if (matches) {
        results.push(fullPath);
      }
      if (entry.isDirectory()) {
        stack.push(fullPath);
      }
    }
  }

  return results;
}

async function findPbxproj() {
  const pbxprojPaths = await findFiles(ROOT, async (fullPath, entry) => {
    return entry.isFile && entry.isFile() === true && fullPath.endsWith('project.pbxproj');
  });

  const iosPbxproj = pbxprojPaths.find((p) => p.includes(`${path.sep}ios${path.sep}`));
  if (!iosPbxproj) {
    throw new Error('No ios/**/project.pbxproj found; cannot determine app icon set.');
  }
  return iosPbxproj;
}

function extractIconNames(pbxprojText) {
  const regex = /ASSETCATALOG_COMPILER_APPICON_NAME\s*=\s*([^;]+);/g;
  const names = new Set();
  let match;
  while ((match = regex.exec(pbxprojText)) !== null) {
    names.add(match[1].trim());
  }
  if (!names.size) {
    throw new Error('No ASSETCATALOG_COMPILER_APPICON_NAME entries found in project.pbxproj.');
  }
  return Array.from(names);
}

async function findAppIconSets(iconName) {
  const matcher = `${iconName}.appiconset`;
  const dirs = await findFiles(ROOT, async (fullPath, entry) => {
    return entry.isDirectory && entry.isDirectory() === true && fullPath.endsWith(matcher);
  });
  return dirs;
}

async function selectSourceIcon() {
  const override = process.env.IOS_MARKETING_ICON_SRC;
  if (override) {
    const resolved = path.isAbsolute(override) ? override : path.join(ROOT, override);
    if (!(await pathExists(resolved))) {
      throw new Error(
        `IOS_MARKETING_ICON_SRC is set but file does not exist: ${resolved}`
      );
    }
    return resolved;
  }

  if (await pathExists(DEFAULT_SRC)) {
    return DEFAULT_SRC;
  }

  const candidates = await findFiles(ROOT, async (fullPath, entry) => {
    return (
      entry.isFile &&
      entry.isFile() === true &&
      fullPath.toLowerCase().endsWith('.png') &&
      /1024/.test(path.basename(fullPath))
    );
  });

  const prioritized = candidates
    .filter((p) => /appstore|ios/i.test(path.basename(p)))
    .concat(candidates.filter((p) => !/appstore|ios/i.test(path.basename(p))));

  if (!prioritized.length) {
    throw new Error(
      'No 1024x1024 PNG found. Set IOS_MARKETING_ICON_SRC to the correct file.'
    );
  }

  const unique = Array.from(new Set(prioritized));
  if (unique.length > 1 && !process.env.CI) {
    console.warn(
      `Multiple 1024px candidates found. Using: ${unique[0]}\nCandidates:\n${unique.join(
        '\n'
      )}\nSet IOS_MARKETING_ICON_SRC to override.`
    );
  }

  return unique[0];
}

async function ensureIconsetHasMarketingIcon(iconsetDir, sourceIcon) {
  const targetIcon = path.join(iconsetDir, 'icon-1024.png');
  await fs.copyFile(sourceIcon, targetIcon);

  const contentsPath = path.join(iconsetDir, 'Contents.json');
  if (!(await pathExists(contentsPath))) {
    throw new Error(`Missing Contents.json in iconset: ${iconsetDir}`);
  }

  const raw = await fs.readFile(contentsPath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error(`Contents.json is not valid JSON: ${contentsPath}`);
  }

  if (!Array.isArray(json.images)) {
    json.images = [];
  }

  const desired = {
    idiom: 'ios-marketing',
    size: '1024x1024',
    scale: '1x',
    filename: 'icon-1024.png'
  };

  const existing = json.images.find(
    (img) =>
      img &&
      img.idiom === 'ios-marketing' &&
      img.size === '1024x1024' &&
      img.scale === '1x'
  );

  if (existing) {
    existing.filename = desired.filename;
  } else {
    json.images.push(desired);
  }

  await fs.writeFile(contentsPath, JSON.stringify(json, null, 2) + '\n');

  console.log(
    `✔ Patched ios-marketing icon in ${iconsetDir} (source: ${path.relative(
      ROOT,
      sourceIcon
    )})`
  );
}

async function main() {
  const sourceIcon = await selectSourceIcon();
  const pbxprojPath = await findPbxproj();
  const pbxprojText = await fs.readFile(pbxprojPath, 'utf8');
  const iconNames = extractIconNames(pbxprojText);

  const iconsetDirs = [];
  for (const name of iconNames) {
    const dirs = await findAppIconSets(name);
    if (!dirs.length) {
      throw new Error(
        `No appiconset directories found for icon name "${name}". Expected ios/**/Assets.xcassets/${name}.appiconset`
      );
    }
    iconsetDirs.push(...dirs);
  }

  for (const dir of iconsetDirs) {
    await ensureIconsetHasMarketingIcon(dir, sourceIcon);
  }

  console.log(
    `Completed ios-marketing icon enforcement for ${iconsetDirs.length} iconset(s).`
  );
}

main().catch((err) => {
  console.error(`❌ ensure-ios-marketing-icon failed: ${err.message}`);
  process.exit(1);
});

