'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Crumb {
    label: string;
    href?: string;
}

export function BreadcrumbNav() {
    const pathname = usePathname();
    if (!pathname) return null;

    const parts = pathname.split('/').filter(Boolean);
    const crumbs: Crumb[] = parts
        .map((seg, idx) => ({
            href: '/' + parts.slice(0, idx + 1).join('/'),
            label: seg.charAt(0).toUpperCase() + seg.slice(1),
        }))
        .filter(({ label }) => label !== 'Overlays');

    return (
        <nav aria-label="Breadcrumb" className={`bg-light rounded-lg p-3 mb-3`}>
            <ol className="breadcrumb fs-6 fw-semibold text-muted mb-0">
                {crumbs.map(({ label, href }, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <li
                            key={i}
                            className={`breadcrumb-item${isLast ? ' active' : ''}`}
                            aria-current={isLast ? 'page' : undefined}
                        >
                            {isLast ? (
                                label
                            ) : (
                                <Link href={href!}>{label}</Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
