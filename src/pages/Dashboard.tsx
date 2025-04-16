import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { DashboardStats } from "../types";
import { getDashboardStats } from "../services/dashboardService";

/**
 * Dashboard page component
 */
const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        setErrorDetails(null);

        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError(
          "Veri çekme sırasında bir hata oluştu. Firebase bağlantınızı kontrol edin."
        );
        if (error instanceof Error) {
          setErrorDetails(error.message);
        } else {
          setErrorDetails("Bilinmeyen hata");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline font-bold mb-2">{error}</span>
            {errorDetails && (
              <div className="text-sm mt-2 p-2 bg-red-50 rounded">
                <p className="font-bold">Hata Detayları:</p>
                <p className="font-mono break-all">{errorDetails}</p>
              </div>
            )}
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded">
              <p className="font-bold">Olası Çözümler:</p>
              <ul className="list-disc ml-5 mt-2">
                <li>Firebase veritabanınızın aktif olduğundan emin olun</li>
                <li>Firebase güvenlik kurallarınızı kontrol edin</li>
                <li>
                  API anahtarlarınızın ve yapılandırmanızın doğru olduğundan
                  emin olun
                </li>
                <li>'users' koleksiyonunuzun var olduğundan emin olun</li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Yeniden Dene
          </button>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
            <span className="block sm:inline">
              İstatistik verileri bulunamadı. Lütfen daha sonra tekrar deneyin.
            </span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Yeniden Dene
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">
            Gösterge Paneli
          </h1>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
            aria-label="Verileri yenile"
          >
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Yenile
          </button>
        </div>

        {/* Uyarı mesajı - kullanıcı sayısı 0 ise */}
        {stats.totalUsers === 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6">
            <span className="block sm:inline">
              <strong>Uyarı:</strong> Hiç kullanıcı bulunamadı. Firebase
              veritabanında 'users' koleksiyonunun var olduğundan ve erişim
              izinlerinizin doğru olduğundan emin olun.
            </span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-500 mr-4">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Toplam Kullanıcı</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats.totalUsers}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-green-500 text-sm">
                <span className="font-bold">+{stats.newUsers}</span> bu ay yeni
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Aktif Açık Artırmalar</p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats.activeAuctions}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-green-500 text-sm">
                <span className="font-bold">+{stats.newAuctions}</span> bu hafta
                yeni
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Toplam Gelir</p>
                <p className="text-2xl font-semibold text-gray-800">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p
                className={`text-sm ${
                  stats.revenueIncrease >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                <span className="font-bold">
                  {stats.revenueIncrease >= 0 ? "+" : ""}$
                  {Math.abs(stats.revenueIncrease).toLocaleString()}
                </span>{" "}
                geçen aydan
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">
                  Tamamlanan Açık Artırmalar
                </p>
                <p className="text-2xl font-semibold text-gray-800">
                  {stats.completedAuctions}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-green-500 text-sm">
                <span className="font-bold">{stats.completionRate}%</span>{" "}
                tamamlanma oranı
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Son Aktiviteler
            </h2>
          </div>
          <div className="p-6">
            {stats.recentActivity.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Kullanıcı
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        İşlem
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Ürün
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.recentActivity.map((activity, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {activity.userPhoto ? (
                              <img
                                className="h-8 w-8 rounded-full mr-3"
                                src={activity.userPhoto}
                                alt={activity.userName}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/32?text=User";
                                  e.currentTarget.onerror = null;
                                }}
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-gray-500">
                                  {activity.userName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {activity.userName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              activity.action === "bid"
                                ? "bg-green-100 text-green-800"
                                : activity.action === "create"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {activity.action === "bid"
                              ? "Teklif Verdi"
                              : activity.action === "create"
                              ? "Açık Artırma Oluşturdu"
                              : "Açık Artırma Kazandı"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.item}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.date).toLocaleString("tr-TR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Henüz aktivite bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Popular Categories */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Popüler Kategoriler
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats.popularCategories.map((category, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-2/3 bg-gray-200 rounded-full h-4 mr-4"
                    title={`${category.percentage}%`}
                  >
                    <div
                      className="bg-indigo-600 h-4 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {category.name} ({category.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
