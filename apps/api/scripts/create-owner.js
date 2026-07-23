import readline from 'node:readline';
import bcrypt from 'bcrypt';
import { db } from '../src/config/database.js';
import { newId } from '../src/utils/id.js';

const BCRYPT_ROUNDS = 12;
const CHAR_CTRL_C = String.fromCharCode(3);
const CHAR_BACKSPACE = String.fromCharCode(127);
const CHAR_BACKSPACE_ALT = String.fromCharCode(8);

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = /^--([^=]+)=(.*)$/.exec(arg);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const stdin = process.stdin;
    process.stdout.write(question);

    let password = '';
    stdin.setRawMode?.(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const onData = (char) => {
      char = char.toString();
      if (char === '\n' || char === '\r') {
        stdin.setRawMode?.(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
        return;
      }
      if (char === CHAR_CTRL_C) {
        process.exit(1);
      }
      if (char === CHAR_BACKSPACE || char === CHAR_BACKSPACE_ALT) {
        password = password.slice(0, -1);
        return;
      }
      password += char;
    };

    stdin.on('data', onData);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = args.email;
  const name = args.name || 'Owner';

  if (!email) {
    console.error('Usage: npm run user:create-owner -- --email=owner@example.com [--name="Business Owner"]');
    process.exit(1);
  }

  const password = process.env.OWNER_PASSWORD || await promptHidden('Enter password for the new owner account: ');
  if (!password || password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const existing = await db('users').whereRaw('LOWER(email) = LOWER(?)', [email]).first();
  if (existing) {
    console.error(`A user with email ${email} already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await db('users').insert({
    id: newId(),
    email: email.toLowerCase(),
    password_hash: passwordHash,
    name,
    role: 'owner',
    verified: true,
  });

  console.log(`Owner account created for ${email}.`);
  await db.destroy();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
