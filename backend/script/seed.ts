// Run with: npx prisma db seed

import { PrismaClient, GameResult, GameType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Config ──────────────────────────────────────────────────────────────────
const NUM_DAYS = 30;
const GAMES_PER_USER = 80; // approximate (each game covers 2 users)

const TIME_CONTROLS: { tc: string; type: GameType }[] = [
  { tc: '1+0', type: 'BULLET' },
  { tc: '2+1', type: 'BULLET' },
  { tc: '5+0', type: 'BLITZ' },
  { tc: '5+3', type: 'BLITZ' },
  { tc: '10+0', type: 'RAPID' },
  { tc: '15+10', type: 'RAPID' },
];

const SEED_USERS = [
  { username: 'kasparov_bot', email: 'kasparov@chess.test' },
  { username: 'morphy_ghost', email: 'morphy@chess.test' },
  { username: 'tal_magic', email: 'tal@chess.test' },
  { username: 'karpov_style', email: 'karpov@chess.test' },
  { username: 'fischer_clock', email: 'fischer@chess.test' },
  { username: 'anand_speed', email: 'anand@chess.test' },
  { username: 'carlsen_god', email: 'carlsen@chess.test' },
  { username: 'polgar_attack', email: 'polgar@chess.test' },
  { username: 'nimzo_idea', email: 'nimzo@chess.test' },
  { username: 'petrov_def', email: 'petrov@chess.test' },
  { username: 'ruy_lopez', email: 'ruy@chess.test' },
  { username: 'sicilian_king', email: 'sicilian@chess.test' },
  { username: 'dragon_var', email: 'dragon@chess.test' },
  { username: 'queens_gambit', email: 'queens@chess.test' },
  { username: 'kings_indian', email: 'kingsindian@chess.test' },
  { username: 'french_def', email: 'french@chess.test' },
  { username: 'caro_kann', email: 'caro@chess.test' },
  { username: 'grunfeld_Eric', email: 'grunfeld@chess.test' },
  { username: 'benoni_trap', email: 'benoni@chess.test' },
  { username: 'dutch_attack', email: 'dutch@chess.test' },
  { username: 'london_system', email: 'london@chess.test' },
  { username: 'catalan_open', email: 'catalan@chess.test' },
  { username: 'pirc_defense', email: 'pirc@chess.test' },
  { username: 'alekhine_gun', email: 'alekhine@chess.test' },
  { username: 'benko_gambit', email: 'benko@chess.test' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random timestamp within the given calendar day (daysAgo days in the past) */
function randomDateOnDay(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randomBetween(8, 23), randomBetween(0, 59), randomBetween(0, 59), 0);
  return d;
}

/** Standard Elo delta calculation (K=32 provisional <30 games, else 16) */
function eloDelta(
  playerElo: number,
  opponentElo: number,
  outcome: 'win' | 'draw' | 'loss',
  gamesPlayed: number,
): number {
  const K = gamesPlayed < 30 ? 32 : 16;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actual = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0;
  return Math.round(K * (actual - expected));
}

function getEloForType(
  elos: { bullet: number; blitz: number; rapid: number },
  type: GameType,
): number {
  if (type === 'BULLET') return elos.bullet;
  if (type === 'BLITZ') return elos.blitz;
  return elos.rapid;
}

function setEloForType(
  elos: { bullet: number; blitz: number; rapid: number },
  type: GameType,
  value: number,
) {
  if (type === 'BULLET') elos.bullet = value;
  else if (type === 'BLITZ') elos.blitz = value;
  else elos.rapid = value;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database with test users and games...\n');

  // ── 1. Upsert users ──────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Test1234!', 10);

  const userIds: string[] = [];

  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) {
      console.log(`  ↩  User "${u.username}" already exists, skipping creation.`);
      userIds.push(existing.id);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: u.email,
        username: u.username,
        password: hashedPassword,
        avatarUrl: 'defaultAvatar.png',
        bio: 'Seed user — here for testing 🤖',
        isOnline: false,
        statistics: { create: {} }, // default 1200 across all modes
      },
    });

    userIds.push(user.id);
    console.log(`  ✅ Created user: ${u.username} (${user.id})`);
  }

  console.log(`\n👤 ${userIds.length} users ready.\n`);

  // ── 2. Track in-memory Elo so we can compute correct deltas ──────────────
  const currentElo: Record<string, { bullet: number; blitz: number; rapid: number }> = {};
  const gameCount: Record<string, number> = {};

  for (const id of userIds) {
    const stats = await prisma.userStatistics.findUnique({ where: { userId: id } });
    currentElo[id] = {
      bullet: stats?.bulletElo ?? 1200,
      blitz: stats?.blitzElo ?? 1200,
      rapid: stats?.rapidElo ?? 1200,
    };
    gameCount[id] = stats?.totalGames ?? 0;
  }

  // ── 3. Generate games ─────────────────────────────────────────────────────
  // Each game covers 2 players, so total games needed = (users * gamesPerUser) / 2.
  // We spread them evenly across NUM_DAYS days.

  let totalGames = 0;
  const gamesNeeded = Math.ceil((SEED_USERS.length * GAMES_PER_USER) / 2);

  const userGameCount: Record<string, number> = {};
  for (const id of userIds) userGameCount[id] = 0;

  for (let g = 0; g < gamesNeeded; g++) {
    const daysAgo = g % NUM_DAYS; // spread evenly across 30 days

    // Pick two different users who still need games
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const whiteId = shuffled[0];
    const blackId = shuffled[1];

    const { tc, type } = pick(TIME_CONTROLS);

    // Determine result
    const roll = Math.random();
    let result: GameResult;
    let winner: string | null;
    let whiteOut: 'win' | 'draw' | 'loss';
    let blackOut: 'win' | 'draw' | 'loss';

    if (roll < 0.45) {
      result = 'WHITE_WIN';
      winner = 'white';
      whiteOut = 'win';
      blackOut = 'loss';
    } else if (roll < 0.80) {
      result = 'BLACK_WIN';
      winner = 'black';
      whiteOut = 'loss';
      blackOut = 'win';
    } else if (roll < 0.92) {
      result = 'DRAW';
      winner = null;
      whiteOut = 'draw';
      blackOut = 'draw';
    } else if (roll < 0.96) {
      result = 'TIMEOUT';
      winner = Math.random() < 0.5 ? 'white' : 'black';
      whiteOut = winner === 'white' ? 'win' : 'loss';
      blackOut = winner === 'black' ? 'win' : 'loss';
    } else {
      result = 'RESIGNATION';
      winner = Math.random() < 0.5 ? 'white' : 'black';
      whiteOut = winner === 'white' ? 'win' : 'loss';
      blackOut = winner === 'black' ? 'win' : 'loss';
    }

    const gameDate = randomDateOnDay(daysAgo);
    const duration = randomBetween(60, 900); // seconds
    const endedAt = new Date(gameDate.getTime() + duration * 1000);
    const moveCount = randomBetween(15, 60);

    // Elo calculation
    const wElo = getEloForType(currentElo[whiteId], type);
    const bElo = getEloForType(currentElo[blackId], type);
    const wDelta = eloDelta(wElo, bElo, whiteOut, gameCount[whiteId]);
    const bDelta = eloDelta(bElo, wElo, blackOut, gameCount[blackId]);
    const newWElo = Math.max(100, wElo + wDelta);
    const newBElo = Math.max(100, bElo + bDelta);

    // Create game + elo history atomically
    const game = await prisma.game.create({
      data: {
        whitePlayerId: whiteId,
        blackPlayerId: blackId,
        status: 'COMPLETED',
        result,
        winner,
        timeControl: tc,
        isRanked: true,
        isAiGame: false,
        totalMoves: moveCount,
        pgn: '', // not needed for visual testing
        startedAt: gameDate,
        endedAt,
        createdAt: gameDate,
      },
    });

    await prisma.eloHistory.createMany({
      data: [
        {
          userId: whiteId,
          gameId: game.id,
          gameType: type,
          eloBefore: wElo,
          eloAfter: newWElo,
          eloChange: wDelta,
          opponentElo: bElo,
          result: whiteOut,
          createdAt: gameDate,
        },
        {
          userId: blackId,
          gameId: game.id,
          gameType: type,
          eloBefore: bElo,
          eloAfter: newBElo,
          eloChange: bDelta,
          opponentElo: wElo,
          result: blackOut,
          createdAt: gameDate,
        },
      ],
    });

    // Update in-memory state
    setEloForType(currentElo[whiteId], type, newWElo);
    setEloForType(currentElo[blackId], type, newBElo);
    gameCount[whiteId]++;
    gameCount[blackId]++;
    userGameCount[whiteId]++;
    userGameCount[blackId]++;

    totalGames++;
  }

  console.log(`🎮 ${totalGames} games created.\n`);

  // ── 4. Sync UserStatistics from actual data ───────────────────────────────
  console.log('📊 Syncing UserStatistics...\n');

  for (const userId of userIds) {
    const games = await prisma.game.findMany({
      where: {
        status: 'COMPLETED',
        isRanked: true,
        OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
      },
    });

    let wins = 0, losses = 0, draws = 0, totalPlayTime = 0;

    for (const g of games) {
      const isWhite = g.whitePlayerId === userId;
      const w = g.winner;
      if (w === null || g.result === 'DRAW' || g.result === 'STALEMATE') draws++;
      else if ((isWhite && w === 'white') || (!isWhite && w === 'black')) wins++;
      else losses++;

      if (g.startedAt && g.endedAt) {
        totalPlayTime += Math.round((g.endedAt.getTime() - g.startedAt.getTime()) / 1000);
      }
    }

    const total = wins + losses + draws;

    // Streak: count consecutive wins from most recent
    const sortedGames = games.sort(
      (a, b) => (b.endedAt ?? b.createdAt).getTime() - (a.endedAt ?? a.createdAt).getTime(),
    );
    let streak = 0;
    for (const g of sortedGames) {
      const isWhite = g.whitePlayerId === userId;
      const w = g.winner;
      const won = (isWhite && w === 'white') || (!isWhite && w === 'black');
      if (won) streak++;
      else break;
    }

    await prisma.userStatistics.update({
      where: { userId },
      data: {
        bulletElo: currentElo[userId].bullet,
        blitzElo: currentElo[userId].blitz,
        rapidElo: currentElo[userId].rapid,
        totalGames: total,
        wins,
        losses,
        draws,
        currentStreak: streak,
        bestStreak: streak, // simplified — good enough for visual testing
        totalPlayTime,
      },
    });

    const u = SEED_USERS[userIds.indexOf(userId)];
    console.log(
      `  📈 ${u?.username ?? userId}: ${total} games | W${wins}/L${losses}/D${draws} | ` +
      `bullet=${currentElo[userId].bullet} blitz=${currentElo[userId].blitz} rapid=${currentElo[userId].rapid}`,
    );
  }

  console.log('\n✅ Seed complete!');
  console.log('\n🔑 All seed users share the password: Test1234!');
  console.log('   Login with any username above at /login\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
