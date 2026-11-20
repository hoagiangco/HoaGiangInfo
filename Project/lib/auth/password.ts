import bcrypt from 'bcryptjs';

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let dummyHash: string | null = null;

/** Valid bcrypt hash of a random string - used to equalise timing for unknown emails. */
export function getDummyHash(): string {
  if (!dummyHash) {
    dummyHash = bcrypt.hashSync(
      Math.random().toString(36) + Date.now().toString(36),
      COST
    );
  }
  return dummyHash;
}

/** Returns an error message (Vietnamese) or null if the password is acceptable. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return 'Mật khẩu phải có ít nhất 10 ký tự';
  if (password.length > 128) return 'Mật khẩu quá dài';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Mật khẩu phải gồm chữ hoa, chữ thường và số';
  }
  const weak = ['admin123', 'password', '12345678', 'qwerty'];
  if (weak.some((w) => password.toLowerCase().includes(w))) {
    return 'Mật khẩu quá dễ đoán';
  }
  return null;
}
