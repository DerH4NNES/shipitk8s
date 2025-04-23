import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { POST as authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';

const OVERLAYS_ROOT = path.join(process.cwd(), 'generated-overlays');
const SLUG_REGEX = /^[a-z0-9-]+$/;

const titleCase = (slug: string) =>
    slug
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');

export async function GET() {
    try {
        const entries = await fs.readdir(OVERLAYS_ROOT, { withFileTypes: true });

        const projects = await Promise.all(
            entries
                .filter((e) => e.isDirectory())
                .map(async (e) => {
                    const metaFile = path.join(OVERLAYS_ROOT, e.name, 'project.json');
                    try {
                        const raw = await fs.readFile(metaFile, 'utf8');
                        return JSON.parse(raw);
                    } catch {
                        return null; // fehlende project.json ⇒ nicht listen
                    }
                }),
        );

        return NextResponse.json({ projects: projects.filter(Boolean) });
    } catch {
        return NextResponse.json({ projects: [] });
    }
}

export async function POST(req: NextRequest) {
    const { id } = await req.json();
    if (typeof id !== 'string' || !SLUG_REGEX.test(id)) {
        return NextResponse.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const projDir = path.join(OVERLAYS_ROOT, id);

    try {
        await fs.access(projDir);
        return NextResponse.json({ error: `Project '${id}' already exists` }, { status: 409 });
    } catch {
        await fs.mkdir(projDir, { recursive: true });

        const session: any = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
        }

        const now = new Date().toISOString();

        const meta = {
            id,
            name: titleCase(id),
            owner: {
                id: session.sub,
                name: session.user?.name ?? '',
                email: session.user?.email ?? '',
            },
            createdAt: now,
            overlays: [],
        };

        await fs.writeFile(path.join(projDir, 'project.json'), JSON.stringify(meta, null, 2));

        return NextResponse.json({ project: meta }, { status: 201 });
    }
}
