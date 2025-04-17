'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import moment from 'moment';
import 'moment/locale/de';

interface PVC {
    name: string;
    storage: string;
}

interface IngressInfo {
    name: string;
    hosts: string[];
}

interface Overlay {
    service: string;
    id: string;
    namespace: string;
    path: string;
    createdAt: string;
    pvcs: PVC[];
    ingresses: IngressInfo[];
    cpuTotal?: string;
    memTotal?: string;
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
        <div className="container py-4">
            <h1 className="mb-4">⛓️ Overlays Übersicht</h1>
            <div className="row g-4">
                {overlays.map(o => {
                    const ts = parseInt(o.id, 10);
                    const rel = moment(ts).fromNow();
                    const exact = moment(ts).format('LLLL');
                    return (
                        <div className="col-sm-6 col-lg-4" key={o.path}>
                            <div className="card h-100 shadow-sm">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <span className="h5 mb-0">{o.service}</span>
                                    <small className="text-muted" title={exact}>
                                        {rel}
                                    </small>
                                </div>

                                <div className="card-body d-flex flex-column">
                                    <p className="mb-3">
                    <span className="badge bg-info text-dark">
                      Namespace: {o.namespace || '–'}
                    </span>
                                    </p>

                                    <div className="mb-3">
                                        <h6 className="fw-semibold">PVCs</h6>
                                        {o.pvcs.length > 0 ? (
                                            <ul className="list-group list-group-sm">
                                                {o.pvcs.map(p => (
                                                    <li
                                                        className="list-group-item d-flex justify-content-between align-items-center"
                                                        key={p.name}
                                                    >
                                                        {p.name}
                                                        <span className="badge bg-secondary">
                              {p.storage}
                            </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted mb-0">Keine PVCs</p>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <h6 className="fw-semibold">Ingress</h6>
                                        {o.ingresses.length > 0 ? (
                                            <ul className="list-group list-group-sm">
                                                {o.ingresses.map(i => (
                                                    <li className="list-group-item" key={i.name}>
                                                        <strong>{i.name}</strong>
                                                        <br />
                                                        {i.hosts.map((h, idx) => (
                                                            <span
                                                                className="badge bg-light text-dark me-1"
                                                                key={idx}
                                                            >
                                {h}
                              </span>
                                                        ))}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-muted mb-0">Kein Ingress</p>
                                        )}
                                    </div>

                                    {(o.cpuTotal || o.memTotal) && (
                                        <div className="mb-3">
                                            <h6 className="fw-semibold">Resource Limits</h6>
                                            <ul className="list-inline mb-0">
                                                {o.cpuTotal && (
                                                    <li className="list-inline-item me-2">
                            <span className="badge bg-warning text-dark">
                              CPU: {o.cpuTotal}
                            </span>
                                                    </li>
                                                )}
                                                {o.memTotal && (
                                                    <li className="list-inline-item">
                            <span className="badge bg-warning text-dark">
                              RAM: {o.memTotal}
                            </span>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="mt-auto"></div>
                                </div>

                                <div className="card-footer bg-transparent">
                                    <Link
                                        href={`/overlays/${o.path}`}
                                        className="btn btn-outline-primary w-100"
                                    >
                                        Details ansehen
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {overlays.length === 0 && (
                    <p className="text-center text-muted">Keine Overlays gefunden.</p>
                )}
            </div>
        </div>
    );
}
