# CollectionApp Admin Panel

Bu proje, CollectionApp uygulaması için bir yönetim paneli sağlar. React, TypeScript ve Firebase teknolojileri kullanılarak geliştirilmiştir.

## Çalıştırma

Projeyi çalıştırmak için aşağıdaki adımları izleyin:

```bash
# Proje dizinine gidin
cd collectionapp-admin-panel

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm start
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek uygulamayı görüntüleyebilirsiniz.

## Giriş Yapma

Giriş yapmak için, Firebase'de admin koleksiyonunda kayıtlı bir e-posta adresi ve şifre kullanmanız gerekmektedir. Admin koleksiyonu şu yapıdadır:

```
admin -> uid -> {
  adminId: string,
  adminMail: string
}
```

## Özellikler

- Kullanıcı yönetimi
- Koleksiyon yönetimi
- İçerik moderasyonu
- İstatistikler ve raporlar
- Sistem ayarları

## Kurulum

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm start
```

## Yapı

- `src/components`: Yeniden kullanılabilir UI bileşenleri
- `src/pages`: Sayfa bileşenleri
- `src/services`: Firebase ve diğer servisler
- `src/hooks`: Özel React hook'ları
- `src/types`: TypeScript tipleri
- `src/utils`: Yardımcı fonksiyonlar
- `src/context`: React context'leri

## Teknolojiler

- React
- TypeScript
- Firebase (Authentication, Firestore, Storage)
- React Router
- Styled Components

## Lisans

Bu proje özel lisans altında dağıtılmaktadır.
