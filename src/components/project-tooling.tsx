// Shared tooling for ProjectDetailPage
// Exports:
//   useProjectOverlays(project)
//   OverlayCard
//   AddToolModal
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Card, Col, Form, Modal } from 'react-bootstrap';
import moment from 'moment';

export interface Owner {
    id: string;
    name: string;
    email: string;
    updatedAt: string;
}

export interface OverlayEntry {
    path: string;
    tool: string;
    app: {
        variables: Record<string, any>;
        owner?: Owner;
    } | null;
}

export interface ServiceMeta {
    name: string;
    variables: { name: string; type: string; default?: any }[];
}

export function useProjectOverlays(project: string) {
    const [overlays, setOverlays] = useState<OverlayEntry[]>([]);
    const [available, setAvailable] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ovJson, svcJson] = await Promise.all([
                fetch(`/api/projects/${project}/tools`).then((r) => r.json()),
                fetch('/api/services').then((r) => r.json()),
            ]);
            setOverlays(ovJson.overlays || []);
            const taken = new Set((ovJson.overlays || []).map((o: OverlayEntry) => o.tool));
            setAvailable((svcJson.services || []).filter((s: string) => !taken.has(s)));
        } catch (e: any) {
            setError(e.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [project]);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    return { overlays, available, loading, error, refresh: fetchAll };
}

interface OverlayCardProps {
    overlay: OverlayEntry;
    project: string;
}

export function OverlayCard({ overlay: o, project }: OverlayCardProps) {
    return (
        <Col>
            <Link href={`/projects/${project}/overlays/${o.tool}`} className="text-decoration-none">
                <Card className="h-100 hover-shadow">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                        <span className="text-capitalize">{o.tool}</span>
                        {o.app?.owner?.name && <small className="text-muted">{o.app.owner.name}</small>}
                    </Card.Header>
                    {o.app?.owner?.updatedAt && (
                        <Card.Footer>
                            <small className="text-muted" title={moment(o.app.owner.updatedAt).format('LLLL')}>
                                updated {moment(o.app.owner.updatedAt).fromNow()}
                            </small>
                        </Card.Footer>
                    )}
                </Card>
            </Link>
        </Col>
    );
}

interface AddToolModalProps {
    project: string;
    available: string[];
    show: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export function AddToolModal({ project, available, show, onClose, onCreated }: AddToolModalProps) {
    const [selected, setSelected] = useState('');
    const [meta, setMeta] = useState<ServiceMeta | null>(null);
    const [vars, setVars] = useState<Record<string, any>>({});
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!selected) return;
        fetch(`/api/services/${selected}`)
            .then((r) => r.json())
            .then((json: ServiceMeta) => {
                setMeta(json);
                const init: Record<string, any> = {};
                json.variables.forEach((v) => {
                    init[v.name] = v.default ?? '';
                });
                setVars(init);
            })
            .catch(() => setMeta(null));
    }, [selected]);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        const res = await fetch(`/api/projects/${project}/tools/${selected}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables: vars }),
        });
        const json = await res.json();
        if (!res.ok) {
            setError(json.error || 'Deployment failed');
        } else {
            onClose();
            onCreated();
        }
        setCreating(false);
    };

    const reset = () => {
        setSelected('');
        setMeta(null);
        setVars({});
        setError(null);
    };

    useEffect(() => {
        if (!show) reset();
    }, [show]);

    return (
        <Modal show={show} onHide={onClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Add Tool to project "{project}"</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Select Tool</Form.Label>
                        <Form.Select value={selected} onChange={(e) => setSelected(e.target.value)}>
                            <option value="">-- choose --</option>
                            {available.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    {meta && (
                        <>
                            <h5>Configuration Variables</h5>
                            {meta.variables.map((v) => (
                                <Form.Group className="mb-3" key={v.name}>
                                    <Form.Label>{v.name}</Form.Label>
                                    <Form.Control
                                        type={v.type === 'number' ? 'number' : 'text'}
                                        value={vars[v.name]}
                                        onChange={(e) =>
                                            setVars({
                                                ...vars,
                                                [v.name]: v.type === 'number' ? Number(e.target.value) : e.target.value,
                                            })
                                        }
                                    />
                                </Form.Group>
                            ))}
                        </>
                    )}

                    {error && <Alert variant="danger">{error}</Alert>}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={creating}>
                    Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!selected || creating}>
                    {creating ? 'Deploying…' : 'Deploy'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
