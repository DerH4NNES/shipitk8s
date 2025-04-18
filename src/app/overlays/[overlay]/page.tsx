'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Row, Col, Card, ListGroup, Badge, Table, Accordion, Spinner, Button } from 'react-bootstrap';
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
interface ServiceInfo {
    name: string;
    type: string;
    ports: { port: number; targetPort: number }[];
}
interface DeploymentInfo {
    name: string;
    replicas: number;
    containers: { name: string; image: string }[];
}
interface OverlayDetail {
    service: string;
    path: string;
    namespace: string;
    createdAt: number;
    pvcs?: PVC[];
    ingresses?: IngressInfo[];
    services?: ServiceInfo[];
    deployments?: DeploymentInfo[];
    cpuTotal?: string;
    memTotal?: string;
    rawYaml: string;
}

export default function OverlayDetailPage() {
    const { overlay } = useParams<{ overlay: string }>();
    const router = useRouter();
    const [data, setData] = useState<OverlayDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!overlay) return;
        fetch(`/api/overlays/${overlay}`)
            .then((res) => res.json())
            .then((json) => {
                if (json.error) {
                    router.push('/overlays');
                } else {
                    setData(json as OverlayDetail);
                }
            })
            .catch(() => router.push('/overlays'))
            .finally(() => setLoading(false));
    }, [overlay, router]);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" />
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

    // Destructure mit Defaults
    const {
        service,
        path,
        namespace,
        createdAt,
        pvcs = [],
        ingresses = [],
        services = [],
        deployments = [],
        cpuTotal,
        memTotal,
        rawYaml,
    } = data;

    const rel = moment(createdAt).fromNow();
    const exact = moment(createdAt).format('LLLL');

    return (
        <Container className="py-4">
            <Row className="mb-3">
                <Col>
                    <h2>
                        {service} <small className="text-muted">({path})</small>
                    </h2>
                    <p>
                        Namespace: <Badge bg="info">{namespace}</Badge> Created: <small title={exact}>{rel}</small>
                    </p>
                    {(cpuTotal || memTotal) && (
                        <p>
                            Resources:{' '}
                            {cpuTotal && (
                                <Badge bg="warning" text="dark" className="me-1">
                                    CPU {cpuTotal}
                                </Badge>
                            )}
                            {memTotal && (
                                <Badge bg="warning" text="dark">
                                    RAM {memTotal}
                                </Badge>
                            )}
                        </p>
                    )}
                </Col>
            </Row>

            <Row className="mb-4">
                {/* Deployments */}
                <Col md={6}>
                    <Card className="mb-3">
                        <Card.Header>Deployments</Card.Header>
                        <ListGroup variant="flush">
                            {deployments.length > 0 ? (
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
                            {services.length > 0 ? (
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

            <Row className="mb-4">
                {/* PVCs */}
                <Col md={6}>
                    <Card>
                        <Card.Header>PVCs</Card.Header>
                        <ListGroup variant="flush">
                            {pvcs.length > 0 ? (
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
                            {ingresses.length > 0 ? (
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
                    <Button variant="secondary" onClick={() => router.push('/overlays')}>
                        ← Back to overview
                    </Button>
                </Col>
            </Row>
        </Container>
    );
}
