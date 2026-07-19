#!/usr/bin/env node
/**
 * Aperture CLI — launches the Aperture desktop shell via Electron.
 *
 * Usage:
 *   aperture                  # launch with defaults
 *   aperture --help           # show help
 *
 * When installed globally (npm install -g aperture), this script is linked
 * as the `aperture` command. It spawns Electron pointing at the built main
 * process.
 */
const { spawn } = require('child_process');
const path = require('path');

// ── resolve Electron binary ──────────────────────────

let electron;
try {
  // require('electron') returns the path to the Electron binary
  electron = String(require('electron'));
} catch (_err) {
  console.error(
    'Aperture requires Electron to run.\n' +
    'Install it globally:\n' +
    '  npm install -g electron\n' +
    'Or add it to your project:\n' +
    '  npm install electron'
  );
  process.exit(1);
}

// ── resolve main entry ───────────────────────────────

const mainPath = path.join(__dirname, '..', 'out', 'main', 'index.js');

// ── forward CLI args (optional flags) ────────────────

const args = process.argv.slice(2);

// ── launch ───────────────────────────────────────────

// Use detached so closing the terminal doesn't kill Aperture
const child = spawn(electron, [mainPath, ...args], {
  stdio: 'inherit',
  detached: true,
  env: { ...process.env },
});

child.unref();

child.on('error', (err) => {
  console.error('Failed to start Aperture:', err.message);
  process.exit(1);
});
