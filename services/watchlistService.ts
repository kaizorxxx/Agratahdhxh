import { db, auth } from '../firebase.ts';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { Anime } from '../types.ts';

const COLLECTION_NAME = 'watchlist';

export const addToWatchlist = async (anime: Anime) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const docRef = doc(db, "users", user.uid, COLLECTION_NAME, anime.id);
  await setDoc(docRef, {
    anime_id: anime.id,
    anime_title: anime.title,
    anime_poster: anime.poster,
    timestamp: Date.now()
  });
};

export const removeFromWatchlist = async (animeId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const docRef = doc(db, "users", user.uid, COLLECTION_NAME, animeId);
  await deleteDoc(docRef);
};

export const isInWatchlist = async (animeId: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  try {
    const docRef = doc(db, "users", user.uid, COLLECTION_NAME, animeId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        // This is expected if the user is not the owner of the document or rules are strict
        return false;
    }
    console.error("Error checking watchlist status:", error);
    return false;
  }
};

export const getWatchlist = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const colRef = collection(db, "users", user.uid, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.data());
  } catch (error: any) {
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.warn("Watchlist fetch skipped: Permission denied.");
        return [];
    }
    console.error("Error fetching watchlist:", error);
    return [];
  }
};
