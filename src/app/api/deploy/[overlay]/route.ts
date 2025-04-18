import { NextResponse } from 'next/server';
import path from 'path';
import { exec } from 'node:child_process';

export async function POST(req: Request, context: { params: { overlay: string } }) {
    const { overlay } = await context.params;
    const dir = path.join(process.cwd(), 'generated-overlays', overlay);

    try {
        // führt "kubectl apply -k generated-overlays/<overlay>" aus
        const { stdout, stderr } = await exec(`kubectl apply -k ${dir}`);
        console.log('kubectl stdout:', stdout);
        if (stderr) console.error('kubectl stderr:', stderr);

        return NextResponse.json({ success: true, message: stdout });
    } catch (e: any) {
        console.error('Deploy failed:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
