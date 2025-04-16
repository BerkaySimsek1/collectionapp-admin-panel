import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  getUserById,
  deleteUser,
  updateUserBanStatus,
} from "../services/userService";
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

  // Format date
  const formatDate = (date: Date | string | number | null | undefined) => {
    if (!date) return "Belirtilmemiş";

    try {
      const dateObj =
        typeof date === "string"
          ? new Date(date)
          : date instanceof Date
          ? date
          : typeof date === "number"
          ? new Date(date)
          : null;

      if (!dateObj || isNaN(dateObj.getTime())) {
        console.error("Geçersiz tarih formatı:", date);
        return "Geçersiz tarih";
      }

      return dateObj.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Tarih biçimlendirme hatası:", error, date);
      return "Geçersiz tarih";
    }
  };

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
                <button
                  onClick={handleBanUser}
                  className={`px-3 py-1 rounded-md ${
                    user.isBanned
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
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
                    {user.followersCount !== undefined
                      ? user.followersCount
                      : 0}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Takip Edilen Sayısı
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {user.followingCount !== undefined
                      ? user.followingCount
                      : 0}
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
    </Layout>
  );
};

export default UserDetail;
