import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { template } from 'lodash-es';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

async function loadMeta(tool: string) {
    const svcYamlPath = path.join(process.cwd(), 'base-deployments', tool, `${tool}.yaml`);

    try {
        return yaml.load(await fs.readFile(svcYamlPath, 'utf8'));
    } catch (e: any) {
        return { success: false, error: `Service meta not found: ${e.message}` };
    }
}

export async function generateOverlay(
    project: string,
    tool: string,
    vars: Record<string, any>,
): Promise<{ success: true; overlay: string } | { success: false; error: string }> {
    let svcMeta: any;
    try {
        svcMeta = await loadMeta(tool);
    } catch (e: any) {
        return { success: false, error: `Service meta not found: ${e.message}` };
    }

    // 2) Variablen‑Mapping, Namespace aus vars.namespace
    const namespace = vars.namespace as string;
    const allVars: Record<string, any> = { name: tool, namespace };
    (svcMeta.variables || []).forEach((v: any) => {
        allVars[v.name] = v.name === 'namespace' ? namespace : (vars[v.name] ?? v.default);
    });

    // 3) Overlay‑Verzeichnis anlegen
    const overlayDir = path.join(process.cwd(), 'generated-overlays', project, tool);
    console.log('create path', overlayDir);
    await fs.mkdir(overlayDir, { recursive: true });

    // 4) Patch‑Templates rendern
    const tplDir = path.join(process.cwd(), 'base-deployments', tool, 'patch-templates');
    const files = await fs.readdir(tplDir);
    for (const file of files) {
        if (!file.match(/\.(ya?ml)$/i)) continue;
        const tpl = await fs.readFile(path.join(tplDir, file), 'utf8');
        const fn = template(tpl, { interpolate: /\$\{([\s\S]+?)\}/g });
        const rendered = fn(allVars);
        await fs.writeFile(path.join(overlayDir, file), rendered);
    }

    // 5) namespace.yaml
    const ns = {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: { name: namespace },
    };
    await fs.writeFile(path.join(overlayDir, 'namespace.yaml'), yaml.dump(ns));

    // 6) kustomization.yaml
    const kustom = {
        apiVersion: 'kustomize.config.k8s.io/v1beta1',
        kind: 'Kustomization',
        namespace,
        resources: [`../../../base-deployments/${tool}/k8s-deployment`, 'namespace.yaml'],
        patches: files.filter((f) => f.endsWith('.yaml')).map((f) => ({ path: f })),
    };
    await fs.writeFile(path.join(overlayDir, 'kustomization.yaml'), yaml.dump(kustom));

    // 7) kustomize build
    try {
        const { stdout } = await exec(`kustomize build ${overlayDir}`);
        await fs.writeFile(path.join(overlayDir, 'all.yaml'), stdout);
        return { success: true, overlay: tool };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
