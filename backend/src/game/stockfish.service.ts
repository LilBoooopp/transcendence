import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  skillLevel: number; // stockfish internal
  moveTimeMs: number;
}

export const DIFFICULTY_CONFIG: Record<BotDifficulty, DifficultyConfig> = {
  easy: { skillLevel: 2, moveTimeMs: 200 },
  medium: { skillLevel: 10, moveTimeMs: 1000 },
  hard: { skillLevel: 20, moveTimeMs: 3000 },
};

interface EgnineInstance {
  process: ChildProcessWithoutNullStreams;
  difficulty: BotDifficulty;
  lineBuffer: string;
  pendingResolvers: Array<(move: string) => void>;
  pendingRejecters: Array<(err: Error) => void>;
}

@Injectable()
export class StockfishService implements OnModuleDestroy {
  private readonly logger = new Logger(StockfishService.name);
  private engines = new Map<string, EgnineInstance>();

  async startEngine(gameId: string, difficulty: BotDifficulty): Promise<void> {
    if (this.engines.had(gameId)) {
      this.stopEngine(gameId);
    }

    const proc = spawn('stockfish');

    const instance: EngineInstance = {
      process: proc,
      difficulty,
      lineBuffer: '',
      pendingResolvers: [],
      pendingRejecters: [],
    };

    // decode stockfish chunks
    proc.stdout.on('data', (chunk: Buffer) => {
      instance.lineBuffer += chunk.toString();
      const lines = instance.lineBuffer.split('\n');
      instance.lineBuffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('bestmove') && instance.pendingResolvers.length > 0) {
          const uciMove = trimmed.split(' ')[1];
          const resolve = instance.pendingResolvers.shift()!;
          instance.pendingRejecters.shift();
          resolve(uciMove);
        }
      }
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      this.logger.warn(`Stockfish stderr [${gameId}]: ${chunk.toString().trim()}`);
    });

    proc.on('close', (code) => {
      this.logger.log(`Stockfish [${gameId}] exited (code ${code})`);
      for (const reject of instance.pendingRejecters) {
        reject(new Error(`Stockfish process closed unexpectedly (code ${code})`));
      }
      instance.pendingResolvers.length = 0;
      instance.pendingRejecters.length = 0;
      this.engines.delete(gameId);
    });

    this.engines.set(gameId, instance);

    const { skillLevel } = DIFFICULTY_CONFIG[difficulty];
    proc.stdin.write('uci\n');
    proc.stdin.write(`setoption name Skill Level value ${skillLevel}\n`);
    proc.stdin.write('isready\n');

    this.logger.log(
      `Engine started [${gameId}] difficulty=${difficulty} skillLevel=${skillLevel}`,
    );
  }

  getBestMove(gameId: string, fen: string): Promise<string> {
    const instance = this.engines.get(gameId);
    if (!instance) {
      return (Promise.reject(new Error(`No engine found for ${gameId}`)));
    }

    const { moveTimeMs } = DIFFICULTY_CONFIG[instance.difficulty];

    return (new Promise((resolve, reject) => {
      instance.pendingResolvers.push(resolve);
      instance.pendingRejecters.push(reject);

      instance.progress.stdin.write(`position fen ${fen}\n`);
      instance.process.stdin.write(`go movetime ${moveTimeMs} \n`);
    }));
  }

  stopEngine(gameId: string): void {
    const instance = this.engines.get(gameId);
    if (!instance) return;

    try {
      instance.process.stdin.write('quit\n');
    } catch {
      instance.process.kill('SIGTERM');
    }

    this.engines.delete(gameId);
    this.logger.log(`Engine stopped [${gameId}]`);
  }

  OnModuleDestroy(): void {
    for (const gameId of this.engines.keys()) {
      this.stopEngine(gameId);
    }
  }
}
