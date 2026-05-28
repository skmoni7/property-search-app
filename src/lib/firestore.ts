import {
  collection, addDoc, getDocs, deleteDoc, doc,
  updateDoc, query, where, serverTimestamp, onSnapshot
} from 'firebase/firestore'
import { db } from './firebase'
import type { LocationWorkspace, RentProperty, BuyProperty } from './types'

// ── Location Workspaces ──────────────────────────────────────────
export async function createLocation(userId: string, name: string) {
  return addDoc(collection(db, 'locations'), {
    name,
    ownerId: userId,
    collaborators: [],
    createdAt: serverTimestamp(),
  })
}

export async function getUserLocations(userId: string) {
  const q = query(
    collection(db, 'locations'),
    where('ownerId', '==', userId)
  )
  const shared = query(
    collection(db, 'locations'),
    where('collaborators', 'array-contains', userId)
  )
  const [owned, sharedSnap] = await Promise.all([getDocs(q), getDocs(shared)])
  const all = [...owned.docs, ...sharedSnap.docs]
  return all.map(d => ({ id: d.id, ...d.data() })) as LocationWorkspace[]
}

export async function inviteCollaborator(locationId: string, email: string, newCollaborators: string[]) {
  return updateDoc(doc(db, 'locations', locationId), { collaborators: newCollaborators })
}

export async function deleteLocation(locationId: string) {
  return deleteDoc(doc(db, 'locations', locationId))
}

// ── Rent Properties ──────────────────────────────────────────────
export async function addRentProperty(locationId: string, property: Omit<RentProperty, 'id'>) {
  return addDoc(collection(db, 'locations', locationId, 'rentProperties'), {
    ...property,
    createdAt: serverTimestamp(),
  })
}

export function subscribeRentProperties(locationId: string, callback: (props: RentProperty[]) => void) {
  return onSnapshot(collection(db, 'locations', locationId, 'rentProperties'), snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as RentProperty[]
    callback(data.sort((a, b) => a.mapMarker - b.mapMarker))
  })
}

export async function updateRentProperty(locationId: string, propertyId: string, updates: Partial<RentProperty>) {
  return updateDoc(doc(db, 'locations', locationId, 'rentProperties', propertyId), updates)
}

export async function deleteRentProperty(locationId: string, propertyId: string) {
  return deleteDoc(doc(db, 'locations', locationId, 'rentProperties', propertyId))
}

// ── Buy Properties ───────────────────────────────────────────────
export async function addBuyProperty(locationId: string, property: Omit<BuyProperty, 'id'>) {
  return addDoc(collection(db, 'locations', locationId, 'buyProperties'), {
    ...property,
    createdAt: serverTimestamp(),
  })
}

export function subscribeBuyProperties(locationId: string, callback: (props: BuyProperty[]) => void) {
  return onSnapshot(collection(db, 'locations', locationId, 'buyProperties'), snap => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as BuyProperty[]
    callback(data.sort((a, b) => a.mapMarker - b.mapMarker))
  })
}

export async function updateBuyProperty(locationId: string, propertyId: string, updates: Partial<BuyProperty>) {
  return updateDoc(doc(db, 'locations', locationId, 'buyProperties', propertyId), updates)
}

export async function deleteBuyProperty(locationId: string, propertyId: string) {
  return deleteDoc(doc(db, 'locations', locationId, 'buyProperties', propertyId))
}

// ── User Workplace Config ────────────────────────────────────────
export async function saveWorkplaceConfig(userId: string, work1Address: string, work2Address: string) {
  return updateDoc(doc(db, 'users', userId), { work1Address, work2Address })
}
