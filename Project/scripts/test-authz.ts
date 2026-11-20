/**
 * Authorization tests.
 *
 *   npm run test:authz                      -> offline unit tests of the permission model
 *   BASE_URL=http://localhost:6001 npm run test:authz
 *                                           -> also probes a RUNNING server as an anonymous
 *                                              customer (and with a forged legacy cookie) and
 *                                              asserts that nothing internal is reachable.
 */
import assert from 'node:assert/strict';
import {
  ROLES,
  canEditDocument,
  canManageRole,
  canViewDocument,
  hasPermission,
  type AuthUser,
  type DocAccessInfo,
  type Role,
} from '../lib/auth/permissions';
import { documentVisibilityWhere } from '../lib/documents';
import { buildFeedbackWhere } from '../lib/feedback';

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed++;
      console.log(`  ok   ${name}`);
    })
    .catch((e) => {
      console.error(`  FAIL ${name}\n       ${e.message}`);
      process.exitCode = 1;
    });
}

const user = (role: Role, department: string | null = null, id: string = role): AuthUser => ({
  id,
  email: `${id}@x.test`,
  name: id,
  role,
  department,
});

const doc = (p: Partial<DocAccessInfo>): DocAccessInfo => ({
  visibility: 'ALL_STAFF',
  departments: [],
  minRole: null,
  uploadedById: null,
  ...p,
});

async function unit() {
  console.log('Permission model');

  await test('anonymous / customer has no permission at all', () => {
    for (const p of ['users.manage', 'documents.read', 'feedback.read', 'content.manage', 'audit.view'] as const) {
      assert.equal(hasPermission(null, p), false);
      assert.equal(hasPermission(undefined, p), false);
    }
  });

  await test('STAFF cannot manage users, content, audit, export or PII', () => {
    const s = user('STAFF');
    for (const p of ['users.manage', 'content.manage', 'audit.view', 'feedback.export', 'feedback.pii', 'feedback.read', 'documents.write'] as const) {
      assert.equal(hasPermission(s, p), false, p);
    }
    assert.equal(hasPermission(s, 'documents.read'), true);
    assert.equal(hasPermission(s, 'feedback.read.assigned'), true);
  });

  await test('MANAGER cannot manage users or CMS content', () => {
    const m = user('MANAGER');
    assert.equal(hasPermission(m, 'users.manage'), false);
    assert.equal(hasPermission(m, 'content.manage'), false);
    assert.equal(hasPermission(m, 'feedback.pii'), true);
  });

  await test('role management hierarchy', () => {
    assert.equal(canManageRole('SUPER_ADMIN', 'ADMIN'), true);
    assert.equal(canManageRole('ADMIN', 'SUPER_ADMIN'), false);
    assert.equal(canManageRole('ADMIN', 'ADMIN'), false);
    assert.equal(canManageRole('ADMIN', 'MANAGER'), true);
    assert.equal(canManageRole('MANAGER', 'STAFF'), false);
    assert.equal(canManageRole('STAFF', 'STAFF'), false);
  });

  console.log('Document visibility');

  await test('ALL_STAFF visible to every internal role', () => {
    for (const r of ROLES) assert.equal(canViewDocument(user(r), doc({})), true);
  });

  await test('DEPARTMENT only for listed departments (managers included)', () => {
    const d = doc({ visibility: 'DEPARTMENT', departments: ['Kế toán'] });
    assert.equal(canViewDocument(user('STAFF', 'Kế toán'), d), true);
    assert.equal(canViewDocument(user('STAFF', 'Bếp'), d), false);
    assert.equal(canViewDocument(user('MANAGER', 'Bếp'), d), false);
    assert.equal(canViewDocument(user('STAFF', null), d), false);
    assert.equal(canViewDocument(user('ADMIN'), d), true);
  });

  await test('ROLE_MIN enforces rank', () => {
    const d = doc({ visibility: 'ROLE_MIN', minRole: 'MANAGER' });
    assert.equal(canViewDocument(user('STAFF'), d), false);
    assert.equal(canViewDocument(user('MANAGER'), d), true);
    assert.equal(canViewDocument(user('ADMIN'), d), true);
  });

  await test('PRIVATE only admins and the uploader', () => {
    const d = doc({ visibility: 'PRIVATE', uploadedById: 'u1' });
    assert.equal(canViewDocument(user('MANAGER', null, 'm1'), d), false);
    assert.equal(canViewDocument(user('MANAGER', null, 'u1'), d), true);
    assert.equal(canViewDocument(user('ADMIN'), d), true);
    assert.equal(canViewDocument(user('STAFF'), d), false);
  });

  await test('only managers/admins can edit; managers limited to own/department docs', () => {
    assert.equal(canEditDocument(user('STAFF'), doc({ uploadedById: 'STAFF' })), false);
    assert.equal(canEditDocument(user('MANAGER', 'Bếp'), doc({})), false);
    assert.equal(canEditDocument(user('MANAGER', 'Bếp', 'm1'), doc({ uploadedById: 'm1' })), true);
    assert.equal(canEditDocument(user('MANAGER', 'Bếp'), doc({ visibility: 'DEPARTMENT', departments: ['Bếp'] })), true);
    assert.equal(canEditDocument(user('ADMIN'), doc({})), true);
  });

  await test('list filter: admins unrestricted, staff constrained', () => {
    assert.deepEqual(documentVisibilityWhere(user('ADMIN')), {});
    const w = JSON.stringify(documentVisibilityWhere(user('STAFF', 'Bếp', 's1')));
    assert.ok(w.includes('ALL_STAFF') && w.includes('Bếp') && w.includes('s1'));
    assert.ok(!w.includes('"PRIVATE"'));
  });

  console.log('Feedback scoping');

  await test('STAFF is always scoped to assigned feedback regardless of filters', () => {
    const w = JSON.stringify(buildFeedbackWhere(user('STAFF', null, 's1'), { status: 'NEW' }));
    assert.ok(w.includes('"assigneeId":"s1"'));
  });

  await test('MANAGER sees all feedback (no assignee scope)', () => {
    const w = JSON.stringify(buildFeedbackWhere(user('MANAGER', null, 'm1'), {}));
    assert.ok(!w.includes('assigneeId'));
  });
}

// ---------------------------------------------------------------------------
// Live probe as an anonymous customer
// ---------------------------------------------------------------------------
async function live(base: string) {
  console.log(`Live probe of ${base} (anonymous customer)`);
  const forged = { Cookie: 'admin_session=authenticated; hg_session=forged' };

  const deniedPages = ['/admin', '/admin/documents', '/admin/feedback', '/admin/users', '/admin/audit', '/admin/qr-codes'];
  for (const p of deniedPages) {
    await test(`GET ${p} redirects to /login`, async () => {
      for (const headers of [{}, forged]) {
        const r = await fetch(base + p, { redirect: 'manual', headers });
        assert.ok([302, 303, 307, 308].includes(r.status), `status ${r.status}`);
        assert.ok((r.headers.get('location') ?? '').includes('/login'));
      }
    });
  }

  const deniedApis: [string, string][] = [
    ['GET', '/api/internal/documents'],
    ['GET', '/api/internal/documents/x'],
    ['GET', '/api/internal/documents/x/file'],
    ['GET', '/api/internal/users'],
    ['GET', '/api/internal/feedback/export'],
    ['PATCH', '/api/internal/feedback/x'],
    ['GET', '/api/export'],
    ['GET', '/api/analytics'],
    ['GET', '/api/qr'],
    ['POST', '/api/qr'],
    ['POST', '/api/menu'],
    ['POST', '/api/upload/image'],
    ['POST', '/api/import'],
  ];
  for (const [method, p] of deniedApis) {
    await test(`${method} ${p} -> 401/403`, async () => {
      for (const headers of [{}, forged]) {
        const r = await fetch(base + p, { method, headers: { ...headers, Origin: base }, redirect: 'manual' });
        assert.ok([401, 403].includes(r.status), `status ${r.status}`);
      }
    });
  }

  await test('legacy public documents folder is blocked', async () => {
    const r = await fetch(`${base}/uploads/documents/anything.pdf`);
    assert.equal(r.status, 404);
  });

  await test('old technical-documents endpoint is gone', async () => {
    const r = await fetch(`${base}/api/technical-documents/x`);
    assert.equal(r.status, 404);
  });

  await test('cross-site POST is rejected (CSRF)', async () => {
    const r = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: '{}',
    });
    assert.equal(r.status, 403);
  });

  await test('login with default admin123 / forged credentials fails', async () => {
    const r = await fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' }),
    });
    assert.ok([400, 401, 429].includes(r.status), `status ${r.status}`);
  });
}

(async () => {
  await unit();
  if (process.env.BASE_URL) await live(process.env.BASE_URL.replace(/\/$/, ''));
  console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
})();
