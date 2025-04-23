'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';

interface ToolDeployModalProps {
    project: string;
    tool: string;
    show: boolean;
    onHide: () => void;
    onDeployed: (overlayPath: string) => void;
}

interface Variable {
    name: string;
    type: string;
    default?: any;
}

interface ServiceMeta {
    name: string;
    variables: Variable[];
}

const fetchMeta = async (tool: string): Promise<ServiceMeta> => fetch(`/api/services/${tool}`).then((r) => r.json());

const fetchExistingValues = async (project: string, tool: string): Promise<Record<string, any> | null> => {
    const res = await fetch(`/api/projects/${project}/tools/${tool}`);
    return res.ok ? res.json() : null;
};

function useToolConfig(show: boolean, project: string, tool: string) {
    const [meta, setMeta] = useState<ServiceMeta | null>(null);
    const [vars, setVars] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!show) return;
        setLoading(true);
        setError(null);

        (async () => {
            try {
                const m = await fetchMeta(tool);
                const existing = (await fetchExistingValues(project, tool))?.variables ?? {};
                const merged: Record<string, any> = {};

                m.variables.forEach((v) => {
                    merged[v.name] = existing?.[v.name] ?? v.default ?? (v.type === 'number' ? 0 : '');
                });

                setMeta(m);
                setVars(merged);
            } catch {
                setError('Could not load metadata');
                setMeta(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [show, project, tool]);

    return { meta, vars, setVars, loading, error };
}

export function ToolConfigureModal({ project, tool, show, onHide, onDeployed }: ToolDeployModalProps) {
    const { meta, vars, setVars, loading, error } = useToolConfig(show, project, tool);
    const [creating, setCreating] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleDeploy = useCallback(async () => {
        setCreating(true);
        setSubmitError(null);
        try {
            const res = await fetch(`/api/projects/${project}/tools/${tool}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ variables: vars }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Service creation failed');
            onHide();
            onDeployed(json.overlay);
        } catch (e: any) {
            setSubmitError(e.message);
        } finally {
            setCreating(false);
        }
    }, [project, tool, vars, onHide, onDeployed]);

    return (
        <Modal show={show} onHide={onHide} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    Deploy {tool} to project "{project}"
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {loading ? (
                    <div className="text-center py-3">
                        <Spinner animation="border" />
                    </div>
                ) : meta ? (
                    <>
                        {error && <Alert variant="danger">{error}</Alert>}

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
                    </>
                ) : (
                    <Alert variant="danger">Failed to load service metadata.</Alert>
                )}
                {submitError && <Alert variant="danger">{submitError}</Alert>}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={creating}>
                    Cancel
                </Button>
                <Button onClick={handleDeploy} disabled={creating || loading || !meta}>
                    {creating ? 'Creating…' : 'Save'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
