import { useState } from 'react';
import { Button } from 'react-bootstrap';

interface UndeployButtonProps {
    overlayPath: string;
    onSuccess: (msg: string) => void;
    onError: (err: string) => void;
}

export function RemoveDeploymentButton({ overlayPath, onSuccess, onError }: UndeployButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleUndeploy = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/deploy/${encodeURIComponent(overlayPath)}/remove`, {
                method: 'POST',
            });
            const json = await res.json();
            if (!res.ok) {
                onError(json.error || 'Remove failed');
            } else {
                onSuccess(`Undeploy successful:\n${(json.message || '').trim()}`);
            }
        } catch (e: any) {
            onError(e.message || 'Unknown error during undeploy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button variant="danger" disabled={loading} onClick={handleUndeploy}>
            {loading ? 'Deleting…' : 'Delete'}
        </Button>
    );
}
