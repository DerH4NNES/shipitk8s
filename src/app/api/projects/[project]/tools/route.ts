import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(_req: Request, context: { params: { project: string } }) {
    const { project } = await context.params;
    const projDir = path.join(process.cwd(), 'generated-overlays', project);

    try {
        const entries = await fs.readdir(projDir, { withFileTypes: true });
        const overlays = entries
            .filter((e) => e.isDirectory())
            .map((e) => {
                const [tool, ts] = e.name.split(/-(?=\d{13,})/, 2);
                return {
                    path: `${project}/${e.name}`,
                    tool,
                    id: ts,
                };
            });
        return NextResponse.json({ overlays });
    } catch {
        return NextResponse.json({ error: `Project '${project}' not found` }, { status: 404 });
    }
}
