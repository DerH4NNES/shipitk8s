'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Accordion, Alert, Badge, Button, Card, Col, Container, ListGroup, Row, Spinner, Table } from 'react-bootstrap';
import { ToolConfigureModal } from '@/components/ToolConfigureModal';
import { RemoveDeploymentButton } from '@/components/RemoveDeploymentButton';

interface OverlayDetail {
    project: string;
    overlay: string;
    namespace: string;
    pvcs: { name: string; storage: string }[];
    ingresses: { name: string; hosts: string[] }[];
    services: { name: string; type: string; ports: { port: number; targetPort: number }[] }[];
    deployments: { name: string; replicas: number; containers: { name: string; image: string }[] }[];
    rawYaml: string;
}

export default function OverlayInProjectPage() {
    const { project, overlay } = useParams<{ project: string; overlay: string }>();
    const tool = overlay.split('-')[0];
    const [showConfigure, setShowConfigure] = useState(false);

    const router = useRouter();
    const [data, setData] = useState<OverlayDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleDeployed = (newOverlayPath: string) => {
        router.push(`/projects/${project}/overlays/${newOverlayPath.replace(project + '/', '')}`);
    };

    const handleDelete = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => {
            router.push(`/projects/${project}`);
        }, 3000);
    };

    const handleDeploy = async (newOverlayPath: string) => {
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            const url = `/api/deploy/${encodeURIComponent(newOverlayPath)}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            if (!res.ok) {
                setErrorMessage(json.error || 'Deployment failed');
            } else {
                setSuccessMessage('Deployment successful:\n' + (json.message || '').trim());
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Unknown error during deployment');
        }
    };

    useEffect(() => {
        if (!project || !overlay) return;
        fetch(`/api/projects/${project}/overlays/${overlay}`)
            .then((res) => res.json())
            .then((json) => {
                if (json.error) {
                    router.push(`/projects/${project}`);
                } else {
                    setData(json as OverlayDetail);
                }
            })
            .finally(() => setLoading(false));
    }, [project, overlay, router]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }
    if (!data) {
        return (
            <Container className="py-5">
                <h3 className="text-danger">Overlay not found</h3>
            </Container>
        );
    }

    const { namespace, pvcs, ingresses, services, deployments, rawYaml } = data;

    return (
        <Container className="py-4">
            <Row className="mb-3">
                <Col>
                    <h3>
                        {overlay} <small className="text-muted">in project {project}</small>
                    </h3>
                    <p>
                        Namespace: <Badge bg="info">{namespace}</Badge>
                    </p>
                </Col>
                <Col xs="auto">
                    <RemoveDeploymentButton
                        overlayPath={`${project}/${overlay}`}
                        onSuccess={handleDelete}
                        onError={setErrorMessage}
                    />
                </Col>
                <Col xs="auto">
                    <Button onClick={() => setShowConfigure(true)}>Configure</Button>
                </Col>
                <Col xs="auto">
                    <Button onClick={() => handleDeploy(`${project}/${overlay}`)}>Deploy</Button>
                </Col>
            </Row>

            {/* Success and error messages */}
            {errorMessage && (
                <Row className="mb-3">
                    <Col>
                        <Alert variant="danger" onClose={() => setErrorMessage(null)} dismissible>
                            {errorMessage}
                        </Alert>
                    </Col>
                </Row>
            )}
            {successMessage && (
                <Row className="mb-3">
                    <Col>
                        <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible>
                            <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{successMessage}</pre>
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Deployments */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Deployments</Card.Header>
                        <ListGroup variant="flush">
                            {deployments.length ? (
                                deployments.map((d) => (
                                    <ListGroup.Item key={d.name}>
                                        <strong>{d.name}</strong> — replicas: {d.replicas}
                                        <Table size="sm" className="mt-2 mb-0">
                                            <thead>
                                                <tr>
                                                    <th>Container</th>
                                                    <th>Image</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {d.containers.map((c) => (
                                                    <tr key={c.name}>
                                                        <td>{c.name}</td>
                                                        <td>
                                                            <code>{c.image}</code>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <ListGroup.Item className="text-muted">No Deployments</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Services */}
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Services</Card.Header>
                        <ListGroup variant="flush">
                            {services.length ? (
                                services.map((s) => (
                                    <ListGroup.Item key={s.name}>
                                        <strong>{s.name}</strong> — {s.type}
                                        <ul className="mb-0">
                                            {s.ports.map((p) => (
                                                <li key={p.port}>
                                                    port {p.port} → target {p.targetPort}
                                                </li>
                                            ))}
                                        </ul>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <ListGroup.Item className="text-muted">No Services</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>

            {/* PVCs */}
            <Row className="mb-4">
                <Col md={6}>
                    <Card>
                        <Card.Header>PVCs</Card.Header>
                        <ListGroup variant="flush">
                            {pvcs.length ? (
                                pvcs.map((p) => (
                                    <ListGroup.Item key={p.name}>
                                        {p.name} <Badge bg="secondary">{p.storage}</Badge>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <ListGroup.Item className="text-muted">No PVCs</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>

                {/* Ingress */}
                <Col md={6}>
                    <Card>
                        <Card.Header>Ingress</Card.Header>
                        <ListGroup variant="flush">
                            {ingresses.length ? (
                                ingresses.map((i) => (
                                    <ListGroup.Item key={i.name}>
                                        <strong>{i.name}</strong>
                                        <div className="mt-1">
                                            {i.hosts.map((h) => (
                                                <Badge key={h} bg="light" text="dark" className="me-1">
                                                    {h}
                                                </Badge>
                                            ))}
                                        </div>
                                    </ListGroup.Item>
                                ))
                            ) : (
                                <ListGroup.Item className="text-muted">No Ingress rules</ListGroup.Item>
                            )}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>

            {/* Raw YAML */}
            <Row>
                <Col>
                    <Accordion>
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>View Generated all.yaml</Accordion.Header>
                            <Accordion.Body style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <pre>
                                    <code>{rawYaml}</code>
                                </pre>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Col>
            </Row>

            <Row className="mt-4">
                <Col>
                    <Button variant="secondary" onClick={() => router.push(`/projects/${project}`)}>
                        ← Back to Project
                    </Button>
                </Col>
            </Row>

            <ToolConfigureModal
                project={project!}
                tool={tool}
                show={showConfigure}
                onHide={() => setShowConfigure(false)}
                onDeployed={handleDeployed}
            />
        </Container>
    );
}
