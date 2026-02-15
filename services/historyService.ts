
import { HistoryItem } from '../types.ts';
import { auth, db } from '../firebase.ts';
import { doc, setDoc, getDocs, collection, query, orderBy, limit } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'anime_x_history';

export const getHistory = (): HistoryItem[] => {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  } catch (e) {
    return [];
  }
};

// Fungsi baru untuk mengambil history langsung dari Firestore agar permanen
export const getUserHistoryFromFirestore = async (): Promise<HistoryItem[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    
    try {
        const historyRef = collection(db, "users", user.uid, "history");
        const q = query(historyRef, orderBy("updated_at", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        
        const history: HistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            history.push({ id: doc.id, ...doc.data() } as HistoryItem);
        });
        return history;
    } catch (e: any) {
        if (e.code === 'permission-denied') {
            console.warn("History fetch permission denied. Check Firestore Rules.");
        } else {
            console.error("Error fetching Firestore history:", e);
        }
        return [];
    }
};

export const saveProgress = async (item: Omit<HistoryItem, 'id' | 'updated_at' | 'user_id'>) => {
  try {
    // 1. Save to Local Storage (Immediate feedback UI)
    const currentHistory = getHistory();
    const existingIndex = currentHistory.findIndex(h => h.anime_id === item.anime_id);
    
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      user_id: 'guest',
      updated_at: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      currentHistory.splice(existingIndex, 1);
    }
    
    currentHistory.unshift(newItem);
    
    if (currentHistory.length > 20) {
      currentHistory.pop();
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentHistory));

    // 2. Sync with Firebase (Persistent Storage)
    const user = auth.currentUser;
    if (user) {
      const docRef = doc(db, "users", user.uid, "history", item.anime_id);
      
      await setDoc(docRef, {
        anime_id: item.anime_id,
        anime_title: item.anime_title,
        anime_poster: item.anime_poster,
        ep_id: item.ep_id,
        ep_title: item.ep_title,
        timestamp: item.timestamp,
        duration: item.duration,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
  } catch (e: any) {
    if (e.code === 'permission-denied') {
        console.warn("Failed to sync history: Permission denied. Check Firestore Rules.");
    } else {
        console.error("Failed to save history", e);
    }
  }
};

export const removeFromHistory = (animeId: string) => {
  const currentHistory = getHistory();
  const newHistory = currentHistory.filter(h => h.anime_id !== animeId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
};
