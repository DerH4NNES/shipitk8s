// app/api/generate/[service]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { template } from 'lodash-es';
import {exec} from "node:child_process";

export async function POST(
    req: Request,
    context: { params: { service: string } }
) {
    // Route parameters müssen awaitet werden
    const { service } = await context.params;
    const body = await req.json();

    // Metadaten laden
    const svcYamlPath = path.join(
        process.cwd(),
        'base-deployments',
        service,
        `${service}.yaml`
    );
    const svcMeta: any = yaml.load(await fs.readFile(svcYamlPath, 'utf8'));

    // Variablen zusammenstellen (inkl. name)
    const vars: Record<string, any> = { name: service };
    (svcMeta.variables || []).forEach((v: any) => {
        vars[v.name] = body[v.name] ?? v.default;
    });

    // Overlay-Ordner anlegen
    const id = Date.now();
    const overlayDir = path.join(
        process.cwd(),
        'generated-overlays',
        `${service}-${id}`
    );
    await fs.mkdir(overlayDir, { recursive: true });

    // Alle Templates rendern
    const tplDir = path.join(
        process.cwd(),
        'base-deployments',
        service,
        'patch-templates'
    );
    const files = await fs.readdir(tplDir);
    const patchFiles: string[] = [];

    for (const file of files) {
        if (!file.match(/\.(ya?ml)$/i)) continue;
        const tplContent = await fs.readFile(path.join(tplDir, file), 'utf8');
        const renderFn = template(tplContent, {
            interpolate: /\$\{([\s\S]+?)\}/g
        });
        const rendered = renderFn(vars);

        await fs.writeFile(path.join(overlayDir, file), rendered);
        patchFiles.push(file);
    }

    // kustomization.yaml dynamisch erzeugen
    const kustom = {
        resources: [
            `../../base-deployments/${service}/k8s-deployment`,
            'namespace.yaml'
        ],
        namespace: vars.namespace,
        patches: patchFiles.map(file => ({ path: file }))
    };
    await fs.writeFile(
        path.join(overlayDir, 'kustomization.yaml'),
        yaml.dump(kustom)
    );



    // Namespace-Patch anlegen
    const ns = {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name: vars.namespace }
    };
    await fs.writeFile(
        path.join(overlayDir, 'namespace.yaml'),
        yaml.dump(ns)
    );

    try {
        // falls du LoadRestrictionsNone brauchst, erhöhe den Befehl um --load-restrictor=none
        const { stdout, stderr } = await exec(
            `kustomize build ${overlayDir}`
        );
        if (stderr) {
            console.error('kustomize stderr:', stderr);
        }
        // Optional: schreibe das gebaute YAML in eine Datei
        await fs.writeFile(path.join(overlayDir, 'all.yaml'), stdout || "Error");

        // 5. Rückmeldung an den Client
        return NextResponse.json({
            success: true,
            overlay: `${service}-${id}`,
            builtYamlPath: `generated-overlays/${service}-${id}/all.yaml`
        });
    } catch (err: any) {
        console.error('kustomize build failed:', err);
        return NextResponse.json({
            success: false,
            error: err.message
        }, { status: 500 });
    }
}