import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user); // ดึงข้อมูล user
  const token = useSelector((state) => state.auth.token); // ดึง token
  const [score, setScore] = useState(0);
  const [scoreData, setScoreData] = useState([]);

  useEffect(() => {

    const fetchPlayers = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/players/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // สมมติว่าเราเก็บ token ไว้ใน localStorage
            },
          }
        );
        const user = await response.json();
        
        if(user.score){
          setScore(user.score);
        }else{
          setScore(0);
        }
      } catch (error) {
        setScore(0);
        console.error("Error fetching user :", error);
      }
    };

    // Fetch ข้อมูลคะแนนและรูปจาก API เมื่อหน้า Dashboard ถูกโหลด
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/leaderboard`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // สมมติว่าเราเก็บ token ไว้ใน localStorage
            },
          }
        );
        let data = await response.json();
        data = data.filter(x=>x.user !== user.user);
        setScoreData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchPlayers();
    fetchData();
    if (!user) {
      navigate("/login");
    }
  }, [user,navigate, token]); // เรียก API หนึ่งครั้งเมื่อโหลดหน้า Dashboard

  // ฟังก์ชันเมื่อคลิกปุ่มเล่น
  const handlePlayGame = () => {
    navigate("/tictactoe"); // นำทางไปยังหน้าเกม Tic-Tac-Toe
  };

  function convertTimestamp(timestamp) {
    const date = new Date(timestamp < 10000000000 ? timestamp * 1000 : timestamp);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">
            Dashboard Overview
          </h1>
        </div>

        {/* User Section */}
        <div className="bg-white shadow-md rounded-lg p-6 flex items-center justify-between">
          <div className="flex items-center">
            {/* แสดงรูปภาพที่ได้จาก Google */}
            <img
              src={user?.picture}
              alt="User Profile"
              className="w-24 h-24 rounded-full border-2 border-gray-300"
            />
            <div className="ml-6">
              <h2 className="text-xl font-semibold text-gray-700">
                Welcome, {user?.name}
              </h2>
              <p className="mt-1 text-gray-500">Your current score is:</p>
              {/* แสดงคะแนนที่ได้จาก API */}
              <p className="text-2xl font-bold text-blue-600">
                {score}
              </p>
            </div>
          </div>
        </div>
        {/* ปุ่มเล่น */}
        <div className="mt-8 text-center">
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 font-bold"
            onClick={handlePlayGame}
          >
            Play Tic-Tac-Toe
          </button>
        </div>
        {/* Table Section */}
        <div className="mt-12 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            ประวัติการเล่น
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 text-left text-gray-600 font-semibold">
                    วันที่
                  </th>
                  <th className="py-2 px-4 text-left text-gray-600 font-semibold">
                    ผู้เล่น
                  </th>
                  <th className="py-2 px-4 text-left text-gray-600 font-semibold">
                    คะแนน
                  </th>
                </tr>
              </thead>
              <tbody>
                {scoreData?.players?.map((score, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4">{convertTimestamp(score.date)}</td>
                    <td className="py-2 px-4">{score.username}</td>
                    <td className="py-2 px-4 text-black-600">{score.score}</td>
                  </tr>
                ))} 
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
