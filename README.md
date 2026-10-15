# ByMaster — e-ticaret ve içerik platformu

ByMaster Professional Pastry Products için B2C + B2B e-ticaret sitesi, tarif/blog (Lezzet Günlüğü) ve yönetim paneli.

- **Uygulama:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Veri:** Prisma 6 — yerelde SQLite, üretimde PostgreSQL önerilir
- **Ödeme:** PayTR (iFrame API) veya iyzico (Checkout Form) + havale/EFT; yalnızca test modunda çalışan yerel ödeme simülatörü
- **Testler:** Vitest (birim + veritabanı entegrasyon), Playwright (uçtan uca, erişilebilirlik, mobil)

---

## 1. Yerelde çalıştırma

Gereksinim: Node.js 20.9+ (geliştirmede 24 kullanıldı).

```bash
npm install
cp .env.example .env          # SESSION_SECRET'i doldurun (aşağıdaki komutla üretin)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npx prisma migrate deploy     # veritabanı tablolarını oluşturur (prisma/dev.db)
npm run db:seed               # katalog, kategoriler, içerik ve yasal metin TASLAKLARI
npm run admin:create -- --email siz@alanadiniz.com --name "Ad Soyad"
npm run dev                   # http://localhost:3000  ·  yönetim: /yonetim
```

`admin:create` parolayı `ADMIN_PASSWORD` ortam değişkeninden okur; verilmezse güçlü bir geçici parola üretip bir kez ekrana yazar.

Tohumlama betiği tekrar çalıştırılabilir; mevcut kayıtların üzerine yazmaz, yalnızca eksikleri ekler.

### Ürün görselleri
Kaynak marka görselleri `assets/source/brand/` altındadır. `npm run images:prepare` bunlardan site görsellerini (`public/images/products`), temsili illüstrasyonları ve editoryal fotoğrafları üretir. Görselleri olmayan ürünlerde **“Temsili görsel”** etiketli illüstrasyon gösterilir; gerçek fotoğraflar yönetim panelinden yüklenmelidir.

---

## 2. Ortam değişkenleri

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | SQLite (`file:./dev.db`) veya PostgreSQL bağlantısı |
| `APP_URL` | Sitenin herkese açık adresi. `https://` ile başlıyorsa çerezler `Secure` olur |
| `SESSION_SECRET` | En az 32 karakter rastgele değer (oturum ve imzalı çerezler) |
| `UPLOAD_DIR` | Yüklenen görsellerin klasörü — kalıcı disk/volume olmalı, `public` dışında |
| `PAYMENT_PROVIDER` | `none` · `paytr` · `iyzico` · `mock` (mock yalnızca test modunda çalışır) |
| `PAYMENT_MODE` | `test` · `live`. Test modunda sitede kalıcı “TEST MODU” bandı görünür |
| `PAYTR_MERCHANT_ID/KEY/SALT` | PayTR Mağaza Paneli > Bilgi |
| `IYZICO_API_KEY/SECRET_KEY/BASE_URL` | iyzico panel > Ayarlar; sandbox: `https://sandbox-api.iyzipay.com`, canlı: `https://api.iyzipay.com` |
| `SMTP_*` | Sipariş, şifre sıfırlama ve bildirim e-postaları. Boşsa e-posta gönderilmez (İşlem kayıtlarında “atlandı” görünür) |
| `CRON_SECRET` | Tanımlanırsa `/api/cron/siparis-suresi` zamanlanmış görev uç noktası açılır |
| `NOINDEX` | `true` ise arama motorları dizinlemez (test/önizleme sunucuları) |

Gizli anahtarlar yalnızca sunucuda okunur; hiçbiri `NEXT_PUBLIC_` önekiyle tarayıcıya gönderilmez. `mock` sağlayıcısı `PAYMENT_MODE=live` ile birlikte kullanılamaz (uygulama açılmaz).

---

## 3. Canlıya çıkış kontrol listesi

Yönetim paneli ana sayfasındaki **“Yayına hazırlık”** listesi aşağıdakileri canlı olarak kontrol eder. Bu adımlar tamamlanmadan site sipariş almaz (müşteri ödeme adımında “online sipariş şu anda alınamıyor” görür):

1. **Site ayarları > Satıcı bilgileri:** şirket unvanı, adres, telefon/e-posta, vergi no veya MERSİS.
2. **Sayfalar:** Ön Bilgilendirme Formu ve Mesafeli Satış Sözleşmesi şablonlarını hukuk danışmanınızla gözden geçirip yayınlayın. KVKK, gizlilik, çerez, iade ve kargo sayfaları da şablon olarak hazırdır (taslak).
3. **Ödeme:** PayTR veya iyzico anahtarları (sunucu ortamında) ve/veya havale hesapları (Site ayarları > Ödeme).
4. **Kargo:** kargo ücreti (boşsa — ücretsiz kargolu kitler dışında — sipariş alınmaz), ücretsiz kargo eşiği, kargo firması ve gönderim süresi.
5. **SMTP** ve **sipariş bildirim e-postası**.
6. **Ürün bilgileri:** içindekiler, alerjenler, saklama koşulları, raf ömrü — tohum verisinde bilinmediği için **boş bırakılmıştır** ve vitrinde “henüz eklenmedi” olarak görünür. Ürünler sayfasındaki “İçerik/alerjen eksik” filtresiyle bulunur.
7. **Stok takibi:** gerçek stok miktarları bilinmediği için tohum verisinde kapalıdır. Stok ve fiyat sayfasından açın.
8. **Gerçek ürün fotoğrafları** (temsili illüstrasyonlu ürünler: Ürünler sayfasında “Fotoğraf eksik” filtresi).
9. **ETBİS** kaydı ve doğrulama bağlantısı, Instagram vb. yalnızca gerçek hesaplar.
10. `PAYMENT_MODE=live`, `NOINDEX=false`, `APP_URL=https://...`

---

## 4. Ödeme sağlayıcıları

Kart bilgileri hiçbir zaman bu uygulamaya girilmez veya kaydedilmez; ödeme formu sağlayıcının sayfasında/iframe'inde açılır.

### PayTR (iFrame API)
- `PAYMENT_PROVIDER=paytr`, `PAYTR_MERCHANT_ID`, `PAYTR_MERCHANT_KEY`, `PAYTR_MERCHANT_SALT`
- PayTR Mağaza Paneli > Ayarlar > **Bildirim URL:** `https://alanadiniz.com/api/odeme/paytr/bildirim`
- Test modunda istekler `test_mode=1` ile gönderilir. Bildirimler HMAC ile doğrulanır; aynı bildirim tekrar gelse de sipariş bir kez işlenir; tahsil edilen tutar sipariş tutarından düşükse sipariş ödendi işaretlenmez.

### iyzico (Checkout Form)
- `PAYMENT_PROVIDER=iyzico`, `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL`
- Geri dönüş adresi otomatik gönderilir: `https://alanadiniz.com/api/odeme/iyzico/donus`
- Tarayıcıdan gelen veriye güvenilmez: sonuç iyzico API'sinden sunucu-sunucu sorgulanır ve yanıt imzası doğrulanır. **Canlıya çıkmadan önce sandbox'ta bir başarılı ve bir başarısız ödemeyle doğrulayın.**

### Havale / EFT
Site ayarları > Ödeme'den IBAN'lar girilir (TR IBAN kontrol hanesi doğrulanır). Sipariş “havale bekleniyor” durumunda oluşur, stok ayrılır; ödeme hesaba geçince yönetici sipariş sayfasından “Ödeme alındı” yapar. Süre dolarsa sipariş kapanır ve stok serbest kalır.

### Yerel test simülatörü
`PAYMENT_PROVIDER=mock` + `PAYMENT_MODE=test`: gerçek sağlayıcı olmadan tüm sipariş akışını denemek içindir. Sağlayıcı bildirimini imzalı olarak taklit eder, siparişler “Test siparişi” olarak işaretlenir ve raporlara dahil edilmez.

---

## 5. Üretim ortamı

### PostgreSQL
SQLite tek sunuculu küçük kurulumlar için yeterlidir; çoklu sunucu ve yedekleme kolaylığı için PostgreSQL önerilir. Şema her iki veritabanıyla uyumlu yazılmıştır (metin enum'lar, kuruş cinsinden tamsayı tutarlar, çift tırnaklı ham SQL).

1. `prisma/schema.prisma` içinde `provider = "postgresql"` yapın.
2. Mevcut `prisma/migrations` klasörü SQLite'a özgüdür. **Boş** bir PostgreSQL veritabanında yeni bir başlangıç migration'ı oluşturun (eski klasörü yedekleyip kaldırdıktan sonra): `npx prisma migrate dev --name init`
3. Üretimde yalnızca `npx prisma migrate deploy` çalıştırın. Mevcut verisi olan bir veritabanında migration'ları önce yedek üzerinde deneyin; tablo silen bir migration'ı inceleme yapmadan uygulamayın.
4. Uygulama kullanıcısına en az yetki verin (yalnızca kendi şemasında `SELECT/INSERT/UPDATE/DELETE`); migration'ları ayrı, yetkili bir kullanıcıyla çalıştırın.

### Sunucu
```bash
npm ci
npx prisma migrate deploy
npm run build
npm run start            # varsayılan port 3000; önüne HTTPS sonlandıran bir ters vekil koyun
```
- Uygulama, istemci IP'sini (hız sınırlama ve ödeme sağlayıcıları için) `X-Forwarded-For` başlığından okur. Bu başlığı **yalnızca kendi ters vekilinizin** ayarladığından emin olun (doğrudan internete açık kurulumda istemci bu başlığı taklit edebilir).
- Form işlemleri (Server Actions) CSRF'e karşı `Origin` ile `Host`/`X-Forwarded-Host` başlıklarını karşılaştırır. Ters vekil bu başlıkları doğru iletmelidir (ör. Nginx: `proxy_set_header Host $host; proxy_set_header X-Forwarded-Host $host;`), aksi hâlde formlar “Invalid Server Actions request” hatası verir.
- `UPLOAD_DIR` kalıcı bir disk olmalı ve veritabanıyla birlikte yedeklenmelidir.
- Ödeme süresi dolan siparişler ödeme/sipariş/yönetim sayfalarında ve sepete eklemede kendiliğinden kapatılır. Ek güvence için `CRON_SECRET` tanımlayıp 5 dakikada bir `POST /api/cron/siparis-suresi` çağırın.
- Güvenlik başlıkları (CSP, HSTS, X-Frame-Options vb.) `next.config.ts` içindedir. Yönetim sayfaları `noindex` ve önbelleksizdir.

---

## 6. Testler

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint (src, scripts, prisma, tests)
npm test               # Vitest: birim + entegrasyon (ayrı prisma/vitest.db oluşturur)
npx playwright install chromium   # ilk seferde
npm run test:e2e       # Playwright: ayrı prisma/e2e.db + üretim derlemesi + ödeme simülatörü (port 3100)
```

E2E testleri kendi veritabanını (`prisma/e2e.db`) sıfırdan kurar; bu veritabanına yalnızca test için, açıkça **“TEST”** olarak işaretlenmiş satıcı bilgileri ve kargo ücreti yazılır. Geliştirme veritabanına dokunulmaz.

> Not: Proje klasörünün yolunda “İ” gibi Türkçe büyük harfler varsa ESLint'in `ignores` kuralları bir karakter kayabiliyor (ESLint hatası). Bu nedenle `npm run lint` yalnızca kaynak klasörlerini tarar.

---

## 7. Klasör yapısı

```
prisma/            şema, migration'lar, tohum verisi (seed-data/)
scripts/           görsel hazırlama, yönetici oluşturma, E2E veritabanı hazırlama
src/app/(site)/    vitrin: ana sayfa, katalog, ürün, sepet, ödeme, hesap, blog, B2B, yasal sayfalar
src/app/yonetim/   yönetim paneli (her sayfa ve her işlem sunucu tarafında yetki kontrolü yapar)
src/app/api/       ödeme bildirimleri, arama, dışa aktarma, cron, medya
src/app/actions/   Server Action'lar (form işlemleri; doğrulama zod ile sunucuda)
src/lib/           iş kuralları: fiyatlama, sepet, sipariş, stok, ödeme, güvenlik, SEO
src/components/    arayüz bileşenleri
tests/             unit, integration (Vitest) ve e2e (Playwright)
```
