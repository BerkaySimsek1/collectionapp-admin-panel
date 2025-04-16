import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import { User, UserGroup } from "../types";
import {
  getGroupById,
  getGroupMembers,
  getGroupAdmins,
  getGroupPosts,
  deleteGroup,
} from "../services/groupService";

/**
 * Group detail page component
 */
const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<UserGroup | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"members" | "admins" | "posts">(
    "members"
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Sayfa yükleme
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Grup bilgilerini al
        const groupData = await getGroupById(id);
        if (!groupData) {
          setError("Grup bulunamadı.");
          setLoading(false);
          return;
        }

        setGroup(groupData);

        // Grup üyelerini, adminleri ve gönderileri al
        const membersData = await getGroupMembers(id);
        const adminsData = await getGroupAdmins(id);
        const postsData = await getGroupPosts(id);

        setMembers(membersData);
        setAdmins(adminsData);
        setPosts(postsData);
        setLoading(false);
      } catch (err) {
        console.error("Grup detayları yüklenirken hata:", err);
        setError(
          "Grup detayları yüklenemedi. Lütfen daha sonra tekrar deneyin."
        );
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id]);

  // Tarih formatını düzenle
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "-";

    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
      return date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return String(dateString);
    }
  };

  // Grubu sil
  const handleDeleteGroup = async () => {
    if (
      !id ||
      !window.confirm(
        "Bu grubu silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      )
    )
      return;

    try {
      setIsDeleting(true);
      await deleteGroup(id);
      navigate("/groups");
    } catch (err) {
      console.error("Grup silinirken hata:", err);
      setError("Grup silinemedi. Lütfen daha sonra tekrar deneyin.");
      setIsDeleting(false);
    }
  };

  // Yükleniyor durumu
  if (loading) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
          <i className="fas fa-spinner fa-spin text-indigo-600 text-4xl"></i>
        </div>
      </Layout>
    );
  }

  // Hata durumu
  if (error) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-400"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                <div className="mt-4">
                  <Link
                    to="/groups"
                    className="text-sm font-medium text-red-800 hover:text-red-600"
                  >
                    <i className="fas fa-arrow-left mr-2"></i>
                    Gruplara Dön
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Grup bulunamadı
  if (!group) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">
              Grup bulunamadı.
            </h3>
            <div className="mt-6">
              <Link
                to="/groups"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Gruplara Dön
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Üst başlık */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {group.name}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <i className="fas fa-users mr-1.5 text-gray-400"></i>
                {members.length} Üye
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <i className="fas fa-shield-alt mr-1.5 text-gray-400"></i>
                {admins.length} Admin
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <i className="fas fa-sticky-note mr-1.5 text-gray-400"></i>
                {posts.length} Gönderi
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <i className="fas fa-calendar mr-1.5 text-gray-400"></i>
                Oluşturulma: {formatDate(group.createdAt)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              onClick={() => navigate("/groups")}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Geri Dön
            </button>
            <button
              type="button"
              onClick={handleDeleteGroup}
              disabled={isDeleting}
              className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Siliniyor...
                </>
              ) : (
                <>
                  <i className="fas fa-trash mr-2"></i>
                  Grubu Sil
                </>
              )}
            </button>
          </div>
        </div>

        {/* Grup detayları */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Grup Detayları
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Grup bilgileri ve özellikleri.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Grup Adı</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {group.name}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Açıklama</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {group.description || "-"}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Oluşturan</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <Link
                    to={`/users/${group.createdBy}`}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {group.createdBy}
                  </Link>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Oluşturulma Tarihi
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {formatDate(group.createdAt)}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Üyeler, Adminler ve Gönderiler tabları */}
        <div className="mt-6">
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Sekme seçin
            </label>
            <select
              id="tabs"
              name="tabs"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={activeTab}
              onChange={(e) =>
                setActiveTab(e.target.value as "members" | "admins" | "posts")
              }
            >
              <option value="members">Üyeler ({members.length})</option>
              <option value="admins">Adminler ({admins.length})</option>
              <option value="posts">Gönderiler ({posts.length})</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("members")}
                  className={`${
                    activeTab === "members"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Üyeler ({members.length})
                </button>
                <button
                  onClick={() => setActiveTab("admins")}
                  className={`${
                    activeTab === "admins"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Adminler ({admins.length})
                </button>
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`${
                    activeTab === "posts"
                      ? "border-indigo-500 text-indigo-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Gönderiler ({posts.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Üye Listesi */}
          {activeTab === "members" && (
            <div className="mt-6">
              {members.length === 0 ? (
                <div className="text-center py-6 bg-white shadow rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">
                    Bu grupta henüz üye bulunmamaktadır.
                  </h3>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {members.map((member) => (
                    <li
                      key={member.uid}
                      className="col-span-1 flex flex-col text-center bg-white rounded-lg shadow divide-y divide-gray-200"
                    >
                      <div className="flex-1 flex flex-col p-8">
                        <img
                          className="w-32 h-32 flex-shrink-0 mx-auto rounded-full object-cover"
                          src={
                            member.photoURL && member.photoURL.trim() !== ""
                              ? member.photoURL
                              : "https://via.placeholder.com/150?text=U"
                          }
                          alt={
                            member.displayName || member.username || "Kullanıcı"
                          }
                          onError={(e) => {
                            console.log("Profil resmi yüklenirken hata:", e);
                            e.currentTarget.src =
                              "https://via.placeholder.com/150?text=U";
                            e.currentTarget.onerror = null;
                          }}
                        />
                        <h3 className="mt-6 text-gray-900 text-sm font-medium">
                          {member.displayName ||
                            member.username ||
                            member.email}
                        </h3>
                        <dl className="mt-1 flex-grow flex flex-col justify-between">
                          <dt className="sr-only">Email</dt>
                          <dd className="text-gray-500 text-sm">
                            {member.email}
                          </dd>
                          <dt className="sr-only">Durum</dt>
                          <dd className="mt-3">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                member.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {member.isActive ? "Aktif" : "Pasif"}
                            </span>
                            {member.isBanned && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Yasaklı
                              </span>
                            )}
                          </dd>
                        </dl>
                      </div>
                      <div>
                        <div className="-mt-px flex divide-x divide-gray-200">
                          <div className="w-0 flex-1 flex">
                            <Link
                              to={`/users/${member.uid}`}
                              className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
                            >
                              <i className="fas fa-eye text-gray-400"></i>
                              <span className="ml-3">Profili Görüntüle</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Admin Listesi */}
          {activeTab === "admins" && (
            <div className="mt-6">
              {admins.length === 0 ? (
                <div className="text-center py-6 bg-white shadow rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">
                    Bu grupta henüz admin bulunmamaktadır.
                  </h3>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {admins.map((admin) => (
                    <li
                      key={admin.uid}
                      className="col-span-1 flex flex-col text-center bg-white rounded-lg shadow divide-y divide-gray-200"
                    >
                      <div className="flex-1 flex flex-col p-8">
                        <img
                          className="w-32 h-32 flex-shrink-0 mx-auto rounded-full object-cover"
                          src={
                            admin.photoURL && admin.photoURL.trim() !== ""
                              ? admin.photoURL
                              : "https://via.placeholder.com/150?text=U"
                          }
                          alt={admin.displayName || admin.username || "Admin"}
                          onError={(e) => {
                            console.log("Profil resmi yüklenirken hata:", e);
                            e.currentTarget.src =
                              "https://via.placeholder.com/150?text=U";
                            e.currentTarget.onerror = null;
                          }}
                        />
                        <h3 className="mt-6 text-gray-900 text-sm font-medium">
                          {admin.displayName || admin.username || admin.email}
                        </h3>
                        <dl className="mt-1 flex-grow flex flex-col justify-between">
                          <dt className="sr-only">Email</dt>
                          <dd className="text-gray-500 text-sm">
                            {admin.email}
                          </dd>
                          <dt className="sr-only">Durum</dt>
                          <dd className="mt-3">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                admin.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {admin.isActive ? "Aktif" : "Pasif"}
                            </span>
                            {admin.isBanned && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Yasaklı
                              </span>
                            )}
                          </dd>
                        </dl>
                      </div>
                      <div>
                        <div className="-mt-px flex divide-x divide-gray-200">
                          <div className="w-0 flex-1 flex">
                            <Link
                              to={`/users/${admin.uid}`}
                              className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
                            >
                              <i className="fas fa-eye text-gray-400"></i>
                              <span className="ml-3">Profili Görüntüle</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Gönderi Listesi */}
          {activeTab === "posts" && (
            <div className="mt-6">
              {posts.length === 0 ? (
                <div className="text-center py-6 bg-white shadow rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900">
                    Bu grupta henüz gönderi bulunmamaktadır.
                  </h3>
                </div>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white shadow rounded-lg overflow-hidden"
                    >
                      <div className="p-6">
                        {/* Gönderinin başlık ve kullanıcı bilgileri */}
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={
                                post.user?.photoURL &&
                                post.user.photoURL.trim() !== ""
                                  ? post.user.photoURL
                                  : "https://via.placeholder.com/40?text=U"
                              }
                              alt={post.user?.displayName || "Kullanıcı"}
                              onError={(e) => {
                                console.log(
                                  "Profil resmi yüklenirken hata:",
                                  e
                                );
                                e.currentTarget.src =
                                  "https://via.placeholder.com/40?text=U";
                                e.currentTarget.onerror = null;
                              }}
                            />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              <Link
                                to={`/users/${post.userId}`}
                                className="hover:underline"
                              >
                                {post.user?.displayName || "Anonim Kullanıcı"}
                              </Link>
                            </p>
                            <p className="text-xs text-gray-500">
                              {post.createdAt
                                ? formatDate(post.createdAt)
                                : "-"}
                            </p>
                          </div>
                        </div>

                        {/* Gönderi içeriği */}
                        <div className="mt-2 text-sm text-gray-700">
                          <p>{post.content}</p>
                        </div>

                        {/* Gönderi Görseli (varsa) */}
                        {post.imageUrl && (
                          <div className="mt-4">
                            <img
                              src={post.imageUrl}
                              alt="Gönderi görseli"
                              className="rounded-lg w-full object-contain h-auto max-h-96 border border-gray-200"
                              onError={(e) => {
                                console.error(
                                  "Görsel yüklenirken hata oluştu:",
                                  post.imageUrl
                                );
                                e.currentTarget.src =
                                  "https://via.placeholder.com/500x300?text=Görsel+Yüklenemedi";
                                e.currentTarget.onerror = null; // Sonsuz döngüyü önlemek için
                              }}
                            />
                          </div>
                        )}

                        {/* Beğeni ve Yorum Sayısı */}
                        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <i className="fas fa-heart text-red-500 mr-1.5"></i>
                            <span>{post.likes} Beğeni</span>
                          </div>
                          <div className="flex items-center">
                            <i className="fas fa-comment text-blue-500 mr-1.5"></i>
                            <span>{post.comments?.length || 0} Yorum</span>
                          </div>
                        </div>

                        {/* Yorumlar (varsa) */}
                        {post.comments && post.comments.length > 0 && (
                          <div className="mt-6 border-t border-gray-200 pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Yorumlar
                            </h4>
                            <div className="space-y-4">
                              {post.comments
                                .slice(0, 3)
                                .map((comment: any, index: number) => (
                                  <div key={index} className="flex">
                                    <div className="flex-shrink-0 mr-3">
                                      <img
                                        className="h-8 w-8 rounded-full"
                                        src={
                                          comment.user?.photoURL &&
                                          comment.user.photoURL.trim() !== ""
                                            ? comment.user.photoURL
                                            : "https://via.placeholder.com/32?text=U"
                                        }
                                        alt={
                                          comment.user?.displayName ||
                                          "Kullanıcı"
                                        }
                                        onError={(e) => {
                                          console.log(
                                            "Profil resmi yüklenirken hata:",
                                            e
                                          );
                                          e.currentTarget.src =
                                            "https://via.placeholder.com/32?text=U";
                                          e.currentTarget.onerror = null;
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-lg px-4 py-2">
                                      <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-medium text-gray-900">
                                          {comment.user?.displayName ||
                                            "Anonim Kullanıcı"}
                                        </h5>
                                        <span className="text-xs text-gray-500">
                                          {comment.createdAt
                                            ? formatDate(comment.createdAt)
                                            : "-"}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-700">
                                        {comment.text}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              {post.comments.length > 3 && (
                                <div className="text-sm text-center">
                                  <span className="text-indigo-600 hover:text-indigo-900 cursor-pointer">
                                    + {post.comments.length - 3} Daha Fazla
                                    Yorum Göster
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GroupDetailPage;
