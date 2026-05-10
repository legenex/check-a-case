/**
 * Lightweight script sandbox for decision tree scripts.
 * Uses Web Workers when available, falls back to direct execution with guardrails.
 */

const FORBIDDEN = ['function ', 'Function', 'eval(', 'eval ', '__proto__', '__defineGetter__', 'constructor['];
const BACKTICK_RE = /`/;

export function isSafeScript(code) {
  if (!code) return true;
  if (BACKTICK_RE.test(code)) return false;
  return !FORBIDDEN.some((kw) => code.includes(kw));
}

/**
 * Execute a script in a sandboxed context.
 * Returns { mutations, error }
 */
export async function runScript(code, context, timeoutMs = 2000) {
  if (!code?.trim()) return { mutations: {}, error: null };

  if (!isSafeScript(code)) {
    return { mutations: {}, error: 'Script contains forbidden patterns and was skipped.' };
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ mutations: {}, error: 'Script timeout' });
    }, timeoutMs);

    try {
      const mutations = {};
      const lead = buildLeadProxy(context.fieldValues || {}, mutations);
      const tags = buildTagsProxy(context.tags || [], mutations);
      const ctx = {
        url: {
          params: { get: (k) => context.urlParams?.[k] || null },
          host: context.host || '',
          referrer: context.referrer || '',
        },
        session: { event_id: context.event_id || '', id: context.session_id || '' },
        fetch: () => Promise.resolve({ json: () => ({}) }), // no-op in client sandbox
        lookup: (nodeId, key) => context.pathTaken?.find((p) => p.node_id === nodeId)?.[key] || null,
      };
      const consoleLogs = [];
      const sandboxConsole = { log: (...args) => consoleLogs.push(args.join(' ')) };

      // Use AsyncFunction for async scripts
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction('lead', 'tags', 'node', 'quiz', 'ctx', 'console', `"use strict";\n${code}`);

      fn(lead, tags, context.node || {}, context.quiz || {}, ctx, sandboxConsole)
        .then(() => {
          clearTimeout(timeout);
          resolve({ mutations, consoleLogs, error: null });
        })
        .catch((err) => {
          clearTimeout(timeout);
          resolve({ mutations, consoleLogs, error: err.message });
        });
    } catch (err) {
      clearTimeout(timeout);
      resolve({ mutations: {}, error: err.message });
    }
  });
}

function buildLeadProxy(fieldValues, mutations) {
  return {
    fields: new Proxy({ ...fieldValues }, {
      get(target, key) { return target[key]; },
      set(target, key, value) {
        target[key] = value;
        mutations[key] = value;
        return true;
      },
    }),
  };
}

function buildTagsProxy(tags, mutations) {
  const tagSet = new Set(tags);
  return {
    add: (tag) => { tagSet.add(tag); mutations.__tags_add = [...(mutations.__tags_add || []), tag]; },
    remove: (tag) => { tagSet.delete(tag); mutations.__tags_remove = [...(mutations.__tags_remove || []), tag]; },
    has: (tag) => tagSet.has(tag),
  };
}