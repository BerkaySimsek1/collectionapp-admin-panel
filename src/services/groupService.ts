import { collection, doc, getDoc, getDocs, query, where, updateDoc, deleteDoc, addDoc, Timestamp, orderBy, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebase';
import { User, UserGroup } from '../types';

/**
 * Get all groups
 * @returns Promise<UserGroup[]>
 */
export const getAllGroups = async (): Promise<UserGroup[]> => {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, orderBy('createdAt', 'desc'));
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
    console.error('Grupları alırken hata oluştu:', error);
    throw new Error('Gruplar alınamadı: ' + error);
  }
};

/**
 * Get group by ID
 * @param groupId Group ID
 * @returns Promise<UserGroup | null>
 */
export const getGroupById = async (groupId: string): Promise<UserGroup | null> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnapshot = await getDoc(groupRef);
    
    if (!groupSnapshot.exists()) {
      return null;
    }
    
    const groupData = groupSnapshot.data();
    return {
      id: groupSnapshot.id,
      name: groupData.name || '',
      description: groupData.description || '',
      members: groupData.members || [],
      createdAt: groupData.createdAt ? 
        (typeof groupData.createdAt.toDate === 'function' ? groupData.createdAt.toDate().toISOString() : groupData.createdAt) 
        : '',
      createdBy: groupData.createdBy || ''
    } as UserGroup;
  } catch (error) {
    console.error('Grup getirme hatası:', error);
    throw new Error('Grup alınamadı: ' + error);
  }
};

/**
 * Get group members with their details
 * @param groupId Group ID
 * @returns Promise<User[]>
 */
export const getGroupMembers = async (groupId: string): Promise<User[]> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnapshot = await getDoc(groupRef);
    
    if (!groupSnapshot.exists()) {
      return [];
    }
    
    const groupData = groupSnapshot.data();
    const memberIds = groupData.members || [];
    
    if (memberIds.length === 0) {
      return [];
    }
    
    const members: User[] = [];
    
    // Her bir üye için kullanıcı bilgilerini al
    for (const memberId of memberIds) {
      const userRef = doc(db, 'users', memberId);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        members.push({
          uid: userSnapshot.id,
          email: userData.email || '',
          displayName: userData.displayName || userData.username || '',
          photoURL: userData.photoURL || 'https://via.placeholder.com/150?text=User',
          username: userData.username || '',
          isActive: userData.isActive !== false,
          isBanned: userData.isBanned === true,
        } as User);
      }
    }
    
    return members;
  } catch (error) {
    console.error('Grup üyelerini alırken hata oluştu:', error);
    throw new Error('Grup üyeleri alınamadı: ' + error);
  }
};

/**
 * Get group admins with their details
 * @param groupId Group ID
 * @returns Promise<User[]>
 */
export const getGroupAdmins = async (groupId: string): Promise<User[]> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnapshot = await getDoc(groupRef);
    
    if (!groupSnapshot.exists()) {
      return [];
    }
    
    const groupData = groupSnapshot.data();
    const adminIds = groupData.adminIds || [];
    
    if (adminIds.length === 0) {
      return [];
    }
    
    const admins: User[] = [];
    
    // Her bir admin için kullanıcı bilgilerini al
    for (const adminId of adminIds) {
      const userRef = doc(db, 'users', adminId);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        admins.push({
          uid: userSnapshot.id,
          email: userData.email || '',
          displayName: userData.displayName || userData.username || '',
          photoURL: userData.photoURL || 'https://via.placeholder.com/150?text=User',
          username: userData.username || '',
          isActive: userData.isActive !== false,
          isBanned: userData.isBanned === true,
        } as User);
      }
    }
    
    return admins;
  } catch (error) {
    console.error('Grup adminlerini alırken hata oluştu:', error);
    throw new Error('Grup adminleri alınamadı: ' + error);
  }
};

/**
 * Create a new group
 * @param group Group data
 * @returns Promise<string> Group ID
 */
export const createGroup = async (group: Omit<UserGroup, 'id'>): Promise<string> => {
  try {
    const groupsRef = collection(db, 'groups');
    const newGroup = {
      ...group,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(groupsRef, newGroup);
    return docRef.id;
  } catch (error) {
    console.error('Grup oluşturma hatası:', error);
    throw new Error('Grup oluşturulamadı: ' + error);
  }
};

/**
 * Update group
 * @param groupId Group ID
 * @param groupData Group data to update
 * @returns Promise<boolean>
 */
export const updateGroup = async (groupId: string, groupData: Partial<UserGroup>): Promise<boolean> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, groupData);
    return true;
  } catch (error) {
    console.error('Grup güncelleme hatası:', error);
    throw new Error('Grup güncellenemedi: ' + error);
  }
};

/**
 * Delete group
 * @param groupId Group ID
 * @returns Promise<boolean>
 */
export const deleteGroup = async (groupId: string): Promise<boolean> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await deleteDoc(groupRef);
    return true;
  } catch (error) {
    console.error('Grup silme hatası:', error);
    throw new Error('Grup silinemedi: ' + error);
  }
};

/**
 * Add member to group
 * @param groupId Group ID
 * @param userId User ID
 * @returns Promise<boolean>
 */
export const addMemberToGroup = async (groupId: string, userId: string): Promise<boolean> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayUnion(userId)
    });
    return true;
  } catch (error) {
    console.error('Gruba üye ekleme hatası:', error);
    throw new Error('Üye eklenemedi: ' + error);
  }
};

/**
 * Remove member from group
 * @param groupId Group ID
 * @param userId User ID
 * @returns Promise<boolean>
 */
export const removeMemberFromGroup = async (groupId: string, userId: string): Promise<boolean> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId)
    });
    return true;
  } catch (error) {
    console.error('Gruptan üye çıkarma hatası:', error);
    throw new Error('Üye çıkarılamadı: ' + error);
  }
};

/**
 * Add admin to group
 * @param groupId Group ID
 * @param userId User ID
 * @returns Promise<boolean>
 */
export const addAdminToGroup = async (groupId: string, userId: string): Promise<boolean> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      adminIds: arrayUnion(userId)
    });
    return true;
  } catch (error) {
    console.error('Gruba admin ekleme hatası:', error);
    throw new Error('Admin eklenemedi: ' + error);
  }
};

/**
 * Remove admin from group
 * @param groupId Group ID
 * @param userId User ID
 * @returns Promise<boolean>
 */
export const removeAdminFromGroup = async (groupId: string, userId: string): Promise<boolean> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      adminIds: arrayRemove(userId)
    });
    return true;
  } catch (error) {
    console.error('Gruptan admin çıkarma hatası:', error);
    throw new Error('Admin çıkarılamadı: ' + error);
  }
};

/**
 * Get group posts
 * @param groupId Group ID
 * @returns Promise<any[]> Posts
 */
export const getGroupPosts = async (groupId: string): Promise<any[]> => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('groupId', '==', groupId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const posts: any[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const postData = docSnapshot.data();
      
      // Kullanıcı bilgilerini getir
      let userData = null;
      if (postData.userId) {
        const userRef = doc(db, 'users', postData.userId);
        const userSnapshot = await getDoc(userRef);
        if (userSnapshot.exists()) {
          userData = userSnapshot.data();
        }
      }
      
      // Tarih alanlarını düzenle
      let createdAt = null;
      if (postData.createdAt) {
        createdAt = typeof postData.createdAt.toDate === 'function' 
          ? postData.createdAt.toDate()
          : new Date(postData.createdAt);
      }
      
      // Görselleri işle
      let imageUrl = null;
      // Görsel URL'si kontrolü - farklı alanlarda olabilir
      if (postData.imageUrl) {
        imageUrl = postData.imageUrl;
      } else if (postData.image) {
        imageUrl = postData.image;
      } else if (postData.imageUrls && Array.isArray(postData.imageUrls) && postData.imageUrls.length > 0) {
        imageUrl = postData.imageUrls[0];
      } else if (postData.images && Array.isArray(postData.images) && postData.images.length > 0) {
        imageUrl = postData.images[0];
      } else if (postData.photoURL) {
        imageUrl = postData.photoURL;
      } else if (postData.photo) {
        imageUrl = postData.photo;
      }
      
      // Yorumları işle
      let comments = [];
      if (postData.comments && Array.isArray(postData.comments)) {
        comments = await Promise.all(postData.comments.map(async (comment: any) => {
          // Yorum yapan kullanıcıyı getir
          let commentUserData = null;
          if (comment.userId) {
            const commentUserRef = doc(db, 'users', comment.userId);
            const commentUserSnapshot = await getDoc(commentUserRef);
            if (commentUserSnapshot.exists()) {
              commentUserData = commentUserSnapshot.data();
            }
          }
          
          return {
            ...comment,
            createdAt: comment.createdAt && typeof comment.createdAt.toDate === 'function' 
              ? comment.createdAt.toDate() 
              : comment.createdAt,
            user: commentUserData ? {
              uid: comment.userId,
              displayName: commentUserData.displayName || commentUserData.username || '',
              photoURL: commentUserData.photoURL || 'https://via.placeholder.com/32?text=User'
            } : null
          };
        }));
      }
      
      posts.push({
        id: docSnapshot.id,
        content: postData.content || '',
        imageUrl: imageUrl,
        likes: postData.likes || 0,
        comments: comments,
        createdAt: createdAt,
        userId: postData.userId || '',
        groupId: postData.groupId || '',
        user: userData ? {
          uid: postData.userId,
          displayName: userData.displayName || userData.username || '',
          photoURL: userData.photoURL || 'https://via.placeholder.com/40?text=User'
        } : null
      });
    }
    
    // Sonuçları log'a yazdır (debug için)
    console.log('Grup gönderileri:', posts);
    
    return posts;
  } catch (error) {
    console.error('Grup gönderilerini alırken hata oluştu:', error);
    throw new Error('Grup gönderileri alınamadı: ' + error);
  }
}; 