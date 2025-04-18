// src/lib/overlayParser.ts
import { Overlay } from '@/components/OverlayCard';

export function buildOverlayFromManifests(docs: any[], overlayPath: string): Overlay {
    // timestamp aus dem Pfad extrahieren
    const id = overlayPath.split('-').pop()!;
    const createdAt = Number(id);

    // Basis‑Felder
    const overlay: Overlay = {
        service: docs.find((d) => d.kind === 'Deployment')?.metadata?.name || '',
        path: overlayPath,
        namespace: docs.find((d) => d.kind === 'Namespace')?.metadata?.name || '',
        createdAt,
        pvcs: [],
        ingresses: [],
    };

    // PVCs sammeln
    for (const doc of docs) {
        if (doc.kind === 'PersistentVolumeClaim') {
            const { name } = doc.metadata;
            const storage = doc.spec?.resources?.requests?.storage;
            overlay.pvcs.push({ name, storage });
        }
    }

    // Ingress‑Rules sammeln
    for (const doc of docs) {
        if (doc.kind === 'Ingress') {
            const name = doc.metadata.name;
            const hosts = doc.spec?.rules?.map((r: any) => r.host) || [];
            overlay.ingresses.push({ name, hosts });
        }
    }

    // Resource‑Limits summieren
    let cpuTotal = 0,
        memTotal = 0;
    for (const doc of docs) {
        if ((doc.kind === 'Deployment' || doc.kind === 'StatefulSet') && doc.spec?.template?.spec?.containers) {
            for (const c of doc.spec.template.spec.containers) {
                const lim = c.resources?.limits;
                if (lim?.cpu) cpuTotal += parseCpu(lim.cpu);
                if (lim?.memory) memTotal += parseMemory(lim.memory);
            }
        }
    }
    if (cpuTotal) overlay.cpuTotal = cpuTotal + 'm';
    if (memTotal) overlay.memTotal = memTotal + 'Mi';

    return overlay;
}

// CPU in millicores umrechnen
function parseCpu(cpu: string): number {
    if (cpu.endsWith('m')) return parseInt(cpu.slice(0, -1), 10);
    return parseFloat(cpu) * 1000;
}

// Memory in Mi umrechnen
function parseMemory(mem: string): number {
    if (mem.endsWith('Gi')) return parseFloat(mem) * 1024;
    if (mem.endsWith('Mi')) return parseFloat(mem);
    return parseFloat(mem) / (1024 * 1024);
}
