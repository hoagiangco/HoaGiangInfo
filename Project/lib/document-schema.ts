import { z } from 'zod';
import { DOC_CATEGORIES } from '@/lib/documents';
import { isRole } from '@/lib/auth/permissions';

export const documentMetaSchema = z
  .object({
    title: z.string().trim().min(1, 'Tiêu đề là bắt buộc').max(200),
    category: z.string().refine((c) => c in DOC_CATEGORIES, 'Danh mục không hợp lệ'),
    description: z.string().trim().max(1000).optional().default(''),
    content: z.string().max(200_000).optional().default(''),
    visibility: z.enum(['ALL_STAFF', 'DEPARTMENT', 'ROLE_MIN', 'PRIVATE']),
    departments: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    minRole: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.visibility === 'DEPARTMENT' && v.departments.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Chọn ít nhất một phòng ban' });
    }
    if (v.visibility === 'ROLE_MIN' && !isRole(v.minRole)) {
      ctx.addIssue({ code: 'custom', message: 'Chọn vai trò tối thiểu' });
    }
  });

export type DocumentMeta = z.infer<typeof documentMetaSchema>;

/** Reads metadata from multipart FormData into a plain object for the schema. */
export function metaFromFormData(fd: FormData) {
  let departments: string[] = [];
  const rawDepts = fd.get('departments');
  if (typeof rawDepts === 'string' && rawDepts) {
    try {
      const parsed = JSON.parse(rawDepts);
      if (Array.isArray(parsed)) departments = parsed.map(String);
    } catch {
      departments = [];
    }
  }
  const minRole = fd.get('minRole');
  return {
    title: fd.get('title') ?? '',
    category: fd.get('category') ?? '',
    description: fd.get('description') ?? '',
    content: fd.get('content') ?? '',
    visibility: fd.get('visibility') ?? 'ALL_STAFF',
    departments,
    minRole: typeof minRole === 'string' && minRole ? minRole : null,
    isActive: fd.get('isActive') !== 'false',
  };
}
