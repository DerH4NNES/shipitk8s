import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { template } from 'lodash-es';
import { exec } from 'node:child_process';

export async function POST(req: Request, context: { params: { service: string } }) {
    // 1. Route‑Param auslesen
    const { service } = await context.params;
    const body = await req.json();

    // 2. Metadaten laden
    const svcYamlPath = path.join(process.cwd(), 'base-deployments', service, `${service}.yaml`);
    const svcMeta: any = yaml.load(await fs.readFile(svcYamlPath, 'utf8'));

    // 3. Variablen zusammenstellen
    //    - body.namespace übernimmt den Projekt‑Slug
    const vars: Record<string, any> = { name: service };
    if (body.namespace) {
        vars.namespace = body.namespace;
    }
    (svcMeta.variables || []).forEach((v: any) => {
        if (v.name === 'namespace') {
            // namespace kommt aus body.namespace
            vars.namespace = vars.namespace ?? v.default;
        } else {
            vars[v.name] = body[v.name] ?? v.default;
        }
    });

    // 4. Overlay‑Ordner anlegen
    const id = Date.now();
    const overlayName = `${service}-${id}`;
    const overlayDir = path.join(process.cwd(), 'generated-overlays', overlayName);
    await fs.mkdir(overlayDir, { recursive: true });

    // 5. Patch‑Templates rendern
    const tplDir = path.join(process.cwd(), 'base-deployments', service, 'patch-templates');
    const files = await fs.readdir(tplDir);
    const patchFiles: string[] = [];
    for (const file of files) {
        if (!file.match(/\.(ya?ml)$/i)) continue;
        const tplContent = await fs.readFile(path.join(tplDir, file), 'utf8');
        const fn = template(tplContent, {
            interpolate: /\$\{([\s\S]+?)\}/g,
        });
        const rendered = fn(vars);
        await fs.writeFile(path.join(overlayDir, file), rendered);
        patchFiles.push(file);
    }

    // 6. namespace.yaml schreiben
    const ns = {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name: vars.namespace },
    };
    await fs.writeFile(path.join(overlayDir, 'namespace.yaml'), yaml.dump(ns));

    // 7. kustomization.yaml erstellen
    const kustom = {
        apiVersion: 'kustomize.config.k8s.io/v1beta1',
        kind: 'Kustomization',
        namespace: vars.namespace,
        resources: [
            `../../base-deployments/${service}/k8s-deployment`,
            'namespace.yaml',
            // Secret-Resource (falls vorhanden gerendert)
            ...patchFiles.filter((f) => f === 'secret.yaml'),
        ],
        patches: patchFiles.filter((f) => f !== 'secret.yaml').map((f) => ({ path: f })),
    };
    await fs.writeFile(path.join(overlayDir, 'kustomization.yaml'), yaml.dump(kustom));

    // 8. kustomize build
    try {
        const { stdout, stderr } = await exec(`kustomize build ${overlayDir}`);
        if (stderr) console.error(stderr);
        await fs.writeFile(path.join(overlayDir, 'all.yaml'), stdout || 'Error');
        return NextResponse.json({
            success: true,
            overlay: overlayName,
            builtYamlPath: `generated-overlays/${overlayName}/all.yaml`,
        });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
