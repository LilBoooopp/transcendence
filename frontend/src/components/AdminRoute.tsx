import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useNotification } from '../notifications';

export function AdminRoute() {
    const navigate = useNavigate();
    const { push } = useNotification();
    const checked = useRef(false);

    useEffect(() => {
        if (checked.current) return;
        checked.current = true;

        const token = localStorage.getItem('token');
        if (!token) {
            push({ type: 'error', title: 'Access denied', message: 'Admin access required.', duration: 5000 });
            navigate('/');
            return;
        }

        fetch('/api/users/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data || data.role !== 'ADMIN') {
                    push({ type: 'error', title: 'Access denied', message: 'Admin access required.', duration: 5000 });
                    navigate('/dashboard');
                }
            })
            .catch(() => navigate('/'));
    }, []);

    return <Outlet />;
}
