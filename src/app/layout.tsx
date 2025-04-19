import 'bootstrap/dist/css/bootstrap.min.css';
import '@/scss/global.scss';
import React, { ReactNode } from 'react';
import { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { Header } from '@/components/Header';
import { Container } from 'react-bootstrap';

export const metadata: Metadata = {
    title: 'Service Deployer',
    description: 'Einfaches Tool zum Deployen vordefinierter Services in Kubernetes',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className="d-flex flex-column min-vh-100">
                {/* AuthProvider (wrappt SessionProvider) */}
                <AuthProvider>
                    {/* Ausgelagerter Header mit React‑Bootstrap */}
                    <Header />

                    {/* Main Content */}
                    <Container className="flex-grow-1 my-4">{children}</Container>
                </AuthProvider>

                <footer className="bg-dark text-white text-center py-3 mt-auto">
                    <Container>
                        <small>&copy; {new Date().getFullYear()} ServiceDeployer. Alle Rechte vorbehalten.</small>
                    </Container>
                </footer>
            </body>
        </html>
    );
}
