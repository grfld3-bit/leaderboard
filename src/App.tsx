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
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp,
  persistentLocalCache,
  persistentMultipleTabManager,
  initializeFirestore
} from "firebase/firestore";
import { 
  LayoutList, 
  Crown, 
  Search, 
  Menu,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Minus
} from "lucide-react";
import { db } from "./lib/firebase";

interface User {
  user_id: number;
  score: number;
  username?: string;
  photo_url?: string;
  previous_rank?: number;
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
  const [tgUser, setTgUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    // Real-time data is handled by onSnapshot
    if (isManual) {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  useEffect(() => {
    // Initialize Telegram Web App
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    
    if (user) {
      setTgUser(user);
      
      // Sync user data to Firebase
      const syncUser = async () => {
        const userRef = doc(db, "users", user.id.toString());
        await setDoc(userRef, {
          user_id: user.id,
          username: user.username || user.first_name || "Guest",
          photo_url: user.photo_url || "",
          last_updated: serverTimestamp(),
          // Don't overwrite score if exists, unless you have logic to update it
        }, { merge: true });
      };
      syncUser();
    }

    if (tg) {
      tg.expand();
      tg.ready();
      tg.setHeaderColor("#0B0E11");
      tg.setBackgroundColor("#0B0E11");
    }

    // Subscribe to leaderboard updates
    const q = query(collection(db, "users"), orderBy("score", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data() as User,
        user_id: doc.data().user_id
      }));
      setLeaderboard(data);
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Gagal memuat data real-time");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return "text-[#F0B90B]"; // Gold
      case 1: return "text-[#C0C0C0]"; // Silver
      case 2: return "text-[#CD7F32]"; // Bronze
      default: return "text-gray-500";
    }
  };

  const avatarColors = [
    "bg-[#FF4B2B]", "bg-[#1f8EF1]", "bg-[#58D37D]", 
    "bg-[#FFD200]", "bg-[#9B51E0]", "bg-[#F2994A]",
    "bg-[#EB5757]", "bg-[#27AE60]", "bg-[#2D9CDB]"
  ];

  const getAvatarPlaceholder = (user: User, size: "sm" | "md" | "lg" = "md") => {
    const username = user.username || `User ${user.user_id}`;
    const initials = username
      .split(" ")
      .map(n => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    
    // Use user_id as seed for color selection to ensure consistency
    const colorIndex = Math.abs(user.user_id) % avatarColors.length;
    const colorClass = avatarColors[colorIndex];
    
    const sizeClasses = {
      sm: "w-10 h-10 text-xs",
      md: "w-12 h-12 text-sm",
      lg: "w-28 h-28 text-3xl"
    };

    const podiumSizeClasses = {
      sm: "w-20 h-20 text-xl",
      md: "w-20 h-20 text-xl",
      lg: "w-28 h-28 text-3xl"
    };

    // Special handling for podium sizes if needed, but let's stick to simple ones
    const finalSizeClass = sizeClasses[size];

    return (
      <div className={`${finalSizeClass} rounded-full flex items-center justify-center font-black text-white shadow-inner ${colorClass} transition-transform group-hover:scale-105`}>
        {initials}
      </div>
    );
  };

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
      <header className="p-6 flex flex-col gap-4 sticky top-0 bg-[#0B0E11]/90 backdrop-blur-md z-50 transition-all border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 border-2 border-[#F0B90B]/50 shrink-0 shadow-[0_0_15px_rgba(240,185,11,0.2)] flex items-center justify-center">
              {tgUser?.photo_url ? (
                <img src={tgUser.photo_url} alt={tgUser.username} className="w-full h-full object-cover" />
              ) : (
                getAvatarPlaceholder({ user_id: tgUser?.id || 0, username: tgUser?.first_name || 'U', score: 0 }, "sm")
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-[#F0B90B] uppercase font-black tracking-[0.2em] leading-none mb-1">Elite Tracker</span>
              <h2 className="text-base font-extrabold truncate max-w-[140px]">
                {tgUser?.username ? `@${tgUser.username}` : tgUser?.first_name || 'Guest User'}
              </h2>
              <span className="text-[8px] text-gray-500 font-medium mt-1">Updates: every 24h</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-[#1A1D22] p-2 rounded-xl border border-white/5 flex items-center gap-2">
               <Crown className="w-4 h-4 text-[#F0B90B]" />
               <span className="text-xs font-bold text-gray-300">#{leaderboard.findIndex(u => u.user_id === tgUser?.id) + 1 || '--'}</span>
            </div>
            <RotateCcw 
              onClick={() => !refreshing && fetchLeaderboard(true)}
              className={`w-5 h-5 text-gray-400 hover:text-white transition-colors cursor-pointer ${refreshing ? 'animate-spin text-[#F0B90B]' : ''}`} 
            />
            <Menu className="w-6 h-6 text-gray-400 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
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
                
                {/* Rank Change Pod */}
                {topThree[1].previous_rank !== undefined && topThree[1].previous_rank !== 2 && (
                  <div className={`absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full border border-[#0B0E11] text-[8px] font-black z-10 flex items-center gap-0.5 ${topThree[1].previous_rank > 2 ? 'bg-[#58D37D] text-black' : 'bg-[#EB5757] text-white'}`}>
                    {topThree[1].previous_rank > 2 ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                    {Math.abs(topThree[1].previous_rank - 2)}
                  </div>
                )}

                <div className="w-20 h-20 rounded-full border-4 border-[#F0B90B]/30 p-1 flex items-center justify-center">
                  {topThree[1].photo_url ? (
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img src={topThree[1].photo_url} alt={topThree[1].username} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    getAvatarPlaceholder(topThree[1], "md")
                  )}
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
                {/* Rank Change Pod */}
                {topThree[0].previous_rank !== undefined && topThree[0].previous_rank !== 1 && (
                  <div className={`absolute top-0 -left-2 px-2 py-1 rounded-full border-2 border-[#0B0E11] text-[10px] font-black z-10 flex items-center gap-0.5 ${topThree[0].previous_rank > 1 ? 'bg-[#58D37D] text-black' : 'bg-[#EB5757] text-white'}`}>
                    <ChevronUp className="w-3 h-3" />
                    {Math.abs(topThree[0].previous_rank - 1)}
                  </div>
                )}

                <div className="w-28 h-28 rounded-full border-4 border-[#F0B90B] p-1 shadow-[0_0_20px_rgba(240,185,11,0.3)] flex items-center justify-center">
                  {topThree[0].photo_url ? (
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img src={topThree[0].photo_url} alt={topThree[0].username} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    getAvatarPlaceholder(topThree[0], "lg")
                  )}
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
                
                {/* Rank Change Pod */}
                {topThree[2].previous_rank !== undefined && topThree[2].previous_rank !== 3 && (
                  <div className={`absolute -bottom-1 -left-1 px-1.5 py-0.5 rounded-full border border-[#0B0E11] text-[8px] font-black z-10 flex items-center gap-0.5 ${topThree[2].previous_rank > 3 ? 'bg-[#58D37D] text-black' : 'bg-[#EB5757] text-white'}`}>
                    {topThree[2].previous_rank > 3 ? <ChevronUp className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                    {Math.abs(topThree[2].previous_rank - 3)}
                  </div>
                )}

                <div className="w-20 h-20 rounded-full border-4 border-[#CD7F32]/30 p-1 flex items-center justify-center">
                  {topThree[2].photo_url ? (
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <img src={topThree[2].photo_url} alt={topThree[2].username} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    getAvatarPlaceholder(topThree[2], "md")
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold max-w-[80px] truncate text-center">{topThree[2].username}</span>
            </motion.div>
          )}
        </div>
      </section>

      {/* List Section */}
      <section className="px-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {restOfUsers.map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ scale: 1.02, backgroundColor: index === 2 ? '#64E48C' : '#252930' }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.05 
              }}
              className={`flex items-center p-4 rounded-2xl relative cursor-pointer group transition-colors ${index === 2 ? 'bg-[#58D37D] text-black' : 'bg-[#1A1D22]'}`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 backdrop-blur-md rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap hidden sm:block">
                <p className="text-xs font-bold text-white">{user.username || `User ${user.user_id}`}</p>
                <p className="text-[10px] text-gray-400">Score: {user.score.toLocaleString()}</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black/90" />
              </div>

              <span className={`w-8 text-center font-bold text-lg mr-2 ${index === 2 ? 'text-black' : 'text-gray-400'}`}>
                {index + 1}
              </span>
              
              {/* Rank Change Indicator */}
              <div className="flex flex-col items-center mr-3 w-6 shrink-0">
                {user.previous_rank !== undefined && (
                  <>
                    {user.previous_rank > (index + 1) ? (
                      <div className="flex flex-col items-center gap-0">
                        <ChevronUp className="w-4 h-4 text-[#58D37D]" />
                        <span className="text-[8px] font-bold text-[#58D37D]">+{user.previous_rank - (index + 1)}</span>
                      </div>
                    ) : user.previous_rank < (index + 1) ? (
                      <div className="flex flex-col items-center gap-0">
                        <ChevronDown className="w-4 h-4 text-[#EB5757]" />
                        <span className="text-[8px] font-bold text-[#EB5757]">-{Math.abs(user.previous_rank - (index + 1))}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center opacity-30">
                        <Minus className="w-3 h-3 text-gray-500" />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="w-12 h-12 rounded-full overflow-hidden mr-4 shrink-0 shadow-sm flex items-center justify-center">
                 {user.photo_url ? (
                   <img src={user.photo_url} alt={user.username} className="w-full h-full object-cover" />
                 ) : (
                   getAvatarPlaceholder(user, "md")
                 )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold truncate ${index === 2 ? 'text-black' : 'text-white'}`}>
                  {user.username || `User ${user.user_id}`}
                </h3>
                {user.previous_rank && user.previous_rank !== (index + 1) && (
                  <p className={`text-[9px] font-bold ${index === 2 ? 'text-black/60' : 'text-gray-500'}`}>
                    Prev: #{user.previous_rank}
                  </p>
                )}
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
          className={`relative flex flex-col items-center gap-1 transition-all flex-1 py-4 ${activeTab === "challenges" ? "text-white" : "text-gray-500 opacity-60"}`}
        >
          {activeTab === "challenges" && (
             <motion.div 
               layoutId="nav-bg"
               className="absolute inset-0 bg-white/5 rounded-2xl -z-10 mx-2"
               transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
             />
          )}
          <div className="text-xl">🏆</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Challenges</span>
        </button>

        <button 
          onClick={() => setActiveTab("achievements")}
          className={`relative flex flex-col items-center gap-1 transition-all flex-1 py-4 ${activeTab === "achievements" ? "text-white" : "text-gray-500 opacity-60"}`}
        >
          {activeTab === "achievements" && (
             <motion.div 
               layoutId="nav-bg"
               className="absolute inset-0 bg-white/5 rounded-2xl -z-10 mx-2"
               transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
             />
          )}
          <div className="text-xl">📋</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Achievements</span>
        </button>

        <button 
          onClick={() => setActiveTab("leaderboard")}
          className={`relative flex flex-col items-center gap-1 transition-all flex-1 py-4 ${activeTab === "leaderboard" ? "text-white" : "text-gray-500 opacity-60"}`}
        >
          {activeTab === "leaderboard" && (
             <motion.div 
               layoutId="nav-bg"
               className="absolute inset-0 bg-white/10 rounded-2xl -z-10 mx-2"
               transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
             />
          )}
          <div className="text-xl">👑</div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Leaderboard</span>
        </button>
      </nav>
    </div>
  );
}

