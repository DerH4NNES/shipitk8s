'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Alert, Button, Col, Container, Row, Spinner } from 'react-bootstrap';
import { AddToolModal, OverlayCard, useProjectOverlays } from '@/components/project-tooling';

export default function ProjectDetailPage() {
    const { project } = useParams<{ project: string }>();
    const { overlays, available, loading, error, refresh } = useProjectOverlays(project);
    const [showAdd, setShowAdd] = useState(false);

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" />
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
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
                    <Button onClick={() => setShowAdd(true)} disabled={available.length === 0}>
                        + Add Tool
                    </Button>
                </Col>
            </Row>

            {overlays.length ? (
                <Row xs={1} sm={2} md={3} className="g-4">
                    {overlays.map((o) => (
                        <OverlayCard key={o.path} overlay={o} project={project} />
                    ))}
                </Row>
            ) : (
                <Alert variant="info">No tools deployed yet in this project.</Alert>
            )}

            <AddToolModal
                project={project}
                available={available}
                show={showAdd}
                onClose={() => setShowAdd(false)}
                onCreated={refresh}
            />
        </Container>
    );
}
