'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';

interface ToolDeployModalProps {
    project: string;
    tool: string;
    show: boolean;
    onHide: () => void;
    onDeployed: (overlayPath: string) => void;
}

interface ServiceMeta {
    name: string;
    variables: { name: string; type: string; default?: any }[];
}

export function ToolDeployModal({ project, tool, show, onHide, onDeployed }: ToolDeployModalProps) {
    const [meta, setMeta] = useState<ServiceMeta | null>(null);
    const [vars, setVars] = useState<Record<string, any>>({});
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Metadaten laden
    useEffect(() => {
        if (!show) return;
        setLoadingMeta(true);
        fetch(`/api/services/${tool}`)
            .then((r) => r.json())
            .then((json) => {
                setMeta(json);
                const init: Record<string, any> = {};
                (json.variables || []).forEach((v: any) => {
                    init[v.name] = v.default ?? '';
                });
                setVars(init);
            })
            .catch(() => setMeta(null))
            .finally(() => setLoadingMeta(false));
    }, [show, tool]);

    // Deploy‑Handler
    const handleDeploy = async () => {
        setDeploying(true);
        setError(null);
        const res = await fetch(`/api/projects/${project}/tools/${tool}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables: vars }),
        });
        const json = await res.json();
        if (!res.ok) {
            setError(json.error || 'Deployment failed');
        } else {
            onHide();
            onDeployed(json.overlay);
        }
        setDeploying(false);
    };

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Deploy {tool} to project "{project}"
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loadingMeta ? (
                    <div className="text-center py-3">
                        <Spinner animation="border" />
                    </div>
                ) : meta ? (
                    <Form>
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
                    </Form>
                ) : (
                    <Alert variant="danger">Failed to load service metadata.</Alert>
                )}
                {error && <Alert variant="danger">{error}</Alert>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={deploying}>
                    Cancel
                </Button>
                <Button onClick={handleDeploy} disabled={deploying || loadingMeta || !meta}>
                    {deploying ? 'Deploying…' : 'Deploy'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
