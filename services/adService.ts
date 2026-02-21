import { db } from '../firebase.ts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Ad } from '../types.ts';

export const fetchAds = async (): Promise<Ad[]> => {
  try {
    const adsRef = collection(db, 'ads');
    const q = query(adsRef, where('is_active', '==', true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Ad));
  } catch (error) {
    console.error("Error fetching ads:", error);
    return [];
  }
};
