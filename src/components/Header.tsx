// components/Header.tsx
'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';

export function Header() {
    const { data: session, status } = useSession();

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <Link href="/" className="navbar-brand">
                    ServiceDeployer
                </Link>
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link href="/" className="nav-link">
                                Services
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link href="/overlays" className="nav-link">
                                Overlays
                            </Link>
                        </li>
                    </ul>
                    <ul className="navbar-nav ms-auto">
                        {status === 'loading' ? null : session ? (
                            <>
                                <li className="nav-item">
                                    <span className="navbar-text me-3">Hi, {session.user?.name}</span>
                                </li>
                                <li className="nav-item">
                                    <button className="btn btn-outline-light" onClick={() => signOut()}>
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : (
                            <li className="nav-item">
                                <button className="btn btn-outline-light" onClick={() => signIn()}>
                                    Login
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}
