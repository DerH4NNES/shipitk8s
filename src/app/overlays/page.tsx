'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import 'moment/locale/de';

interface Overlay {
    service: string;
    id: string;           // z.B. "1744902642372"
    namespace: string;
    path: string;
}

export default function OverlaysPage() {
    const [overlays, setOverlays] = useState<Overlay[]>([]);

    useEffect(() => {
        moment.locale('de');
        fetch('/api/overlays')
            .then(res => res.json())
            .then(data => setOverlays(data.overlays));
    }, []);

    return (
        <div className="container mt-4">
            <h1>Overlays Übersicht</h1>
            <div className="row">
                {overlays.map(o => {
                    // id in Number umwandeln
                    const ts = parseInt(o.id, 10);
                    return (
                        <div className="col-md-4 mb-3" key={o.path}>
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title">{o.service}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">
                                        Namespace: {o.namespace || '—'}
                                    </h6>
                                    <p className="card-text">ID: {o.id}</p>
                                    <p className="card-text">
                    <span title={moment(ts).format('LLLL')}>
                      {moment(ts).fromNow()}
                    </span>
                                    </p>
                                    <Link href={`/overlays/${o.path}`} className="card-link">
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {overlays.length === 0 && (
                    <p className="text-center">Keine Overlays gefunden.</p>
                )}
            </div>
        </div>
    );
}
