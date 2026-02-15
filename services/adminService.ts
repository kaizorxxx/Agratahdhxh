
import { auth, db } from '../firebase.ts';
import { collection, getDocs, doc, setDoc, increment, updateDoc, getDoc } from 'firebase/firestore';

/**
 * Service untuk mengelola data administratif menggunakan Firebase Firestore.
 */
class AdminService {
  
  // Mengambil user saat ini
  async getCurrentUser() {
    const user = auth.currentUser;
    if (user) {
      console.log(`User detected:`, user.email);
    }
    return user;
  }

  // Mengambil daftar semua user (Hanya user yang terdaftar di Firestore users collection)
  async getAllUsers() {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }

  // Mendapatkan semua script iklan yang aktif
  async getActiveAds() {
    try {
      const querySnapshot = await getDocs(collection(db, "ads"));
      const ads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // @ts-ignore
      return ads.filter(ad => ad.is_active);
    } catch (error) {
      console.error("Error fetching ads:", error);
      return [];
    }
  }

  // Mengupdate statistik menggunakan Firestore Atomic Increment
  async incrementStat(key: 'total_views' | 'ad_clicks') {
    try {
      const statRef = doc(db, "stats", key);
      await setDoc(statRef, { value: increment(1) }, { merge: true });
    } catch (error) {
      console.error("Error incrementing stat:", error);
    }
  }

  // Mendapatkan dashboard stats
  async getDashboardStats() {
    try {
      const querySnapshot = await getDocs(collection(db, "stats"));
      const stats: any = {};
      querySnapshot.forEach((doc) => {
        stats[doc.id] = doc.data().value;
      });
      return stats;
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      return null;
    }
  }
}

export const adminService = new AdminService();
