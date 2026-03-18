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
        //if rate limit
        if (res.status === 429) {
            //return error but still consider the user as connected (to avoid infinite loop of logout/login)
            return { connected: true };
        }

        if (!res.ok) {
            localStorage.removeItem('token');
            return { connected: false };
        }

        const data = await res.json();
        // If we got a 200 OK response, the token is valid
        return { connected: true, username: data.username };
    } catch {
        return { connected: false };
    }
}