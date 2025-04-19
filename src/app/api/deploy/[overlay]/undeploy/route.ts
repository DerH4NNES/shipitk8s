// app/api/undeploy/[overlay]/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import YAML from 'js-yaml';
import { execSync } from 'child_process';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ overlay: string }> }
) {
    const { overlay } = await params;
    const dir = path.join(process.cwd(), 'generated-overlays', overlay);
    const file = path.join(dir, 'all.yaml');

    try {
        const docs = YAML.loadAll(fs.readFileSync(file, 'utf-8'));

        const filtered = docs.filter((doc: any) => doc.kind !== 'Namespace');

        if (filtered.length === 0) {
            return NextResponse.json(
                { success: true, message: 'Nothing to delete (only Namespace present)' }
            );
        }

        const tmpFile = path.join(dir, 'to-delete.yaml');
        fs.writeFileSync(
            tmpFile,
            filtered.map((d) => YAML.dump(d)).join('---\n')
        );

        const stdout = execSync(`kubectl delete -f ${tmpFile}`, { encoding: 'utf-8' });

        fs.unlinkSync(tmpFile);

        return NextResponse.json({ success: true, message: stdout });
    } catch (e: any) {
        return NextResponse.json(
            { success: false, error: e.stderr?.toString() || e.message },
            { status: 500 }
        );
    }
}
