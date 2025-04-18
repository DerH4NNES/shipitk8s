// app/api/overlays/[overlay]/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

interface PVC {
    name: string;
    storage: string;
}
interface IngressInfo {
    name: string;
    hosts: string[];
}
interface ServiceInfo {
    name: string;
    type: string;
    ports: { port: number; targetPort: number }[];
}
interface DeploymentInfo {
    name: string;
    replicas: number;
    containers: { name: string; image: string }[];
}
interface OverlayDetail {
    service: string;
    path: string;
    namespace: string;
    createdAt: number;
    pvcs: PVC[];
    ingresses: IngressInfo[];
    services: ServiceInfo[];
    deployments: DeploymentInfo[];
    cpuTotal?: string;
    memTotal?: string;
    rawYaml: string;
}

export async function GET(_req: Request, context: { params: { overlay: string } }) {
    const { overlay } = await context.params;
    const filePath = path.join(process.cwd(), 'generated-overlays', overlay, 'all.yaml');

    try {
        const rawYaml = await fs.readFile(filePath, 'utf8');
        const docs: any = yaml.loadAll(rawYaml);

        const detail: OverlayDetail = {
            path: overlay,
            createdAt: Number(overlay.split('-').pop()!),
            namespace: '',
            service: '',
            pvcs: [],
            ingresses: [],
            services: [],
            deployments: [],
            rawYaml,
        };

        // Namespace
        const nsDoc = docs.find((d: any) => d.kind === 'Namespace');
        if (nsDoc) detail.namespace = nsDoc.metadata.name;

        // Service name (Deployment name)
        const depDoc = docs.find((d: any) => d.kind === 'Deployment');
        if (depDoc) detail.service = depDoc.metadata.name;

        // PVCs
        for (const doc of docs) {
            if (doc.kind === 'PersistentVolumeClaim') {
                detail.pvcs.push({
                    name: doc.metadata.name,
                    storage: doc.spec.resources.requests.storage,
                });
            }
        }

        // Ingress
        for (const doc of docs) {
            if (doc.kind === 'Ingress') {
                detail.ingresses.push({
                    name: doc.metadata.name,
                    hosts: doc.spec.rules?.map((r: any) => r.host) || [],
                });
            }
        }

        // Services
        for (const doc of docs) {
            if (doc.kind === 'Service') {
                detail.services.push({
                    name: doc.metadata.name,
                    type: doc.spec.type || 'ClusterIP',
                    ports: (doc.spec.ports || []).map((p: any) => ({
                        port: p.port,
                        targetPort: p.targetPort,
                    })),
                });
            }
        }

        // Deployments
        for (const doc of docs) {
            if (doc.kind === 'Deployment') {
                detail.deployments.push({
                    name: doc.metadata.name,
                    replicas: doc.spec.replicas,
                    containers: (doc.spec.template.spec.containers || []).map((c: any) => ({
                        name: c.name,
                        image: c.image,
                    })),
                });
            }
        }

        // Sum resource limits
        let cpu = 0,
            mem = 0;
        for (const dep of detail.deployments) {
            // find the original doc to read resources
            const orig = docs.find((d: any) => d.kind === 'Deployment' && d.metadata.name === dep.name);
            orig?.spec.template.spec.containers.forEach((c: any) => {
                const lim = c.resources?.limits;
                if (lim?.cpu) cpu += parseCpu(lim.cpu);
                if (lim?.memory) mem += parseMem(lim.memory);
            });
        }
        if (cpu) detail.cpuTotal = cpu + 'm';
        if (mem) detail.memTotal = mem + 'Mi';

        return NextResponse.json(detail);
    } catch {
        return NextResponse.json({ error: 'Overlay not found or parse error' }, { status: 404 });
    }
}

function parseCpu(s: string): number {
    if (s.endsWith('m')) return parseInt(s.slice(0, -1), 10);
    return Math.round(parseFloat(s) * 1000);
}

function parseMem(s: string): number {
    if (s.endsWith('Gi')) return Math.round(parseFloat(s) * 1024);
    if (s.endsWith('Mi')) return parseInt(s.slice(0, -2), 10);
    // fallback bytes → Mi
    return Math.round(parseFloat(s) / (1024 * 1024));
}
