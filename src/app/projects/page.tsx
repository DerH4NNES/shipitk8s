'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Spinner } from 'react-bootstrap';
import Link from 'next/link';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newId, setNewId] = useState('');
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            body: JSON.stringify({ id: newId.trim(), displayName: newName.trim() }),
        });
        const json = await res.json();
        if (!res.ok) {
            setError(json.error || 'Failed to create');
        } else {
            setShowModal(false);
            setNewId('');
            setNewName('');
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
                    {projects.map((id) => (
                        <Col key={id}>
                            <Card className="h-100">
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title className="text-capitalize">{id}</Card.Title>
                                    <div className="mt-auto">
                                        <Link href={`/projects/${id}`} className="btn btn-primary w-100">
                                            View Project
                                        </Link>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <p>No projects yet. Create one!</p>
            )}

            {/* New Project Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>New Project</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Project ID (lower‑case, a‑z, 0‑9, hyphens)</Form.Label>
                            <Form.Control
                                value={newId}
                                onChange={(e) => setNewId(e.target.value)}
                                placeholder="e.g. my‑website"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Display Name</Form.Label>
                            <Form.Control
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. My Website"
                            />
                        </Form.Group>
                        {error && <div className="alert alert-danger">{error}</div>}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating || !newId || !newName}>
                        {creating ? 'Creating…' : 'Create'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
