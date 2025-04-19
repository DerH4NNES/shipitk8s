import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { execSync } from 'child_process';

export async function POST(request: NextRequest, context: any) {
    const { overlay } = (await context.params) as { overlay: string };
    const dir = path.join(process.cwd(), 'generated-overlays', overlay);

    try {
        const stdout = execSync(`kubectl apply -f ${dir}/all.yaml`, { encoding: 'utf-8' });
        return NextResponse.json({ success: true, message: stdout });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
