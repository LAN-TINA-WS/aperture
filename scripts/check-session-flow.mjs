// ═══════════════════════════════════════════════
// Diagnostics: session:scan → session:messages data flow
// ═══════════════════════════════════════════════

import { listSessions } from '@anthropic-ai/claude-agent-sdk';
import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';

// ─── Helpers (mirrors session-scanner.ts) ──────

function parseTs(val) {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') { const d = new Date(val).getTime(); return isNaN(d) ? null : d; }
  return null;
}

function truncate(s, max) {
  return s.length <= max ? s : s.slice(0, max - 3) + '...';
}

function collectFiles(dir, ext, out) {
  if (!existsSync(dir)) return;
  try {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) collectFiles(p, ext, out);
      else if (p.endsWith(ext)) out.push(p);
    }
  } catch { /* skip */ }
}

function readLines(path) {
  try { return readFileSync(path, 'utf-8').split('\n').filter(Boolean); } catch { return []; }
}

function claudeProjectsDir() {
  return join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'projects');
}

// ─── findClaudeSessionPath (mirrors session-scanner.ts) ───
function findClaudeSessionPath(sessionId) {
  const files = [];
  collectFiles(claudeProjectsDir(), '.jsonl', files);
  for (const f of files) {
    const base = basename(f, '.jsonl');
    if (base === sessionId || base.replace(/-session$/, '') === sessionId) return f;
    try {
      const lines = readLines(f);
      for (const line of lines.slice(0, 3)) {
        const obj = JSON.parse(line);
        if (obj.sessionId === sessionId || obj.session_id === sessionId) return f;
      }
    } catch { continue; }
  }
  return null;
}

// ─── loadMessages (mirrors session-scanner.ts Claude loader) ───
function loadMessages(path) {
  return readLines(path).map(line => {
    try {
      const obj = JSON.parse(line);
      if (obj.isMeta) return null;
      const msg = obj.message; if (!msg) return null;
      let role = msg.role || 'unknown';
      const content = msg.content;
      const ts = parseTs(obj.timestamp);
      if (role === 'user' && Array.isArray(content) && content.every(b => b.type === 'tool_result')) role = 'tool';
      let text = '';
      let thinking = undefined;
      if (Array.isArray(content)) {
        for (const b of content) {
          if (b.type === 'text') text += b.text || '';
          else if (b.type === 'thinking') thinking = (thinking || '') + (b.thinking || '');
          else if (b.type === 'tool_use') text += `[Tool: ${b.name}]`;
          else if (b.type === 'tool_result') text += typeof b.content === 'string' ? b.content : JSON.stringify(b.content);
        }
      } else if (typeof content === 'string') text = content;
      if (!text.trim() && !thinking) return null;
      return { role, content: text, thinking, ts };
    } catch { return null; }
  }).filter(Boolean);
}

// ═══════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  session:scan → session:messages 数据流诊断  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ─── 1. session:scan ────────────────────────
  console.log('━━━ 1. session:scan → listSessions() ━━━');
  const sessions = await listSessions({ limit: 5 });
  console.log(`   SDK returned ${sessions.length} sessions\n`);

  let issues = 0;
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const missing = [];
    if (!s.sessionId) missing.push('sessionId');
    if (!s.summary && !s.customTitle && !s.firstPrompt) missing.push('summary/customTitle/firstPrompt');
    if (!s.cwd) missing.push('cwd');
    if (!s.lastModified) missing.push('lastModified');

    const icon = missing.length ? '❌' : '✅';
    console.log(`   ${icon} Session ${i+1}: ${s.sessionId || 'MISSING'}`);
    console.log(`      summary:     "${s.summary || '(empty)'}"`);
    console.log(`      customTitle: "${s.customTitle || 'undefined'}"`);
    console.log(`      cwd:         "${s.cwd || 'MISSING'}"`);
    console.log(`      lastModified: ${s.lastModified} ${new Date(s.lastModified).toISOString()}`);
    if (missing.length) {
      console.log(`      ⚠️  MISSING FIELDS: ${missing.join(', ')}`);
      issues++;
    }
  }

  // ─── IPC mapping check ──────────────────────
  console.log('\n   🔍 IPC handler mapping check:');
  const s0 = sessions[0];
  const ipcMapped = {
    providerId: 'claude',
    sessionId: s0.sessionId,
    title: s0.customTitle || s0.summary || s0.firstPrompt || null,
    sourcePath: '',
    projectDir: s0.cwd || null,
    resumeCommand: null,
    lastActiveAt: s0.lastModified || null,
  };
  console.log(`   session:scan would return for session 1:`);
  console.log(JSON.stringify(ipcMapped, null, 2));

  // ─── 2. findClaudeSessionPath ───────────────
  console.log('\n━━━ 2. findClaudeSessionPath ━━━');
  const firstId = sessions[0].sessionId;
  console.log(`   Looking up: ${firstId}`);
  const foundPath = findClaudeSessionPath(firstId);
  if (foundPath) {
    console.log(`   ✅ Found: ${foundPath}`);
    const fileExists = existsSync(foundPath);
    console.log(`   File exists: ${fileExists}`);
    if (fileExists) {
      const stat = statSync(foundPath);
      console.log(`   Size: ${stat.size} bytes, Modified: ${stat.mtime.toISOString()}`);
    }
  } else {
    console.log(`   ❌ NOT FOUND by sessionId — trying sessionId-based filename match...`);
    // Check if a file named exactly <sessionId>.jsonl exists
    const projectsDir = claudeProjectsDir();
    const allFiles = [];
    collectFiles(projectsDir, '.jsonl', allFiles);
    const matching = allFiles.filter(f => {
      const base = basename(f, '.jsonl');
      return base === firstId || base.replace(/-session$/, '') === firstId;
    });
    console.log(`   Files matching basename: ${matching.length}`);
    matching.forEach(f => console.log(`     ${f}`));
    issues++;
  }

  // ─── 3. loadMessages ────────────────────────
  console.log('\n━━━ 3. loadMessages ━━━');
  if (foundPath) {
    const messages = loadMessages(foundPath);
    console.log(`   Total messages loaded: ${messages.length}`);
    console.log(`\n   First 5 messages:`);
    messages.slice(0, 5).forEach((m, i) => {
      const contentPreview = (m.content || '').slice(0, 80);
      const thinkingLen = m.thinking ? ` (thinking: ${m.thinking.length} chars)` : '';
      console.log(`   [${i}] role=${m.role}${thinkingLen} content="${contentPreview}${contentPreview.length >= 80 ? '...' : ''}"`);
    });

    // Role distribution
    const roleCounts = {};
    messages.forEach(m => { roleCounts[m.role] = (roleCounts[m.role] || 0) + 1; });
    console.log(`\n   Role distribution:`, roleCounts);

    if (messages.length === 0) {
      console.log(`   ⚠️  No messages extracted!`);
      // Debug: show first 3 raw JSON lines
      const rawLines = readLines(foundPath).slice(0, 3);
      rawLines.forEach((l, i) => {
        try {
          const obj = JSON.parse(l);
          console.log(`   Raw line ${i}: type=${obj.type}, has message=${!!obj.message}, isMeta=${obj.isMeta}`);
        } catch { console.log(`   Raw line ${i}: failed to parse`); }
      });
      issues++;
    }
  }

  // ─── 4. Verify session:messages IPC flow ────
  console.log('\n━━━ 4. IPC handler session:messages check ━━━');
  console.log('   handler = get path via findClaudeSessionPath → loadMessages("claude", path)');
  console.log(`   findClaudeSessionPath("${firstId}") → ${foundPath ? 'FOUND' : 'NOT FOUND'}`);
  if (foundPath) {
    const msgCount = loadMessages(foundPath).length;
    console.log(`   loadMessages("claude", path) → ${msgCount} messages`);
    console.log(`   ${msgCount > 0 ? '✅ session:messages data flow intact' : '❌ loadMessages returned 0'}`);
  } else {
    console.log(`   ❌ session:messages would fail — cannot find JSONL`);
  }

  // ─── Summary ────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  SUMMARY: ${issues === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${issues} ISSUE(S) FOUND`}  ║`);
  console.log('╚══════════════════════════════════════════════╝');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
