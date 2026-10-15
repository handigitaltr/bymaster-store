// Sayfa içerikleri. Yasal metinler TASLAK olarak eklenir: işletme bilgileri site ayarlarından
// otomatik doldurulur; yayına almadan önce hukuki danışmanınızla kontrol edilmelidir.

export type SeedPage = {
  slug: string;
  title: string;
  kind: "INFO" | "LEGAL";
  status: "DRAFT" | "PUBLISHED";
  seoDescription?: string;
  content: string;
};

export const pages: SeedPage[] = [
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
    kind: "INFO",
    status: "PUBLISHED",
    seoDescription:
      "ByMaster Professional Pastry Products: waffle sosları, çikolata bazı, süslemeler ve evde tatlı kitleriyle profesyonel ve ev mutfakları için pastacılık ürünleri.",
    content: `## Profesyonel mutfaktan ev mutfağına

ByMaster, "Professional Pastry Products" yaklaşımıyla waffle, krep, pankek ve tatlı sunumlarına yönelik ürünler sunan bir pastacılık ürünleri markasıdır. Kataloğumuz waffle soslarından çikolata bazına, pirinç patlaklarından krep kırıklarına ve evde tatlı kitlerine uzanır.

## Profesyoneller için

Kafeler, pastaneler, restoranlar ve oteller için ürünlerimizi yoğun kullanıma uygun ambalajlarda sunuyoruz: soslar 10 kg kovada, krep kırıkları 2,5 kg, pirinç patlakları ve şekerlemeler 1 kg paketlerde. Toplu alım ihtiyaçlarınız için teklif talebi oluşturabilirsiniz.

## Ev mutfağı için

Evde tatlı hazırlamayı sevenler için Churros Box ve Pankek Box gibi kitler, temel malzemeleri tek kutuda bir araya getirir.

## Yaklaşımımız

Sunum, bir tatlının ilk izlenimidir. Bu nedenle ürünlerimizin yanında tarifler, sunum fikirleri ve profesyonel mutfak rehberleriyle de yanınızda olmayı amaçlıyoruz.`,
  },
  {
    slug: "kargo-ve-teslimat",
    title: "Kargo ve Teslimat",
    kind: "INFO",
    status: "DRAFT",
    seoDescription: "ByMaster sipariş, kargo ücreti, gönderim süresi ve teslimat bilgileri.",
    content: `## Kargo ücreti

Standart kargo ücreti: {{KARGO_UCRETI}}

{{UCRETSIZ_KARGO_ESIGI}}

Evde Tatlı Kitleri'nde kargo ücretsizdir. Sepetinizde kitlerin yanında başka ürünler de bulunuyorsa standart kargo koşulları uygulanır.

## Gönderim süresi

{{GONDERIM_SURESI}}

## Kargo firması

Siparişleriniz {{KARGO_FIRMASI}} ile gönderilir. Siparişiniz kargoya verildiğinde takip numarası e-posta ile iletilir ve sipariş detayında görüntülenir.

## Teslimat

Teslimat sırasında paketi kontrol etmenizi, hasarlı paketleri teslim almadan kargo görevlisine tutanak tutturmanızı öneririz.`,
  },
  {
    slug: "on-bilgilendirme-formu",
    title: "Ön Bilgilendirme Formu",
    kind: "LEGAL",
    status: "DRAFT",
    content: `## 1. Satıcı bilgileri

- **Unvan:** {{SATICI_UNVAN}}
- **Adres:** {{SATICI_ADRES}}
- **Telefon:** {{SATICI_TELEFON}}
- **E-posta:** {{SATICI_EPOSTA}}
- **MERSİS no:** {{SATICI_MERSIS}}
- **Vergi dairesi / no:** {{SATICI_VERGI_DAIRESI}} / {{SATICI_VERGI_NO}}
- **KEP adresi:** {{SATICI_KEP}}
- **İnternet sitesi:** {{SITE_ADRESI}}

## 2. Alıcı bilgileri

- **Ad soyad:** {{ALICI_AD}}
- **E-posta:** {{ALICI_EPOSTA}}
- **Telefon:** {{ALICI_TELEFON}}
- **Teslimat adresi:** {{TESLIMAT_ADRESI}}
- **Fatura bilgileri:** {{FATURA_BILGISI}}

## 3. Sözleşme konusu ürünler ve fiyatlar

{{URUN_TABLOSU}}

- **Ara toplam (KDV dahil):** {{ARA_TOPLAM}}
- **İndirim:** {{INDIRIM}}
- **Kargo:** {{KARGO}}
- **Toplam ödenecek tutar (vergiler dahil):** {{TOPLAM}}
- **Ödeme yöntemi:** {{ODEME_YONTEMI}}

Ürünlerin temel nitelikleri ilgili ürün sayfalarında belirtildiği gibidir.

## 4. Teslimat

Ürünler alıcının belirttiği teslimat adresine kargo yoluyla teslim edilir. Teslimat süresi, siparişin onaylanmasından itibaren yasal süre olan 30 günü aşamaz.

## 5. Cayma hakkı

Alıcı, malın kendisine veya gösterdiği üçüncü kişiye tesliminden itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin ve cezai şart ödemeksizin sözleşmeden cayma hakkına sahiptir. Cayma hakkının kullanılması için bu süre içinde satıcıya yukarıdaki iletişim kanallarından açık bir bildirimde bulunulması yeterlidir.

Mesafeli Sözleşmeler Yönetmeliği'nin 15. maddesi uyarınca; çabuk bozulabilen veya son kullanma tarihi geçebilecek malların teslimine ilişkin sözleşmelerde ve tesliminden sonra ambalaj, bant, mühür, paket gibi koruyucu unsurları açılmış olan mallardan iadesi sağlık ve hijyen açısından uygun olmayanların teslimine ilişkin sözleşmelerde cayma hakkı kullanılamaz.

Cayma hakkının kullanılması hâlinde satıcı, cayma bildiriminin kendisine ulaştığı tarihten itibaren 14 gün içinde, teslimat masrafları dahil tahsil edilen tüm ödemeleri alıcının ödeme yaptığı araca uygun şekilde iade eder. Alıcı, cayma bildirimini yönelttiği tarihten itibaren 10 gün içinde malı satıcıya geri gönderir.

## 6. Şikâyet ve itiraz

Alıcı, şikâyet ve itirazlarını yukarıdaki iletişim bilgileri aracılığıyla satıcıya iletebilir. Uyuşmazlıklarda Ticaret Bakanlığınca her yıl belirlenen parasal sınırlar dahilinde alıcının veya satıcının yerleşim yerindeki Tüketici Hakem Heyetleri ile Tüketici Mahkemeleri yetkilidir.

Bu form {{TARIH}} tarihinde, {{SIPARIS_NO}} numaralı sipariş için elektronik ortamda düzenlenmiştir.`,
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Mesafeli Satış Sözleşmesi",
    kind: "LEGAL",
    status: "DRAFT",
    content: `## Madde 1 — Taraflar

**Satıcı:** {{SATICI_UNVAN}} · Adres: {{SATICI_ADRES}} · Telefon: {{SATICI_TELEFON}} · E-posta: {{SATICI_EPOSTA}} · MERSİS: {{SATICI_MERSIS}} · Vergi dairesi / no: {{SATICI_VERGI_DAIRESI}} / {{SATICI_VERGI_NO}}

**Alıcı:** {{ALICI_AD}} · E-posta: {{ALICI_EPOSTA}} · Telefon: {{ALICI_TELEFON}} · Teslimat adresi: {{TESLIMAT_ADRESI}} · Fatura bilgileri: {{FATURA_BILGISI}}

## Madde 2 — Konu

İşbu sözleşmenin konusu, alıcının {{SITE_ADRESI}} internet sitesi üzerinden elektronik ortamda siparişini verdiği, aşağıda nitelikleri ve satış fiyatı belirtilen ürünlerin satışı ve teslimine ilişkin olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin belirlenmesidir.

## Madde 3 — Ürünler ve bedel

{{URUN_TABLOSU}}

Ara toplam: {{ARA_TOPLAM}} · İndirim: {{INDIRIM}} · Kargo: {{KARGO}} · **Toplam: {{TOPLAM}}** (vergiler dahil)

Ödeme yöntemi: {{ODEME_YONTEMI}}

## Madde 4 — Teslimat

4.1. Ürünler alıcının belirttiği adrese kargo ile teslim edilir. Teslimat, siparişin onaylanmasından itibaren en geç 30 gün içinde yapılır.

4.2. Alıcı, teslim aldığı ürünü kontrol etmeli; hasarlı paketleri teslim almamalı ve kargo görevlisine tutanak tutturmalıdır.

## Madde 5 — Cayma hakkı

5.1. Alıcı, ürünün teslim tarihinden itibaren 14 gün içinde cayma hakkını kullanabilir.

5.2. Çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünler ile tesliminden sonra ambalajı açılmış olup iadesi sağlık ve hijyen açısından uygun olmayan ürünlerde cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md. 15).

5.3. Cayma bildiriminin satıcıya ulaşmasından itibaren 14 gün içinde ödeme, alıcının kullandığı ödeme aracına uygun şekilde iade edilir.

## Madde 6 — Genel hükümler

6.1. Alıcı, ürünlerin temel nitelikleri, satış fiyatı, ödeme şekli ve teslimata ilişkin ön bilgileri okuyup bilgi sahibi olduğunu ve elektronik ortamda onay verdiğini kabul eder.

6.2. Satıcı, sipariş konusu ürünün tedarik edilememesi hâlinde durumu alıcıya bildirir ve tahsil edilen bedeli 14 gün içinde iade eder.

6.3. Ayıplı mal durumunda alıcı, 6502 sayılı Kanun'da düzenlenen seçimlik haklarını kullanabilir.

## Madde 7 — Uyuşmazlıkların çözümü

İşbu sözleşmeden doğan uyuşmazlıklarda Ticaret Bakanlığınca ilan edilen parasal sınırlar dahilinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.

## Madde 8 — Yürürlük

Alıcı, siparişi onaylamakla işbu sözleşmenin tüm koşullarını kabul etmiş sayılır. Sözleşme {{TARIH}} tarihinde, {{SIPARIS_NO}} numaralı sipariş için elektronik ortamda kurulmuştur.`,
  },
  {
    slug: "kvkk-aydinlatma-metni",
    title: "KVKK Aydınlatma Metni",
    kind: "LEGAL",
    status: "DRAFT",
    content: `{{SATICI_UNVAN}} ("Şirket") olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan çerçevede işlemekteyiz.

## İşlenen kişisel veriler

- **Kimlik ve iletişim:** ad soyad, e-posta adresi, telefon numarası
- **Teslimat ve fatura:** teslimat ve fatura adresi; kurumsal faturalarda şirket unvanı, vergi dairesi ve vergi numarası
- **Müşteri işlem:** sipariş geçmişi, sepet içeriği, talep, şikâyet ve teklif talepleri
- **İşlem güvenliği:** oturum kayıtları, IP adresinin geri döndürülemez özet değeri, tarayıcı bilgisi
- **Pazarlama:** yalnızca açık rızanız bulunması hâlinde e-bülten ve kampanya iletişimi tercihleri

Kart bilgileriniz Şirket sistemlerinde saklanmaz; ödemeler lisanslı ödeme kuruluşunun altyapısı üzerinden gerçekleştirilir.

## İşleme amaçları

Siparişlerin alınması, ödeme ve teslimat süreçlerinin yürütülmesi; fatura düzenlenmesi; müşteri hizmetleri ve iade süreçlerinin yönetimi; toplu alım tekliflerinin değerlendirilmesi; bilgi güvenliğinin sağlanması; yasal yükümlülüklerin yerine getirilmesi ve açık rızanız bulunması hâlinde ticari elektronik ileti gönderilmesi.

## Hukuki sebepler

KVKK md. 5/2 kapsamında sözleşmenin kurulması ve ifası, hukuki yükümlülüğün yerine getirilmesi, bir hakkın tesisi ve korunması ile meşru menfaat; pazarlama iletişimi için md. 5/1 kapsamında açık rıza.

## Aktarım

Kişisel verileriniz yukarıdaki amaçlarla sınırlı olarak kargo ve lojistik firmalarına, ödeme kuruluşlarına, bilgi teknolojileri hizmet sağlayıcılarına (barındırma, e-posta), mali müşavirlik hizmeti alınan kişilere ve talep hâlinde yetkili kamu kurum ve kuruluşlarına aktarılabilir.

## Toplama yöntemi

Kişisel verileriniz internet sitemizdeki formlar, üyelik ve sipariş süreçleri ile e-posta ve telefon kanalları aracılığıyla elektronik ortamda toplanır.

## Haklarınız

KVKK md. 11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini, silinmesini veya yok edilmesini isteme, otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.

Başvurularınızı {{SATICI_ADRES}} adresine yazılı olarak, {{SATICI_KEP}} KEP adresine veya {{SATICI_EPOSTA}} e-posta adresine iletebilirsiniz.`,
  },
  {
    slug: "gizlilik-politikasi",
    title: "Gizlilik Politikası",
    kind: "LEGAL",
    status: "DRAFT",
    content: `Bu politika, {{SITE_ADRESI}} adresindeki internet sitesini kullanırken kişisel verilerinizin nasıl korunduğunu açıklar. Kişisel verilerin işlenmesine ilişkin ayrıntılı bilgi için KVKK Aydınlatma Metni'ni inceleyebilirsiniz.

## Güvenlik önlemleri

- Site trafiği şifreli bağlantı (HTTPS) üzerinden iletilir.
- Parolalar geri döndürülemez şekilde özetlenerek saklanır.
- Kart bilgileri sistemlerimizde saklanmaz; ödemeler ödeme kuruluşunun güvenli sayfasında alınır.
- Yönetim paneline erişim yetkilendirilmiş kullanıcılarla sınırlıdır ve yönetim işlemleri kayıt altına alınır.

## Çerezler ve yerel depolama

Sitemizde zorunlu çerezler ile yalnızca onay vermeniz hâlinde analiz ve pazarlama çerezleri kullanılır. Favori ve karşılaştırma listeleriniz yalnızca tarayıcınızda tutulur. Ayrıntılar için Çerez Politikası'na bakabilirsiniz.

## Ticari elektronik iletiler

Kampanya ve bülten e-postaları yalnızca onayınız ile gönderilir. Her e-postadaki bağlantıdan dilediğiniz zaman ayrılabilirsiniz.

## İletişim

Sorularınız için {{SATICI_EPOSTA}} adresinden bize ulaşabilirsiniz.`,
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    kind: "LEGAL",
    status: "DRAFT",
    content: `Bu politika, {{SITE_ADRESI}} adresinde kullanılan çerezleri açıklar.

## Zorunlu çerezler

Sitenin çalışması için gereklidir ve onayınıza tabi değildir:

| Çerez | Amaç | Süre |
|---|---|---|
| bm_session | Giriş yaptığınızda oturumunuzu güvenli şekilde sürdürür | En fazla 30 gün |
| bm_cart | Sepetinizi saklar | 60 gün |
| bm_orders | Misafir siparişlerinizi görüntüleyebilmeniz için kullanılır | 30 gün |
| bm_consent | Çerez tercihlerinizi hatırlar | 12 ay |

## Analiz çerezleri (onaya tabi)

Yalnızca onay vermeniz hâlinde, site kullanımını anlamak amacıyla Google Analytics çerezleri kullanılabilir.

## Pazarlama çerezleri (onaya tabi)

Yalnızca onay vermeniz hâlinde, reklam performansını ölçmek amacıyla Meta Pixel çerezleri kullanılabilir.

## Tercihlerinizi yönetme

Çerez tercihlerinizi sayfanın altındaki "Çerez tercihleri" bağlantısından dilediğiniz zaman değiştirebilirsiniz. Tarayıcı ayarlarınızdan da çerezleri silebilir veya engelleyebilirsiniz.`,
  },
  {
    slug: "iade-ve-iptal",
    title: "İade ve İptal Koşulları",
    kind: "LEGAL",
    status: "DRAFT",
    content: `## Sipariş iptali

Kargoya verilmemiş siparişlerinizin iptali için sipariş numaranızla {{SATICI_EPOSTA}} adresinden veya {{SATICI_TELEFON}} numarasından bize ulaşabilirsiniz. Ödemesi alınmış siparişlerde ücret iadesi, ödeme yaptığınız araca yapılır.

## Cayma hakkı

Ürünü teslim aldığınız tarihten itibaren 14 gün içinde cayma hakkınızı kullanabilirsiniz. Ancak gıda ürünlerinde; ambalajı, bandı veya mührü açılmış ve iadesi sağlık ve hijyen açısından uygun olmayan ürünler ile çabuk bozulabilen veya son kullanma tarihi geçebilecek ürünlerde cayma hakkı kullanılamaz (Mesafeli Sözleşmeler Yönetmeliği md. 15).

## Hasarlı veya hatalı ürün

Ürününüz hasarlı, eksik ya da hatalı ulaştıysa, sipariş detay sayfasındaki "Sorun bildir" bağlantısından veya iletişim formundan bildirimde bulunun. Talebiniz incelenerek değişim veya iade süreci başlatılır.

## İade süreci

1. Talebinizi iletin.
2. Onaylanan talepler için gönderim bilgisi tarafınıza iletilir.
3. Ürün bize ulaştıktan sonra en geç 14 gün içinde ücret iadesi yapılır.`,
  },
];

export const faqItems = [
  {
    group: "Sipariş",
    question: "Üye olmadan sipariş verebilir miyim?",
    answer:
      "Evet. Ödeme adımında misafir olarak devam edebilirsiniz. Siparişinizi daha sonra Sipariş Takibi sayfasından sipariş numaranız ve e-posta adresinizle görüntüleyebilirsiniz.",
  },
  {
    group: "Sipariş",
    question: "Siparişimi nasıl takip ederim?",
    answer:
      "Üyeyseniz Hesabım > Siparişlerim bölümünden, misafir olarak sipariş verdiyseniz Sipariş Takibi sayfasından sipariş numaranız ve e-posta adresinizle siparişinizin durumunu görebilirsiniz. Kargoya verilen siparişlerde takip numarası da burada yer alır.",
  },
  {
    group: "Sipariş",
    question: "İndirim kodumu nasıl kullanırım?",
    answer: "Sepet sayfasındaki “İndirim kodu” alanına kodunuzu yazıp uygulayın. Kodun koşulları sağlanıyorsa indirim sepet özetine yansır.",
  },
  {
    group: "Sipariş",
    question: "Önceki siparişimi tekrar verebilir miyim?",
    answer:
      "Evet. Üyeyseniz Hesabım > Siparişlerim bölümünde ilgili siparişin detayındaki “Tekrar sipariş ver” düğmesiyle ürünleri güncel fiyat ve stok durumuyla sepetinize ekleyebilirsiniz.",
  },
  {
    group: "Ürünler",
    question: "Ürünlerin içerik ve alerjen bilgilerine nereden ulaşabilirim?",
    answer:
      "Her ürün sayfasında “İçindekiler” ve “Alerjen bilgisi” bölümleri bulunur. Henüz eklenmemiş bilgiler için satın almadan önce iletişim formundan bize ulaşabilirsiniz.",
  },
  {
    group: "Ürünler",
    question: "10 kg kova ürünler kimler için uygun?",
    answer:
      "Kova ambalajlı soslar, sosu yoğun kullanan kafe, pastane ve restoranlar için sunulmaktadır. Evde kullanım için Evde Tatlı Kitleri'ne göz atabilirsiniz.",
  },
  {
    group: "Ürünler",
    question: "Stokta olmayan bir ürün geldiğinde haber alabilir miyim?",
    answer: "Evet. Ürün sayfasındaki “Gelince haber ver” alanına e-posta adresinizi bırakmanız yeterli.",
  },
  {
    group: "İşletmeler",
    question: "Toplu alım veya toptan fiyat için ne yapmalıyım?",
    answer:
      "Profesyonellere Özel sayfasındaki teklif formunu doldurarak ihtiyaç duyduğunuz ürün ve miktarları iletebilirsiniz. Talebiniz ekibimiz tarafından değerlendirilerek sizinle iletişime geçilir.",
  },
  {
    group: "İşletmeler",
    question: "Porsiyon başına maliyetimi nasıl hesaplarım?",
    answer:
      "Profesyonellere Özel sayfasındaki porsiyon hesaplayıcıya porsiyon sayınızı ve porsiyon başına kullandığınız miktarı girerek ihtiyaç duyacağınız ambalaj adedini ve yaklaşık malzeme maliyetini görebilirsiniz.",
  },
];

export const announcements = [
  { message: "Churros Box ve Pankek Box siparişlerinde kargo ücretsiz.", linkUrl: "/kategori/evde-tatli-kitleri", linkLabel: "Kutuları keşfet", sortOrder: 10 },
  { message: "İşletmeler için toplu alım teklifi alın.", linkUrl: "/profesyonel/teklif", linkLabel: "Teklif iste", sortOrder: 20 },
];
