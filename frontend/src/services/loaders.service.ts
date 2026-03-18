// services/loaders.service.ts

//Get headers to clean code and avoid repetition
const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// Loaders
export async function dashboardLoader() {
  const [statsRes, eloRes, historyRes, usersRes] = await Promise.all([
    fetch('/api/users/stats', { headers: getApiHeaders() }),
    fetch('/api/users/elo-history', { headers: getApiHeaders() }),
    fetch('/api/users/history', { headers: getApiHeaders() }),
    fetch('/api/users', { headers: getApiHeaders() }),
  ]);

  if ([statsRes, eloRes, historyRes, usersRes].some(r => r.status === 401)) throw new Error('Unauthorized');
  if ([statsRes, eloRes, historyRes, usersRes].some(r => r.status === 429)) throw new Error('Rate limited');
  if ([statsRes, eloRes, historyRes, usersRes].some(r => !r.ok)) throw new Error('Failed');

  const [stats, chartData, history, usersRaw] = await Promise.all([
    statsRes.json(),
    eloRes.json(),
    historyRes.json(),
    usersRes.json(),
  ]);

  const leaderboard = usersRaw.map((user: any, index: number) => {
    const s = user.statistics || {};
    const rapidElo = s.rapidElo ?? 1200;
    const bulletElo = s.bulletElo ?? 1200;
    const blitzElo = s.blitzElo ?? 1200;
    return {
      id: user.id || user.userId || user._id || `fallback-id-${index}`,
      username: user.username || 'Unknown Player',
      elo: Math.round((rapidElo + bulletElo + blitzElo) / 3),
      avatarUrl: user.avatarUrl,
      currentStreak: s.currentStreak ?? user.currentStreak,
      bestStreak: s.bestStreak ?? user.bestStreak,
    };
  }).sort((a: any, b: any) => (b.elo || 0) - (a.elo || 0));

  return { stats, chartData, history, leaderboard };
}

export async function userLoader() {
  const [userRes,] = await Promise.all([
    fetch('/api/users/me', { headers: getApiHeaders() }),
  ]);

  if ([userRes].some(r => r.status === 401)) throw new Error('Unauthorized');
  if ([userRes].some(r => r.status === 429)) throw new Error('Rate limited');
  if ([userRes].some(r => !r.ok)) throw new Error('Failed');

  const [userData] = await Promise.all([
    userRes.json(),
  ]);

  return { userData };
}



/*

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Not ok');
        return res.json();
      })
      .then((user) => {
        setProfileData({
          username: user.username ?? '',
          email: user.email ?? '',
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          bio: user.bio ?? '',
          avatarUrl: user.avatarUrl ?? '',
        });
      })
      .catch(() => {
        // handle error if needed
      });
  }, []);

*/