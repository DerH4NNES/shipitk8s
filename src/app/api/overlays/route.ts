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
        createdAt: string;
        pvcs: { name: string; storage: string }[];
        ingresses: { name: string; hosts: string[] }[];
        cpuTotal?: string;
        memTotal?: string;
    }[] = [];

    for (const name of entries) {
        const overlayPath = path.join(overlaysDir, name);
        if (!(await fs.stat(overlayPath)).isDirectory()) continue;

        // service und id aus Ordnernamen
        const [service, ...idParts] = name.split('-');
        const id = idParts.join('-');
        const createdAt = new Date(Number(id)).toISOString();

        // namespace aus namespace.yaml
        let namespace = '';
        try {
            const nsFile = await fs.readFile(path.join(overlayPath, 'namespace.yaml'), 'utf8');
            const nsMeta = yaml.load(nsFile) as any;
            namespace = nsMeta.metadata?.name || '';
        } catch {
            // ignore
        }

        // all.yaml parsen
        const allYamlPath = path.join(overlayPath, 'all.yaml');
        let docs: any[] = [];
        try {
            const content = await fs.readFile(allYamlPath, 'utf8');
            docs = yaml.loadAll(content);
        } catch {
            // ignore if missing
        }

        // PVCs extrahieren
        const pvcs = docs
            .filter((d) => d.kind === 'PersistentVolumeClaim')
            .map((d) => ({
                name: d.metadata.name,
                storage: d.spec.resources.requests.storage as string,
            }));

        // Ingresses extrahieren
        const ingresses = docs
            .filter((d) => d.kind === 'Ingress')
            .map((d) => ({
                name: d.metadata.name,
                hosts: (d.spec.rules || []).map((r: any) => r.host),
            }));

        // Resource Limits aufsummieren
        let totalCpuMillicores = 0;
        let totalMemoryMi = 0;
        docs.forEach((d) => {
            if ((d.kind === 'Deployment' || d.kind === 'StatefulSet') && d.spec?.template?.spec?.containers) {
                d.spec.template.spec.containers.forEach((c: any) => {
                    const limits = c.resources?.limits || {};
                    // CPU
                    if (limits.cpu) {
                        const cpu = limits.cpu.toString();
                        if (cpu.endsWith('m')) {
                            totalCpuMillicores += parseInt(cpu.slice(0, -1), 10);
                        } else {
                            totalCpuMillicores += parseFloat(cpu) * 1000;
                        }
                    }
                    // Memory
                    if (limits.memory) {
                        const mem = limits.memory.toString().toUpperCase();
                        const value = parseFloat(mem);
                        if (mem.endsWith('GI')) {
                            totalMemoryMi += value * 1024;
                        } else if (mem.endsWith('MI')) {
                            totalMemoryMi += value;
                        } else if (mem.endsWith('KI')) {
                            totalMemoryMi += value / 1024;
                        } else {
                            totalMemoryMi += value / (1024 * 1024);
                        }
                    }
                });
            }
        });

        const cpuTotal =
            totalCpuMillicores >= 1000
                ? (totalCpuMillicores / 1000).toString().replace(/\.0$/, '') + 'CPU'
                : totalCpuMillicores + 'm';
        const memTotal =
            totalMemoryMi >= 1024
                ? (totalMemoryMi / 1024).toFixed(1).replace(/\.0$/, '') + 'Gi'
                : Math.round(totalMemoryMi) + 'Mi';

        overlays.push({
            service,
            id,
            namespace,
            path: name,
            createdAt,
            pvcs,
            ingresses,
            cpuTotal: totalCpuMillicores > 0 ? cpuTotal : undefined,
            memTotal: totalMemoryMi > 0 ? memTotal : undefined,
        });
    }

    return NextResponse.json({ overlays });
}
