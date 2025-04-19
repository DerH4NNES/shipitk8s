import { NextResponse } from 'next/server';
import path from 'path';
import { execSync } from 'node:child_process';

export async function POST(req: Request, context: { params: { overlay: string } }) {
    const { overlay } = await context.params;
    const dir = path.join(process.cwd(), 'generated-overlays', overlay);

    try {
        const stdout = execSync(`kubectl apply -f ${dir}/all.yaml`, { encoding: 'utf-8' });
        if (stdout) console.log('kubectl output:', stdout);
        return NextResponse.json({ success: true, message: stdout });
    } catch (e: any) {
        console.error('Deploy failed:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
