'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import moment from 'moment';
import 'moment/locale/de';

interface OverlayEntry {
    path: string; // e.g. "project/tool-<timestamp>"
    tool: string;
    id: string;
}

interface ServiceMeta {
    name: string;
    variables: { name: string; type: string; default?: any }[];
}

export default function ProjectDetailPage() {
    const { project } = useParams<{ project: string }>();
    const [overlays, setOverlays] = useState<OverlayEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [available, setAvailable] = useState<string[]>([]);
    const [selected, setSelected] = useState('');
    const [meta, setMeta] = useState<ServiceMeta | null>(null);
    const [vars, setVars] = useState<Record<string, any>>({});
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load existing overlays and services
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`/api/projects/${project}/tools`).then((r) => r.json()),
            fetch('/api/services').then((r) => r.json()),
        ])
            .then(([ovJson, svcJson]) => {
                const ov: OverlayEntry[] = ovJson.overlays || [];
                setOverlays(ov);
                const svc: string[] = svcJson.services || [];
                const taken = new Set(ov.map((o) => o.tool));
                setAvailable(svc.filter((s) => !taken.has(s)));
            })
            .finally(() => setLoading(false));
    }, [project]);

    // Reset modal state
    const openAdd = () => {
        setSelected('');
        setMeta(null);
        setVars({});
        setError(null);
        setShowAdd(true);
    };

    // Load metadata when a tool is selected
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

    // Handle deploy (Add Tool)
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
            setShowAdd(false);
            // refresh list
            const ov = await fetch(`/api/projects/${project}/tools`).then((r) => r.json());
            setOverlays(ov.overlays || []);
            setAvailable((av) => av.filter((s) => s !== selected));
        }
        setCreating(false);
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <Row className="mb-4">
                <Col>
                    <h2>Project: {project}</h2>
                </Col>
                <Col xs="auto">
                    <Button onClick={openAdd} disabled={available.length === 0}>
                        + Add Tool
                    </Button>
                </Col>
            </Row>

            {overlays.length ? (
                <Row xs={1} sm={2} md={3} className="g-4">
                    {overlays.map((o) => {
                        const ts = Number(o.id);
                        const overlaySlug = `${o.tool}-${o.id}`;
                        return (
                            <Col key={o.path}>
                                <Link
                                    href={`/projects/${project}/overlays/${overlaySlug}`}
                                    className="text-decoration-none"
                                >
                                    <Card className="h-100 hover-shadow">
                                        <Card.Header className="d-flex justify-content-between">
                                            <span className="text-capitalize">{o.tool}</span>
                                            <small title={moment(ts).format('LLLL')}>{moment(ts).fromNow()}</small>
                                        </Card.Header>
                                    </Card>
                                </Link>
                            </Col>
                        );
                    })}
                </Row>
            ) : (
                <Alert variant="info">No tools deployed yet in this project.</Alert>
            )}

            {/* Add Tool Modal */}
            <Modal show={showAdd} onHide={() => setShowAdd(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Add Tool to project &quot;{project}&quot;</Modal.Title>
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
                                                    [v.name]:
                                                        v.type === 'number' ? Number(e.target.value) : e.target.value,
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
                    <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!selected || creating}>
                        {creating ? 'Deploying…' : 'Deploy'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
