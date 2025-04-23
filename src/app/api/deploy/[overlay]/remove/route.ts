import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { deleteGeneratedOverlaysSubfolder } from '@/lib/gitClient';

export async function POST(request: NextRequest, context: any) {
    const { overlay } = (await context.params) as { overlay: string };
    const dir = path.join(process.cwd(), 'generated-overlays', overlay);

    try {
        await deleteGeneratedOverlaysSubfolder(dir);
        return NextResponse.json({ success: true, message: 'Success' });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.stderr?.toString() || e.message }, { status: 500 });
    }
}
