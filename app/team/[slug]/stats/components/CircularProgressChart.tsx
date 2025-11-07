// src/components/CircularProgressChart.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface CircularProgressChartProps {
  stats: { name: string; wins: number; losses: number; points: number }[];
}

const CircularProgressChart: React.FC<CircularProgressChartProps> = ({
  stats,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {stats.map((player) => {
        const totalGames = player.wins + player.losses;
        const winPercentage =
          totalGames > 0 ? (player.wins / totalGames) * 100 : 0;

        return (
          <Card key={player.name} className="flex flex-col items-center p-4">
            <CardContent className="relative flex items-center justify-center h-24 w-24 rounded-full bg-muted/50 mb-3 p-0">
              {/* Circular progress bar - Using explicit green and red */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(
                    #34d399 0% ${winPercentage}%, /* Green for wins */
                    #f87171 ${winPercentage}% 100%  /* Red for losses */
                  )`,
                }}
              />
              {/* Inner circle to hide center of conic gradient */}
              <div className="relative z-10 flex items-center justify-center h-20 w-20 rounded-full bg-card text-card-foreground text-sm font-semibold">
                {winPercentage.toFixed(0)}%
              </div>
            </CardContent>
            <p className="text-sm font-medium text-center truncate w-full px-2">
              {player.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {player.wins}W / {player.losses}L
            </p>
          </Card>
        );
      })}
    </div>
  );
};

export default CircularProgressChart;