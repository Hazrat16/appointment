import path from 'node:path';

// eslint's `parserOptions.project` in each package's .eslintrc is resolved
// relative to eslint's own cwd, so files must be passed relative to their
// package directory (not the git-root-relative paths lint-staged gives us),
// and eslint must be invoked with that package directory as cwd.
function forPackage(pkgDir) {
  return (filenames) => {
    const relative = filenames.map((f) => path.relative(pkgDir, f));
    const inner = `cd ${pkgDir} && npx eslint --fix ${relative.join(' ')}`;
    // lint-staged tokenizes the returned string itself (no shell), so the
    // chained `cd && ...` must be wrapped as a single argument to `sh -c`.
    return `sh -c ${JSON.stringify(inner)}`;
  };
}

export default {
  'backend/src/**/*.ts': forPackage('backend'),
  'frontend/src/**/*.{ts,tsx}': forPackage('frontend'),
};
