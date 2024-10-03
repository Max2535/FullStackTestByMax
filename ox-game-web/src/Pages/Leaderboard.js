import React, { useEffect, useState } from 'react';

function Leaderboard() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => setPlayers(data));
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold my-4">Leaderboard</h1>
      <table className="min-w-full table-auto bg-white shadow-md rounded-lg">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">Player</th>
            <th className="px-4 py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2">{player.name}</td>
              <td className="px-4 py-2">{player.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;
