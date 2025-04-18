// components/OverlayCard.tsx
'use client';

import Link from 'next/link';
import moment from 'moment';
import 'moment/locale/de';
import { MouseEvent, ReactNode } from 'react';

export interface PVC {
    name: string;
    storage: string;
}
export interface IngressInfo {
    name: string;
    hosts: string[];
}

export interface Overlay {
    service: string;
    path: string;
    namespace: string;
    createdAt: number;
    pvcs: PVC[];
    ingresses: IngressInfo[];
    cpuTotal?: string;
    memTotal?: string;
}

interface Props {
    o: Overlay;
    deploying: boolean;
    onDeploy: (path: string) => void;
    detailsHref?: string; // Falls du eine individuelle URL brauchst
    detailsLabel?: ReactNode; // z.B. “Details” oder Icon
}

export function OverlayCard({ o, deploying, onDeploy, detailsHref, detailsLabel = 'Details' }: Props) {
    const rel = moment(o.createdAt).fromNow();
    const exact = moment(o.createdAt).format('LLLL');

    const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        onDeploy(o.path);
    };

    return (
        <div className="col-sm-6 col-lg-4">
            <div className="card h-100 shadow-sm">
                {/* Header */}
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{o.service}</h5>
                    <small className="text-muted" title={exact}>
                        {rel}
                    </small>
                </div>

                {/* Body */}
                <div className="card-body d-flex flex-column">
                    <p>
                        <strong>Namespace:</strong> {o.namespace}
                    </p>

                    <div className="mb-2">
                        <strong>PVCs:</strong>{' '}
                        {o.pvcs.length > 0 ? (
                            <ul className="list-unstyled mb-0">
                                {o.pvcs.map((p) => (
                                    <li key={p.name}>
                                        {p.name}: <span className="badge bg-secondary">{p.storage}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-muted ms-2">None</span>
                        )}
                    </div>

                    <div className="mb-2">
                        <strong>Ingress:</strong>{' '}
                        {o.ingresses.length > 0 ? (
                            <ul className="list-unstyled mb-0">
                                {o.ingresses.map((i) => (
                                    <li key={i.name}>
                                        {i.name}:{' '}
                                        {i.hosts.map((h) => (
                                            <span key={h} className="badge bg-light text-dark me-1">
                                                {h}
                                            </span>
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span className="text-muted ms-2">None</span>
                        )}
                    </div>

                    {(o.cpuTotal || o.memTotal) && (
                        <div className="mb-2">
                            <strong>Limits:</strong>{' '}
                            {o.cpuTotal && <span className="badge bg-warning text-dark me-1">CPU {o.cpuTotal}</span>}
                            {o.memTotal && <span className="badge bg-warning text-dark">RAM {o.memTotal}</span>}
                        </div>
                    )}

                    <div className="mt-auto"></div>
                </div>

                {/* Footer */}
                <div className="card-footer bg-transparent d-flex gap-2">
                    {/* Details-Button */}
                    <Link href={detailsHref ?? `/overlays/${o.path}`} className="btn btn-outline-primary flex-fill">
                        {detailsLabel}
                    </Link>

                    {/* Deploy-Button */}
                    <button className="btn btn-success flex-fill" disabled={deploying} onClick={handleClick}>
                        {deploying ? 'Deploying…' : 'Deploy'}
                    </button>
                </div>
            </div>
        </div>
    );
}
