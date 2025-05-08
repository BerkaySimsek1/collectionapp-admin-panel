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
  CollectionReference,
  collectionGroup,
  serverTimestamp
} from 'firebase/firestore';
import { db as firestore } from '../firebase';

/**
 * Belirtilen koleksiyondan tüm belgeleri getirir
 * @param collectionName Koleksiyon adı
 * @returns Promise<QuerySnapshot<DocumentData>>
 */
export const getAll = async (collectionName: string): Promise<QuerySnapshot<DocumentData>> => {
  const collectionRef = collection(firestore, collectionName);
  return getDocs(collectionRef);
};

/**
 * Belirtilen koleksiyondan belirli bir belgeyi getirir
 * @param collectionName Koleksiyon adı
 * @param id Belge ID'si
 * @returns Promise<DocumentSnapshot<DocumentData>>
 */
export const getById = async (collectionName: string, id: string): Promise<DocumentSnapshot<DocumentData>> => {
  const docRef = doc(firestore, collectionName, id);
  return getDoc(docRef);
};

/**
 * Belirtilen koleksiyona yeni bir belge ekler
 * @param collectionName Koleksiyon adı
 * @param data Eklenecek veri
 * @returns Promise<DocumentReference<DocumentData>>
 */
export const add = async (collectionName: string, data: any): Promise<DocumentReference<DocumentData>> => {
  const collectionRef = collection(firestore, collectionName);
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
  const docRef = doc(firestore, collectionName, id);
  return updateDoc(docRef, data);
};

/**
 * Belirtilen belgeyi siler
 * @param collectionName Koleksiyon adı
 * @param id Belge ID'si
 * @returns Promise<void>
 */
export const remove = async (collectionName: string, id: string): Promise<void> => {
  const docRef = doc(firestore, collectionName, id);
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
  const collectionRef = collection(firestore, collectionName);
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
  const collectionRef = collection(firestore, collectionName);
  const q = query(collectionRef, orderBy(fieldPath, direction), limit(limitCount));
  return getDocs(q);
};

// Rapor servisleri
export const getReports = async (type: 'user' | 'group' | 'auction'): Promise<any[]> => {
  try {
    console.log(`${type} tipi için raporlar alınıyor...`);
    
    // reports/type koleksiyonunu al
    const reportsRef = collection(firestore, `reports/${type}`);
    const reportsSnapshot = await getDocs(reportsRef);
    
    console.log('Raporlayan kullanıcılar:', reportsSnapshot.docs.map(doc => doc.id));
    
    const allReports: any[] = [];
    
    // Her bir raporlayan kullanıcı için
    for (const reporterDoc of reportsSnapshot.docs) {
      const reporterId = reporterDoc.id;
      
      // Kullanıcının raporlarını al
      const userReportsRef = collection(firestore, `reports/${type}/${reporterId}`);
      const userReportsSnapshot = await getDocs(userReportsRef);
      
      console.log(`${reporterId} kullanıcısının raporları:`, userReportsSnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      })));
      
      // Her bir raporu işle
      for (const reportDoc of userReportsSnapshot.docs) {
        try {
          const reportData = reportDoc.data();
          
          const reportObj: any = {
            id: reportDoc.id,
            ...reportData,
            reporterId,
            // Timestamp'ı ISO string'e çevir
            createdAt: reportData.timestamp ? new Date(reportData.timestamp.toDate()).toISOString() : new Date().toISOString(),
            // Varsayılan durum değeri ata
            status: reportData.status || 'pending'
          };
          
          // Raporlayan kullanıcı bilgilerini getir
          try {
            const reporterDocRef = doc(firestore, 'users', reporterId);
            const reporterSnapshot = await getDoc(reporterDocRef);
            if (reporterSnapshot.exists()) {
              reportObj.reporter = { uid: reporterSnapshot.id, ...reporterSnapshot.data() };
            }
          } catch (e) {
            console.error(`Raporlayan kullanıcı bilgisi alınamadı: ${e}`);
          }
          
          // Raporlanan entiteyi getir
          if (reportData.reportedId) {
            if (type === 'user') {
              try {
                const reportedUserDocRef = doc(firestore, 'users', reportData.reportedId);
                const reportedUserSnapshot = await getDoc(reportedUserDocRef);
                if (reportedUserSnapshot.exists()) {
                  reportObj.reportedUser = { uid: reportedUserSnapshot.id, ...reportedUserSnapshot.data() };
                }
              } catch (e) {
                console.error(`Raporlanan kullanıcı bilgisi alınamadı: ${e}`);
              }
            } else if (type === 'group') {
              try {
                const reportedGroupDocRef = doc(firestore, 'groups', reportData.reportedId);
                const reportedGroupSnapshot = await getDoc(reportedGroupDocRef);
                if (reportedGroupSnapshot.exists()) {
                  reportObj.reportedGroup = { id: reportedGroupSnapshot.id, ...reportedGroupSnapshot.data() };
                }
              } catch (e) {
                console.error(`Raporlanan grup bilgisi alınamadı: ${e}`);
              }
            } else if (type === 'auction') {
              // Raporlanan kullanıcı bilgilerini getir
              try {
                const reportedUserDocRef = doc(firestore, 'users', reportData.reportedId);
                const reportedUserSnapshot = await getDoc(reportedUserDocRef);
                if (reportedUserSnapshot.exists()) {
                  reportObj.reportedUser = { uid: reportedUserSnapshot.id, ...reportedUserSnapshot.data() };
                }
              } catch (e) {
                console.error(`Raporlanan kullanıcı bilgisi alınamadı: ${e}`);
              }
              
              // Raporlanan açık artırma bilgilerini getir
              if (reportData.auctionId) {
                try {
                  const auctionDocRef = doc(firestore, 'auctions', reportData.auctionId);
                  const auctionSnapshot = await getDoc(auctionDocRef);
                  if (auctionSnapshot.exists()) {
                    reportObj.reportedAuction = { id: auctionSnapshot.id, ...auctionSnapshot.data() };
                  }
                } catch (e) {
                  console.error(`Raporlanan açık artırma bilgisi alınamadı: ${e}`);
                }
              }
            }
          }
          
          // Raporu listeye ekle
          allReports.push(reportObj);
          console.log('Rapor eklendi:', reportObj);
        } catch (e) {
          console.error(`Rapor işlenirken hata: ${e}, rapor ID: ${reportDoc.id}`);
        }
      }
    }
    
    console.log(`${type} tipinde toplam ${allReports.length} rapor bulundu.`);
    console.log('Bulunan raporlar:', allReports);
    return allReports;
  } catch (error) {
    console.error(`${type} raporları alınırken hata:`, error);
    throw error;
  }
};

export const updateReportStatus = async (
  type: 'user' | 'group' | 'auction', 
  reportId: string, 
  status: 'pending' | 'resolved' | 'rejected',
  adminId: string
): Promise<void> => {
  try {
    console.log(`Rapor durumu güncelleniyor: ${type}/${reportId} -> ${status}`);
    
    // Önce reports/type koleksiyonunu al
    const reportsRef = collection(firestore, `reports/${type}`);
    const reportsSnapshot = await getDocs(reportsRef);
    
    let found = false;
    
    // Her bir raporlayan kullanıcı için
    for (const reporterDoc of reportsSnapshot.docs) {
      const reporterId = reporterDoc.id;
      
      // Kullanıcının raporlarını al
      const userReportsRef = collection(firestore, `reports/${type}/${reporterId}`);
      const userReportsSnapshot = await getDocs(userReportsRef);
      
      // Raporu bul
      const reportDoc = userReportsSnapshot.docs.find(doc => doc.id === reportId);
      if (reportDoc) {
        console.log(`Güncellenecek rapor bulundu: reports/${type}/${reporterId}/${reportId}`);
        await updateDoc(reportDoc.ref, {
          status: status,
          resolvedAt: serverTimestamp(),
          resolvedBy: adminId
        });
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.error(`Rapor bulunamadı: ${type}/${reportId}`);
    }
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}; 