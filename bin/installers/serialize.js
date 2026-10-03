export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function splitFrontmatter(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) return { frontmatter: '', body: normalized };
  const end = normalized.indexOf('\n---\n', 4);
  if (end === -1) return { frontmatter: '', body: normalized };
  return {
    frontmatter: normalized.slice(4, end),
    body: normalized.slice(end + 5),
  };
}

function parseYamlScalar(rest) {
  const value = rest.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => parseYamlScalar(item));
  }
  if (value.length >= 2 && ((value[0] === '"' && value.endsWith('"')) || (value[0] === "'" && value.endsWith("'")))) {
    return value.slice(1, -1);
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (/^-?\d+\.\d+$/.test(value)) return Number(value);
  return value;
}

function indentOf(line) {
  return line.length - line.replace(/^ +/, '').length;
}

function parseYamlBlock(lines, idx, indent) {
  const result = {};
  while (idx < lines.length) {
    const line = lines[idx];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { idx += 1; continue; }
    const currentIndent = indentOf(line);
    if (currentIndent < indent) break;
    if (currentIndent > indent) { idx += 1; continue; }

    const match = trimmed.match(/^([^:]+):(?:\s*(.*))?$/);
    if (!match) { idx += 1; continue; }

    const key = match[1].trim();
    const rest = match[2] || '';

    if (rest.trim() === '') {
      let nextIndent = null;
      let nextTrimmed = null;
      if (idx + 1 < lines.length) {
        nextTrimmed = lines[idx + 1].trim();
        nextIndent = indentOf(lines[idx + 1]);
      }
      if (nextIndent !== null && nextIndent > indent && nextTrimmed.startsWith('-')) {
        const items = [];
        idx += 1;
        while (idx < lines.length) {
          const nxt = lines[idx];
          const nxtTrimmed = nxt.trim();
          const nxtIndent = indentOf(nxt);
          if (nxtIndent < nextIndent) break;
          if (nxtTrimmed.startsWith('-')) {
            items.push(parseYamlScalar(nxtTrimmed.slice(1).trim()));
            idx += 1;
          } else if (!nxtTrimmed) {
            idx += 1;
          } else {
            break;
          }
        }
        result[key] = items;
        continue;
      }
      if (nextIndent !== null && nextIndent > indent) {
        const nested = parseYamlBlock(lines, idx + 1, nextIndent);
        result[key] = nested.value;
        idx = nested.idx;
        continue;
      }
      result[key] = null;
      idx += 1;
      continue;
    }

    result[key] = parseYamlScalar(rest);
    idx += 1;
  }
  return { value: result, idx };
}

export function parseYaml(text) {
  if (!text) return {};
  return parseYamlBlock(text.split('\n'), 0, 0).value;
}

function yamlScalar(value) {
  if (typeof value === 'string') {
    const looksLikeSpecial = /^(true|false|null|~|yes|no|on|off)$/i.test(value)
      || /^-?\d+(\.\d+)?$/.test(value)
      || /^[:#\[\]{}&*!|>'"%@`]/.test(value)
      || /[:#]\s/.test(value)
      || /^\s|\s$/.test(value);
    if (value === '' || looksLikeSpecial) return JSON.stringify(value);
    return value;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null || value === undefined) return 'null';
  return String(value);
}

function yamlLines(obj, indent) {
  const pad = ' '.repeat(indent);
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) { lines.push(`${pad}${key}: []`); continue; }
      lines.push(`${pad}${key}:`);
      for (const item of value) lines.push(`${pad}  - ${yamlScalar(item)}`);
    } else if (isPlainObject(value)) {
      lines.push(`${pad}${key}:`);
      lines.push(...yamlLines(value, indent + 2));
    } else {
      lines.push(`${pad}${key}: ${yamlScalar(value)}`);
    }
  }
  return lines;
}

export function serializeYaml(obj) {
  return yamlLines(obj, 0).join('\n');
}

function tomlValue(value) {
  if (typeof value === 'string') {
    if (value.includes('\n')) return `"""\n${value}\n"""`;
    return JSON.stringify(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(', ')}]`;
  return String(value);
}

export function serializeToml(obj) {
  const lines = [];
  const scalarKeys = Object.keys(obj).filter((key) => !isPlainObject(obj[key]));
  const tableKeys = Object.keys(obj).filter((key) => isPlainObject(obj[key]));

  for (const key of scalarKeys) lines.push(`${key} = ${tomlValue(obj[key])}`);
  for (const key of tableKeys) {
    const table = obj[key];
    lines.push(`[${key}]`);
    for (const [subKey, subValue] of Object.entries(table)) {
      if (isPlainObject(subValue)) {
        lines.push(`[${key}.${subKey}]`);
        for (const [leafKey, leafValue] of Object.entries(subValue)) {
          lines.push(`${leafKey} = ${tomlValue(leafValue)}`);
        }
      } else {
        lines.push(`${subKey} = ${tomlValue(subValue)}`);
      }
    }
  }
  return `${lines.join('\n')}\n`;
}
