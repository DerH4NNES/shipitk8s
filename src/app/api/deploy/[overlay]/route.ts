import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { pushGeneratedOverlaysSubfolder } from '@/lib/gitClient';

export async function POST(request: NextRequest, context: any) {
    const { overlay } = (await context.params) as { overlay: string };
    const dir = path.join(process.cwd(), 'generated-overlays', overlay);

    try {
        await pushGeneratedOverlaysSubfolder(dir);
        return NextResponse.json({ success: true, message: 'yes, it worked!' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
