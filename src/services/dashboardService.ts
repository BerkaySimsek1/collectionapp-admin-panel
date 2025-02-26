import { collection, getDocs, query, where, orderBy, limit, Timestamp, getCountFromServer, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DashboardStats } from '../types';

/**
 * Gets dashboard statistics from Firestore
 * @returns Promise<DashboardStats>
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log('Firebase db referansı:', db);
    
    // Toplam kullanıcı sayısını al
    const usersRef = collection(db, 'users');
    console.log('Users koleksiyon path:', usersRef.path);
    
    try {
      // Firestore bağlantısını test et
      console.log('Firestore bağlantısını test ediyorum...');
      const testSnapshot = await getDocs(collection(db, 'users'));
      console.log('Test snapshot size:', testSnapshot.size);
      console.log('Test snapshot empty:', testSnapshot.empty);
      console.log('Test snapshot docs:', testSnapshot.docs.length);
      
      // Tüm kullanıcı belgelerini göster
      if (testSnapshot.docs.length > 0) {
        console.log('Örnek kullanıcı verileri:');
        testSnapshot.docs.forEach((docSnap, index) => {
          if (index < 3) { // İlk 3 belgeyi göster
            console.log(`Belge ID: ${docSnap.id}, Veri:`, docSnap.data());
          }
        });
      } else {
        console.log('Kullanıcı koleksiyonu boş görünüyor!');
      }
    } catch (err) {
      console.error('Firestore bağlantı testi sırasında hata:', err);
    }
    
    // Kullanıcı sayısını almak için doğrudan belgeleri çek
    let totalUsers = 0;
    try {
      const userSnapshot = await getDocs(usersRef);
      totalUsers = userSnapshot.size;
      console.log('Kullanıcı sayısı (getDocs):', totalUsers);
      
      // Alternatif yöntem olarak getCountFromServer'ı da deneyelim
      try {
        const countSnapshot = await getCountFromServer(usersRef);
        console.log('Kullanıcı sayısı (getCountFromServer):', countSnapshot.data().count);
        
        // Eğer getCountFromServer sonuç verdiyse ve getDocs sonuç vermediyse, getCountFromServer sonucunu kullan
        if (countSnapshot.data().count > 0 && totalUsers === 0) {
          totalUsers = countSnapshot.data().count;
        }
      } catch (countErr) {
        console.error('getCountFromServer hatası:', countErr);
      }
    } catch (getUsersErr) {
      console.error('Users koleksiyonundan veri çekerken hata:', getUsersErr);
    }
    
    // Son 30 gün içinde kaydolan kullanıcıları al
    let newUsers = 0;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const newUsersQuery = query(
        usersRef,
        where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
      );
      const newUsersSnapshot = await getDocs(newUsersQuery);
      newUsers = newUsersSnapshot.size;
      console.log('Son 30 gün içinde kaydolan kullanıcı sayısı:', newUsers);
      
      // createdAt alanının formatını kontrol et
      if (newUsers === 0) {
        console.log('createdAt alanının formatını kontrol ediyorum...');
        const allUsers = await getDocs(usersRef);
        
        if (!allUsers.empty) {
          const sampleUser = allUsers.docs[0].data();
          console.log('Örnek kullanıcı createdAt:', sampleUser.createdAt);
          if (sampleUser.createdAt) {
            console.log('createdAt tipi:', typeof sampleUser.createdAt);
            if (sampleUser.createdAt instanceof Timestamp) {
              console.log('createdAt Timestamp tipinde');
            } else {
              console.log('createdAt Timestamp tipinde değil');
            }
          } else {
            console.log('createdAt alanı bulunamadı');
          }
        }
      }
    } catch (newUsersErr) {
      console.error('Yeni kullanıcıları çekerken hata:', newUsersErr);
    }
    
    // Aktif açık artırmaları al
    let activeAuctions = 0;
    try {
      const auctionsRef = collection(db, 'auctions');
      const activeAuctionsQuery = query(
        auctionsRef,
        where('status', '==', 'active')
      );
      const activeAuctionsSnapshot = await getDocs(activeAuctionsQuery);
      activeAuctions = activeAuctionsSnapshot.size;
      console.log('Aktif açık artırma sayısı:', activeAuctions);
    } catch (activeAuctionsErr) {
      console.error('Aktif açık artırmaları çekerken hata:', activeAuctionsErr);
    }
    
    // Son 7 gün içinde oluşturulan açık artırmaları al
    let newAuctions = 0;
    try {
      const auctionsRef = collection(db, 'auctions');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const newAuctionsQuery = query(
        auctionsRef,
        where('createdAt', '>=', Timestamp.fromDate(sevenDaysAgo))
      );
      const newAuctionsSnapshot = await getDocs(newAuctionsQuery);
      newAuctions = newAuctionsSnapshot.size;
      console.log('Son 7 gün içinde oluşturulan açık artırma sayısı:', newAuctions);
    } catch (newAuctionsErr) {
      console.error('Yeni açık artırmaları çekerken hata:', newAuctionsErr);
    }
    
    // Tamamlanan açık artırmaları al
    let completedAuctions = 0;
    let totalRevenue = 0;
    try {
      const auctionsRef = collection(db, 'auctions');
      const completedAuctionsQuery = query(
        auctionsRef,
        where('status', '==', 'completed')
      );
      const completedAuctionsSnapshot = await getDocs(completedAuctionsQuery);
      completedAuctions = completedAuctionsSnapshot.size;
      console.log('Tamamlanan açık artırma sayısı:', completedAuctions);
      
      // Toplam geliri hesapla
      completedAuctionsSnapshot.forEach((doc) => {
        const data = doc.data();
        totalRevenue += data.currentPrice || 0;
      });
      console.log('Toplam gelir:', totalRevenue);
    } catch (completedAuctionsErr) {
      console.error('Tamamlanan açık artırmaları çekerken hata:', completedAuctionsErr);
    }
    
    // Önceki ay gelirini hesapla
    let previousMonthRevenue = 0;
    let currentMonthRevenue = 0;
    try {
      const auctionsRef = collection(db, 'auctions');
      const currentMonth = new Date().getMonth();
      const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const currentYear = new Date().getFullYear();
      const previousMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      
      const startOfPreviousMonth = new Date(previousMonthYear, previousMonth, 1);
      const endOfPreviousMonth = new Date(currentYear, currentMonth, 0);
      
      const previousMonthAuctionsQuery = query(
        auctionsRef,
        where('status', '==', 'completed'),
        where('endDate', '>=', Timestamp.fromDate(startOfPreviousMonth)),
        where('endDate', '<=', Timestamp.fromDate(endOfPreviousMonth))
      );
      
      const previousMonthAuctionsSnapshot = await getDocs(previousMonthAuctionsQuery);
      
      previousMonthAuctionsSnapshot.forEach((doc) => {
        const data = doc.data();
        previousMonthRevenue += data.currentPrice || 0;
      });
      console.log('Önceki ay geliri:', previousMonthRevenue);
      
      // Bu ay gelirini hesapla
      const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
      const currentDate = new Date();
      
      const currentMonthAuctionsQuery = query(
        auctionsRef,
        where('status', '==', 'completed'),
        where('endDate', '>=', Timestamp.fromDate(startOfCurrentMonth)),
        where('endDate', '<=', Timestamp.fromDate(currentDate))
      );
      
      const currentMonthAuctionsSnapshot = await getDocs(currentMonthAuctionsQuery);
      
      currentMonthAuctionsSnapshot.forEach((doc) => {
        const data = doc.data();
        currentMonthRevenue += data.currentPrice || 0;
      });
      console.log('Bu ay geliri:', currentMonthRevenue);
    } catch (revenueErr) {
      console.error('Gelir verilerini çekerken hata:', revenueErr);
    }
    
    const revenueIncrease = currentMonthRevenue - previousMonthRevenue;
    
    // Tamamlanma oranını hesapla
    let completionRate = 0;
    try {
      const auctionsRef = collection(db, 'auctions');
      const allAuctionsSnapshot = await getDocs(auctionsRef);
      const allAuctions = allAuctionsSnapshot.size;
      
      completionRate = allAuctions > 0 
        ? Math.round((completedAuctions / allAuctions) * 100) 
        : 0;
      console.log('Tamamlanma oranı:', completionRate);
    } catch (completionRateErr) {
      console.error('Tamamlanma oranını hesaplarken hata:', completionRateErr);
    }
    
    // Son aktiviteleri al
    const recentActivity: Array<{
      userName: string;
      userPhoto?: string;
      action: string;
      item: string;
      date: string;
    }> = [];
    try {
      const auctionsRef = collection(db, 'auctions');
      const recentActivityQuery = query(
        auctionsRef,
        orderBy('updatedAt', 'desc'),
        limit(5)
      );
      
      const recentActivitySnapshot = await getDocs(recentActivityQuery);
      console.log('Son aktivite sayısı:', recentActivitySnapshot.size);
      
      for (const activityDoc of recentActivitySnapshot.docs) {
        const activityData = activityDoc.data();
        let action = 'create';
        
        if (activityData.status === 'completed') {
          action = 'win';
        } else if (activityData.lastBidBy) {
          action = 'bid';
        }
        
        // Kullanıcı bilgilerini al
        let userName = 'Unknown User';
        let userPhoto = undefined;
        
        if (activityData.createdBy || activityData.lastBidBy) {
          const userId = activityData.lastBidBy || activityData.createdBy;
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.displayName || userData.email || 'Unknown User';
              userPhoto = userData.photoURL;
            }
          } catch (error) {
            console.error(`Error fetching user data for ID ${userId}:`, error);
          }
        }
        
        recentActivity.push({
          userName,
          userPhoto,
          action,
          item: activityData.title || 'Unknown Item',
          date: activityData.updatedAt 
            ? activityData.updatedAt.toDate().toISOString() 
            : new Date().toISOString()
        });
      }
    } catch (recentActivityErr) {
      console.error('Son aktiviteleri çekerken hata:', recentActivityErr);
    }
    
    // Popüler kategorileri al
    const popularCategories: Array<{
      name: string;
      percentage: number;
    }> = [];
    try {
      const categoriesRef = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesRef);
      console.log('Kategori sayısı:', categoriesSnapshot.size);
      
      const categoriesMap = new Map();
      categoriesSnapshot.forEach((doc) => {
        categoriesMap.set(doc.id, { name: doc.data().name, count: 0 });
      });
      
      // Her kategori için açık artırma sayısını hesapla
      const auctionsRef = collection(db, 'auctions');
      const allAuctionsQuery = query(auctionsRef, limit(500));
      const allAuctionsDataSnapshot = await getDocs(allAuctionsQuery);
      
      allAuctionsDataSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.categoryId && categoriesMap.has(data.categoryId)) {
          const category = categoriesMap.get(data.categoryId);
          category.count += 1;
        }
      });
      
      // Kategorileri sayılarına göre sırala
      const sortedCategories = Array.from(categoriesMap.values())
        .filter(cat => cat.count > 0)
        .sort((a, b) => b.count - a.count);
      
      // Toplam açık artırma sayısını hesapla
      const totalCategorizedAuctions = sortedCategories.reduce((sum, cat) => sum + cat.count, 0);
      
      // En popüler 5 kategoriyi al ve yüzdeleri hesapla
      const topCategories = sortedCategories.slice(0, 5).map(cat => ({
        name: cat.name,
        percentage: totalCategorizedAuctions > 0 
          ? Math.round((cat.count / totalCategorizedAuctions) * 100)
          : 0
      }));
      
      // Eğer kategori verisi varsa, popularCategories'e ekle
      if (topCategories.length > 0) {
        popularCategories.push(...topCategories);
      }
    } catch (categoriesErr) {
      console.error('Kategorileri çekerken hata:', categoriesErr);
    }
    
    // Eğer kategori verisi yoksa varsayılan değerler kullan
    if (popularCategories.length === 0) {
      console.log('Kategori verisi bulunamadı, varsayılan değerler kullanılıyor.');
      popularCategories.push(
        { name: "Koleksiyonlar", percentage: 35 },
        { name: "Sanat", percentage: 25 },
        { name: "Mücevher", percentage: 20 },
        { name: "Antikalar", percentage: 15 },
        { name: "Kitaplar", percentage: 5 }
      );
    }
    
    return {
      totalUsers,
      newUsers,
      activeAuctions,
      newAuctions,
      totalRevenue,
      revenueIncrease,
      completedAuctions,
      completionRate,
      recentActivity,
      popularCategories
    };
  } catch (error) {
    console.error('Gösterge paneli istatistiklerini çekerken beklenmeyen hata:', error);
    throw error; // Hatayı yukarı ilet, böylece UI'da görebiliriz
  }
}; 