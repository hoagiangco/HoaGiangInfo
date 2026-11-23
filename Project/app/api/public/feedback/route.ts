import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyQRToken } from '@/lib/qr-auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { normalizeLanguage } from '@/lib/i18n';

/**
 * PUBLIC, WRITE-ONLY endpoint used by the guest feedback form.
 * There is deliberately no GET here: customers can never read feedback
 * (their own or anyone else's). Reading happens in /admin/feedback.
 */

const rating = z.number().int().min(1).max(5);

const schema = z.object({
  token: z.string().min(1).max(128),
  venue: z.enum(['hotel', 'restaurant', 'spa', 'other']),
  location: z.string().trim().max(40).optional(),
  overallRating: rating,
  ratings: z
    .object({
      service: rating.optional(),
      food: rating.optional(),
      cleanliness: rating.optional(),
      value: rating.optional(),
    })
    .optional(),
  npsScore: z.number().int().min(0).max(10).optional(),
  comment: z.string().trim().max(2000).optional(),
  guestName: z.string().trim().max(100).optional(),
  contact: z.string().trim().max(120).optional(),
  language: z.preprocess(
    (v) => (typeof v === 'string' ? normalizeLanguage(v) : 'vi'),
    z.enum(['vi', 'en', 'zh'])
  ).default('vi'),
  website: z.string().max(200).optional(), // honeypot
});

/** Strip control characters (keeps newlines/tabs in comments). */
function clean(value: string | undefined): string | null {
  if (!value) return null;
  const out = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return out || null;
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);

  const ipLimit = rateLimit(`feedback:ip:${ip}`, 5, 10 * 60 * 1000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: 'too_many_requests' },
      { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) } }
    );
  }

  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 20_000) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const data = parsed.data;

  // Bots fill hidden fields. Pretend success, store nothing.
  if (data.website) {
    return NextResponse.json({ success: true });
  }

  const qr = await verifyQRToken(data.token);
  if (!qr) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 404 });
  }

  const tokenLimit = rateLimit(`feedback:token:${qr.id}`, 200, 60 * 60 * 1000);
  if (!tokenLimit.ok) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 });
  }

  const salt = process.env.APP_SECRET || 'dev-only-salt';
  const ipHash = createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);

  await prisma.feedback.create({
    data: {
      qrCodeId: qr.id,
      venue: data.venue,
      location: clean(data.location),
      overallRating: data.overallRating,
      ratings: data.ratings ?? undefined,
      npsScore: data.npsScore ?? null,
      comment: clean(data.comment),
      guestName: clean(data.guestName),
      contact: clean(data.contact),
      language: data.language,
      ipHash,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
