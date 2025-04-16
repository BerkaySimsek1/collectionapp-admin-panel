import { collection, getDocs, getDoc, doc, query, where, deleteDoc, updateDoc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Auction, Bid, User } from '../types';

// Firestore'dan gelen auction verisi için interface
interface FirestoreAuctionData {
  id: string;
  name?: string;
  description?: string;
  starting_price?: number;
  creator_id?: string;
  bidder_id?: string;
  end_time?: number;
  image_urls?: string[];
  isAuctionEnd?: boolean;
  bid_history?: Array<{
    user_id?: string;
    amount?: number;
    timestamp?: number;
  }>;
  created_at?: number;
}

// Sıralama seçenekleri için tip tanımı
export type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc';

/**
 * Tüm açık artırmaları getiren fonksiyon
 */
export const getAllAuctions = async (): Promise<Auction[]> => {
  try {
    const auctionsCollection = collection(db, 'auctions');
    const auctionsQuery = query(
      auctionsCollection,
      orderBy("created_at", "desc")
    );
    const auctionDocs = await getDocs(auctionsQuery);
    
    // Tüm auction dokümanlarını toplu olarak işleme
    const auctions: Auction[] = [];
    const userCache: Record<string, User> = {};
    
    // Önce tüm auction verilerini topla
    const auctionDataList: FirestoreAuctionData[] = auctionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<FirestoreAuctionData, 'id'>
    }));
    
    // Gerekli tüm kullanıcı ID'lerini topla
    const userIds = new Set<string>();
    
    auctionDataList.forEach(auction => {
      if (auction.creator_id) userIds.add(auction.creator_id);
      if (auction.bidder_id) userIds.add(auction.bidder_id);
      
      if (auction.bid_history && Array.isArray(auction.bid_history)) {
        auction.bid_history.forEach(bid => {
          if (bid.user_id) userIds.add(bid.user_id);
        });
      }
    });
    
    // Tüm kullanıcı verilerini tek seferde getir
    await Promise.all(Array.from(userIds).map(async userId => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          userCache[userId] = userDoc.data() as User;
        }
      } catch (error) {
        console.error(`Kullanıcı bilgisi alınamadı: ${userId}`, error);
      }
    }));
    
    // Auction verilerini formatla
    for (const auctionData of auctionDataList) {
      const bidHistory = auctionData.bid_history ? 
        auctionData.bid_history.map(bid => ({
          userId: bid.user_id || "",
          amount: bid.amount || 0,
          timestamp: bid.timestamp || 0,
          userInfo: bid.user_id ? userCache[bid.user_id] : undefined
        } as Bid)) : [];
      
      const auction: Auction = {
        id: auctionData.id,
        name: auctionData.name || "",
        description: auctionData.description || "",
        startingPrice: auctionData.starting_price || 0,
        creatorId: auctionData.creator_id || "",
        bidderId: auctionData.bidder_id || "",
        endTime: auctionData.end_time || 0,
        imageUrls: auctionData.image_urls || [],
        isAuctionEnd: auctionData.isAuctionEnd || false,
        bidHistory: bidHistory,
        createdAt: auctionData.created_at || 0,
        creator: auctionData.creator_id ? userCache[auctionData.creator_id] : undefined,
        currentBidder: auctionData.bidder_id ? userCache[auctionData.bidder_id] : undefined
      };
      
      auctions.push(auction);
    }
    
    return auctions;
  } catch (error) {
    console.error("Açık artırmalar alınırken hata oluştu:", error);
    throw error;
  }
};

/**
 * Aktif açık artırmaları getiren fonksiyon
 */
export const getActiveAuctions = async (): Promise<Auction[]> => {
  try {
    const now = Date.now();
    const auctionsCollection = collection(db, 'auctions');
    
    // Hem isAuctionEnd=false olan hem de bitiş tarihi şu andan büyük olan müzayedeleri seç
    const activeAuctionsQuery = query(
      auctionsCollection,
      where("isAuctionEnd", "==", false),
      orderBy("created_at", "desc")
    );
    
    const auctionDocs = await getDocs(activeAuctionsQuery);
    
    // Tüm auction dokümanlarını toplu olarak işleme
    const auctions: Auction[] = [];
    const userCache: Record<string, User> = {};
    
    // Önce tüm auction verilerini topla
    const auctionDataList: FirestoreAuctionData[] = auctionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<FirestoreAuctionData, 'id'>
    }));
    
    // Gerekli tüm kullanıcı ID'lerini topla
    const userIds = new Set<string>();
    
    auctionDataList.forEach(auction => {
      if (auction.creator_id) userIds.add(auction.creator_id);
      if (auction.bidder_id) userIds.add(auction.bidder_id);
      
      if (auction.bid_history && Array.isArray(auction.bid_history)) {
        auction.bid_history.forEach(bid => {
          if (bid.user_id) userIds.add(bid.user_id);
        });
      }
    });
    
    // Tüm kullanıcı verilerini tek seferde getir
    await Promise.all(Array.from(userIds).map(async userId => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          userCache[userId] = userDoc.data() as User;
        }
      } catch (error) {
        console.error(`Kullanıcı bilgisi alınamadı: ${userId}`, error);
      }
    }));
    
    // Auction verilerini formatla ve sadece gerçekten aktif olanları filtrele
    for (const auctionData of auctionDataList) {
      // Bitiş zamanını sayısal değere dönüştür
      const endTime = Number(auctionData.end_time);
      
      // Eğer bitiş zamanı geçmişse, bu müzayede artık aktif değil
      if (endTime <= now) {
        continue; // Bu müzayedeyi atla
      }
      
      const bidHistory = auctionData.bid_history ? 
        auctionData.bid_history.map(bid => ({
          userId: bid.user_id || "",
          amount: bid.amount || 0,
          timestamp: bid.timestamp || 0,
          userInfo: bid.user_id ? userCache[bid.user_id] : undefined
        } as Bid)) : [];
      
      const auction: Auction = {
        id: auctionData.id,
        name: auctionData.name || "",
        description: auctionData.description || "",
        startingPrice: auctionData.starting_price || 0,
        creatorId: auctionData.creator_id || "",
        bidderId: auctionData.bidder_id || "",
        endTime: auctionData.end_time || 0,
        imageUrls: auctionData.image_urls || [],
        isAuctionEnd: auctionData.isAuctionEnd || false,
        bidHistory: bidHistory,
        createdAt: auctionData.created_at || 0,
        creator: auctionData.creator_id ? userCache[auctionData.creator_id] : undefined,
        currentBidder: auctionData.bidder_id ? userCache[auctionData.bidder_id] : undefined
      };
      
      auctions.push(auction);
    }
    
    return auctions;
  } catch (error) {
    console.error("Aktif açık artırmalar alınırken hata oluştu:", error);
    throw error;
  }
};

/**
 * Bitmiş açık artırmaları getiren fonksiyon
 */
export const getEndedAuctions = async (): Promise<Auction[]> => {
  try {
    const now = Date.now();
    const auctionsCollection = collection(db, 'auctions');
    
    // İki tür bitmiş müzayede vardır:
    // 1. isAuctionEnd = true olan
    // 2. Bitiş tarihi geçmiş olan
    const endedAuctionsQuery = query(
      auctionsCollection, 
      where("isAuctionEnd", "==", true),
      orderBy("created_at", "desc")
    );
    
    const auctionDocs = await getDocs(endedAuctionsQuery);
    
    // Tüm auction dokümanlarını toplu olarak işleme
    const auctions: Auction[] = [];
    const userCache: Record<string, User> = {};
    
    // Önce tüm auction verilerini topla
    const auctionDataList: FirestoreAuctionData[] = auctionDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<FirestoreAuctionData, 'id'>
    }));
    
    // Zamanı geçmiş ama isAuctionEnd=false olan müzayedeleri de getir
    const activeAuctionsQuery = query(
      auctionsCollection,
      where("isAuctionEnd", "==", false),
      orderBy("created_at", "desc")
    );
    
    const activeAuctionDocs = await getDocs(activeAuctionsQuery);
    const expiredAuctionData: FirestoreAuctionData[] = activeAuctionDocs.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<FirestoreAuctionData, 'id'>
      }))
      .filter(auction => Number(auction.end_time) <= now);
    
    // Tüm bitmiş müzayedeleri birleştir
    const allEndedAuctions = [...auctionDataList, ...expiredAuctionData];
    
    // Gerekli tüm kullanıcı ID'lerini topla
    const userIds = new Set<string>();
    
    allEndedAuctions.forEach(auction => {
      if (auction.creator_id) userIds.add(auction.creator_id);
      if (auction.bidder_id) userIds.add(auction.bidder_id);
      
      if (auction.bid_history && Array.isArray(auction.bid_history)) {
        auction.bid_history.forEach(bid => {
          if (bid.user_id) userIds.add(bid.user_id);
        });
      }
    });
    
    // Tüm kullanıcı verilerini tek seferde getir
    await Promise.all(Array.from(userIds).map(async userId => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          userCache[userId] = userDoc.data() as User;
        }
      } catch (error) {
        console.error(`Kullanıcı bilgisi alınamadı: ${userId}`, error);
      }
    }));
    
    // Auction verilerini formatla
    for (const auctionData of allEndedAuctions) {
      const bidHistory = auctionData.bid_history ? 
        auctionData.bid_history.map(bid => ({
          userId: bid.user_id || "",
          amount: bid.amount || 0,
          timestamp: bid.timestamp || 0,
          userInfo: bid.user_id ? userCache[bid.user_id] : undefined
        } as Bid)) : [];
      
      const auction: Auction = {
        id: auctionData.id,
        name: auctionData.name || "",
        description: auctionData.description || "",
        startingPrice: auctionData.starting_price || 0,
        creatorId: auctionData.creator_id || "",
        bidderId: auctionData.bidder_id || "",
        endTime: auctionData.end_time || 0,
        imageUrls: auctionData.image_urls || [],
        isAuctionEnd: auctionData.isAuctionEnd || false,
        bidHistory: bidHistory,
        createdAt: auctionData.created_at || 0,
        creator: auctionData.creator_id ? userCache[auctionData.creator_id] : undefined,
        currentBidder: auctionData.bidder_id ? userCache[auctionData.bidder_id] : undefined
      };
      
      auctions.push(auction);
    }
    
    return auctions;
  } catch (error) {
    console.error("Bitmiş açık artırmalar alınırken hata oluştu:", error);
    throw error;
  }
};

/**
 * Açık artırmaları arama fonksiyonu
 * @param searchTerm Arama terimi
 * @param auctions Arama yapılacak müzayedeler listesi
 * @returns Filtrelenmiş müzayedeler listesi
 */
export const searchAuctions = (searchTerm: string, auctions: Auction[]): Auction[] => {
  if (!searchTerm || searchTerm.trim() === '') {
    return auctions;
  }
  
  const term = searchTerm.toLowerCase().trim();
  
  return auctions.filter(auction => {
    const nameMatch = auction.name.toLowerCase().includes(term);
    const descriptionMatch = auction.description.toLowerCase().includes(term);
    const creatorMatch = auction.creator?.displayName?.toLowerCase().includes(term) || false;
    
    return nameMatch || descriptionMatch || creatorMatch;
  });
};

/**
 * Açık artırmaları sıralama fonksiyonu
 * @param auctions Sıralanacak müzayedeler listesi
 * @param sortOption Sıralama seçeneği
 * @returns Sıralanmış müzayedeler listesi
 */
export const sortAuctions = (auctions: Auction[], sortOption: SortOption): Auction[] => {
  const sortedAuctions = [...auctions];
  
  switch (sortOption) {
    case 'name_asc':
      return sortedAuctions.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'name_desc':
      return sortedAuctions.sort((a, b) => b.name.localeCompare(a.name));
    
    case 'price_asc':
      return sortedAuctions.sort((a, b) => a.startingPrice - b.startingPrice);
    
    case 'price_desc':
      return sortedAuctions.sort((a, b) => b.startingPrice - a.startingPrice);
    
    case 'date_asc':
      return sortedAuctions.sort((a, b) => Number(a.endTime) - Number(b.endTime));
    
    case 'date_desc':
      return sortedAuctions.sort((a, b) => Number(b.endTime) - Number(a.endTime));
    
    default:
      return sortedAuctions;
  }
};

/**
 * Arama ve sıralama işlemlerini birleştiren fonksiyon
 * @param auctions İşlenecek müzayedeler listesi
 * @param searchTerm Arama terimi (boş olabilir)
 * @param sortOption Sıralama seçeneği (belirtilmezse varsayılan sıralama kullanılır)
 * @returns Filtrelenmiş ve sıralanmış müzayedeler listesi
 */
export const filterAndSortAuctions = (
  auctions: Auction[], 
  searchTerm: string = '', 
  sortOption?: SortOption
): Auction[] => {
  // Önce arama işlemini yap
  const filteredAuctions = searchAuctions(searchTerm, auctions);
  
  // Sıralama seçeneği belirtilmişse sırala
  if (sortOption) {
    return sortAuctions(filteredAuctions, sortOption);
  }
  
  // Sıralama seçeneği belirtilmemişse filtrelenmiş listeyi döndür
  return filteredAuctions;
};

/**
 * Belirli bir açık artırmayı getiren fonksiyon
 */
export const getAuctionById = async (auctionId: string): Promise<Auction | null> => {
  try {
    const auctionDoc = await getDoc(doc(db, 'auctions', auctionId));
    
    if (!auctionDoc.exists()) {
      return null;
    }
    
    const auctionData = auctionDoc.data();
    
    // Kullanıcı bilgilerini eklemek için
    let creatorData = null;
    let bidderData = null;
    
    // Oluşturan kullanıcının bilgilerini getir
    if (auctionData.creator_id) {
      const creatorDoc = await getDoc(doc(db, 'users', auctionData.creator_id));
      if (creatorDoc.exists()) {
        creatorData = creatorDoc.data() as User;
        // Profil resmi yoksa varsayılan resim ekle
        if (!creatorData.photoURL) {
          creatorData.photoURL = "https://via.placeholder.com/150?text=User";
        }
      }
    }
    
    // Son teklif veren kullanıcının bilgilerini getir
    if (auctionData.bidder_id && auctionData.bidder_id !== "") {
      const bidderDoc = await getDoc(doc(db, 'users', auctionData.bidder_id));
      if (bidderDoc.exists()) {
        bidderData = bidderDoc.data() as User;
        // Profil resmi yoksa varsayılan resim ekle
        if (!bidderData.photoURL) {
          bidderData.photoURL = "https://via.placeholder.com/150?text=User";
        }
      }
    }
    
    // Teklif geçmişindeki kullanıcıların bilgilerini getir
    const bidHistory = auctionData.bid_history ? await Promise.all(
      auctionData.bid_history.map(async (bid: any) => {
        let userInfo = undefined;
        
        if (bid.user_id) {
          const userDoc = await getDoc(doc(db, 'users', bid.user_id));
          if (userDoc.exists()) {
            userInfo = userDoc.data() as User;
            // Profil resmi yoksa varsayılan resim ekle
            if (!userInfo.photoURL) {
              userInfo.photoURL = "https://via.placeholder.com/150?text=User";
            }
          }
        }
        
        return {
          userId: bid.user_id || "",
          amount: bid.amount || 0,
          timestamp: bid.timestamp || 0,
          userInfo
        } as Bid;
      })
    ) : [];
    
    // Auction nesnesini oluştur
    const auction: Auction = {
      id: auctionDoc.id,
      name: auctionData.name || "",
      description: auctionData.description || "",
      startingPrice: auctionData.starting_price || 0,
      creatorId: auctionData.creator_id || "",
      bidderId: auctionData.bidder_id || "",
      endTime: auctionData.end_time || 0,
      imageUrls: auctionData.image_urls || [],
      isAuctionEnd: auctionData.isAuctionEnd || false,
      bidHistory: bidHistory,
      createdAt: auctionData.created_at || 0,
      creator: creatorData || undefined,
      currentBidder: bidderData || undefined
    };
    
    return auction;
  } catch (error) {
    console.error(`${auctionId} ID'li açık artırma alınırken hata oluştu:`, error);
    throw error;
  }
};

/**
 * Belirli bir kullanıcının açık artırmalarını getiren fonksiyon
 */
export const getAuctionsByUserId = async (userId: string): Promise<Auction[]> => {
  try {
    const auctionsCollection = collection(db, 'auctions');
    const userAuctionsQuery = query(
      auctionsCollection, 
      where("creator_id", "==", userId)
    );
    
    const auctionDocs = await getDocs(userAuctionsQuery);
    
    const auctions: Auction[] = [];
    
    for (const auctionDoc of auctionDocs.docs) {
      const auctionData = auctionDoc.data();
      
      // Kullanıcı bilgilerini eklemek için
      let creatorData = null;
      let bidderData = null;
      
      // Oluşturan kullanıcının bilgilerini getir
      if (auctionData.creator_id) {
        const creatorDoc = await getDoc(doc(db, 'users', auctionData.creator_id));
        if (creatorDoc.exists()) {
          creatorData = creatorDoc.data() as User;
          // Profil resmi yoksa varsayılan resim ekle
          if (!creatorData.photoURL) {
            creatorData.photoURL = "https://via.placeholder.com/150?text=User";
          }
        }
      }
      
      // Son teklif veren kullanıcının bilgilerini getir
      if (auctionData.bidder_id && auctionData.bidder_id !== "") {
        const bidderDoc = await getDoc(doc(db, 'users', auctionData.bidder_id));
        if (bidderDoc.exists()) {
          bidderData = bidderDoc.data() as User;
          // Profil resmi yoksa varsayılan resim ekle
          if (!bidderData.photoURL) {
            bidderData.photoURL = "https://via.placeholder.com/150?text=User";
          }
        }
      }
      
      // Teklif geçmişindeki kullanıcıların bilgilerini getir
      const bidHistory = auctionData.bid_history ? await Promise.all(
        auctionData.bid_history.map(async (bid: any) => {
          let userInfo = undefined;
          
          if (bid.user_id) {
            const userDoc = await getDoc(doc(db, 'users', bid.user_id));
            if (userDoc.exists()) {
              userInfo = userDoc.data() as User;
              // Profil resmi yoksa varsayılan resim ekle
              if (!userInfo.photoURL) {
                userInfo.photoURL = "https://via.placeholder.com/150?text=User";
              }
            }
          }
          
          return {
            userId: bid.user_id || "",
            amount: bid.amount || 0,
            timestamp: bid.timestamp || 0,
            userInfo
          } as Bid;
        })
      ) : [];
      
      // Auction nesnesini oluştur
      const auction: Auction = {
        id: auctionDoc.id,
        name: auctionData.name || "",
        description: auctionData.description || "",
        startingPrice: auctionData.starting_price || 0,
        creatorId: auctionData.creator_id || "",
        bidderId: auctionData.bidder_id || "",
        endTime: auctionData.end_time || 0,
        imageUrls: auctionData.image_urls || [],
        isAuctionEnd: auctionData.isAuctionEnd || false,
        bidHistory: bidHistory,
        createdAt: auctionData.created_at || 0,
        creator: creatorData || undefined,
        currentBidder: bidderData || undefined
      };
      
      auctions.push(auction);
    }
    
    return auctions;
  } catch (error) {
    console.error(`${userId} ID'li kullanıcıya ait açık artırmalar alınırken hata oluştu:`, error);
    throw error;
  }
};

/**
 * Açık artırmayı silen fonksiyon
 */
export const deleteAuction = async (auctionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'auctions', auctionId));
  } catch (error) {
    console.error(`${auctionId} ID'li açık artırma silinirken hata oluştu:`, error);
    throw error;
  }
};

/**
 * Auction servisi için faydalı dönüşüm fonksiyonları
 */
export const formatFirestoreData = (auctionData: any): Auction => {
  return {
    id: auctionData.id || '',
    name: auctionData.name || '',
    description: auctionData.description || '',
    startingPrice: auctionData.starting_price || 0,
    creatorId: auctionData.creator_id || '',
    bidderId: auctionData.bidder_id || '',
    endTime: auctionData.end_time || 0,
    imageUrls: auctionData.image_urls || [],
    isAuctionEnd: auctionData.isAuctionEnd || false,
    bidHistory: (auctionData.bid_history || []).map((bid: any) => ({
      userId: bid.user_id || '',
      amount: bid.amount || 0,
      timestamp: bid.timestamp || 0,
    })),
    createdAt: auctionData.created_at || 0,
  };
}; 