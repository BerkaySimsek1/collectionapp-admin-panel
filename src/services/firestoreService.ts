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
import { db as firestore } from '../firebase'; // Firestore örneğinizin yolu doğru olmalı

// ... (Diğer genel CRUD fonksiyonları: getAll, getById, add, update, remove, queryByField, queryWithOrder - bu kısımlar değişmeyecek)

/**
 * Belirtilen tipteki tüm raporları getirir (yeni Firebase yapısına göre)
 * @param type Rapor tipi ('user' | 'group' | 'auction')
 * @returns Promise<any[]>
 */
export const getReports = async (type: 'user' | 'group' | 'auction'): Promise<any[]> => {
  try {
    console.log(`${type} tipi için raporlar alınıyor (yeni yapı)...`);

    const reportsCollectionRef = collection(firestore, 'reports');
    // Raporları `type` alanına göre filtrele
    const q = query(reportsCollectionRef, where('type', '==', type));
    const querySnapshot = await getDocs(q);

    const allReports: any[] = [];

    for (const reportDoc of querySnapshot.docs) {
      try {
        const reportData = reportDoc.data();

        const reportObj: any = {
          id: reportDoc.id,
          ...reportData,
          // Firestore Timestamp objesini Date objesine, sonra ISO string'e çevir
          createdAt: reportData.timestamp ? new Date(reportData.timestamp.toDate()).toISOString() : new Date().toISOString(),
          status: reportData.status || 'pending' // Varsayılan durum değeri
        };

        // Raporlayan kullanıcı bilgilerini getir (reporterId, rapor belgesinin içinde)
        if (reportData.reporterId) {
          try {
            const reporterDocRef = doc(firestore, 'users', reportData.reporterId);
            const reporterSnapshot = await getDoc(reporterDocRef);
            if (reporterSnapshot.exists()) {
              reportObj.reporter = { uid: reporterSnapshot.id, ...reporterSnapshot.data() };
            }
          } catch (e) {
            console.error(`Raporlayan kullanıcı bilgisi alınamadı (ID: ${reportData.reporterId}): ${e}`);
          }
        }

        // Raporlanan entiteyi getir (reportedId, rapor belgesinin içinde)
        if (reportData.reportedId) {
          if (type === 'user') {
            try {
              const reportedUserDocRef = doc(firestore, 'users', reportData.reportedId);
              const reportedUserSnapshot = await getDoc(reportedUserDocRef);
              if (reportedUserSnapshot.exists()) {
                reportObj.reportedUser = { uid: reportedUserSnapshot.id, ...reportedUserSnapshot.data() };
              }
            } catch (e) {
              console.error(`Raporlanan kullanıcı bilgisi alınamadı (ID: ${reportData.reportedId}): ${e}`);
            }
          } else if (type === 'group') {
            try {
              const reportedGroupDocRef = doc(firestore, 'groups', reportData.reportedId);
              const reportedGroupSnapshot = await getDoc(reportedGroupDocRef);
              if (reportedGroupSnapshot.exists()) {
                reportObj.reportedGroup = { id: reportedGroupSnapshot.id, ...reportedGroupSnapshot.data() };
              }
            } catch (e) {
              console.error(`Raporlanan grup bilgisi alınamadı (ID: ${reportData.reportedId}): ${e}`);
            }
          } else if (type === 'auction') {
            // Açık artırma raporlarında hem reportedId (genellikle satıcı) hem de auctionId olabilir
            try {
              const reportedUserDocRef = doc(firestore, 'users', reportData.reportedId);
              const reportedUserSnapshot = await getDoc(reportedUserDocRef);
              if (reportedUserSnapshot.exists()) {
                reportObj.reportedUser = { uid: reportedUserSnapshot.id, ...reportedUserSnapshot.data() };
              }
            } catch (e) {
              console.error(`Açık artırma ile ilgili raporlanan kullanıcı bilgisi alınamadı (ID: ${reportData.reportedId}): ${e}`);
            }

            if (reportData.auctionId) { // auctionId de belgenin içinde tutuluyor
              try {
                const auctionDocRef = doc(firestore, 'auctions', reportData.auctionId);
                const auctionSnapshot = await getDoc(auctionDocRef);
                if (auctionSnapshot.exists()) {
                  reportObj.reportedAuction = { id: auctionSnapshot.id, ...auctionSnapshot.data() };
                }
              } catch (e) {
                console.error(`Raporlanan açık artırma bilgisi alınamadı (ID: ${reportData.auctionId}): ${e}`);
              }
            }
          }
        }
        allReports.push(reportObj);
      } catch (e) {
        console.error(`Rapor işlenirken hata (ID: ${reportDoc.id}): ${e}`);
      }
    }

    console.log(`${type} tipinde toplam ${allReports.length} rapor bulundu (yeni yapı).`);
    return allReports;
  } catch (error) {
    console.error(`${type} raporları alınırken hata (yeni yapı):`, error);
    throw error;
  }
};

/**
 * Belirtilen raporun durumunu günceller (yeni Firebase yapısına göre)
 * @param type Rapor tipi (bu fonksiyon için aslında gerekli değil ama imza uyumluluğu için tutulabilir)
 * @param reportId Güncellenecek raporun ID'si
 * @param status Yeni durum
 * @param adminId Durumu güncelleyen yöneticinin ID'si
 * @returns Promise<void>
 */

export const updateReportStatus = async (
  type: 'user' | 'group' | 'auction', // type parametresi artık doğrudan kullanılmıyor, ancak imzayı korumak için tutulabilir.
  reportId: string,
  status: 'pending' | 'resolved' | 'rejected',
  adminId: string
): Promise<void> => {
  try {
    console.log(`Rapor durumu güncelleniyor (yeni yapı): Rapor ID: ${reportId} -> ${status}`);

    // Doğrudan 'reports' ana koleksiyonundan raporu bul
    const reportDocRef = doc(firestore, 'reports', reportId);
    const reportSnapshot = await getDoc(reportDocRef);

    if (reportSnapshot.exists()) {
      await updateDoc(reportDocRef, {
        status: status,
        resolvedAt: serverTimestamp(),
        resolvedBy: adminId
      });
      console.log(`Rapor (ID: ${reportId}) durumu başarıyla güncellendi.`);
    } else {
      console.warn(`Rapor bulunamadı veya yetkiniz yok: ID: ${reportId}`);
      // İsteğe bağlı olarak hata fırlatılabilir
      throw new Error(`Rapor bulunamadı: ${reportId}`);
    }
  } catch (error) {
    console.error('Rapor durumu güncellenirken hata (yeni yapı):', error);
    throw error;
  }
};