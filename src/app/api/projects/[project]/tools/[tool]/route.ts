import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { POST as authOptions } from '@/app/api/auth/[...nextauth]/route';
import fs from 'fs/promises';
import path from 'path';
import { generateOverlay } from '@/lib/generateOverlay';

export async function POST(req: NextRequest, { params }: { params: { project: string; tool: string } }) {
    const { project, tool } = params;
    const body = await req.json();

    const projDir = path.join(process.cwd(), 'generated-overlays', project);
    const toolDir = path.join(projDir, tool);

    try {
        await fs.access(projDir);
    } catch {
        return NextResponse.json({ error: `Project '${project}' not found` }, { status: 404 });
    }

    const gen = await generateOverlay(project, tool, {
        ...body.variables,
        namespace: project,
    });

    if (!gen.success) {
        return NextResponse.json({ error: gen.error || 'Generation failed' }, { status: 500 });
    }

    const session: any = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    const owner = {
        id: session.sub,
        name: session.user?.name ?? '',
        email: session.user?.email ?? '',
    };

    await fs.mkdir(toolDir, { recursive: true });
    await fs.writeFile(
        path.join(toolDir, 'app.json'),
        JSON.stringify({ variables: body.variables, name: tool, owner, updatedAt: new Date().toISOString() }, null, 2),
    );

    return NextResponse.json({ overlay: `${project}/${gen.overlay}` }, { status: 201 });
}

export async function GET(req: NextRequest, { params }: { params: { project: string; tool: string } }) {
    const { project, tool } = params;
    const toolDir = path.join(process.cwd(), 'generated-overlays', project, tool);

    try {
        const raw = await fs.readFile(path.join(toolDir, 'app.json'), 'utf8');
        const data = JSON.parse(raw);
        return NextResponse.json({ variables: data.variables, owner: data.owner });
    } catch {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}
