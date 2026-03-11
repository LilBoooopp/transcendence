export async function isLoggedIn(): Promise<{ connected: boolean; username?: string }> {
    const token = localStorage.getItem('token');
    if (!token) return { connected: false };

    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            localStorage.removeItem('token');
            return { connected: false };
        }

        const data = await res.json();
        return { connected: !!data.isConnected, username: data.username };
    } catch {
        return { connected: false };
    }
}