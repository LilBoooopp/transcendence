import { useRouteError, useNavigate } from 'react-router-dom';

export function ErrorPage() {
    const error = useRouteError() as any;
    const navigate = useNavigate();
    
    const message = error?.message || error?.statusText || 'An unexpected error occurred.';
    const isRateLimited = message.toLowerCase().includes('rate limited');

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <h1 className="text-5xl font-bold">
                {isRateLimited ? '429' : 'Oops'}
            </h1>
            <h2 className="text-2xl font-semibold">
                {isRateLimited ? 'Too many requests' : 'Something went wrong'}
            </h2>
            <p className="text-lg text-gray-400">{message}</p>
            <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
                Go Home
            </button>
        </div>
    );
}