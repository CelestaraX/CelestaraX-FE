import { z } from 'zod';

export const HtmlFilesQuerySchema = z.object({
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  // page는 숫자로 받지만 query param은 string → 변환시
});

export const HtmlFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  page: z.string(),
  htmlContent: z.string(),
});

export const HtmlFilesResponseSchema = z.object({
  items: z.array(HtmlFileSchema),
  hasMore: z.boolean(),
});
