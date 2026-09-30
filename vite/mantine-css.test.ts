import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..');
const mantine = join(root, 'node_modules', '@mantine', 'core');
const components = join(mantine, 'esm', 'components');

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) ? [path] : [];
  });

const usedComponents = () => {
  const names = new Set<string>();
  for (const file of sourceFiles(join(root, 'src'))) {
    const source = readFileSync(file, 'utf8');
    for (const [, specifiers = ''] of source.matchAll(
      /import\s*\{([^}]*)\}\s*from\s*'@mantine\/core'/g,
    )) {
      for (const specifier of specifiers.split(',')) {
        const name = specifier.trim();
        if (/^[A-Z]/.test(name) && existsSync(join(components, name))) names.add(name);
      }
    }
  }
  return names;
};

const requiredStylesheets = () => {
  const visited = new Set<string>();
  const stylesheets = new Set<string>();
  const visit = (file: string) => {
    if (visited.has(file) || !existsSync(file)) return;
    visited.add(file);
    for (const [, specifier = ''] of readFileSync(file, 'utf8').matchAll(/from\s+"(\.[^"]+)"/g)) {
      const target = resolve(dirname(file), specifier);
      const component = relative(components, target).split(sep)[0] ?? '';
      if (
        target.endsWith('.module.mjs') &&
        existsSync(join(mantine, 'styles', `${component}.css`))
      ) {
        stylesheets.add(component);
      }
      visit(target);
    }
  };
  for (const name of usedComponents()) visit(join(components, name, `${name}.mjs`));
  return stylesheets;
};

const importedStylesheets = () =>
  new Set(
    [
      ...readFileSync(join(root, 'src', 'styles', 'mantine.css'), 'utf8').matchAll(
        /@mantine\/core\/styles\/(\w+)\.css/g,
      ),
    ].map(([, name]) => name),
  );

describe('src/styles/mantine.css', () => {
  it('imports the stylesheet of every Mantine component in use and its dependencies', () => {
    const imported = importedStylesheets();
    const missing = [...requiredStylesheets()].filter((name) => !imported.has(name));
    expect(missing).toEqual([]);
  });
});
