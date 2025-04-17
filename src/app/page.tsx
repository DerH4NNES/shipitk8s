"use client";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';

interface Variable {
    name: string;
    type: string;
    default: any;
}

interface Service {
    name: string;
    description: string;
    variables: { name: string; type: string; default: any }[];
}

export default function Home() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [message, setMessage] = useState<string>('');
    const [showModal, setShowModal] = useState<boolean>(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [formValues, setFormValues] = useState<Record<string, any>>({});

    useEffect(() => {
        fetch('/api/services')
            .then((res) => res.json())
            .then((data) => setServices(data.services))
            .catch(console.error);
    }, []);

    const openModal = (svc: Service) => {
        setSelectedService(svc);
        const defaults: Record<string, any> = {};
        (svc.variables || []).forEach((v) => {
            defaults[v.name] = v.default;
        });
        setFormValues(defaults);
        setShowModal(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
    };

    const handleConfirm = () => {
        if (selectedService) {
            handleDeploy(selectedService.name, formValues);
            setShowModal(false);
        }
    };

    const handleDeploy = async (
        serviceName: string,
        values: Record<string, any> = {}
    ) => {
        setLoading((prev) => ({ ...prev, [serviceName]: true }));
        setMessage('');
        try {
            const response = await fetch(`/api/generate/${serviceName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            const data = await response.json();
            if (data.success) {
                setMessage(`Service "${serviceName}" wurde bereitgestellt: ${data.overlay}`);
            } else {
                setMessage(`Fehler: ${data.error || 'Unbekannter Fehler'}`);
            }
        } catch (err: any) {
            setMessage(`Fehler: ${err.message}`);
        }
        setLoading((prev) => ({ ...prev, [serviceName]: false }));
    };

    return (
        <div className="container mt-5">
            {message && <div className="alert alert-info">{message}</div>}
            <h1 className="mb-4">Verfügbare Services</h1>
            <div className="row">
                {services.map((svc) => (
                    <div className="col-md-4 mb-4" key={svc.name}>
                        <div className="card h-100">
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title text-capitalize">{svc.name}</h5>
                                <p className="card-text flex-grow-1">{svc.description}</p>
                                <button
                                    className="btn btn-primary mt-3"
                                    onClick={() => openModal(svc)}
                                    disabled={loading[svc.name]}
                                >
                                    {loading[svc.name] ? 'Bereitstellung läuft...' : 'Bereitstellen'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && selectedService && (
                <div className="modal show d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{`Konfiguration: ${selectedService.name}`}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                {(selectedService.variables || []).map((v) => (
                                    <div className="mb-3" key={v.name}>
                                        <label className="form-label text-capitalize">{v.name}</label>
                                        <input
                                            type={v.type === 'number' ? 'number' : 'text'}
                                            className="form-control"
                                            name={v.name}
                                            value={formValues[v.name] ?? ''}
                                            onChange={handleChange}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowModal(false)}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleConfirm}
                                >
                                    Deploy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}