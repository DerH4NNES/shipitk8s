'use client';

import { useEffect, useState } from 'react';
import { Overlay, OverlayCard } from '@/components/OverlayCard';

export default function OverlaysPage() {
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [deploying, setDeploying] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/overlays')
            .then((r) => r.json())
            .then((data) => setOverlays(data.overlays));
    }, []);

    const handleDeploy = async (path: string) => {
        setDeploying(path);
        await fetch(`/api/deploy/${path}`, { method: 'POST' });
        setDeploying(null);
    };

    return (
        <div className="container py-4">
            <h1 className="mb-4">⛓️ Overlays Übersicht</h1>
            <div className="row g-4">
                {overlays.map((o) => (
                    <OverlayCard key={o.path} o={o} deploying={deploying === o.path} onDeploy={handleDeploy} />
                ))}
            </div>
        </div>
    );
}
