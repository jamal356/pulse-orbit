export type Pair = [string, string]

export interface Round {
  pairs: Pair[]
  bye?: string
}

export function generateRoundRobin(participants: string[]): Round[] {
  const n = participants.length
  if (n < 2) return []

  const isOdd = n % 2 === 1
  const nRounds = n - 1
  const people = [...participants]

  if (isOdd) {
    people.push('__bye__')
  }

  const m = people.length / 2
  const rounds: Round[] = []

  for (let r = 0; r < nRounds; r++) {
    const pairs: Pair[] = []

    for (let i = 0; i < m; i++) {
      const p1 = people[i]
      const p2 = people[people.length - 1 - i]

      if (p1 === '__bye__' || p2 === '__bye__') {
        continue
      }

      pairs.push([p1, p2])
    }

    const round: Round = { pairs }

    if (isOdd) {
      const byeIdx = people.findIndex((p) => p === '__bye__')
      if (byeIdx !== -1) {
        const byeUser = byeIdx === 0 ? people[people.length - 1] : people[0]
        if (byeUser !== '__bye__') {
          round.bye = byeUser
        }
      }
    }

    rounds.push(round)

    const last = people.pop()
    if (last !== undefined) {
      people.splice(1, 0, last)
    }
  }

  return rounds
}
