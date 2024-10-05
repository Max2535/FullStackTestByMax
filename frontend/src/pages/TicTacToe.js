import React, { useState, useEffect } from 'react';
import { X, Circle } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const TicTacToe = () => {
  const navigate = useNavigate();

  const token = useSelector((state) => state.auth.token); // ดึง token จาก Redux store
  const user = useSelector((state) => state.auth.user); // ดึงข้อมูล user

  const [difficulty, setDifficulty] = useState('easy'); // ค่าเริ่มต้น
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const botMove = (currentBoard) => {

    if(difficulty==='easy'){

      const emptySquares = currentBoard.reduce((acc, val, idx) => {
        if (val === null) acc.push(idx);
        return acc;
      }, []);
      if (emptySquares.length === 0) return;
      const randomIndex = Math.floor(Math.random() * emptySquares.length);
      return emptySquares[randomIndex];


    }else{

    // ตรวจสอบถ้ามีการเดินที่บอทสามารถชนะได้
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] === null) {
        const tempBoard = [...currentBoard];
        tempBoard[i] = 'O';
        if (calculateWinner(tempBoard) === 'O') {
          return i; // บอทชนะ
        }
      }
    }
  
    // ตรวจสอบถ้ามีการเดินที่ผู้เล่นสามารถชนะได้ และบอทควรป้องกัน
    for (let i = 0; i < currentBoard.length; i++) {
      if (currentBoard[i] === null) {
        const tempBoard = [...currentBoard];
        tempBoard[i] = 'X';
        if (calculateWinner(tempBoard) === 'X') {
          return i; // ป้องกันไม่ให้ผู้เล่นชนะ
        }
      }
    }
  
    // ถ้าไม่มีใครจะชนะในตาถัดไป ให้บอทเลือกตำแหน่งกลางก่อน (ตำแหน่ง 4)
    if (currentBoard[4] === null) {
      return 4; // ถ้าตำแหน่งกลางว่าง
    }
  
    // ถ้าไม่มีทางเลือกที่ดีกว่า ให้สุ่มการเคลื่อนไหว
    const emptySquares = currentBoard.reduce((acc, val, idx) => {
      if (val === null) acc.push(idx);
      return acc;
    }, []);
    
    const randomIndex = Math.floor(Math.random() * emptySquares.length);
    return emptySquares[randomIndex];
    }
  };

  const handleDifficultyChange = (event) => {
    setDifficulty(event.target.value);
  };

  const handleClick = (i) => {
    if (winner || board[i] || !isXNext) return;
    const newBoard = board.slice();
    newBoard[i] = 'X';
    setBoard(newBoard);
    setIsXNext(false);
  };

  useEffect(() => {
    if (!isXNext && !winner) {
      const timer = setTimeout(() => {
        const botMoveIndex = botMove(board);
        if (botMoveIndex !== undefined) {
          const newBoard = board.slice();
          newBoard[botMoveIndex] = 'O';
          setBoard(newBoard);
          setIsXNext(true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, board,user]);

  useEffect(() => {
    const checkWinnerAndUpdateScore = async () => {
      const winner = calculateWinner(board);
      if (winner) {
        setWinner(winner);
        if (winner === 'X') {
          setScore(score => score + 1);
          setWinStreak(streak => {
            const newStreak = streak + 1;
            if (newStreak === 3) {
              setScore(score => score + 1); // เพิ่มคะแนนพิเศษเมื่อชนะ 3 ครั้งติดต่อกัน
              return 0; // รีเซ็ต streak
            }
            return newStreak;
          });
        } else {
          setScore(score => score - 1);
          setWinStreak(0);
        }

        // ก่อนรีเซ็ตเกม เราจะอัปเดตคะแนนไปยัง backend
        const result = winner === 'X' ? 'win' : 'lose'; // ใช้ผลลัพธ์ของเกมว่า win หรือ lose
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/players`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ token, result }),
          });
          const data = await response.json();
          console.log('Score updated:', data);
        } catch (error) {
          console.error('Error updating score:', error);
        }
      } else if (!board.includes(null)) {
        setWinner('draw');
      }
    };

    checkWinnerAndUpdateScore();
  }, [board]);

  const renderSquare = (i) => (
    <button
      className="w-20 h-20 border border-gray-300 flex items-center justify-center text-4xl font-bold bg-white hover:bg-gray-100"
      onClick={() => handleClick(i)}
      disabled={!isXNext || winner}
    >
      {board[i] === 'X' ? <X size={40} /> : board[i] === 'O' ? <Circle size={40} /> : null}
    </button>
  );

  const resetGame = async () => {
    // รีเซ็ตบอร์ดเกม
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">{user.name} vs Bot</h1>
      <div className="mb-4 p-4 bg-blue-100 border border-blue-300 rounded">
        <p className="font-semibold">Score: {score} | Win Streak: {winStreak}</p>
      </div>
      <div className="mb-4">
  <label className="mr-4">Choose Difficulty: </label>
  <select value={difficulty} onChange={handleDifficultyChange} className="p-2 border border-gray-300 rounded">
    <option value="easy">Easy</option>
    <option value="hard">Hard</option>
  </select>
</div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[...Array(9)].map((_, i) => renderSquare(i))}
      </div>
      {winner && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
          <p className="font-semibold">
            {winner === 'draw' 
              ? "It's a draw!" 
              : `Winner: ${winner === 'X' ? 'You' : 'Bot'}`}
          </p>
        </div>
      )}
      <div className="flex space-x-4 mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={resetGame}
        >
          New Game
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default TicTacToe;