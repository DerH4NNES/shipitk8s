// app/layout.tsx
import 'bootstrap/dist/css/bootstrap.min.css';
import { Metadata } from 'next';
import { ReactNode } from 'react';
import { Header } from '../components/Header';
import { AuthProvider } from '@/components/AuthProvider';

export const metadata: Metadata = { title: 'ServiceDeployer', description: '…' };

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="de">
            <head />
            <body className="d-flex flex-column min-vh-100">
                <AuthProvider>
                    <Header />
                    <main className="flex-grow-1 container my-4">{children}</main>
                    <footer className="bg-dark text-white text-center py-3 mt-auto">
                        <div className="container">
                            <small>&copy; {new Date().getFullYear()} ServiceDeployer</small>
                        </div>
                    </footer>
                </AuthProvider>
            </body>
        </html>
    );
}
