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

const GLOBAL_STYLESHEETS = new Set(['baseline', 'default-css-variables', 'global']);

const importedStylesheets = () =>
  [
    ...readFileSync(join(root, 'src', 'styles', 'mantine.css'), 'utf8').matchAll(
      /@mantine\/core\/styles\/([\w-]+)\.css/g,
    ),
  ].map(([, name = '']) => name);

const bundlePosition = (bundle: string, name: string) => {
  const firstClass = readFileSync(join(mantine, 'styles', `${name}.css`), 'utf8').match(
    /\.m_[0-9a-f]+/,
  )?.[0];
  return firstClass === undefined ? -1 : bundle.indexOf(firstClass);
};

describe('src/styles/mantine.css', () => {
  it('imports exactly the stylesheets of the Mantine components in use and their dependencies', () => {
    const imported = new Set(importedStylesheets());
    const required = requiredStylesheets();
    const missing = [...required].filter((name) => !imported.has(name));
    const unused = [...imported].filter(
      (name) => !required.has(name) && !GLOBAL_STYLESHEETS.has(name),
    );
    expect({ missing, unused }).toEqual({ missing: [], unused: [] });
  });

  it('imports the global stylesheets first and components in Mantine bundle order', () => {
    const imported = importedStylesheets();
    const globals = imported.slice(0, GLOBAL_STYLESHEETS.size);
    const componentSheets = imported.slice(GLOBAL_STYLESHEETS.size);
    const bundle = readFileSync(join(mantine, 'styles.css'), 'utf8');
    const positions = componentSheets.map((name) => bundlePosition(bundle, name));

    expect(globals).toEqual([...GLOBAL_STYLESHEETS]);
    expect(positions).not.toContain(-1);
    expect(positions).toEqual(positions.toSorted((a, b) => a - b));
  });
});
