export function getPremoveTargets(
  piece: string,
  rank: number,
  file: number
): { rank: number, file: number }[] {
  const color = piece[0] // 'w' or 'b'
  const type = piece[1].toLowerCase() // 'p', 'n', etc.
  const inBounds = (r: number, f: number) => r >= 0 && r < 8 && f >= 0 && f < 8
  const targets: { rank: number, file: number }[] = []

  const addRay = (dr: number, df: number) => {
    let r = rank + dr
    let f = file + df
    while (inBounds(r, f)) {
      targets.push({ rank: r, file: f })
      r += dr
      f += df
    }
  }

  switch (type) {
    case 'p': {
      const dir = color === 'w' ? -1 : 1
      // forward one
      if (inBounds(rank + dir, file))
        targets.push({ rank: rank + dir, file })
      // forward two from starting rank
      const startRank = color === 'w' ? 6 : 1
      if (rank === startRank && inBounds(rank + dir * 2, file))
        targets.push({ rank: rank + dir * 2, file })
      // diagonal captures
      if (inBounds(rank + dir, file - 1))
        targets.push({ rank: rank + dir, file: file - 1 })
      if (inBounds(rank + dir, file + 1))
        targets.push({ rank: rank + dir, file: file + 1 })
      break
    }
    case 'n': {
      const offsets = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
      offsets.forEach(([dr, df]) => {
        if (inBounds(rank + dr, file + df))
          targets.push({ rank: rank + dr, file: file + df })
      })
      break
    }
    case 'b': {
      addRay(-1, -1)
      addRay(-1, 1)
      addRay(1, -1)
      addRay(1, 1)
      break
    }
    case 'r': {
      addRay(-1, 0)
      addRay(1, 0)
      addRay(0, -1)
      addRay(0, 1)
      break
    }
    case 'q': {
      addRay(-1, -1)
      addRay(-1,  1)
      addRay( 1, -1)
      addRay( 1,  1)
      addRay(-1,  0)
      addRay( 1,  0)
      addRay( 0, -1)
      addRay( 0,  1)
      break
    }
    case 'k': {
      const offsets = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
      offsets.forEach(([dr, df]) => {
        if (inBounds(rank + dr, file +df))
          targets.push({ rank: rank + dr, file: file + df })
      })
      break
    }
  }

  return (targets)
}
