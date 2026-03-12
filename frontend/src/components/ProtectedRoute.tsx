import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../services/auth.service';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<'loading' | 'authed' | 'unauthed'>('loading');
    const location = useLocation();

    useEffect(() => {
        isLoggedIn().then(({ connected }) => {
            setStatus(connected ? 'authed' : 'unauthed');
        });
    }, []);

    if (status === 'loading') return null;
    if (status === 'unauthed') return <Navigate to="/" state={{ from: location }} replace />;
    return <>{children}</>;
}

export default ProtectedRoute;
