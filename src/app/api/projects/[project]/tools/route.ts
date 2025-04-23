import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(_: NextRequest, { params }: { params: { project: string } }) {
    const { project } = await params;
    const projDir = path.join(process.cwd(), 'generated-overlays', project);

    try {
        const entries = await fs.readdir(projDir, { withFileTypes: true });

        const overlays = await Promise.all(
            entries
                .filter((e) => e.isDirectory())
                .map(async (e) => {
                    const toolDir = path.join(projDir, e.name);
                    const appPath = path.join(toolDir, 'app.json');

                    let appData: Record<string, any> | null = null;
                    try {
                        const raw = await fs.readFile(appPath, 'utf8');
                        appData = JSON.parse(raw);
                    } catch {
                        /* kein app.json → ignorieren */
                    }

                    return {
                        path: `${project}/${e.name}`,
                        tool: e.name,
                        app: appData, // enthält variables / owner / …
                    };
                }),
        );

        return NextResponse.json({ overlays });
    } catch {
        return NextResponse.json({ error: `Project '${project}' not found` }, { status: 404 });
    }
}
