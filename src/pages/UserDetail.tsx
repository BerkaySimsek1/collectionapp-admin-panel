import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  getUserById,
  deleteUser,
  updateUserBanStatus,
  updateUserStatus, // Import the new function
} from "../services/userService"; // Make sure userService.ts exports this
import { User } from "../types";

// @ts-ignore
import Swal from "sweetalert2";

/**
 * User detail component
 */
const UserDetail: React.FC = () => {
  // TypeScript'in useParams tipini düzeltiyoruz
  const params = useParams();
  const id = params.id;

  console.log("URL parametreleri:", params);
  console.log("Kullanıcı ID'si:", id);

  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Takipçi ve takip edilen listelerini göstermek için state'ler
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);

  // Load user data
  useEffect(() => {
    const fetchUser = async () => {
      console.log("fetchUser fonksiyonu çağrıldı, id:", id);

      if (!id) {
        console.error("Kullanıcı ID'si bulunamadı. URL parametreleri:", params);
        setError("Kullanıcı ID'si bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Kullanıcı detayı yükleniyor, ID:", id);

        // Doğrudan try-catch bloğu içinde getUserById'yi çağır
        const userRef = await getUserById(id);
        console.log("Alınan kullanıcı verisi:", userRef);

        // Debug için kullanıcı verisi
        if (userRef) {
          console.log("Kullanıcı Profil Resmi URL:", userRef.photoURL);
          console.log(
            "Kullanıcı Profil Resmi URL tipi:",
            typeof userRef.photoURL
          );
          console.log("Kullanıcı tam verisi:", JSON.stringify(userRef));
        }

        if (!userRef) {
          console.error("Kullanıcı bulunamadı:", id);
          setError("Kullanıcı bulunamadı.");
          setLoading(false);
          return;
        }

        setUser(userRef);
        setLoading(false);
      } catch (error) {
        console.error("Kullanıcı bilgisi alınırken hata:", error);
        setError("Kullanıcı bilgileri yüklenemedi. Lütfen tekrar deneyin.");
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, params]);

  // Takipçi listesini yükle
  const loadFollowers = async () => {
    if (!user) return;
    setLoadingLists(true);
    try {
      console.log("Takipçiler yükleniyor, user:", user);
      console.log("Takipçi ID'leri:", user.followers);

      const followersList = await Promise.all(
        (user.followers || []).map(async (followerId: string) => {
          console.log("Takipçi ID'si:", followerId);
          const follower = await getUserById(followerId);
          console.log("Takipçi verisi:", follower);
          return follower;
        })
      );
      console.log("Tüm takipçi listesi:", followersList);
      setFollowers(followersList.filter((f): f is User => f !== null));
    } catch (error) {
      console.error("Takipçiler yüklenirken hata:", error);
    }
    setLoadingLists(false);
  };

  // Takip edilen listesini yükle
  const loadFollowing = async () => {
    if (!user) return;
    setLoadingLists(true);
    try {
      console.log("Takip edilenler yükleniyor, user:", user);
      console.log("Takip edilen ID'leri:", user.following);

      const followingList = await Promise.all(
        (user.following || []).map(async (followingId: string) => {
          console.log("Takip edilen ID'si:", followingId);
          const followingUser = await getUserById(followingId);
          console.log("Takip edilen verisi:", followingUser);
          return followingUser;
        })
      );
      console.log("Tüm takip edilen listesi:", followingList);
      setFollowing(followingList.filter((f): f is User => f !== null));
    } catch (error) {
      console.error("Takip edilenler yüklenirken hata:", error);
    }
    setLoadingLists(false);
  };

  // Kullanıcı detayına git
  const handleUserClick = (userId: string) => {
    setShowFollowers(false);
    setShowFollowing(false);
    navigate(`/users/${userId}`);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!user) return;

    const result = await Swal.fire({
      title: "Kullanıcıyı sil",
      text: "Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Evet, sil",
      cancelButtonText: "İptal",
    });

    if (result.isConfirmed) {
      try {
        const success = await deleteUser(user.uid);
        if (success) {
          Swal.fire({
            title: "Silindi!",
            text: "Kullanıcı başarıyla silindi.",
            icon: "success",
          });
          navigate("/users");
        } else {
          Swal.fire({
            title: "Hata!",
            text: "Kullanıcı silinirken bir hata oluştu.",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Kullanıcı silinirken hata:", error);
        Swal.fire({
          title: "Hata!",
          text: "Kullanıcı silinirken bir hata oluştu.",
          icon: "error",
        });
      }
    }
  };

  // Handle user ban/unban
  const handleBanUser = async () => {
    if (!user) return;

    const isBanned = user.isBanned;
    const title = isBanned
      ? "Kullanıcı Engelini Kaldır"
      : "Kullanıcıyı Engelle";
    const text = isBanned
      ? "Bu kullanıcının engelini kaldırmak istediğinizden emin misiniz?"
      : "Bu kullanıcıyı engellemek istediğinizden emin misiniz?";
    const confirmButtonText = isBanned
      ? "Evet, engeli kaldır"
      : "Evet, engelle";

    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isBanned ? "#3085d6" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText,
      cancelButtonText: "İptal",
    });

    if (result.isConfirmed) {
      try {
        const success = await updateUserBanStatus(user.uid, !isBanned);
        if (success) {
          // Update local state immediately
          setUser((prevUser) => {
            if (!prevUser) return null;
            return { ...prevUser, isBanned: !prevUser.isBanned };
          });

          Swal.fire({
            title: "Başarılı!",
            text: isBanned
              ? "Kullanıcı engeli kaldırıldı."
              : "Kullanıcı engellendi.",
            icon: "success",
          });
        } else {
          throw new Error("İşlem başarısız oldu");
        }
      } catch (error) {
        console.error("Kullanıcı engelleme durumu güncellenirken hata:", error);
        Swal.fire({
          title: "Hata!",
          text: "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.",
          icon: "error",
        });
      }
    }
  };

  // Handle user activation/deactivation
  const handleToggleActiveStatus = async () => {
    if (!user) return;

    const newStatus = user.isActive === false ? true : false; // Toggle logic
    const title = newStatus ? "Kullanıcıyı Aktif Et" : "Kullanıcıyı Pasif Et";
    const text = newStatus
      ? `Bu kullanıcıyı aktif etmek istediğinizden emin misiniz?`
      : `Bu kullanıcıyı pasif etmek istediğinizden emin misiniz? Kullanıcı uygulamaya giriş yapamayacaktır.`;
    const confirmButtonText = newStatus ? "Evet, Aktif Et" : "Evet, Pasif Et";
    const confirmButtonColor = newStatus ? "#28a745" : "#ffc107"; // Green for activate, Amber for deactivate

    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor,
      cancelButtonColor: "#6c757d",
      confirmButtonText,
      cancelButtonText: "İptal",
    });

    if (result.isConfirmed) {
      try {
        const success = await updateUserStatus(user.uid, newStatus);
        if (success) {
          // Update local state immediately
          setUser((prevUser) => {
            if (!prevUser) return null;
            return { ...prevUser, isActive: newStatus };
          });

          Swal.fire({
            title: "Başarılı!",
            text: newStatus
              ? "Kullanıcı başarıyla aktif edildi."
              : "Kullanıcı başarıyla pasif edildi.",
            icon: "success",
          });
        } else {
          throw new Error("İşlem başarısız oldu");
        }
      } catch (error) {
        console.error(
          "Kullanıcı aktif/pasif durumu güncellenirken hata:",
          error
        );
        Swal.fire({
          title: "Hata!",
          text: "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.",
          icon: "error",
        });
      }
    }
  };

  const formatDate = (date: Date | null) =>
    date
      ? date.toLocaleString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "Belirtilmemiş";
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Hata: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Uyarı: </strong>
            <span className="block sm:inline">Kullanıcı bulunamadı.</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              Kullanıcı Detayları
            </h1>
            {/* Debug bilgisi */}
            <div className="text-xs text-gray-500 mt-1">
              Profil URL: {user.photoURL || "Yok"}
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="flex items-center justify-between px-4 py-5 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12">
                  {user.photoURL && user.photoURL.trim() !== "" ? (
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={user.photoURL}
                      alt={user.displayName || "Kullanıcı"}
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/150?text=U";
                        e.currentTarget.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl text-indigo-800 font-medium">
                        {user.displayName
                          ? user.displayName.charAt(0).toUpperCase()
                          : user.email
                          ? user.email.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {user.displayName || "İsimsiz Kullanıcı"}
                  </h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {user.isBanned ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Engellenmiş
                      </span>
                    ) : user.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        İnaktif
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                {/* New Activation/Deactivation Button */}
                <button
                  onClick={handleToggleActiveStatus}
                  className={`px-3 py-1 rounded-md ${
                    user.isActive === false
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  }`}
                  aria-label={
                    user.isActive === false
                      ? "Kullanıcıyı aktif et"
                      : "Kullanıcıyı pasif et"
                  }
                >
                  {user.isActive === false ? "Aktif Et" : "Pasif Et"}
                </button>

                <button
                  onClick={handleBanUser}
                  className={`px-3 py-1 rounded-md ${
                    user.isBanned
                      ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200" // Changed color for Unban to avoid red conflict
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                  aria-label={
                    user.isBanned
                      ? "Kullanıcı engelini kaldır"
                      : "Kullanıcıyı engelle"
                  }
                >
                  {user.isBanned ? "Engeli Kaldır" : "Engelle"}
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                  aria-label="Kullanıcıyı sil"
                >
                  Sil
                </button>
              </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Kullanıcı ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.uid}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">E-posta</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.email || "Belirtilmemiş"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Kullanıcı Adı
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.username || "Belirtilmemiş"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.phone || "Belirtilmemiş"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Konum</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.location || "Belirtilmemiş"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.bio || "Belirtilmemiş"}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    İlgi Alanları
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.interests && user.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-md text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "Belirtilmemiş"
                    )}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Takipçi Sayısı
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <button
                      onClick={() => {
                        setShowFollowers(true);
                        loadFollowers();
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {user.followersCount !== undefined
                        ? user.followersCount
                        : 0}
                    </button>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Takip Edilen Sayısı
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <button
                      onClick={() => {
                        setShowFollowing(true);
                        loadFollowing();
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {user.followingCount !== undefined
                        ? user.followingCount
                        : 0}
                    </button>
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Kayıt Tarihi
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Son Aktivite
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(user.lastActive)}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Debug Test - Profil Resmi
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.photoURL ? (
                      <>
                        <div>URL: {user.photoURL}</div>
                        <img
                          src={user.photoURL}
                          alt="Test profil"
                          className="h-16 w-16 rounded-full mt-2"
                          onError={() =>
                            console.log("Test resim yüklenirken hata oluştu")
                          }
                        />
                      </>
                    ) : (
                      "Profil resmi URL'si yok"
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Takipçiler Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          {" "}
          {/* Added z-50 */}
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Takipçiler
                </h3>
                <button
                  onClick={() => setShowFollowers(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Kapat</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {loadingLists ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : followers.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {followers.map((follower) => (
                    <li
                      key={follower.uid}
                      className="py-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleUserClick(follower.uid)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          {follower.photoURL ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={follower.photoURL}
                              alt={follower.displayName || "Kullanıcı"}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">
                                {follower.displayName
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {follower.displayName || "İsimsiz Kullanıcı"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {follower.email}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Takipçi bulunmuyor
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Takip Edilenler Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          {" "}
          {/* Added z-50 */}
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Takip Edilenler
                </h3>
                <button
                  onClick={() => setShowFollowing(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Kapat</span>
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              {loadingLists ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : following.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {following.map((followingUser) => (
                    <li
                      key={followingUser.uid}
                      className="py-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleUserClick(followingUser.uid)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10">
                          {followingUser.photoURL ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={followingUser.photoURL}
                              alt={followingUser.displayName || "Kullanıcı"}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">
                                {followingUser.displayName
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {followingUser.displayName || "İsimsiz Kullanıcı"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {followingUser.email}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Takip edilen kullanıcı bulunmuyor
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UserDetail;
