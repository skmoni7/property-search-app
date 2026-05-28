import {
  collection, addDoc, getDocs, getDoc, deleteDoc, doc, updateDoc,
  query, where, serverTimestamp, orderBy, setDoc, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface LocationWorkspace { id?: string; name: string; ownerId: string; collaborators: string[]; createdAt?: unknown; }
export interface RentProperty { id?: string; address: string; price: number | null; sqft: number | null; distanceWork1: string | null; durationWork1: string | null; distanceWork2: string | null; durationWork2: string | null; costco: { name: string; distance: string; duration: string } | null; walmart: { name: string; distance: string; duration: string } | null; indianStore: { name: string; distance: string; duration: string } | null; lat: number | null; lng: number | null; notes: string; manualOverrides: Record<string, boolean>; createdAt?: unknown; }
export interface BuyProperty { id?: string; address: string; beds: number | null; baths: number | null; sqft: number | null; lotSize: number | null; price: number | null; schoolRating: string; elementarySchool: string | null; middleSchool: string | null; highSchool: string | null; distanceWork1: string | null; durationWork1: string | null; distanceWork2: string | null; durationWork2: string | null; costco: { name: string; distance: string; duration: string } | null; walmart: { name: string; distance: string; duration: string } | null; indianStore: { name: string; distance: string; duration: string } | null; lat: number | null; lng: number | null; notes: string; manualOverrides: Record<string, boolean>; createdAt?: unknown; }
export interface UserProfile { uid: string; email: string; workplace1: string; workplace2: string; }

// --- LOCATION WORKSPACES ---
export async function createLocation(userId: string, name: string): Promise<string> {
  const ref = await addDoc(collection(db, 'locations'), { name, ownerId: userId, collaborators: [], createdAt: serverTimestamp() });
  return ref.id;
}
export async function getUserLocations(userId: string, userEmail: string): Promise<LocationWorkspace[]> {
  const ownedQ = query(collection(db, 'locations'), where('ownerId', '==', userId));
  const sharedQ = query(collection(db, 'locations'), where('collaborators', 'array-contains', userEmail));
  const [ownedSnap, sharedSnap] = await Promise.all([getDocs(ownedQ), getDocs(sharedQ)]);
  const results: LocationWorkspace[] = [];
  const seen = new Set<string>();
  [...ownedSnap.docs, ...sharedSnap.docs].forEach((d) => { if (!seen.has(d.id)) { seen.add(d.id); results.push({ id: d.id, ...d.data() } as LocationWorkspace); } });
  return results;
}
export async function deleteLocation(locationId: string): Promise<void> { await deleteDoc(doc(db, 'locations', locationId)); }

// --- RENT/BUY PROPERTIES ---
export async function addRentProperty(locationId: string, property: Omit<RentProperty, 'id' | 'createdAt'>): Promise<string> { const ref = await addDoc(collection(db, 'locations', locationId, 'rentProperties'), { ...property, createdAt: serverTimestamp() }); return ref.id; }
export function subscribeRentProperties(locationId: string, callback: (properties: RentProperty[]) => void) { const q = query(collection(db, 'locations', locationId, 'rentProperties'), orderBy('createdAt', 'asc')); return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RentProperty)))); }
export async function deleteRentProperty(locationId: string, propertyId: string): Promise<void> { await deleteDoc(doc(db, 'locations', locationId, 'rentProperties', propertyId)); }

export async function addBuyProperty(locationId: string, property: Omit<BuyProperty, 'id' | 'createdAt'>): Promise<string> { const ref = await addDoc(collection(db, 'locations', locationId, 'buyProperties'), { ...property, createdAt: serverTimestamp() }); return ref.id; }
export function subscribeBuyProperties(locationId: string, callback: (properties: BuyProperty[]) => void) { const q = query(collection(db, 'locations', locationId, 'buyProperties'), orderBy('createdAt', 'asc')); return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BuyProperty)))); }
export async function deleteBuyProperty(locationId: string, propertyId: string): Promise<void> { await deleteDoc(doc(db, 'locations', locationId, 'buyProperties', propertyId)); }

// --- USER PROFILE ---
export async function saveUserProfile(uid: string, profile: Partial<UserProfile>): Promise<void> { await setDoc(doc(db, 'users', uid), profile, { merge: true }); }
export async function getUserProfile(uid: string): Promise<UserProfile | null> { const snap = await getDoc(doc(db, 'users', uid)); if (!snap.exists()) return null; return snap.data() as UserProfile; }
export async function getUserByEmail(email: string): Promise<UserProfile | null> { const q = query(collection(db, 'users'), where('email', '==', email)); const snap = await getDocs(q); if (snap.empty) return null; return snap.docs[0].data() as UserProfile; }