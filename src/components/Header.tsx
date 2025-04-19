'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function Header() {
    const { data: session, status } = useSession();
    const pathname = usePathname();

    // verhindern, dass active schon auf dem Server gerendert wird
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <Navbar bg="dark" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} href="/">
                    ServiceDeployer
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="navbar-nav" />
                <Navbar.Collapse id="navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link
                            as={Link}
                            href="/"
                            // active erst nach Client‑Mount
                            active={mounted && pathname === '/'}
                        >
                            Services
                        </Nav.Link>
                        <Nav.Link as={Link} href="/projects" active={mounted && pathname === '/projects'}>
                            Projects
                        </Nav.Link>
                    </Nav>
                    <Nav>
                        {status === 'loading' ? null : session ? (
                            <>
                                <Navbar.Text className="me-3">Hi, {session.user?.name}</Navbar.Text>
                                <Button variant="outline-light" onClick={() => signOut()}>
                                    Logout
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline-light" onClick={() => signIn()}>
                                Login
                            </Button>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
