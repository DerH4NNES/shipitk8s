'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Modal, Row, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import moment from 'moment';

interface ProjectMeta {
    id: string;
    name: string;
    createdAt: string;
    owner?: { name?: string };
}

const slugify = (title: string) =>
    title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const slug = useMemo(() => slugify(title), [title]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projects');
            const json = await res.json();
            setProjects(json.projects || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = async () => {
        setCreating(true);
        setError(null);
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: slug }),
        });
        const json = await res.json();
        if (!res.ok) {
            setError(json.error || 'Failed to create');
        } else {
            setShowModal(false);
            setTitle('');
            fetchProjects();
        }
        setCreating(false);
    };

    return (
        <Container className="py-4">
            <Row className="mb-4 align-items-center">
                <Col>
                    <h1>Projects</h1>
                </Col>
                <Col xs="auto">
                    <Button onClick={() => setShowModal(true)}>+ New Project</Button>
                </Col>
            </Row>

            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" />
                </div>
            ) : projects.length > 0 ? (
                <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                    {projects.map((p) => (
                        <Col key={p.id}>
                            <Card className="h-100 hover-shadow">
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title>{p.name}</Card.Title>
                                    {p.owner?.name && (
                                        <Card.Subtitle className="mb-1 text-muted" style={{ fontSize: '0.8rem' }}>
                                            {p.owner.name}
                                        </Card.Subtitle>
                                    )}
                                    <small className="text-muted" title={moment(p.createdAt).format('LLLL')}>
                                        created {moment(p.createdAt).fromNow()}
                                    </small>
                                    <div className="mt-auto">
                                        <Link href={`/projects/${p.id}`} className="btn btn-primary w-100 mt-2">
                                            View Project
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Alert variant="info">No projects yet. Create one!</Alert>
            )}

            {/* New Project Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>New Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Project Title</Form.Label>
                            <Form.Control
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. My Website"
                            />
                            {title && <Form.Text className="text-muted">Generated ID: {slug || '–'}</Form.Text>}
                        </Form.Group>
                        {error && <Alert variant="danger">{error}</Alert>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating || !slug}>
                        {creating ? 'Creating…' : 'Create'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
