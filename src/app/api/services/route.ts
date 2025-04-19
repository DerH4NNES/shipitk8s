import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SERVICES_ROOT = path.join(process.cwd(), 'base-deployments');

export async function GET() {
    let services: string[] = [];
    try {
        const entries = await fs.readdir(SERVICES_ROOT, { withFileTypes: true });
        services = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
        // Kein base-deployments‑Ordner oder leer
    }
    return NextResponse.json({ services });
}
