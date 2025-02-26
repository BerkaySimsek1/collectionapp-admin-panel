import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Belirtilen koleksiyondan tüm belgeleri getirir
 * @param collectionName Koleksiyon adı
 * @returns Promise<QuerySnapshot<DocumentData>>
 */
export const getAll = async (collectionName: string): Promise<QuerySnapshot<DocumentData>> => {
  const collectionRef = collection(db, collectionName);
  return getDocs(collectionRef);
};

/**
 * Belirtilen koleksiyondan belirli bir belgeyi getirir
 * @param collectionName Koleksiyon adı
 * @param id Belge ID'si
 * @returns Promise<DocumentSnapshot<DocumentData>>
 */
export const getById = async (collectionName: string, id: string): Promise<DocumentSnapshot<DocumentData>> => {
  const docRef = doc(db, collectionName, id);
  return getDoc(docRef);
};

/**
 * Belirtilen koleksiyona yeni bir belge ekler
 * @param collectionName Koleksiyon adı
 * @param data Eklenecek veri
 * @returns Promise<DocumentReference<DocumentData>>
 */
export const add = async (collectionName: string, data: any): Promise<DocumentReference<DocumentData>> => {
  const collectionRef = collection(db, collectionName);
  return addDoc(collectionRef, data);
};

/**
 * Belirtilen belgeyi günceller
 * @param collectionName Koleksiyon adı
 * @param id Belge ID'si
 * @param data Güncellenecek veri
 * @returns Promise<void>
 */
export const update = async (collectionName: string, id: string, data: any): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  return updateDoc(docRef, data);
};

/**
 * Belirtilen belgeyi siler
 * @param collectionName Koleksiyon adı
 * @param id Belge ID'si
 * @returns Promise<void>
 */
export const remove = async (collectionName: string, id: string): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  return deleteDoc(docRef);
};

/**
 * Belirtilen koleksiyonda filtreleme yapar
 * @param collectionName Koleksiyon adı
 * @param fieldPath Alan yolu
 * @param opStr Operatör
 * @param value Değer
 * @returns Promise<QuerySnapshot<DocumentData>>
 */
export const queryByField = async (
  collectionName: string,
  fieldPath: string,
  opStr: any,
  value: any
): Promise<QuerySnapshot<DocumentData>> => {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, where(fieldPath, opStr, value));
  return getDocs(q);
};

/**
 * Belirtilen koleksiyonda sıralama yapar
 * @param collectionName Koleksiyon adı
 * @param fieldPath Alan yolu
 * @param direction Sıralama yönü
 * @param limitCount Sonuç sayısı limiti
 * @returns Promise<QuerySnapshot<DocumentData>>
 */
export const queryWithOrder = async (
  collectionName: string,
  fieldPath: string,
  direction: 'asc' | 'desc',
  limitCount: number = 10
): Promise<QuerySnapshot<DocumentData>> => {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, orderBy(fieldPath, direction), limit(limitCount));
  return getDocs(q);
}; 