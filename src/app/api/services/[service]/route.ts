import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export async function GET(request: NextRequest, context: any) {
    const { service } = (await context.params) as { service: string };
    const yamlPath = path.join(process.cwd(), 'base-deployments', service, `${service}.yaml`);

    try {
        const content = await fs.readFile(yamlPath, 'utf8');
        const meta = yaml.load(content) as {
            name: string;
            description?: string;
            variables: { name: string; type: string; default?: any }[];
        };
        return NextResponse.json(meta);
    } catch {
        return NextResponse.json({ error: `Service '${service}' not found` }, { status: 404 });
    }
}
