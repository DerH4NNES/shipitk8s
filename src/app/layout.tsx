import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import React from 'react';
import {Metadata} from "next";

export const metadata: Metadata = {
  title: 'Service Deployer',
  description: 'Einfaches Tool zum Deployen vordefinierter Services in Kubernetes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="de">
      <head />
      <body className="d-flex flex-column min-vh-100">
      {/* Header mit Navigation */}
      <header>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <Link href="/" className="navbar-brand">
              ServiceDeployer
            </Link>
            <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
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
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow-1 container my-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-3 mt-auto">
        <div className="container">
          <small>
            &copy; {new Date().getFullYear()} ServiceDeployer. Alle Rechte vorbehalten.
          </small>
        </div>
      </footer>
      </body>
      </html>
  );
}