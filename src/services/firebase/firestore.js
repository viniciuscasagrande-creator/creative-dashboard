import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, setDoc, getDocs, deleteDoc } from "firebase/firestore";
import app, { hasConfig } from "./config";

let db = null;
let firebaseDB = { isConfigured: false };

if (hasConfig && app) {
  try {
    db = getFirestore(app);
    
    firebaseDB = {
      isConfigured: true,

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

      async addEvent(event) {
        const eventsCol = collection(db, "events");
        const { id, ...eventData } = event;
        const docRef = await addDoc(eventsCol, eventData);
        return docRef.id;
      },

      async updateEvent(id, updatedFields) {
        const docRef = doc(db, "events", id.toString());
        await updateDoc(docRef, updatedFields);
      },

      async saveEvent(event) {
        const { id, ...eventData } = event;
        const docRef = doc(db, "events", id.toString());
        await setDoc(docRef, eventData);
      },

      async seedInitialDataIfEmpty(initialEvents) {
        console.log("Syncing initial events with Firebase Firestore...");
        for (const ev of initialEvents) {
          await this.saveEvent(ev);
        }
      },

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

      async addCoupon(coupon) {
        const couponsCol = collection(db, "coupons");
        const { id, ...couponData } = coupon;
        const docRef = await addDoc(couponsCol, couponData);
        return docRef.id;
      },

      async saveCoupon(coupon) {
        const { id, ...couponData } = coupon;
        const docRef = doc(db, "coupons", id.toString());
        await setDoc(docRef, couponData);
      },

      async deleteCoupon(id) {
        const docRef = doc(db, "coupons", id.toString());
        await deleteDoc(docRef);
      },

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
    
    console.log("🔥 Firestore initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Firestore:", error);
  }
} else {
  console.warn("⚠️ Firebase configuration missing. Running in offline/mock mode.");
}

// Expose globally for app.js legacy references
window.firebaseDB = firebaseDB;

export default firebaseDB;
