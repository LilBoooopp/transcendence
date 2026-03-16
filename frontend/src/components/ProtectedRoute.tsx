import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../services/auth.service';
import { useNotification } from '../notifications';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'authed' | 'unauthed'>('loading');
    const location = useLocation();
    let isDone = false;
    const { push } = useNotification();

    useEffect(() => {
        isLoggedIn().then(({ connected }) => {
            setStatus(connected ? 'authed' : 'unauthed');
            if (!connected && !isDone) {
                isDone = true;
                push({
                    type: 'error',
                    title: "You are not logged in.",
                    message: 'You need to be logged in to access this page.',
                    duration: 5000,
                });
            }
        });
    }, []);

    if (status === 'loading') return null;
    if (status === 'unauthed') return <Navigate to="/" state={{ from: location }} replace />; // Do NOT add code here (will call 1 million times)
    return <>{children}</>;
}

export default ProtectedRoute;
