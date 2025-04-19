import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

export async function GET(request: NextRequest, context: any) {
    const { project, overlay } = (await context.params) as { project: string; overlay: string };
    const filePath = path.join(process.cwd(), 'generated-overlays', project, overlay, 'all.yaml');

    try {
        const rawYaml = await fs.readFile(filePath, 'utf8');
        const docs: any = yaml.loadAll(rawYaml);

        // Baue ein minimales Detail‑Objekt
        const detail: any = {
            project,
            overlay,
            rawYaml,
            namespace: project,
            createdAt: Number(overlay.split('-').pop()),
            pvcs: [],
            ingresses: [],
            services: [],
            deployments: [],
        };

        for (const doc of docs) {
            switch (doc.kind) {
                case 'PersistentVolumeClaim':
                    detail.pvcs.push({
                        name: doc.metadata.name,
                        storage: doc.spec.resources.requests.storage,
                    });
                    break;
                case 'Ingress':
                    detail.ingresses.push({
                        name: doc.metadata.name,
                        hosts: doc.spec.rules?.map((r: any) => r.host) || [],
                    });
                    break;
                case 'Service':
                    detail.services.push({
                        name: doc.metadata.name,
                        type: doc.spec.type || 'ClusterIP',
                        ports: (doc.spec.ports || []).map((p: any) => ({
                            port: p.port,
                            targetPort: p.targetPort,
                        })),
                    });
                    break;
                case 'Deployment':
                    detail.deployments.push({
                        name: doc.metadata.name,
                        replicas: doc.spec.replicas,
                        containers: (doc.spec.template.spec.containers || []).map((c: any) => ({
                            name: c.name,
                            image: c.image,
                        })),
                    });
                    break;
            }
        }

        return NextResponse.json(detail);
    } catch {
        return NextResponse.json({ error: `Overlay '${overlay}' in project '${project}' not found` }, { status: 404 });
    }
}
