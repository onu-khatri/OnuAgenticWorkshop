import process from 'node:process';
import readline from 'node:readline';

function ensureInteractive() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive selection requires a TTY. Use --clients and --scope in non-interactive environments.');
  }
}

function listen(callback) {
  ensureInteractive();
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('keypress', callback);
}

function stopListen(callback) {
  process.stdin.off('keypress', callback);
  process.stdin.setRawMode(false);
  process.stdin.pause();
}

async function select(message, options, { multiple }) {
  let cursor = 0;
  const selected = new Set();
  const lineCount = options.length + 2;
  let firstRender = true;

  const render = () => {
    if (!firstRender) process.stdout.write(`\x1b[${lineCount}A`);
    firstRender = false;
    process.stdout.write(`${message}\x1b[K\n`);
    for (let i = 0; i < options.length; i += 1) {
      const pointer = i === cursor ? '›' : ' ';
      const mark = multiple ? (selected.has(options[i].value) ? '☑' : '☐') : '';
      process.stdout.write(`${pointer} ${mark}${mark ? ' ' : ''}${options[i].label}\x1b[K\n`);
    }
    const hint = multiple ? '↑/↓ move • Space toggle • Enter confirm' : '↑/↓ move • Enter confirm';
    process.stdout.write(`  ${hint}\x1b[K\n`);
  };

  render();

  return new Promise((resolve, reject) => {
    const onKeypress = (_str, key) => {
      if (key?.ctrl && key.name === 'c') {
        stopListen(onKeypress);
        process.stdout.write('\n');
        reject(new Error('Installation cancelled.'));
        return;
      }
      if (key?.name === 'up') {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      } else if (key?.name === 'down') {
        cursor = (cursor + 1) % options.length;
        render();
      } else if (multiple && key?.name === 'space') {
        const value = options[cursor].value;
        if (selected.has(value)) selected.delete(value);
        else selected.add(value);
        render();
      } else if (key?.name === 'return' || key?.name === 'enter') {
        if (multiple) {
          if (selected.size === 0) {
            process.stdout.write('\x07');
            return;
          }
          stopListen(onKeypress);
          resolve(options.filter((option) => selected.has(option.value)).map((option) => option.value));
        } else {
          stopListen(onKeypress);
          resolve(options[cursor].value);
        }
      }
    };

    listen(onKeypress);
  });
}

export function chooseMany(message, options) {
  return select(message, options, { multiple: true });
}

export function chooseOne(message, options) {
  return select(message, options, { multiple: false });
}

async function question(message, suffix = '') {
  ensureInteractive();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await new Promise((resolve) => rl.question(`${message}${suffix} `, resolve));
  } finally {
    rl.close();
  }
}

export function confirm(message) {
  return question(message, '[y/N]').then((answer) => /^y(es)?$/i.test(answer.trim()));
}

export function promptText(message) {
  return question(message);
}
