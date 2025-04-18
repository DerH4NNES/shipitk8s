// app/api/services/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export async function GET() {
    const baseDir = path.join(process.cwd(), 'base-deployments');
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const services: { name: string; description: string; variables: any[] }[] = [];

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const serviceName = entry.name;
        const metaPath = path.join(baseDir, serviceName, `${serviceName}.yaml`);
        try {
            const file = await fs.readFile(metaPath, 'utf8');
            const meta: any = yaml.load(file);
            services.push({
                name: serviceName,
                description: meta.description || '',
                variables: meta.variables || [],
            });
        } catch {
            // fehlerhafte oder fehlende Meta-Datei überspringen
        }
    }

    return NextResponse.json({ services });
}
