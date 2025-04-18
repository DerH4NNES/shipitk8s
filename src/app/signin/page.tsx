// app/signin/page.tsx
'use client';

import { getProviders, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function SignInPage() {
    const [providers, setProviders] = useState<any>(null);

    useEffect(() => {
        getProviders().then((prov) => setProviders(prov));
    }, []);

    if (!providers) return <div>Loading…</div>;

    return (
        <div className="container py-5">
            <h1 className="mb-4">Bitte einloggen</h1>
            {Object.values(providers).map((p: any) => (
                <div key={p.name} className="mb-2">
                    <button className="btn btn-primary" onClick={() => signIn(p.id)}>
                        Mit {p.name} anmelden
                    </button>
                </div>
            ))}
        </div>
    );
}
