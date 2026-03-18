import { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../services/auth.service';
import { useNotification } from '../notifications';

export function ProtectedLayout() {
    const navigate = useNavigate();
    const { push } = useNotification();
    const isDone = useRef(false);

    useEffect(() => {
        isLoggedIn().then(({ connected }) => {
            if (!connected && !isDone.current) {
                isDone.current = true;
                push({
                    type: 'error',
                    title: 'Access denied',
                    message: 'You need to be logged in to access this page.',
                    duration: 5000,
                });
                navigate('/');
            }
        });
    }, []);

    return <Outlet />;
}