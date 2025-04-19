// src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const OVERLAYS_ROOT = path.join(process.cwd(), 'generated-overlays');
const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function GET() {
    try {
        const entries = await fs.readdir(OVERLAYS_ROOT, { withFileTypes: true });
        const projects = entries.filter((e) => e.isDirectory()).map((e) => e.name);
        return NextResponse.json({ projects });
    } catch {
        // noch kein generated‑overlays‑Ordner
        return NextResponse.json({ projects: [] });
    }
}

export async function POST(req: Request) {
    const { id } = await req.json();
    if (typeof id !== 'string' || !SLUG_REGEX.test(id)) {
        return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const projDir = path.join(OVERLAYS_ROOT, id);
    try {
        // existenz prüfen
        await fs.access(projDir);
        return NextResponse.json({ error: `Project '${id}' already exists` }, { status: 409 });
    } catch {
        // Ordner anlegen
        await fs.mkdir(projDir, { recursive: true });
        return NextResponse.json({ project: id }, { status: 201 });
    }
}
