/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  LayoutList, 
  Crown, 
  Search, 
  Menu 
} from "lucide-react";

interface User {
  user_id: number;
  score: number;
  username?: string;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram: any;
  }
}

export default function App() {
  const [leaderboard, setLeaderboard] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("leaderboard");

  useEffect(() => {
    // Initialize Telegram Web App
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;

    if (tg) {
      tg.expand();
      tg.ready();
      tg.setHeaderColor("#0B0E11");
      tg.setBackgroundColor("#0B0E11");
    }

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const initData = tg?.initData || "";
        
        const response = await fetch("/api/leaderboard", {
          headers: {
            "X-Telegram-Init-Data": initData,
          },
        });
        
        if (!response.ok) {
          throw new Error("Gagal mengambil data");
        }
        
        const result = await response.json();
        if (result.status === "success") {
          // If the real telegram user is available, we could potentially inject them into the mock data
          // or just use the mock data as is. For this demo, let's stick to the mock data but 
          // add a logic to show user's real name if we match IDs (optional)
          setLeaderboard(result.data);
        } else {
          setError("Belum ada data minggu ini");
        }
      } catch (err) {
        setError("Gagal memuat data leaderboard");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return "text-[#F0B90B]"; // Gold
      case 1: return "text-[#C0C0C0]"; // Silver
      case 2: return "text-[#CD7F32]"; // Bronze
      default: return "text-gray-500";
    }
  };

  const getAvatarPlaceholder = (username: string, colorClass: string) => {
    const initials = username.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return (
      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${colorClass}`}>
        {initials}
      </div>
    );
  };

  const avatarColors = [
    "bg-pink-500", "bg-blue-500", "bg-purple-500", 
    "bg-green-500", "bg-yellow-600", "bg-indigo-500",
    "bg-red-500", "bg-teal-500", "bg-orange-500"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-[#F0B90B] border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-400 font-medium tracking-tight">Memuat...</span>
      </div>
    );
  }

  if (error && leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B0E11] flex items-center justify-center p-6 text-center">
        <div>
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const restOfUsers = leaderboard.slice(0, 10); // Display top 10 as requested

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white pb-24 font-sans select-none">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-[#0B0E11]/80 backdrop-blur-md z-10 transition-all">
        <Menu className="w-6 h-6 text-gray-300" />
        <h1 className="text-xl font-bold tracking-tight">Leaderboard</h1>
        <Search className="w-6 h-6 text-gray-300" />
      </header>

      {/* Podium Section */}
      <section className="px-6 mb-8 mt-4">
        <div className="relative h-64 flex items-end justify-center gap-4">
          {/* Rank 2 */}
          {topThree[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center mb-4"
            >
              <div className="relative mb-2">
                <div className="absolute -top-3 -right-1 w-6 h-6 bg-[#F0B90B] rounded-full border-2 border-[#0B0E11] flex items-center justify-center text-[10px] font-bold text-black z-10">2</div>
                <div className="w-20 h-20 rounded-full border-4 border-[#F0B90B]/30 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                     <img src={`https://ui-avatars.com/api/?name=${topThree[1].username}&background=random`} alt={topThree[1].username} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate text-center">{topThree[1].username}</span>
            </motion.div>
          )}

          {/* Rank 1 */}
          {topThree[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center z-10"
            >
              <div className="mb-4">
                 <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1">⭐</span>
                    <div className="bg-[#F0B90B] px-3 py-0.5 rounded text-[10px] font-bold text-black uppercase tracking-widest">1</div>
                 </div>
              </div>
              <div className="relative mb-2">
                <div className="w-28 h-28 rounded-full border-4 border-[#F0B90B] p-1 shadow-[0_0_20px_rgba(240,185,11,0.3)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                    <img src={`https://ui-avatars.com/api/?name=${topThree[0].username}&background=random`} alt={topThree[0].username} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <span className="text-sm font-bold tracking-tight text-center">{topThree[0].username}</span>
            </motion.div>
          )}

          {/* Rank 3 */}
          {topThree[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center mb-4"
            >
              <div className="relative mb-2">
                <div className="absolute -top-3 -right-1 w-6 h-6 bg-[#CD7F32] rounded-full border-2 border-[#0B0E11] flex items-center justify-center text-[10px] font-bold text-white z-10">3</div>
                <div className="w-20 h-20 rounded-full border-4 border-[#CD7F32]/30 p-1">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                    <img src={`https://ui-avatars.com/api/?name=${topThree[2].username}&background=random`} alt={topThree[2].username} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate text-center">{topThree[2].username}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* List Section */}
      <section className="px-4 space-y-3">
        <AnimatePresence>
          {restOfUsers.map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center p-4 rounded-2xl ${index === 2 ? 'bg-[#58D37D] text-black' : 'bg-[#1A1D22]'}`}
            >
              <span className={`w-8 text-center font-bold text-lg mr-2 ${index === 2 ? 'text-black' : 'text-gray-400'}`}>
                {index + 1}
              </span>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 mr-4 shrink-0 shadow-sm">
                 <img src={`https://ui-avatars.com/api/?name=${user.username || 'User'}&background=random`} alt={user.username} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${index === 2 ? 'text-black' : 'text-white'}`}>
                  {user.username || `User ${user.user_id}`}
                </h3>
              </div>
              <div className="text-right ml-4">
                <span className={`font-bold text-lg ${index === 2 ? 'text-black' : 'text-white'}`}>
                  {user.score.toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-[#1A1D22] border-t border-white/5 px-6 pb-6 flex items-center justify-between z-50">
        <button 
          onClick={() => setActiveTab("challenges")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === "challenges" ? "text-white" : "text-gray-500 opacity-60"}`}
        >
          <div className="text-xl">🏆</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Challenges</span>
        </button>

        <button 
          onClick={() => setActiveTab("achievements")}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === "achievements" ? "text-white" : "text-gray-500 opacity-60"}`}
        >
          <div className="text-xl">📋</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Achievements</span>
        </button>

        <button 
          onClick={() => setActiveTab("leaderboard")}
          className={`relative group flex flex-col items-center gap-1 transition-all ${activeTab === "leaderboard" ? "text-white" : "text-gray-500 opacity-60"}`}
        >
          {activeTab === "leaderboard" && (
             <motion.div 
               layoutId="nav-bg"
               className="absolute -top-4 -bottom-1 -left-4 -right-4 bg-black/40 rounded-xl -z-10"
             />
          )}
          <div className="text-xl">👑</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Leaderboard</span>
        </button>
      </nav>
    </div>
  );
}

