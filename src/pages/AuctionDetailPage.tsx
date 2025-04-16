import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAuctionById, deleteAuction } from "../services/auctionService";
import { Auction, Bid } from "../types";
import Swal from "sweetalert2";
import Layout from "../components/Layout";

const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"details" | "bids">("details");

  useEffect(() => {
    const fetchAuctionDetail = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const auctionData = await getAuctionById(id);
        setAuction(auctionData);
      } catch (error) {
        console.error("Açık artırma detayları alınırken hata oluştu:", error);
        Swal.fire({
          title: "Hata!",
          text: "Açık artırma detayları yüklenirken bir hata oluştu.",
          icon: "error",
          confirmButtonText: "Tamam",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAuctionDetail();
  }, [id]);

  const handleDeleteAuction = async () => {
    if (!auction) return;

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
          await deleteAuction(auction.id);

          Swal.fire({
            title: "Silindi!",
            text: "Açık artırma başarıyla silindi.",
            icon: "success",
            confirmButtonText: "Tamam",
          }).then(() => {
            navigate("/auctions");
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

  const getStatusBadge = () => {
    if (!auction) return null;

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

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!auction) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-500 text-lg">Açık artırma bulunamadı.</p>
          <button
            onClick={() => navigate("/auctions")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Tüm Açık Artırmalara Dön
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => navigate("/auctions")}
              className="inline-flex items-center text-blue-600 hover:text-blue-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Geri
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {auction.name}
            </h1>
          </div>
          <button
            onClick={handleDeleteAuction}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Açık Artırmayı Sil
          </button>
        </div>

        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Detaylar
              </button>
              <button
                onClick={() => setActiveTab("bids")}
                className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                  activeTab === "bids"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Teklifler ({auction.bidHistory.length})
              </button>
            </nav>
          </div>

          {activeTab === "details" ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Açık Artırma Bilgileri
                    </h3>
                    <div className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Açık Artırma Durumu
                        </p>
                        <div className="mt-1">{getStatusBadge()}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Başlangıç Fiyatı
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {auction.startingPrice.toLocaleString("tr-TR")} ₺
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Bitiş Tarihi
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {formatDate(auction.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Oluşturulma Tarihi
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          {auction.createdAt
                            ? formatDate(auction.createdAt)
                            : "Bilinmiyor"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Oluşturan Kullanıcı
                    </h3>
                    {auction.creator ? (
                      <div className="mt-4 flex items-center space-x-3">
                        {auction.creator.photoURL &&
                        auction.creator.photoURL.trim() !== "" ? (
                          <img
                            src={auction.creator.photoURL}
                            alt={auction.creator.displayName || "User"}
                            className="h-10 w-10 rounded-full"
                            onError={(e) => {
                              e.currentTarget.src =
                                "https://via.placeholder.com/40?text=U";
                              e.currentTarget.onerror = null;
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-800 font-medium">
                              {auction.creator.displayName
                                ? auction.creator.displayName
                                    .charAt(0)
                                    .toUpperCase()
                                : auction.creator.email
                                ? auction.creator.email.charAt(0).toUpperCase()
                                : "U"}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {auction.creator.displayName ||
                              auction.creator.email}
                          </p>
                          <p className="text-sm text-gray-500">
                            {auction.creator.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">
                        Kullanıcı bilgisi bulunamadı
                      </p>
                    )}
                  </div>

                  {auction.bidderId && auction.bidderId !== "" && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        En Yüksek Teklif Veren
                      </h3>
                      {auction.currentBidder ? (
                        <div className="mt-4 flex items-center space-x-3">
                          {auction.currentBidder.photoURL &&
                          auction.currentBidder.photoURL.trim() !== "" ? (
                            <img
                              src={auction.currentBidder.photoURL}
                              alt={auction.currentBidder.displayName || "User"}
                              className="h-10 w-10 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/40?text=U";
                                e.currentTarget.onerror = null;
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">
                                {auction.currentBidder.displayName
                                  ? auction.currentBidder.displayName
                                      .charAt(0)
                                      .toUpperCase()
                                  : auction.currentBidder.email
                                  ? auction.currentBidder.email
                                      .charAt(0)
                                      .toUpperCase()
                                  : "U"}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {auction.currentBidder.displayName ||
                                auction.currentBidder.email}
                            </p>
                            <p className="text-sm text-gray-500">
                              {auction.currentBidder.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-gray-500">
                          Kullanıcı bilgisi bulunamadı
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                {auction.imageUrls && auction.imageUrls.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Görseller
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {auction.imageUrls.map((imageUrl, index) => (
                        <div key={index} className="overflow-hidden rounded-lg">
                          <img
                            src={imageUrl}
                            alt={`${auction.name} - ${index + 1}`}
                            className="h-64 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Görseller
                    </h3>
                    <div className="h-64 w-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">Görsel bulunamadı</p>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Açıklama
                  </h3>
                  <div className="prose prose-blue max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">
                      {auction.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Teklif Geçmişi
              </h3>

              {auction.bidHistory.length === 0 ? (
                <p className="text-gray-500">Henüz hiç teklif yapılmamış.</p>
              ) : (
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
                          Teklif Miktarı
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Teklif Tarihi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {auction.bidHistory
                        .sort((a: Bid, b: Bid) => {
                          const timestampA =
                            typeof a.timestamp === "string"
                              ? parseInt(a.timestamp)
                              : (a.timestamp as number);
                          const timestampB =
                            typeof b.timestamp === "string"
                              ? parseInt(b.timestamp)
                              : (b.timestamp as number);
                          return timestampB - timestampA;
                        })
                        .map((bid: Bid, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {bid.userInfo?.photoURL &&
                                bid.userInfo.photoURL.trim() !== "" ? (
                                  <img
                                    src={bid.userInfo.photoURL}
                                    alt={bid.userInfo.displayName || "User"}
                                    className="h-8 w-8 rounded-full mr-3"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "https://via.placeholder.com/32?text=U";
                                      e.currentTarget.onerror = null;
                                    }}
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                    <span className="text-indigo-800 text-xs">
                                      {bid.userInfo?.displayName
                                        ? bid.userInfo.displayName
                                            .charAt(0)
                                            .toUpperCase()
                                        : bid.userInfo?.email
                                        ? bid.userInfo.email
                                            .charAt(0)
                                            .toUpperCase()
                                        : "U"}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm font-medium text-gray-900">
                                  {bid.userInfo?.displayName ||
                                    bid.userInfo?.email ||
                                    bid.userId ||
                                    "Bilinmiyor"}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {bid.amount.toLocaleString("tr-TR")} ₺
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {formatDate(bid.timestamp)}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuctionDetailPage;
