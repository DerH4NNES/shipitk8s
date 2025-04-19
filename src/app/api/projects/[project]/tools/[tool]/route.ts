import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { generateOverlay } from '@/lib/generateOverlay';

export async function POST(req: Request, context: { params: { project: string; tool: string } }) {
    const { project, tool } = await context.params;
    const body = await req.json();

    const projDir = path.join(process.cwd(), 'generated-overlays', project);
    // 1) Stelle sicher, dass das Projekt‑Verzeichnis existiert
    try {
        await fs.access(projDir);
    } catch {
        return NextResponse.json({ error: `Project '${project}' not found` }, { status: 404 });
    }

    // 2) Alte Overlays mit demselben Tool löschen (Overwrite-Mode)
    const entries = await fs.readdir(projDir, { withFileTypes: true });
    const toDelete = entries
        .filter((e) => e.isDirectory() && e.name.startsWith(`${tool}-`))
        .map((e) => path.join(projDir, e.name));
    await Promise.all(toDelete.map((dir) => fs.rm(dir, { recursive: true, force: true })));

    // 3) Neues Overlay generieren (direkter Funktionsaufruf, kein HTTP-Fetch)
    const gen = await generateOverlay(tool, {
        ...body.variables,
        namespace: project,
    });
    if (!gen.success) {
        return NextResponse.json({ error: gen.error || 'Generation failed' }, { status: 500 });
    }

    // 4) Verschiebe das frisch erstellte Overlay in das Projekt‑Verzeichnis
    const overlayName = gen.overlay; // z.B. "mariadb-168..."
    const src = path.join(process.cwd(), 'generated-overlays', overlayName);
    const dest = path.join(projDir, overlayName);
    await fs.rename(src, dest);

    return NextResponse.json({ overlay: `${project}/${overlayName}` }, { status: 201 });
}
