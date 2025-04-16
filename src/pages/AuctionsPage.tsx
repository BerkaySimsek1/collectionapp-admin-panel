import React, { useState, useEffect } from "react";
import {
  getAllAuctions,
  getActiveAuctions,
  getEndedAuctions,
  deleteAuction,
  filterAndSortAuctions,
  SortOption,
} from "../services/auctionService";
import { Auction } from "../types";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import Layout from "../components/Layout";

const AuctionsPage: React.FC = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption | undefined>(
    undefined
  );

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      let fetchedAuctions: Auction[] = [];

      switch (filter) {
        case "active":
          fetchedAuctions = await getActiveAuctions();
          break;
        case "ended":
          fetchedAuctions = await getEndedAuctions();
          break;
        default:
          fetchedAuctions = await getAllAuctions();
          break;
      }

      setAuctions(fetchedAuctions);
      applyFiltersAndSort(fetchedAuctions);
    } catch (error) {
      console.error("Açık artırmalar alınırken hata oluştu:", error);
      Swal.fire({
        title: "Hata!",
        text: "Açık artırmalar yüklenirken bir hata oluştu.",
        icon: "error",
        confirmButtonText: "Tamam",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = (auctionList: Auction[] = auctions) => {
    const filtered = filterAndSortAuctions(auctionList, searchTerm, sortOption);
    setFilteredAuctions(filtered);
  };

  useEffect(() => {
    fetchAuctions();
  }, [filter]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, sortOption]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleSort = (field: string) => {
    // Aynı alana tekrar tıklanırsa, sıralama yönünü tersine çevir
    if (field === "name") {
      setSortOption(sortOption === "name_asc" ? "name_desc" : "name_asc");
    } else if (field === "price") {
      setSortOption(sortOption === "price_asc" ? "price_desc" : "price_asc");
    } else if (field === "date") {
      setSortOption(sortOption === "date_asc" ? "date_desc" : "date_asc");
    }
  };

  const getSortIndicator = (field: string) => {
    if (field === "name") {
      if (sortOption === "name_asc") return " ↑";
      if (sortOption === "name_desc") return " ↓";
    } else if (field === "price") {
      if (sortOption === "price_asc") return " ↑";
      if (sortOption === "price_desc") return " ↓";
    } else if (field === "date") {
      if (sortOption === "date_asc") return " ↑";
      if (sortOption === "date_desc") return " ↓";
    }
    return "";
  };

  const handleDeleteAuction = async (auctionId: string) => {
    try {
      Swal.fire({
        title: "Emin misiniz?",
        text: "Bu açık artırmayı silmek istediğinizden emin misiniz?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Evet, sil!",
        cancelButtonText: "İptal",
      }).then(async (result) => {
        if (result.isConfirmed) {
          await deleteAuction(auctionId);
          const updatedAuctions = auctions.filter(
            (auction) => auction.id !== auctionId
          );
          setAuctions(updatedAuctions);
          applyFiltersAndSort(updatedAuctions);

          Swal.fire({
            title: "Silindi!",
            text: "Açık artırma başarıyla silindi.",
            icon: "success",
            confirmButtonText: "Tamam",
          });
        }
      });
    } catch (error) {
      console.error("Açık artırma silinirken hata oluştu:", error);
      Swal.fire({
        title: "Hata!",
        text: "Açık artırma silinirken bir hata oluştu.",
        icon: "error",
        confirmButtonText: "Tamam",
      });
    }
  };

  const formatDate = (timestamp: number | string | Date) => {
    if (!timestamp) return "Bilinmiyor";

    const date =
      typeof timestamp === "object"
        ? timestamp
        : new Date(
            typeof timestamp === "string" ? parseInt(timestamp) : timestamp
          );

    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusBadge = (auction: Auction) => {
    const endTime =
      typeof auction.endTime === "object"
        ? auction.endTime
        : new Date(
            typeof auction.endTime === "string"
              ? parseInt(auction.endTime as string)
              : (auction.endTime as number)
          );

    const isEnded = auction.isAuctionEnd || new Date() > endTime;

    if (isEnded) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Bitti
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Aktif
      </span>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Açık Artırmalar</h1>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Müzayede ara..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={clearSearch}
              >
                <svg
                  className="h-5 w-5 text-gray-400 hover:text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-md ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-md ${
                filter === "active"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setFilter("ended")}
              className={`px-4 py-2 rounded-md ${
                filter === "ended"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Biten
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchTerm
                ? "Aramanızla eşleşen müzayede bulunamadı."
                : "Hiç açık artırma bulunamadı."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Görsel
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500"
                    onClick={() => handleSort("name")}
                  >
                    İsim {getSortIndicator("name")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500"
                    onClick={() => handleSort("price")}
                  >
                    Başlangıç Fiyatı {getSortIndicator("price")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Oluşturan
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-blue-500"
                    onClick={() => handleSort("date")}
                  >
                    Bitiş Tarihi {getSortIndicator("date")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Durum
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAuctions.map((auction) => (
                  <tr key={auction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex-shrink-0 h-16 w-16 overflow-hidden rounded-md">
                        {auction.imageUrls && auction.imageUrls.length > 0 ? (
                          <img
                            src={auction.imageUrls[0]}
                            alt={auction.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500">
                            N/A
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {auction.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {auction.startingPrice.toLocaleString("tr-TR")} ₺
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {auction.creator ? (
                          <div className="flex items-center">
                            {auction.creator.photoURL &&
                            auction.creator.photoURL.trim() !== "" ? (
                              <img
                                src={auction.creator.photoURL}
                                alt={auction.creator.displayName || "User"}
                                className="h-6 w-6 rounded-full mr-2"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/40?text=U";
                                  e.currentTarget.onerror = null;
                                }}
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
                                <span className="text-indigo-800 text-xs font-medium">
                                  {auction.creator.displayName
                                    ? auction.creator.displayName
                                        .charAt(0)
                                        .toUpperCase()
                                    : auction.creator.email
                                    ? auction.creator.email
                                        .charAt(0)
                                        .toUpperCase()
                                    : "U"}
                                </span>
                              </div>
                            )}
                            <span>
                              {auction.creator.displayName ||
                                auction.creator.email}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-500">Bilinmiyor</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(auction.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(auction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Link
                          to={`/auctions/${auction.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Detaylar
                        </Link>
                        <button
                          onClick={() => handleDeleteAuction(auction.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AuctionsPage;
