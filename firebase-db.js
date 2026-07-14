import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, setDoc, getDocs, deleteDoc } from "firebase/firestore";

// Read from import.meta.env (Vite environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Check if credentials are provided
const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

if (hasConfig) {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Helper functions for Firestore database sync
    window.firebaseDB = {
      isConfigured: true,

      // Listen to real-time updates
      onEventsChange(callback) {
        const eventsCol = collection(db, "events");
        return onSnapshot(eventsCol, (snapshot) => {
          const events = [];
          snapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
          });
          callback(events);
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
        });
      },

      // Add event
      async addEvent(event) {
        const eventsCol = collection(db, "events");
        // Remove client-side id if present to let Firestore generate its own
        const { id, ...eventData } = event;
        const docRef = await addDoc(eventsCol, eventData);
        return docRef.id;
      },

      // Update event
      async updateEvent(id, updatedFields) {
        const docRef = doc(db, "events", id.toString());
        await updateDoc(docRef, updatedFields);
      },

      // Save event with specific ID (used for seeding or duplicating)
      async saveEvent(event) {
        const { id, ...eventData } = event;
        const docRef = doc(db, "events", id.toString());
        await setDoc(docRef, eventData);
      },

      // Seed/Sync initial data to make sure new events exist in Firebase
      async seedInitialDataIfEmpty(initialEvents) {
        console.log("Syncing initial events with Firebase Firestore...");
        for (const ev of initialEvents) {
          // Save or overwrite each initial event with its numeric ID as the document ID
          await this.saveEvent(ev);
        }
      },

      // Listen to real-time coupons updates
      onCouponsChange(callback) {
        const couponsCol = collection(db, "coupons");
        return onSnapshot(couponsCol, (snapshot) => {
          const coupons = [];
          snapshot.forEach((doc) => {
            coupons.push({ id: doc.id, ...doc.data() });
          });
          callback(coupons);
        }, (error) => {
          console.error("Firestore onSnapshot coupons error:", error);
        });
      },

      // Add coupon
      async addCoupon(coupon) {
        const couponsCol = collection(db, "coupons");
        const { id, ...couponData } = coupon;
        const docRef = await addDoc(couponsCol, couponData);
        return docRef.id;
      },

      // Save coupon with specific ID
      async saveCoupon(coupon) {
        const { id, ...couponData } = coupon;
        const docRef = doc(db, "coupons", id.toString());
        await setDoc(docRef, couponData);
      },

      // Delete coupon
      async deleteCoupon(id) {
        const docRef = doc(db, "coupons", id.toString());
        await deleteDoc(docRef);
      },

      // Seed coupons
      async seedInitialCouponsIfEmpty(initialCoupons) {
        const couponsCol = collection(db, "coupons");
        const snapshot = await getDocs(couponsCol);
        if (snapshot.empty) {
          console.log("Seeding initial coupons in Firestore...");
          for (const c of initialCoupons) {
            await this.saveCoupon(c);
          }
        }
      }
    };

    console.log("🔥 Firebase initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    window.firebaseDB = { isConfigured: false };
  }
} else {
  console.warn("⚠️ Firebase configuration is missing or incomplete. Running in offline/mock mode. Fill in your credentials in the `.env` file to enable Firebase database integration.");
  window.firebaseDB = { isConfigured: false };
}
