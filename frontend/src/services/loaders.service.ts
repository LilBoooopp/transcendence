import { redirect } from 'react-router-dom';

const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export async function dashboardLoader() {
  const [statsRes, eloRes, historyRes, usersRes, me, friendsRes, requestRes] = await Promise.all([
    fetch('/api/users/stats', { headers: getApiHeaders() }),
    fetch('/api/users/elo-history', { headers: getApiHeaders() }),
    fetch('/api/users/history', { headers: getApiHeaders() }),
    fetch('/api/users', { headers: getApiHeaders() }),
    fetch('/api/users/me', { headers: getApiHeaders() }),
		fetch('/api/friends', { headers: getApiHeaders() }),
		fetch('/api/friends/request', { headers: getApiHeaders() }),
  ]);

  if ([statsRes, eloRes, historyRes, usersRes, me].some(r => r.status === 429)) throw new Error('Rate limited');
  if ([statsRes, eloRes, historyRes, usersRes, me].some(r => !r.ok)) throw new Error('Failed');

  const [stats, chartData, history, usersRaw, userData, friends, friendRequests] = await Promise.all([
    statsRes.json(),
    eloRes.json(),
    historyRes.json(),
    usersRes.json(),
    me.json(),
		friendsRes.json(),
		requestRes.json(),
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

  return { stats, chartData, history, leaderboard, userData, friends, friendRequests};
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