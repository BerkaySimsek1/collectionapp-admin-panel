import React, { useState, useEffect } from "react";
import {
  Tab,
  Tabs,
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { getReports, updateReportStatus } from "../services/firestoreService";
import { UserReport, GroupReport, AuctionReport } from "../types";
import { getAuth } from "firebase/auth";
import "../index.css";
import Layout from "../components/Layout";

const ReportsPage: React.FC = () => {
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [groupReports, setGroupReports] = useState<GroupReport[]>([]);
  const [auctionReports, setAuctionReports] = useState<AuctionReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("user");

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);

      try {
        // Kullanıcı raporlarını yükle
        try {
          const userReportsData = await getReports("user");
          setUserReports(userReportsData as UserReport[]);
        } catch (userError: any) {
          console.error("Kullanıcı raporları yüklenirken hata:", userError);
        }

        // Grup raporlarını yükle
        try {
          const groupReportsData = await getReports("group");
          setGroupReports(groupReportsData as GroupReport[]);
        } catch (groupError: any) {
          console.error("Grup raporları yüklenirken hata:", groupError);
        }

        // Açık artırma raporlarını yükle
        try {
          const auctionReportsData = await getReports("auction");
          setAuctionReports(auctionReportsData as AuctionReport[]);
        } catch (auctionError: any) {
          console.error(
            "Açık artırma raporları yüklenirken hata:",
            auctionError
          );
        }
      } catch (error: any) {
        console.error("Raporlar yüklenirken genel hata:", error);
        setError(
          "Raporlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleTabChange = (key: string | null) => {
    if (key) {
      setActiveTab(key);
    }
  };

  const handleUpdateStatus = async (
    type: "user" | "group" | "auction",
    reportId: string,
    status: "pending" | "resolved" | "rejected"
  ) => {
    try {
      const auth = getAuth();
      const adminId = auth.currentUser?.uid || "";

      await updateReportStatus(type, reportId, status, adminId);

      // Rapor durumunu güncelle
      if (type === "user") {
        setUserReports((prev) =>
          prev.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status,
                  resolvedBy: adminId,
                  resolvedAt: new Date().toISOString(),
                }
              : report
          )
        );
      } else if (type === "group") {
        setGroupReports((prev) =>
          prev.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status,
                  resolvedBy: adminId,
                  resolvedAt: new Date().toISOString(),
                }
              : report
          )
        );
      } else if (type === "auction") {
        setAuctionReports((prev) =>
          prev.map((report) =>
            report.id === reportId
              ? {
                  ...report,
                  status,
                  resolvedBy: adminId,
                  resolvedAt: new Date().toISOString(),
                }
              : report
          )
        );
      }
    } catch (error) {
      console.error("Rapor durumu güncellenirken hata:", error);
    }
  };

  const formatDate = (dateString: string | number | Date | undefined) => {
    if (!dateString) return "N/A";

    const date =
      typeof dateString === "string"
        ? new Date(dateString)
        : dateString instanceof Date
        ? dateString
        : new Date(dateString);

    return date.toLocaleString("tr-TR");
  };

  const renderStatusBadge = (status: "pending" | "resolved" | "rejected") => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Beklemede</Badge>;
      case "resolved":
        return <Badge bg="success">Çözüldü</Badge>;
      case "rejected":
        return <Badge bg="danger">Reddedildi</Badge>;
      default:
        return <Badge bg="secondary">Bilinmiyor</Badge>;
    }
  };

  // Kullanıcı Raporları
  const renderUserReports = () => {
    if (userReports.length === 0) {
      return (
        <p className="text-center my-4">Hiç kullanıcı raporu bulunamadı.</p>
      );
    }

    return userReports.map((report) => (
      <Card key={report.id} className="mb-3">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h5 className="mb-3">Rapor Detayları</h5>
              <div className="d-flex mb-2">
                <strong className="me-2">Durum:</strong>
                {renderStatusBadge(report.status)}
              </div>
              <div className="mb-2">
                <strong>Rapor Nedeni:</strong> {report.reason}
              </div>
              <div className="mb-2">
                <strong>Açıklama:</strong> {report.description}
              </div>
              <div className="mb-2">
                <strong>Raporlama Tarihi:</strong>{" "}
                {formatDate(report.createdAt)}
              </div>
              {report.resolvedAt && (
                <div className="mb-2">
                  <strong>Çözülme Tarihi:</strong>{" "}
                  {formatDate(report.resolvedAt)}
                </div>
              )}
            </Col>
            <Col md={4}>
              <h5 className="mb-3">Kullanıcı Bilgileri</h5>
              <div className="mb-2">
                <strong>Raporlayan:</strong>{" "}
                {report.reporter ? (
                  <Link to={`/users/${report.reporter.uid}`}>
                    {report.reporter.displayName ||
                      report.reporter.username ||
                      report.reporter.email}
                  </Link>
                ) : (
                  report.reporterId
                )}
              </div>
              <div className="mb-2">
                <strong>Raporlanan:</strong>{" "}
                {report.reportedUser ? (
                  <Link to={`/users/${report.reportedUser.uid}`}>
                    {report.reportedUser.displayName ||
                      report.reportedUser.username ||
                      report.reportedUser.email}
                  </Link>
                ) : (
                  report.reportedId || "Bilinmiyor"
                )}
              </div>
              {report.status === "pending" && (
                <div className="mt-3">
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() =>
                      handleUpdateStatus("user", report.id, "resolved")
                    }
                  >
                    Çözüldü Olarak İşaretle
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      handleUpdateStatus("user", report.id, "rejected")
                    }
                  >
                    Reddet
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    ));
  };

  // Grup Raporları
  const renderGroupReports = () => {
    if (groupReports.length === 0) {
      return <p className="text-center my-4">Hiç grup raporu bulunamadı.</p>;
    }

    return groupReports.map((report) => (
      <Card key={report.id} className="mb-3">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h5 className="mb-3">Rapor Detayları</h5>
              <div className="d-flex mb-2">
                <strong className="me-2">Durum:</strong>
                {renderStatusBadge(report.status)}
              </div>
              <div className="mb-2">
                <strong>Rapor Nedeni:</strong> {report.reason}
              </div>
              <div className="mb-2">
                <strong>Açıklama:</strong> {report.description}
              </div>
              <div className="mb-2">
                <strong>Raporlama Tarihi:</strong>{" "}
                {formatDate(report.createdAt)}
              </div>
              {report.resolvedAt && (
                <div className="mb-2">
                  <strong>Çözülme Tarihi:</strong>{" "}
                  {formatDate(report.resolvedAt)}
                </div>
              )}
            </Col>
            <Col md={4}>
              <h5 className="mb-3">Grup Bilgileri</h5>
              <div className="mb-2">
                <strong>Raporlayan:</strong>{" "}
                {report.reporter ? (
                  <Link to={`/users/${report.reporter.uid}`}>
                    {report.reporter.displayName ||
                      report.reporter.username ||
                      report.reporter.email}
                  </Link>
                ) : (
                  report.reporterId
                )}
              </div>
              <div className="mb-2">
                <strong>Raporlanan Grup:</strong>{" "}
                {report.reportedGroup ? (
                  <Link to={`/groups/${report.reportedGroup.id}`}>
                    {report.reportedGroup.name}
                  </Link>
                ) : (
                  report.reportedId
                )}
              </div>
              {report.status === "pending" && (
                <div className="mt-3">
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() =>
                      handleUpdateStatus("group", report.id, "resolved")
                    }
                  >
                    Çözüldü Olarak İşaretle
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      handleUpdateStatus("group", report.id, "rejected")
                    }
                  >
                    Reddet
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    ));
  };

  // Açık Artırma Raporları
  const renderAuctionReports = () => {
    if (auctionReports.length === 0) {
      return (
        <p className="text-center my-4">Hiç açık artırma raporu bulunamadı.</p>
      );
    }

    return auctionReports.map((report) => (
      <Card key={report.id} className="mb-3">
        <Card.Body>
          <Row>
            <Col md={8}>
              <h5 className="mb-3">Rapor Detayları</h5>
              <div className="d-flex mb-2">
                <strong className="me-2">Durum:</strong>
                {renderStatusBadge(report.status)}
              </div>
              <div className="mb-2">
                <strong>Rapor Nedeni:</strong> {report.reason}
              </div>
              <div className="mb-2">
                <strong>Açıklama:</strong> {report.description}
              </div>
              <div className="mb-2">
                <strong>Raporlama Tarihi:</strong>{" "}
                {formatDate(report.createdAt)}
              </div>
              {report.resolvedAt && (
                <div className="mb-2">
                  <strong>Çözülme Tarihi:</strong>{" "}
                  {formatDate(report.resolvedAt)}
                </div>
              )}
            </Col>
            <Col md={4}>
              <h5 className="mb-3">Açık Artırma Bilgileri</h5>
              <div className="mb-2">
                <strong>Raporlayan:</strong>{" "}
                {report.reporter ? (
                  <Link to={`/users/${report.reporter.uid}`}>
                    {report.reporter.displayName ||
                      report.reporter.username ||
                      report.reporter.email}
                  </Link>
                ) : (
                  report.reporterId
                )}
              </div>
              <div className="mb-2">
                <strong>Raporlanan:</strong>{" "}
                {report.reportedUser ? (
                  <Link to={`/users/${report.reportedUser.uid}`}>
                    {report.reportedUser.displayName ||
                      report.reportedUser.username ||
                      report.reportedUser.email}
                  </Link>
                ) : (
                  report.reportedId
                )}
              </div>
              <div className="mb-2">
                <strong>Açık Artırma:</strong>{" "}
                {report.reportedAuction ? (
                  <Link to={`/auctions/${report.reportedAuction.id}`}>
                    {report.reportedAuction.name}
                  </Link>
                ) : (
                  report.auctionId
                )}
              </div>
              {report.status === "pending" && (
                <div className="mt-3">
                  <Button
                    variant="success"
                    size="sm"
                    className="me-2"
                    onClick={() =>
                      handleUpdateStatus("auction", report.id, "resolved")
                    }
                  >
                    Çözüldü Olarak İşaretle
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="mt-2"
                    onClick={() =>
                      handleUpdateStatus("auction", report.id, "rejected")
                    }
                  >
                    Reddet
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    ));
  };

  return (
    <Layout>
      <Container className="py-4">
        <h2 className="mb-4">Raporlar</h2>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="mb-4">
          <p>
            <strong>Kullanıcı Raporları:</strong> {userReports.length}
            {" | "}
            <strong>Grup Raporları:</strong> {groupReports.length}
            {" | "}
            <strong>Açık Artırma Raporları:</strong> {auctionReports.length}
          </p>
        </div>

        <Tabs activeKey={activeTab} onSelect={handleTabChange} className="mb-4">
          <Tab eventKey="user" title="Kullanıcı Raporları">
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </Spinner>
              </div>
            ) : userReports.length === 0 ? (
              <Alert variant="info">Hiç kullanıcı raporu bulunamadı.</Alert>
            ) : (
              renderUserReports()
            )}
          </Tab>
          <Tab eventKey="group" title="Grup Raporları">
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </Spinner>
              </div>
            ) : groupReports.length === 0 ? (
              <Alert variant="info">Hiç grup raporu bulunamadı.</Alert>
            ) : (
              renderGroupReports()
            )}
          </Tab>
          <Tab eventKey="auction" title="Açık Artırma Raporları">
            {loading ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Yükleniyor...</span>
                </Spinner>
              </div>
            ) : auctionReports.length === 0 ? (
              <Alert variant="info">Hiç açık artırma raporu bulunamadı.</Alert>
            ) : (
              renderAuctionReports()
            )}
          </Tab>
        </Tabs>
      </Container>
    </Layout>
  );
};

export default ReportsPage;
