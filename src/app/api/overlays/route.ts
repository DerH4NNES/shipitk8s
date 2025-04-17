// app/api/overlays/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export async function GET() {
    const overlaysDir = path.join(process.cwd(), 'generated-overlays');
    let entries: string[];
    try {
        entries = await fs.readdir(overlaysDir);
    } catch {
        return NextResponse.json({ overlays: [] });
    }

    const overlays: {
        service: string;
        id: string;
        namespace: string;
        path: string;
    }[] = [];

    for (const name of entries) {
        const overlayPath = path.join(overlaysDir, name);
        const stat = await fs.stat(overlayPath);
        if (!stat.isDirectory()) continue;

        // service und id aus Ordnernamen extrahieren
        const [service, ...idParts] = name.split('-');
        const id = idParts.join('-');

        // namespace.yaml einlesen
        let namespace = '';
        try {
            const nsFile = await fs.readFile(
                path.join(overlayPath, 'namespace.yaml'),
                'utf8'
            );
            const nsMeta = yaml.load(nsFile) as any;
            namespace = nsMeta.metadata?.name || '';
        } catch {
            // falls fehlt, bleibt namespace leer
        }

        overlays.push({ service, id, namespace, path: name });
    }

    return NextResponse.json({ overlays });
}
