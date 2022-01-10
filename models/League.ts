export class League implements ILeague{
  "id": string;
  "data": [{
    "position": number,
    "team": {
      "id": number,
      "name": string,
      "crestUrl": string
    },
    "playedGames": number,
    "form": string | null,
    "won": number,
    "draw": number,
    "lost": number,
    "points": number,
    "goalsFor": number,
    "goalsAgainst": number,
    "goalDifference": number
  }]
}