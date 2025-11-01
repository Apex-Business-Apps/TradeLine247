type Job<T> = () => Promise<T>;

export class ThrottleQueue {
  private running = 0;
  private q: Job<any>[] = [];

  constructor(private concurrency = 3) {
    this.concurrency = Math.max(1, concurrency);
  }

  push<T>(job: Job<T>) {
    this.q.push(job);
    this.drain();
  }

  private drain() {
    while (this.running < this.concurrency && this.q.length) {
      const j = this.q.shift()!;
      this.running++;
      j().finally(() => {
        this.running--;
        this.drain();
      });
    }
  }
}

export async function backoff<T>(
  fn: () => Promise<T>,
  tries = 5,
  baseMs = 300
): Promise<T> {
  let n = 0;
  let last: any;
  while (n < tries) {
    try {
      return await fn();
    } catch (e: any) {
      last = e;
      const s = e?.status ?? e?.response?.status ?? 0;
      if (s !== 429 && s < 500) break;
      await new Promise((r) =>
        setTimeout(
          r,
          Math.min(baseMs * (2 ** n) + Math.random() * 150, 5000)
        )
      );
      n++;
    }
  }
  throw last;
}

