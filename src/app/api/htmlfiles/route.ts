// app/api/htmlfiles/route.ts
import { NextRequest, NextResponse } from 'next/server';

// 충분히 많은 mock items
// 여기선 100개만 예시로
const bigDataset = Array.from({ length: 100 }, (_, i) => ({
  id: String(i + 1),
  name: `Mock File #${i + 1}`,
  page: 'somePage',
  htmlContent: `<p>This is content for item #${i + 1}.</p>`,
}));

// pageSize
const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const pageStr = searchParams.get('page') || '0';
    const page = parseInt(pageStr, 10);

    console.log('API /htmlfiles => page:', page, 'search:', search);
    // 필터
    let filtered = bigDataset;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((f) => f.name.toLowerCase().includes(s));
    }

    // pagination
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const slice = filtered.slice(start, end);

    const hasMore = end < filtered.length;

    console.log('Returning slice:', start, end, 'hasMore:', hasMore);

    return NextResponse.json({
      items: slice,
      hasMore,
    });
  } catch (err) {
    console.error('/api/htmlfiles error', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
