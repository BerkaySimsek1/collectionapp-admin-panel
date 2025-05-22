import { collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, orderBy, limit, startAfter, QueryDocumentSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Auction, UserGroup } from '../types';

/**
 * URL'nin geçerli olup olmadığını kontrol eden yardımcı fonksiyon
 */
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url.trim() === "") return false;
  
  return true; // Tüm URL'leri geçerli kabul et, hata durumu img onError ile yakalanacak
};

/**
 * Get all users with pagination
 * @param pageSize Number of users to retrieve
 * @param lastDocIndex Last document for pagination
 */
export const getAllUsers = async (pageSize = 10, lastDocIndex: number | null = null) => {
  try {
    console.log(`getAllUsers çağrıldı: pageSize=${pageSize}, lastDocIndex=${lastDocIndex}`);
    
    const usersRef = collection(db, "users");
    
    // Tüm kullanıcıları çek - sayfalama olmadan
    let q = query(usersRef);
    
    const querySnapshot = await getDocs(q);
    console.log(`Firebase'den toplam ${querySnapshot.docs.length} kullanıcı alındı`);
    
    if (querySnapshot.empty) {
      console.log("Kullanıcı koleksiyonu boş!");
      return { users: [], lastVisible: null };
    }
    
    // Tüm kullanıcıları işle
    const allUsers: User[] = [];
    querySnapshot.docs.forEach((docSnapshot) => {
      try {
        const userData = docSnapshot.data();
        console.log(`İşlenen kullanıcı: ${docSnapshot.id}, veri:`, userData);
        
        // Tarih alanlarını kontrol et
        let createdAt = null;
        if (userData.createdAt) {
          createdAt = userData.createdAt.toDate?.() || userData.createdAt;
        } else if (userData.created_at) {
          createdAt = userData.created_at.toDate?.() || userData.created_at;
        }
        
        let lastActive = null;
        if (userData.lastActive) {
          lastActive = userData.lastActive.toDate?.() || userData.lastActive;
        } else if (userData.last_active) {
          lastActive = userData.last_active.toDate?.() || userData.last_active;
        }
        
        // Profil fotoğrafı kontrolü - farklı alanlarda olabilir
        let photoURL = "";
        
        // Önce photoURL kontrolü
        if (userData.photoURL) {
          photoURL = userData.photoURL;
        }
        // Sonra profileImageUrl kontrolü
        else if (userData.profileImageUrl) {
          photoURL = userData.profileImageUrl;
        }
        // Sonra profilePic kontrolü
        else if (userData.profilePic) {
          photoURL = userData.profilePic;
        }
        // Sonra photo ya da picture alanları
        else if (userData.photo) {
          photoURL = userData.photo;
        }
        else if (userData.picture) {
          photoURL = userData.picture;
        }
        
        const user: User = {
          uid: docSnapshot.id,
          email: userData.email || "",
          displayName: userData.displayName || userData.username || "",
          photoURL: photoURL,
          isActive: userData.isActive !== false, // varsayılan olarak true
          isBanned: userData.isBanned === true,
          createdAt: createdAt || new Date(),
          lastActive: lastActive,
          username: userData.username || "",
          bio: userData.bio || "",
          location: userData.location || "",
          interests: userData.interests || [],
          followersCount: Array.isArray(userData.followers) ? userData.followers.length : 0,
          followingCount: Array.isArray(userData.following) ? userData.following.length : 0,
          phone: userData.phone || "",
        };
        
        allUsers.push(user);
      } catch (err) {
        console.error(`Kullanıcı verisi işlenirken hata (uid: ${docSnapshot.id}):`, err, docSnapshot.data());
      }
    });
    
    // Kullanıcıları oluşturma tarihine göre sırala (en yeniden en eskiye)
    allUsers.sort((a, b) => {
      const dateA = a.createdAt ? (typeof a.createdAt === 'object' ? a.createdAt : new Date(a.createdAt)) : new Date(0);
      const dateB = b.createdAt ? (typeof b.createdAt === 'object' ? b.createdAt : new Date(b.createdAt)) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log(`Toplam işlenen kullanıcı sayısı: ${allUsers.length}`);
    
    // Sayfalama için kullanıcıları dilimle
    const startIndex = lastDocIndex || 0;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);
    
    console.log(`Sayfalanmış kullanıcı sayısı: ${paginatedUsers.length}, Başlangıç: ${startIndex}, Bitiş: ${endIndex}`);
    
    // Sonraki sayfa için lastVisible değeri
    const hasMoreUsers = endIndex < allUsers.length;
    const newLastVisible = hasMoreUsers ? endIndex : null;
    
    return {
      users: paginatedUsers,
      lastVisible: newLastVisible,
    };
  } catch (error) {
    console.error("Kullanıcılar getirilirken hata:", error);
    throw new Error("Kullanıcı verileri alınamadı: " + error);
  }
};

// Kullanıcı verisinde profil fotoğrafı kontrolü - değişik alanlarda olabilir
const getProfileImageUrl = (userData: any): string => {
  if (!userData) return "";
  
  console.log("getProfileImageUrl - Ham kullanıcı verisi alanları:", Object.keys(userData));
  
  // Sırasıyla tüm olası profil fotoğrafı alanlarını kontrol et
  if (userData.photoURL && userData.photoURL.trim() !== "") {
    console.log("photoURL bulundu:", userData.photoURL);
    return userData.photoURL;
  }
  
  if (userData.profileImageUrl && userData.profileImageUrl.trim() !== "") {
    console.log("profileImageUrl bulundu:", userData.profileImageUrl);
    return userData.profileImageUrl;
  }
  
  if (userData.profilePic && userData.profilePic.trim() !== "") {
    console.log("profilePic bulundu:", userData.profilePic);
    return userData.profilePic;
  }
  
  if (userData.photo && userData.photo.trim() !== "") {
    console.log("photo bulundu:", userData.photo);
    return userData.photo;
  }
  
  if (userData.picture && userData.picture.trim() !== "") {
    console.log("picture bulundu:", userData.picture);
    return userData.picture;
  }
  
  if (userData.avatar && userData.avatar.trim() !== "") {
    console.log("avatar bulundu:", userData.avatar);
    return userData.avatar;
  }
  
  console.log("Hiçbir profil fotoğrafı alanı bulunamadı");
  return "";
};

/**
 * Get user by ID
 * @param uid User ID
 */
export const getUserById = async (uid: string): Promise<User | null> => {
  if (!uid.trim()) return null;

  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const data = snap.data(); // Firestore'dan gelen ham veri

  // Detaylı loglama (Geliştirme sırasında sorunu anlamak için)
  console.log('[getUserById] Ham snap.data():', JSON.parse(JSON.stringify(data))); // Verinin yapısını görmek için

  let processedCreatedAt: Date | null = null;
  const createdAtField = data.createdAt || data.created_at; // Hem createdAt hem de created_at kontrolü

  if (createdAtField) {
    console.log('[getUserById] Bulunan createdAtField:', createdAtField, typeof createdAtField);
    if (createdAtField instanceof Timestamp) {
      processedCreatedAt = createdAtField.toDate();
      console.log('[getUserById] Timestamp olarak işlendi:', processedCreatedAt);
    } else if (typeof createdAtField === 'string') {
      // ISO string veya parse edilebilir bir string ise Date'e çevir
      const dateCandidate = new Date(createdAtField);
      if (!isNaN(dateCandidate.getTime())) { // Geçerli bir tarih mi kontrolü
        processedCreatedAt = dateCandidate;
        console.log('[getUserById] String olarak işlendi:', processedCreatedAt);
      } else {
        console.warn('[getUserById] createdAtField string ama geçerli bir tarihe dönüştürülemedi:', createdAtField);
        processedCreatedAt = new Date(); // Hatalı durumda varsayılan
      }
    } else if (typeof createdAtField === 'object' && createdAtField !== null &&
               typeof createdAtField.seconds === 'number' && typeof createdAtField.nanoseconds === 'number') {
      // Eğer {seconds, nanoseconds} yapısında bir obje ise (instanceof çalışmasa bile)
      try {
        processedCreatedAt = new Timestamp(createdAtField.seconds, createdAtField.nanoseconds).toDate();
        console.log('[getUserById] {seconds, nanoseconds} objesi olarak işlendi:', processedCreatedAt);
      } catch (e) {
        console.error('[getUserById] createdAtField {seconds, nanoseconds} objesinden Timestamp oluşturulamadı:', e);
        processedCreatedAt = new Date(); // Hatalı durumda varsayılan
      }
    } else {
      console.warn('[getUserById] createdAtField tanınmayan bir formatta:', createdAtField);
      processedCreatedAt = new Date(); // Tanınmayan formatta varsayılan
    }
  } else {
    console.log('[getUserById] createdAt veya created_at alanı bulunamadı.');
    processedCreatedAt = new Date(); // Yoksa varsayılan (veya null bırakabilirsiniz)
  }

  let processedLastActive: Date | null = null;
  const lastActiveField = data.lastActive || data.last_active;

  if (lastActiveField) {
    console.log('[getUserById] Bulunan lastActiveField:', lastActiveField, typeof lastActiveField);
    if (lastActiveField instanceof Timestamp) {
      processedLastActive = lastActiveField.toDate();
    } else if (typeof lastActiveField === 'string') {
      const dateCandidate = new Date(lastActiveField);
      if (!isNaN(dateCandidate.getTime())) {
        processedLastActive = dateCandidate;
      } else {
         console.warn('[getUserById] lastActiveField string ama geçerli bir tarihe dönüştürülemedi:', lastActiveField);
      }
    } else if (typeof lastActiveField === 'object' && lastActiveField !== null &&
               typeof lastActiveField.seconds === 'number' && typeof lastActiveField.nanoseconds === 'number') {
      try {
        processedLastActive = new Timestamp(lastActiveField.seconds, lastActiveField.nanoseconds).toDate();
      } catch (e) {
         console.error('[getUserById] lastActiveField {seconds, nanoseconds} objesinden Timestamp oluşturulamadı:', e);
      }
    } else if (lastActiveField !== null) { // lastActive null olabilir, bu bir hata değil
        console.warn('[getUserById] lastActiveField tanınmayan bir formatta:', lastActiveField);
    }
  } else {
      console.log('[getUserById] lastActive veya last_active alanı bulunamadı (veya null).');
  }

  return {
    uid: snap.id,
    email: data.email || "",
    displayName: data.displayName || data.username || "",
    // photoURL: data.photoURL || data.profileImageUrl || data.profilePic || "", // getProfileImageUrl kullanmak daha iyi
    photoURL: getProfileImageUrl(data), // getProfileImageUrl fonksiyonunuzu kullanın
    isActive: data.isActive !== false,
    isBanned: data.isBanned === true,
    createdAt: processedCreatedAt, // İşlenmiş Date nesnesini kullanın
    lastActive: processedLastActive, // İşlenmiş Date nesnesini kullanın (null olabilir)
    username: data.username || "",
    bio: data.bio || "",
    location: data.location || "",
    interests: data.interests || [],
    followersCount: Array.isArray(data.followers) ? data.followers.length : 0,
    followingCount: Array.isArray(data.following) ? data.following.length : 0,
    followers: Array.isArray(data.followers) ? data.followers : [],
    following: Array.isArray(data.following) ? data.following : [],
    phone: data.phone || "",
  };
};
// ... (your existing imports and other functions)

/**
 * Update user status (activate/deactivate)
 * @param uid User ID
 * @param isActive New status (true for active, false for deactivated)
 */
export const updateUserStatus = async (
  uid: string,
  isActive: boolean
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isActive, // This directly sets the isActive field in Firestore
      updatedAt: serverTimestamp(), // Good practice to track when it was updated
    });

    console.log(`User ${uid} isActive status set to ${isActive} successfully.`);
    return true;
  } catch (error) {
    console.error("Error updating user status:", error);
    return false;
  }
};

/**
 * Ban or unban user
 * @param uid User ID
 * @param isBanned New banned status
 */
export const updateUserBanStatus = async (
  uid: string,
  isBanned: boolean
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isBanned,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Kullanıcı engelleme durumu güncellenirken hata:", error);
    return false;
  }
};

/**
 * Delete user
 * @param uid User ID
 */
export const deleteUser = async (uid: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Kullanıcı silinirken hata:", error);
    return false;
  }
};

/**
 * Get new users count for last 24 hours
 */
export const getNewUsersCount = async (): Promise<number> => {
  try {
    const usersRef = collection(db, "users");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const q = query(
      usersRef,
      where("createdAt", ">=", yesterday)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Yeni kullanıcı sayısı alınırken hata:", error);
    return 0;
  }
};

/**
 * Gets a user's auctions
 * @param uid User ID
 * @returns Promise<Auction[]>
 */
export const getUserAuctions = async (uid: string): Promise<Auction[]> => {
  try {
    const auctionsRef = collection(db, 'auctions');
    const q = query(auctionsRef, where('creator_id', '==', uid));
    const querySnapshot = await getDocs(q);
    
    const auctions: Auction[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const auctionData = docSnapshot.data();
      
      // Kullanıcı bilgilerini eklemek için
      let creatorData = null;
      let bidderData = null;
      
      // Oluşturan kullanıcının bilgilerini getir
      if (auctionData.creator_id) {
        const creatorDoc = await getDoc(doc(db, 'users', auctionData.creator_id));
        if (creatorDoc.exists()) {
          creatorData = creatorDoc.data() as User;
        }
      }
      
      // Son teklif veren kullanıcının bilgilerini getir
      if (auctionData.bidder_id && auctionData.bidder_id !== "") {
        const bidderDoc = await getDoc(doc(db, 'users', auctionData.bidder_id));
        if (bidderDoc.exists()) {
          bidderData = bidderDoc.data() as User;
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
            }
          }
          
          return {
            userId: bid.user_id || "",
            amount: bid.amount || 0,
            timestamp: bid.timestamp || 0,
            userInfo
          };
        })
      ) : [];
      
      // Auction nesnesini oluştur
      const auction: Auction = {
        id: docSnapshot.id,
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
    console.error('Error fetching user auctions:', error);
    return [];
  }
};

/**
 * Gets a user's groups
 * @param uid User ID
 * @returns Promise<UserGroup[]>
 */
export const getUserGroups = async (uid: string): Promise<UserGroup[]> => {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, where('members', 'array-contains', uid));
    const querySnapshot = await getDocs(q);
    
    const groups: UserGroup[] = [];
    querySnapshot.forEach((doc) => {
      const groupData = doc.data();
      groups.push({
        id: doc.id,
        name: groupData.name || '',
        description: groupData.description || '',
        members: groupData.members || [],
        createdAt: groupData.createdAt ? 
          (typeof groupData.createdAt.toDate === 'function' ? groupData.createdAt.toDate().toISOString() : groupData.createdAt) 
          : '',
        createdBy: groupData.createdBy || ''
      } as UserGroup);
    });
    
    return groups;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
};