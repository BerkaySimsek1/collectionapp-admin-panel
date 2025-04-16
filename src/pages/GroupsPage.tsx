import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { UserGroup } from "../types";
import { getAllGroups } from "../services/groupService";

/**
 * Groups listing page component
 */
const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Sayfa yükleme
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const groupsData = await getAllGroups();
        setGroups(groupsData);
        setFilteredGroups(groupsData);
        setLoading(false);
      } catch (err) {
        console.error("Gruplar yüklenirken hata:", err);
        setError("Gruplar yüklenemedi. Lütfen daha sonra tekrar deneyin.");
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Arama işlevi
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(
        (group) =>
          group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, groups]);

  // Tarih formatını düzenle
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      return dateString;
    }
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Gruplar</h1>
            <p className="mt-2 text-sm text-gray-700">
              Sistemdeki tüm grupların listesi. Her grup için detaylı bilgileri
              görüntüleyebilirsiniz.
            </p>
          </div>
        </div>

        {/* Arama */}
        <div className="mt-4 mb-6">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Grup adı veya açıklaması ile arayın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="fas fa-exclamation-circle text-red-400"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Yükleniyor durumu */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <i className="fas fa-spinner fa-spin text-indigo-600 text-4xl"></i>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  {filteredGroups.length === 0 ? (
                    <div className="bg-white px-6 py-12 text-center">
                      <p className="text-gray-500 text-lg">
                        {searchTerm
                          ? "Arama kriterlerine uygun grup bulunamadı."
                          : "Henüz hiç grup oluşturulmamış."}
                      </p>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Grup Adı
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Açıklama
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Üye Sayısı
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Oluşturulma Tarihi
                          </th>
                          <th
                            scope="col"
                            className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                          >
                            <span className="sr-only">Düzenle</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredGroups.map((group) => (
                          <tr key={group.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {group.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {group.description.length > 50
                                ? `${group.description.substring(0, 50)}...`
                                : group.description}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {group.members.length}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(group.createdAt)}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <Link
                                to={`/groups/${group.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Detaylar
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GroupsPage;
