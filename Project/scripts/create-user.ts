/**
 * Creates (or resets the password of) an internal user from the command line.
 * This is how the FIRST Super Admin is created.
 *
 *   npm run user:create -- --email owner@example.com --name "Owner" --role SUPER_ADMIN
 *
 * The password is read from the prompt (hidden), or from the
 * NEW_USER_PASSWORD env var for non-interactive use. It is never passed as a
 * CLI argument so it does not end up in shell history.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();
const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

function promptHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const anyRl = rl as any;
    anyRl._writeToOutput = (s: string) => {
      if (s.includes(question)) process.stdout.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

function strengthError(p: string): string | null {
  if (p.length < 10) return 'Password must be at least 10 characters';
  if (!/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p)) {
    return 'Password must contain upper case, lower case and a digit';
  }
  if (/admin123|password|12345678|qwerty/i.test(p)) return 'Password is too easy to guess';
  return null;
}

async function main() {
  const email = arg('email')?.trim().toLowerCase();
  const name = arg('name')?.trim();
  const role = (arg('role') ?? 'STAFF').toUpperCase();
  const department = arg('department')?.trim() || null;

  if (!email || !name) {
    console.error('Usage: npm run user:create -- --email <email> --name "<name>" [--role SUPER_ADMIN|ADMIN|MANAGER|STAFF] [--department "<dept>"]');
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Invalid role. Use one of: ${ROLES.join(', ')}`);
    process.exit(1);
  }

  const password = process.env.NEW_USER_PASSWORD ?? (await promptHidden('Password: '));
  const err = strengthError(password);
  if (err) {
    console.error(err);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name, role: role as any, department, isActive: true, failedAttempts: 0, lockedUntil: null },
    });
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    console.log(`Updated existing user ${email} (${role}); all sessions revoked.`);
  } else {
    await prisma.user.create({ data: { email, name, role: role as any, department, passwordHash } });
    console.log(`Created user ${email} (${role}).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
