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
// --- DYNAMIC INLINE UPDATE HELPERS ---
export async function updateRentPropertyField(
  locationId: string, 
  propertyId: string, 
  fields: Record<string, any>
): Promise<void> {
  const ref = doc(db, 'locations', locationId, 'rentProperties', propertyId);
  await updateDoc(ref, {
    ...fields,
    // Track that this field was manually updated via the UI
    [`manualOverrides.${Object.keys(fields)[0]}`]: true
  });
}

export async function updateBuyPropertyField(
  locationId: string, 
  propertyId: string, 
  fields: Record<string, any>
): Promise<void> {
  const ref = doc(db, 'locations', locationId, 'buyProperties', propertyId);
  await updateDoc(ref, {
    ...fields,
    [`manualOverrides.${Object.keys(fields)[0]}`]: true
  });
export interface AmenityHeading {
  id?: string;
  title: string; // e.g., "Costco", "Indian Grocery", "Gyms"
  createdAt?: unknown;
}

export interface AmenityPlace {
  id?: string;
  name: string; // e.g., "Costco Research Blvd"
  address: string; // e.g., "10201 Research Blvd, Austin, TX"
  lat: number | null;
  lng: number | null;
  createdAt?: unknown;
}

// --- CUSTOM AMENITY HEADINGS ---
export async function addAmenityHeading(locationId: string, title: string): Promise<string> {
  const ref = await addDoc(collection(db, 'locations', locationId, 'amenityHeadings'), {
    title,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export function subscribeAmenityHeadings(locationId: string, callback: (headings: AmenityHeading[]) => void) {
  const q = query(collection(db, 'locations', locationId, 'amenityHeadings'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AmenityHeading))));
}

export async function deleteAmenityHeading(locationId: string, headingId: string): Promise<void> {
  await deleteDoc(doc(db, 'locations', locationId, 'amenityHeadings', headingId));
}

// --- CUSTOM PLACES UNDER HEADINGS ---
export async function addAmenityPlace(locationId: string, headingId: string, place: Omit<AmenityPlace, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'locations', locationId, 'amenityHeadings', headingId, 'places'), {
    ...place,
    createdAt: serverTimestamp()
  });
  return ref.id;
}

export function subscribeAmenityPlaces(locationId: string, headingId: string, callback: (places: AmenityPlace[]) => void) {
  const q = query(collection(db, 'locations', locationId, 'amenityHeadings', headingId, 'places'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AmenityPlace))));
}

export async function deleteAmenityPlace(locationId: string, headingId: string, placeId: string): Promise<void> {
  await deleteDoc(doc(db, 'locations', locationId, 'amenityHeadings', headingId, 'places', placeId));
}  
}