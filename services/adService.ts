import { db, auth } from '../firebase.ts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { Ad } from '../types.ts';

export const fetchAds = async (): Promise<Ad[]> => {
  try {
    // Ensure user is authenticated anonymously if not already signed in
    if (!auth.currentUser) {
        try {
            await signInAnonymously(auth);
        } catch (authError) {
            console.warn("Anonymous auth failed:", authError);
            // Continue anyway, maybe public read is allowed
        }
    }

    const adsRef = collection(db, 'ads');
    const q = query(adsRef, where('is_active', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ad));
  } catch (error: any) {
    // Suppress permission errors to avoid console noise
    if (error?.code === 'permission-denied') {
        console.warn("Ads fetch skipped: Permission denied (Firestore rules require auth or are restrictive).");
        return [];
    }
    console.error("Error fetching ads:", error);
    return [];
  }
};
