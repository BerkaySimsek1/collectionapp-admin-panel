# 📱 CollectionApp Yönetim Paneli

<div align="center">
  <img src="https://via.placeholder.com/150" alt="CollectionApp Logo" width="150" height="150">
  <br>
  <p><strong>Koleksiyon Uygulaması Yönetim Paneli</strong></p>
</div>

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Özellikler](#-özellikler)
- [Teknolojiler](#-teknolojiler)
- [Kurulum](#-kurulum)
- [Kullanım](#-kullanım)
- [Proje Yapısı](#-proje-yapısı)
- [API Entegrasyonu](#-api-entegrasyonu)
- [Katkıda Bulunma](#-katkıda-bulunma)
- [Lisans](#-lisans)
- [İletişim](#-iletişim)

## 🚀 Proje Hakkında

CollectionApp Yönetim Paneli, koleksiyon uygulamasının yönetimi için geliştirilmiş kapsamlı bir admin arayüzüdür. Bu panel sayesinde kullanıcıları, koleksiyonları ve açık artırmaları yönetebilir, detaylı raporlar alabilir ve sistem ayarlarını yapılandırabilirsiniz.

## ✨ Özellikler

- **Kullanıcı Yönetimi**: Kullanıcıları görüntüleme, düzenleme ve yönetme
- **Koleksiyon Yönetimi**: Koleksiyonları ve içeriklerini yönetme
- **Açık Artırma Yönetimi**: Açık artırmaları izleme ve yönetme
- **Raporlama**: Detaylı istatistikler ve raporlar
- **Güvenli Giriş**: Firebase Authentication ile güvenli admin girişi
- **Duyarlı Tasarım**: Mobil ve masaüstü cihazlarda sorunsuz çalışma

## 💻 Teknolojiler

- **Frontend**: React, TypeScript, React Router
- **Stil**: TailwindCSS
- **Backend**: Firebase (Authentication, Firestore, Storage, Functions)
- **State Yönetimi**: React Context API
- **Deployment**: Firebase Hosting

## 🔧 Kurulum

### Ön Koşullar

- Node.js (v14.0.0 veya üzeri)
- npm veya yarn
- Firebase hesabı

### Adımlar

1. Projeyi klonlayın:

   ```bash
   git clone https://github.com/kullaniciadi/collectionapp-admin-panel.git
   cd collectionapp-admin-panel
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   # veya
   yarn install
   ```

3. `.env` dosyasını oluşturun ve Firebase yapılandırma bilgilerinizi ekleyin:

   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. Geliştirme sunucusunu başlatın:

   ```bash
   npm start
   # veya
   yarn start
   ```

5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek uygulamayı görüntüleyin.

## 📖 Kullanım

### Giriş Yapma

Giriş yapmak için, Firebase'de admin koleksiyonunda kayıtlı bir e-posta adresi ve şifre kullanmanız gerekmektedir. Admin koleksiyonu şu yapıdadır:

```
admin -> uid -> {
  adminId: string,
  adminMail: string
}
```

### Kullanıcı Yönetimi

- Tüm kullanıcıları görüntüleme
- Kullanıcı detaylarını inceleme
- Kullanıcı hesaplarını yönetme (askıya alma, silme)

### Koleksiyon Yönetimi

- Koleksiyonları görüntüleme ve düzenleme
- Yeni koleksiyon öğeleri ekleme
- Koleksiyon öğelerini onaylama veya reddetme

### Raporlar

- Kullanıcı aktivite raporları
- Koleksiyon istatistikleri
- Açık artırma performans raporları

## 📁 Proje Yapısı

```
src/
├── components/       # Yeniden kullanılabilir UI bileşenleri
├── context/          # React context'leri
├── hooks/            # Özel React hook'ları
├── pages/            # Sayfa bileşenleri
├── services/         # Firebase ve diğer servisler
├── types/            # TypeScript tipleri
├── utils/            # Yardımcı fonksiyonlar
├── App.tsx           # Ana uygulama bileşeni
└── index.tsx         # Giriş noktası
```

## 🔌 API Entegrasyonu

Bu yönetim paneli, Firebase Firestore veritabanı ile entegre çalışır. Veritabanı yapısı şu şekildedir:

- **users**: Kullanıcı bilgileri
- **collections**: Koleksiyon bilgileri
- **items**: Koleksiyon öğeleri
- **auctions**: Açık artırma bilgileri
- **admin**: Admin kullanıcıları

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje özel lisans altında dağıtılmaktadır. Tüm hakları saklıdır.

## 📞 İletişim

Proje Sahibi - [email@example.com](mailto:email@example.com)

Proje Linki: [https://github.com/kullaniciadi/collectionapp-admin-panel](https://github.com/kullaniciadi/collectionapp-admin-panel)
