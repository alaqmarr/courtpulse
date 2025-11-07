export default function LeaderboardTable({
  leaderboard,
}: {
  leaderboard: {
    name: string;
    wins: number;
    losses: number;
    points: number;
  }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-3">Rank</th>
            <th className="py-2 px-3">Player</th>
            <th className="py-2 px-3">Wins</th>
            <th className="py-2 px-3">Losses</th>
            <th className="py-2 px-3">Win Rate</th>
            <th className="py-2 px-3">Points</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((p, i) => (
            <tr key={p.name} className="border-b hover:bg-muted/40 transition-colors">
              <td className="py-2 px-3 font-medium">{i + 1}</td>
              <td className="py-2 px-3">{p.name}</td>
              <td className="py-2 px-3 text-green-600">{p.wins}</td>
              <td className="py-2 px-3 text-red-500">{p.losses}</td>
              <td className="py-2 px-3">
                {((p.wins / (p.wins + p.losses || 1)) * 100).toFixed(0)}%
              </td>
              <td className="py-2 px-3">{p.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
