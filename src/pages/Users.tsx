import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getAllUsers, updateUserStatus } from "../services/userService";
import { User } from "../types";

/**
 * Format date for display
 */
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

    return dateObj.toLocaleDateString("tr-TR");
  } catch (error) {
    console.error("Tarih biçimlendirme hatası:", error, date);
    return "Geçersiz tarih";
  }
};

/**
 * Users page component
 */
const Users: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  /**
   * Function to load users
   */
  const loadUsers = useCallback(
    async (isInitial = false) => {
      try {
        if (searchTerm.trim() !== "" && !isInitial) {
          return;
        }

        setLoading(true);
        setError(null);

        console.log(
          "Kullanıcılar yükleniyor...",
          isInitial ? "İlk yükleme" : "Daha fazla yükleme",
          "Son görünür:",
          lastVisible
        );

        const result = await getAllUsers(10, isInitial ? null : lastVisible);
        console.log(
          "Alınan kullanıcı sayısı:",
          result.users.length,
          "Son görünür:",
          result.lastVisible
        );

        if (result.users.length === 0 && isInitial) {
          console.log("Hiç kullanıcı bulunamadı");
          setUsers([]);
          setHasMore(false);
          setLoading(false);
          return;
        }

        if (isInitial) {
          setUsers(result.users);
        } else {
          setUsers((prevUsers) => [...prevUsers, ...result.users]);
        }

        setLastVisible(result.lastVisible);
        setHasMore(result.lastVisible !== null);
      } catch (error) {
        console.error("Kullanıcılar yüklenirken hata:", error);
        setError(
          "Kullanıcılar yüklenirken bir hata oluştu. Lütfen tekrar deneyin."
        );
      } finally {
        setLoading(false);
      }
    },
    [lastVisible, searchTerm]
  );

  /**
   * Function to update user status
   */
  const handleToggleStatus = async (
    uid: string,
    currentStatus: boolean = false
  ) => {
    try {
      const success = await updateUserStatus(uid, !currentStatus);

      if (success) {
        setUsers(
          users.map((user) =>
            user.uid === uid ? { ...user, isActive: !currentStatus } : user
          )
        );
      }
    } catch (error) {
      console.error("Kullanıcı durumu güncellenirken hata:", error);
    }
  };

  /**
   * Function to navigate to user details
   */
  const handleViewUserDetails = (uid: string) => {
    console.log("Kullanıcı detaylarına yönlendiriliyor, ID:", uid);
    navigate(`/users/${uid}`);
  };

  /**
   * Function to handle search term change
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  /**
   * Function to handle load more button click
   */
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadUsers(false);
    }
  };

  // Initial loading
  useEffect(() => {
    loadUsers(true);
  }, []);

  // Search filtering
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.displayName &&
            user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Search users"
            />
            <svg
              className="h-5 w-5 text-gray-400 absolute right-3 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    User
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Registration Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.uid}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewUserDetails(user.uid)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.photoURL ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={user.photoURL}
                                alt={user.displayName || "User"}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {user.displayName
                                    ? user.displayName.charAt(0).toUpperCase()
                                    : user.email?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName ||
                                user.username ||
                                "Unnamed User"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.createdAt
                            ? formatDate(user.createdAt)
                            : "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isBanned
                              ? "bg-red-100 text-red-800"
                              : user.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.isBanned
                            ? "Banned"
                            : user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(user.uid, user.isActive);
                          }}
                          className={`px-3 py-1 rounded-md ${
                            user.isActive
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-green-100 text-green-800 hover:bg-green-200"
                          }`}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewUserDetails(user.uid);
                          }}
                          className="ml-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-md hover:bg-indigo-200"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {loading
                        ? "Kullanıcılar yükleniyor..."
                        : "Kullanıcı bulunamadı."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {hasMore && searchTerm.trim() === "" && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
              aria-label="Daha fazla kullanıcı yükle"
            >
              {loading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {loading ? "Yükleniyor..." : "Daha Fazla Yükle"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;
