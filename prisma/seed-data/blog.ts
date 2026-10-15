// Lezzet Günlüğü başlangıç içerikleri.
// Yazılar genel mutfak bilgisi ve sunum önerileri içerir; ürün bileşimi hakkında iddia içermez.
// [[urun:slug]] satırları, yazı içinde sepete eklenebilir ürün kartı olarak gösterilir.

export const blogCategories = [
  { slug: "tarifler", name: "Tarifler", description: "Adım adım tarifler ve hazırlık rehberleri.", sortOrder: 10 },
  { slug: "sunum-fikirleri", name: "Sunum Fikirleri", description: "Sos, süsleme ve tabak kurgusu üzerine ilham.", sortOrder: 20 },
  { slug: "profesyonel-mutfak", name: "Profesyonel Mutfak", description: "Kafe ve pastaneler için maliyet, porsiyon ve servis.", sortOrder: 30 },
  { slug: "rehberler", name: "Rehberler", description: "Ürünleri doğru kullanmanın püf noktaları.", sortOrder: 40 },
];

export type SeedPost = {
  slug: string;
  type: "ARTICLE" | "RECIPE" | "GUIDE";
  category: string;
  title: string;
  excerpt: string;
  cover: string;
  coverAlt: string;
  coverCredit: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  products: Array<{ slug: string; note?: string }>;
  daysAgo: number;
  recipeIngredients?: string;
  recipeSteps?: string;
  content: string;
};

export const posts: SeedPost[] = [
  {
    slug: "evde-waffle-nasil-yapilir",
    type: "RECIPE",
    category: "tarifler",
    title: "Evde Waffle Nasıl Yapılır? Çıtır Dış, Yumuşak İç İçin Adım Adım Rehber",
    excerpt:
      "Makinenin ısısından hamurun kıvamına, sos ve süslemenin sırasından servis anına kadar evde kafe kalitesinde waffle hazırlamanın püf noktaları.",
    cover: "/images/editorial/waffle-cilek.jpg",
    coverAlt: "Çilek ve çikolata sosuyla servis edilmiş waffle",
    coverCredit: "Fotoğraf: Unsplash",
    seoTitle: "Evde Waffle Nasıl Yapılır? Adım Adım Rehber",
    seoDescription:
      "Evde çıtır waffle için makine ısısı, hamur kıvamı, sos ve süsleme sırası. ByMaster Waffle Mix ile adım adım waffle rehberi.",
    tags: ["waffle", "tarif", "ev mutfağı"],
    products: [
      { slug: "waffle-mix-1-kg", note: "Ambalaj talimatındaki oranda" },
      { slug: "sutlu-waffle-sosu-10-kg", note: "Servis için" },
      { slug: "krep-kirigi-oreo-2-5-kg", note: "Süsleme için" },
      { slug: "pirinc-patlagi-metalik-karisik-1-kg", note: "Süsleme için" },
    ],
    daysAgo: 3,
    recipeIngredients:
      "ByMaster Waffle Mix (ambalaj talimatındaki oranda)\nAmbalaj talimatında belirtilen sıvı malzemeler\nByMaster Sütlü Waffle Sosu\nKrep kırığı veya pirinç patlağı (süsleme için)\nTaze meyve (isteğe bağlı)",
    recipeSteps:
      "Waffle makinesini tam ısıya gelene kadar önceden ısıtın.\nWaffle Mix'i ambalaj üzerindeki talimata göre hazırlayın; topaklanmaması için sıvıyı azar azar ekleyin.\nHamuru kalıbın ortasından başlayarak taşırmadan dökün ve kapağı kapatın.\nBuhar azalana kadar pişirin; kapağı erken açmayın.\nWaffle sıcakken sosu gezdirin, ardından çıtır süslemeleri ve meyveleri ekleyerek hemen servis edin.",
    content: `İyi bir waffle'ı unutulmaz kılan şey çoğu zaman tarifin kendisi değil, küçük ayrıntılardır: makinenin doğru ısıya gelmesi, hamurun kıvamı, sosun ve süslemenin hangi sırayla eklendiği. Bu rehberde, ByMaster Waffle Mix ile evde hazırlayacağınız waffle'ı bir adım öteye taşıyacak noktaları bir araya getirdik.

## 1. Makineyi önceden ısıtın

Waffle makinesi tam ısıya ulaşmadan dökülen hamur, dışı çıtırlaşmadan içten pişmeye başlar; sonuç yumuşak ve soluk bir waffle olur. Makinenizin ısı göstergesi yanana kadar bekleyin ve ilk waffle'ı her zaman bir "deneme" olarak düşünün.

## 2. Hamuru ambalaj talimatına göre hazırlayın

Karışım ile sıvı arasındaki oran, hamurun kıvamını doğrudan belirler. Bu nedenle Waffle Mix'i ambalaj üzerindeki hazırlama talimatına göre hazırlayın; göz kararı ekleme yapmaktan kaçının. Topaklanma olmaması için sıvıyı azar azar ekleyip karıştırın ve hamuru gereğinden fazla çırpmayın.

[[urun:waffle-mix-1-kg]]

## 3. Kalıbı doğru miktarda doldurun

Aşırı dolum hamurun kenarlardan taşmasına ve waffle'ın eşit pişmemesine yol açar. Kalıbın ortasından başlayarak hamuru dökün; kapak kapandığında hamurun yayılacağını hesaba katın.

## 4. Sabırlı olun

Pişme süresi makineden makineye değişir. Kapaktan çıkan buhar azaldığında waffle genellikle hazırdır. Kapağı erken açmak waffle'ın ikiye ayrılmasına neden olabilir.

## 5. Sos ve süslemeyi doğru sırayla ekleyin

Waffle'ı makineden aldıktan hemen sonra sosu gezdirin; sıcak yüzey sosun yayılmasını kolaylaştırır. Krep kırığı ve pirinç patlağı gibi çıtır süslemeleri ise en son, servis anında ekleyin. Böylece süslemeler sosla temas ettiği hâlde çıtırlığını korur.

[[urun:sutlu-waffle-sosu-10-kg]]

## 6. Meyveyi en sona bırakın

Çilek, muz, kivi ya da yaban mersini gibi taze meyveleri servis anında doğrayın. Önceden doğranan meyveler suyunu bırakarak waffle'ın çıtırlığını azaltır.

## Kısa kontrol listesi

- Makine tam ısıda mı?
- Hamur ambalaj talimatındaki oranda mı hazırlandı?
- Sos, waffle sıcakken mi eklendi?
- Çıtır süslemeler servis anında mı serpildi?

Evde pratik bir başlangıç için temel malzemeleri tek kutuda bulabileceğiniz Evde Tatlı Kitleri'ne de göz atabilirsiniz.`,
  },
  {
    slug: "waffle-soslari-arasindaki-farklar",
    type: "ARTICLE",
    category: "sunum-fikirleri",
    title: "Waffle Sosları Arasındaki Farklar: Hangi Sos Hangi Sunuma Yakışır?",
    excerpt:
      "Sütlüden bitter'a, Antep fıstıklıdan Lotus'a: waffle soslarını lezzet ailelerine göre tanıyın ve menünüzde doğru eşleşmeleri kurun.",
    cover: "/images/editorial/waffle-cikolata-sos.jpg",
    coverAlt: "Çikolata sosu gezdirilmiş katlı waffle",
    coverCredit: "Fotoğraf: Unsplash",
    seoTitle: "Waffle Sosları Arasındaki Farklar ve Eşleştirme Rehberi",
    seoDescription:
      "Sütlü, bitter, beyaz, Antep fıstıklı, frambuazlı ve Lotus waffle soslarını lezzet ailelerine göre tanıyın; sunum ve süsleme eşleştirme tablosu.",
    tags: ["waffle sosları", "sunum", "eşleştirme"],
    products: [
      { slug: "sutlu-waffle-sosu-10-kg" },
      { slug: "bitter-waffle-sosu-10-kg" },
      { slug: "antep-fistikli-waffle-sosu-10-kg" },
      { slug: "lotus-waffle-sosu-10-kg" },
    ],
    daysAgo: 8,
    content: `Bir waffle menüsü tasarlarken sos seçimi, sunumun karakterini belirleyen ilk karardır. ByMaster'ın 10 kg kova ambalajdaki waffle sosları dört lezzet ailesinde toplanıyor. Aşağıdaki rehber, sosları bu ailelere göre tanımanıza ve sunumlarınızda dengeli eşleşmeler kurmanıza yardımcı olmak için hazırlandı.

## Çikolata ailesi: Sütlü, Bitter ve Premium Çikolata Bazı

**Sütlü** sos, geniş bir kitleye hitap eden klasik bir tercihtir; meyveyle ve renkli süslemelerle kolayca uyum sağlar. **Bitter** sos ise daha koyu ve yoğun bir çikolata karakteri arayanlar için menüye derinlik katar. İkisini aynı tabakta ince çizgiler hâlinde birlikte kullanmak, görsel olarak da güçlü bir kontrast oluşturur.

[[urun:bitter-waffle-sosu-10-kg]]

**Premium Çikolata Bazı** ise çikolata ağırlıklı sunumlar kurgulayan işletmeler için katalogda ayrı bir seçenek olarak yer alıyor.

## Kuruyemiş ailesi: Antep Fıstıklı ve Beyaz

**Antep fıstıklı** sos, rengiyle bile sunumda fark yaratır; sade bir waffle'ı tek başına taşıyabilir. Etiketinde "fındık aromalı beyaz sos" olarak tanımlanan **Beyaz** sos ise hem tek başına hem de koyu soslarla birlikte, renk kontrastı kurmak için kullanılabilir.

[[urun:antep-fistikli-waffle-sosu-10-kg]]

## Meyve ailesi: Frambuazlı

**Frambuazlı** sos, çikolatalı sunumlara ferah bir karşılık sunar. Beyaz sos ve taze meyvelerle birlikte kullanıldığında görsel açıdan dikkat çekici tabaklar ortaya çıkar.

## Bisküvi ailesi: Lotus

**Lotus** sos, bisküvi lezzetini sevenler için menüde ayrı bir başlık açar. Karamelli krep kırığıyla birlikte kullanıldığında doku ve lezzet bütünlüğü sağlar.

## Eşleştirme için pratik bir tablo

| Sos | Öne çıkan eşleşme | Süsleme önerisi |
|---|---|---|
| Sütlü | Muz, çilek | Karışık pirinç patlağı, Minibon |
| Bitter | Frambuazlı sos, kırmızı meyveler | Oreo krep kırığı |
| Beyaz | Bitter veya frambuazlı sos | Çilekli krep kırığı |
| Antep Fıstıklı | Sade waffle, dondurma | Antep fıstıklı krep kırığı |
| Frambuazlı | Beyaz sos | Sade krep kırığı |
| Lotus | Dondurma | Karamelli krep kırığı |

Bu tablo bir başlangıç noktasıdır; en iyi eşleşmeyi kendi menünüzde, misafirlerinizin tercihleriyle bulacaksınız. Farklı kombinasyonları denemek için Waffle & Tatlı Dünyası sayfamızdaki sunum laboratuvarını kullanabilirsiniz.`,
  },
  {
    slug: "lotus-sosuyla-sunum-fikirleri",
    type: "ARTICLE",
    category: "sunum-fikirleri",
    title: "Lotus Sosuyla 5 Sunum Fikri",
    excerpt: "Waffle'dan dondurma kupasına, Lotus sosunu menünüzde farklı biçimlerde değerlendirmenin beş kolay yolu.",
    cover: "/images/editorial/biskuvili-dondurma.jpg",
    coverAlt: "Bisküvi kırıntılı katmanlı dondurma bardağı ve bisküvi",
    coverCredit: "Fotoğraf: Unsplash",
    seoTitle: "Lotus Sosuyla 5 Sunum Fikri",
    seoDescription:
      "Lotus waffle sosunu waffle, dondurma kupası, katmanlı bardak tatlısı, pankek ve churros sunumlarında kullanmanın beş yolu.",
    tags: ["lotus", "sunum", "dondurma"],
    products: [
      { slug: "lotus-waffle-sosu-10-kg" },
      { slug: "krep-kirigi-karamel-2-5-kg", note: "Çıtır doku için" },
      { slug: "krep-kirigi-sade-2-5-kg" },
    ],
    daysAgo: 13,
    content: `Bisküvi lezzeti, tatlı menülerinin en sevilen başlıklarından biri. ByMaster Lotus Waffle Sosu'nu yalnızca waffle'da değil, farklı sunumlarda da kullanarak menünüze tutarlı bir "Lotus serisi" kurabilirsiniz.

[[urun:lotus-waffle-sosu-10-kg]]

## 1. Klasik Lotus waffle

Sıcak waffle'ın üzerine sosu geniş bir şerit hâlinde dökün, ardından karamelli krep kırığıyla tamamlayın. Kırığı servis anında ekleyerek çıtırlığını koruyun.

## 2. Dondurma kupası

Bir top vanilyalı dondurmanın üzerine sosu ince bir çizgi hâlinde gezdirin. Bardağın dibine bir kat krep kırığı koymak, kaşık her daldığında farklı bir doku sunar.

## 3. Katmanlı bardak tatlısı

Krep kırığı, sos ve kremayı şeffaf bir bardakta katmanlar hâlinde dizin. Şeffaf sunum, katmanları görünür kılarak vitrinde dikkat çeker.

## 4. Pankek kulesi

Üst üste dizilen pankeklerin arasına ince bir kat sos sürün, en üste ise kırık serpiştirin. Pankek hazırlığına dair pratik bilgiler için evde pankek ve churros rehberimize göz atabilirsiniz.

## 5. Paylaşmalık churros tabağı

Churros'un yanına küçük bir kâse Lotus sos koyarak klasik çikolata sosuna alternatif bir dip seçeneği sunun. Aynı tabakta iki farklı sos, paylaşımlı sunumlarda tercih özgürlüğü tanır.

[[urun:krep-kirigi-karamel-2-5-kg]]

## Sunum ipucu

Lotus serisinde renk paleti zaten sıcak tonlardadır. Tabağa kontrast katmak için beyaz bir zemin, koyu bir kahve fincanı ya da az miktarda beyaz sos kullanabilirsiniz.`,
  },
  {
    slug: "antep-fistikli-sosla-modern-tatli-sunumlari",
    type: "ARTICLE",
    category: "sunum-fikirleri",
    title: "Antep Fıstıklı Sosla Modern Tatlı Sunumları",
    excerpt:
      "Yeşilin tonlarıyla sade ama etkileyici tabaklar: Antep fıstıklı sosu waffle, dondurma ve paylaşmalık tatlılarda kullanmanın modern yolları.",
    cover: "/images/editorial/antep-tatli.jpg",
    coverAlt: "Antep fıstığı tozu ile süslenmiş tatlı ve fıstıklar",
    coverCredit: "Fotoğraf: Unsplash",
    seoTitle: "Antep Fıstıklı Sosla Modern Tatlı Sunumları",
    seoDescription:
      "Antep fıstıklı waffle sosuyla tek renkli sunum, sıcak–soğuk dengesi, beyaz–yeşil kontrastı ve paylaşmalık tatlı fikirleri.",
    tags: ["antep fıstığı", "sunum", "modern tatlı"],
    products: [
      { slug: "antep-fistikli-waffle-sosu-10-kg" },
      { slug: "krep-kirigi-antep-fistik-2-5-kg" },
      { slug: "pirinc-patlagi-metalik-yesil-1-kg" },
    ],
    daysAgo: 19,
    content: `Antep fıstığı, Türk tatlı kültürünün en güçlü imzalarından biri. ByMaster Antep Fıstıklı Waffle Sosu, bu imzayı waffle ve modern tatlı sunumlarına taşımak isteyen işletmeler için 10 kg kova ambalajda sunuluyor.

[[urun:antep-fistikli-waffle-sosu-10-kg]]

## Az ama öz: tek renkli sunum

Modern sunumlarda "az malzeme, net kontrast" ilkesi öne çıkar. Sade bir waffle, üzerinde geniş bir şerit Antep fıstıklı sos ve az miktarda Antep fıstıklı krep kırığı: tabak, rengiyle kendini anlatır.

## Sıcak–soğuk dengesi

Sıcak waffle'ın yanında bir top dondurma ve üzerine gezdirilmiş sos, hem sıcaklık hem doku kontrastı yaratır. Dondurmanın erimeye başladığı ilk dakikalar, sunumun en fotojenik anıdır; servisi geciktirmeyin.

## Beyaz ile yeşil

Beyaz sos ve Antep fıstıklı sosu aynı tabakta, birbirine paralel çizgiler hâlinde kullanmak sade bir görsel düzen sağlar. Süsleme olarak yeşil ya da sedef beyaz pirinç patlağı, renk paletini bozmadan parlaklık katar.

[[urun:krep-kirigi-antep-fistik-2-5-kg]]

## Paylaşmalık sunumlar

Bubble waffle, krep ruloları veya churros gibi elle yenen tatlılarda sosu ayrı bir kâsede sunmak, misafirin istediği kadar kullanmasına imkân tanır ve tabağın daha uzun süre düzgün görünmesini sağlar.

## Fotoğraf için küçük not

Yeşil tonlar doğal ışıkta ve açık renkli zeminlerde en iyi sonucu verir. Koyu tabaklar ise sosun parlaklığını daha belirgin gösterir.`,
  },
  {
    slug: "krep-kiriklari-ve-pirinc-patlaklari-nasil-kullanilir",
    type: "GUIDE",
    category: "rehberler",
    title: "Krep Kırıkları ve Pirinç Patlakları Nasıl Kullanılır?",
    excerpt: "Doku, renk ve zamanlama: çıtır süslemeleri waffle, dondurma ve pastalarda doğru kullanmak için pratik bir rehber.",
    cover: "/images/editorial/kurabiyeli-waffle.jpg",
    coverAlt: "Kurabiye ve çikolata sosuyla süslenmiş waffle",
    coverCredit: "Fotoğraf: Unsplash",
    seoTitle: "Krep Kırıkları ve Pirinç Patlakları Nasıl Kullanılır?",
    seoDescription:
      "Krep kırığı ve pirinç patlağını waffle, dondurma ve pastalarda kullanma rehberi: zamanlama, renk seçimi ve saklama önerileri.",
    tags: ["krep kırığı", "pirinç patlağı", "süsleme"],
    products: [
      { slug: "krep-kirigi-oreo-2-5-kg" },
      { slug: "krep-kirigi-cilek-2-5-kg" },
      { slug: "pirinc-patlagi-metalik-karisik-1-kg" },
      { slug: "pirinc-patlagi-metalik-kirmizi-1-kg" },
    ],
    daysAgo: 26,
    content: `Süslemeler bir tatlının son dokunuşu gibi görünse de sunumun dokusunu ve rengini belirleyen asıl unsurlardır. ByMaster kataloğundaki krep kırıkları 2,5 kg, pirinç patlakları ise 1 kg paketlerde sunuluyor. Peki bunları en iyi nasıl kullanırsınız?

## Krep kırığı: dokunun kahramanı

Krep kırıkları ince ve çıtır yapılarıyla sosa doku katar. Sade, çilekli, karamelli, Oreo ve Antep fıstıklı seçenekler, sosla aynı lezzet ailesinde ya da bilinçli bir kontrast oluşturacak şekilde eşleştirilebilir.

[[urun:krep-kirigi-oreo-2-5-kg]]

**Zamanlama önemli:** Krep kırığı nemle temas ettikçe çıtırlığını kaybeder. Bu nedenle sosun üzerine, servis anında ekleyin. Hazırlık sırasında kırıkları açıkta bırakmayın; ambalajı kullandıktan sonra ağzını sıkıca kapatın.

## Pirinç patlağı: rengin dili

Pirinç patlakları küçük ve yuvarlak formlarıyla tabağa ritim ve renk katar. Metalik renkler özel gün sunumlarında, bitter ve sütlü seçenekler ise daha klasik tabaklarda tercih edilebilir.

[[urun:pirinc-patlagi-metalik-karisik-1-kg]]

### Renk seçimi için üç öneri

1. **Tek renk, tek vurgu:** Sade bir sunumda tek renkli pirinç patlağı, tabağa net bir odak noktası kazandırır.
2. **Lezzetle uyumlu renk:** Frambuazlı sosla frambuaz, Antep fıstıklı sosla yeşil tonlar doğal bir uyum yaratır.
3. **Kutlama sunumları:** Karışık metalik renkler, doğum günü ve özel gün tabaklarında neşeli bir görünüm sağlar.

## Birlikte kullanım

Krep kırığı ile pirinç patlağını aynı tabakta kullanmak hem doku hem renk katmanı oluşturur. Bu durumda miktarı dengeli tutun: süsleme, sosu ve ana tatlıyı örtmemeli, tamamlamalıdır.

## Pasta ve kekte

Her iki süsleme de pasta ve kek kenarlarında, krema üzerinde dekoratif bir bitiş sağlar. Kremanın yüzeyi hâlâ hafif nemliyken uygulanan süslemeler daha iyi tutunur.`,
  },
  {
    slug: "kafe-menusu-maliyet-ve-porsiyon-planlamasi",
    type: "GUIDE",
    category: "profesyonel-mutfak",
    title: "Kafe Menüsü İçin Maliyet ve Porsiyon Planlaması",
    excerpt:
      "Bir porsiyonun gerçek maliyetini bilmek, doğru fiyatlamanın ilk adımı. Ambalaj fiyatından porsiyon maliyetine adım adım bir yöntem.",
    cover: "/images/editorial/profesyonel-bubble.jpg",
    coverAlt: "Vitrinde sergilenen süslemeli bubble waffle'lar",
    coverCredit: "Fotoğraf: Raymond Okoro / Unsplash",
    seoTitle: "Kafe Menüsü İçin Maliyet ve Porsiyon Planlaması",
    seoDescription:
      "Waffle ve tatlı menüsünde gram başına maliyet, porsiyon maliyeti ve haftalık stok ihtiyacını hesaplamanın adım adım yöntemi.",
    tags: ["maliyet", "porsiyon", "kafe işletmeciliği"],
    products: [
      { slug: "antep-fistikli-waffle-sosu-10-kg" },
      { slug: "sutlu-waffle-sosu-10-kg" },
      { slug: "waffle-mix-1-kg" },
    ],
    daysAgo: 33,
    content: `Tatlı menüsünde fiyatlandırma çoğu zaman sezgiyle yapılır; oysa her porsiyonun maliyetini bilmek hem kârlılığı hem de stok planlamasını netleştirir. Bu yazıda ambalaj fiyatından porsiyon maliyetine giden basit bir yöntemi paylaşıyoruz.

## Adım 1: Kendi porsiyon ölçünüzü belirleyin

Porsiyon başına kullanılan sos ve süsleme miktarı işletmeden işletmeye değişir. En sağlıklı yol, kendi sunumunuzu birkaç kez tartarak ortalama bir değer çıkarmaktır. Örneğin bir waffle'a kaç gram sos kullandığınızı mutfak terazisiyle ölçün ve not edin.

## Adım 2: Gram başına maliyeti hesaplayın

**Gram başına maliyet = Ambalaj fiyatı ÷ Ambalajın net gramajı**

Örnek: 10 kg (10.000 g) kova bir sosun fiyatı 3.100 TL ise gram başına maliyet 0,31 TL'dir.

## Adım 3: Porsiyon maliyetini bulun

**Porsiyon maliyeti = Gram başına maliyet × Porsiyon başına kullanım**

Yukarıdaki örnekte porsiyon başına 40 g sos kullandığınızı **varsayarsak** sos maliyeti 12,40 TL olur. Aynı hesabı süsleme, waffle hamuru ve servis malzemeleri (kâse, peçete vb.) için de yaparak porsiyonun toplam malzeme maliyetine ulaşabilirsiniz.

> Buradaki 40 g yalnızca hesaplamayı göstermek için seçilmiş bir örnektir; kendi ölçünüzü kullanın.

[[urun:antep-fistikli-waffle-sosu-10-kg]]

## Adım 4: Stok ihtiyacını planlayın

Haftalık porsiyon tahmininizi porsiyon başına kullanımla çarparak toplam ihtiyacı bulun, ardından ambalaj gramajına bölüp yukarı yuvarlayın. Örneğin haftada 500 porsiyon × 40 g = 20.000 g, yani iki adet 10 kg kova.

Bu hesapları hızlıca yapmak için Profesyonellere Özel sayfamızdaki **porsiyon hesaplayıcıyı** kullanabilirsiniz. Hesaplayıcı, seçtiğiniz ürünün güncel fiyatı ve ambalaj gramajıyla çalışır; porsiyon başına kullanım miktarını siz girersiniz.

## Adım 5: Fiyatı belirlerken unutulmaması gerekenler

Malzeme maliyeti, satış fiyatının yalnızca bir bileşenidir. İşçilik, enerji, kira, fire ve vergiler gibi kalemleri de hesaba katın. Fire oranını gerçekçi tahmin etmek için ilk haftalarda kullanılan miktarları düzenli olarak kaydedin.

## Toplu alım

Düzenli ve yüksek hacimli kullanımda ihtiyacınızı teklif formu üzerinden iletebilirsiniz. Talebiniz değerlendirilerek sizinle iletişime geçilir.`,
  },
  {
    slug: "profesyonel-waffle-sunumunda-sik-yapilan-hatalar",
    type: "ARTICLE",
    category: "profesyonel-mutfak",
    title: "Profesyonel Waffle Sunumunda Sık Yapılan 7 Hata",
    excerpt: "Isınmamış makineden erken eklenen süslemeye: waffle servisinin kalitesini düşüren yaygın hatalar ve kolay çözümleri.",
    cover: "/images/editorial/waffle-meyveli.jpg",
    coverAlt: "Muz, yaban mersini ve çikolatalı sosla servis edilen waffle",
    coverCredit: "Fotoğraf: Unsplash",
    seoTitle: "Profesyonel Waffle Sunumunda Sık Yapılan 7 Hata",
    seoDescription:
      "Waffle servisinde makine ısısı, hamur kıvamı, sos ve süsleme zamanlaması, porsiyon tutarlılığı ve saklama hataları ile çözümleri.",
    tags: ["waffle", "servis", "profesyonel"],
    products: [
      { slug: "waffle-mix-1-kg" },
      { slug: "frambuazli-waffle-sosu-10-kg" },
      { slug: "beyaz-waffle-sosu-10-kg" },
    ],
    daysAgo: 41,
    content: `Yoğun saatlerde küçük aksaklıklar, tabağın kalitesine doğrudan yansır. Aşağıda waffle servisinde sık karşılaşılan hataları ve pratik çözümlerini derledik.

## 1. Makineyi tam ısınmadan kullanmak

Isınmamış makine, dışı soluk ve yumuşak waffle'lar üretir. Servis başlamadan makinenin hazır olduğundan emin olun ve gün içinde ısı ayarını sabit tutun.

## 2. Hamuru göz kararı hazırlamak

Her seferinde farklı kıvamda hazırlanan hamur tutarsız sonuçlar verir. Karışımı ambalaj talimatındaki orana göre ve mümkünse tartarak hazırlayın.

[[urun:waffle-mix-1-kg]]

## 3. Sosu soğumuş waffle'a eklemek

Sos, sıcak yüzeyde daha kolay yayılır ve waffle'la bütünleşir. Waffle'ı bekletmeden soslayın.

## 4. Süslemeleri erken eklemek

Krep kırığı ve pirinç patlağı gibi çıtır süslemeler nemle temas ettikçe yumuşar. Süslemeleri servis anında, en son ekleyin.

## 5. Tabağı aşırı yüklemek

Fazla sos ve süsleme tatları birbirine karıştırır ve tabağı dağınık gösterir. Her tabakta bir ana sos ve en fazla iki süsleme, dengeli bir sunum için iyi bir başlangıçtır.

## 6. Tutarsız porsiyon

Aynı ürünün her seferinde farklı miktarda sosla servis edilmesi hem maliyeti hem misafir deneyimini etkiler. Sos şişeleri ya da ölçü kaşıklarıyla porsiyonu standartlaştırın.

## 7. Ürünleri yanlış saklamak

Açılmış ambalajların ağzını sıkıca kapatın ve ürün etiketindeki saklama koşullarına uyun. Sos kovalarında temiz ve kuru servis ekipmanı kullanmak, ürün kalitesini korumanın en basit yoludur.

[[urun:frambuazli-waffle-sosu-10-kg]]

## Kısa özet

Doğru ısı, standart ölçü ve doğru zamanlama: profesyonel waffle sunumunun üç temel taşı.`,
  },
  {
    slug: "evde-pankek-ve-churros-hazirlama-rehberi",
    type: "GUIDE",
    category: "rehberler",
    title: "Evde Pankek ve Churros Hazırlama Rehberi",
    excerpt: "Pankek Box ve Churros Box ile evde hazırlayacağınız tatlılar için püf noktaları: kıvam, kızartma, sos ve süsleme.",
    cover: "/images/editorial/pankek.jpg",
    coverAlt: "Şurup ve orman meyveleriyle servis edilen pankek kulesi",
    coverCredit: "Fotoğraf: Stavros Papadimitriou / Unsplash",
    seoTitle: "Evde Pankek ve Churros Hazırlama Rehberi",
    seoDescription:
      "Pankek Box ve Churros Box ile evde pankek ve churros: hamur kıvamı, tava ısısı, kızartma, sos ve süsleme önerileri.",
    tags: ["pankek", "churros", "ev mutfağı"],
    products: [
      { slug: "pankek-box" },
      { slug: "churros-box" },
    ],
    daysAgo: 48,
    content: `Hafta sonu kahvaltısında bir pankek kulesi ya da arkadaşlarla paylaşılacak bir tabak churros... ByMaster'ın Pankek Box ve Churros Box ürünleri, ihtiyaç duyacağınız temel malzemeleri tek kutuda bir araya getiriyor. Bu rehberde, kutulardan en iyi sonucu almanız için genel püf noktalarını paylaşıyoruz.

## Pankek için

### Kıvam

Pankek hamuru akışkan ama akıp gitmeyecek kıvamda olmalıdır. Kutudaki Pankek Miks'i ambalaj talimatına göre hazırlayın ve hamuru birkaç dakika dinlendirin.

### Tava ısısı

Orta ateş pankek için idealdir. Çok yüksek ısıda dış yüzey kararırken iç kısım pişmeden kalabilir. Hamurun yüzeyinde kabarcıklar oluşup patlamaya başladığında çevirme zamanı gelmiştir.

### Kalıp kullanımı

Pankek Box'tan çıkan silikon kalıp, farklı şekillerde pankekler hazırlamanızı sağlar. Kalıbın iç yüzeyini hafifçe yağlamak, pankeğin kolayca çıkmasına yardımcı olur.

[[urun:pankek-box]]

## Churros için

### Sıkma torbası

Churros Box'taki sıkma torbası ve uç, churros'a karakteristik tırtıklı görünümünü verir. Hamuru torbaya fazla doldurmamak kontrolü kolaylaştırır.

### Kızartma

Kızartma yağının yeterince ısınmış olması, churros'un yağ çekmeden çıtırlaşmasına yardımcı olur. Kızaran churros'u kâğıt havlu üzerinde kısa süre bekletin ve sıcakken tarçınlı şekere bulayın.

### Sos

Kutudaki sütlü, bitter ve beyaz soslar churros için üç farklı dip seçeneği sunar. Sosları küçük kâselerde ayrı ayrı servis etmek, paylaşımlı sunumlarda pratiktir.

[[urun:churros-box]]

## Son dokunuş

Pankekte ve churros'ta süslemeleri servis anında ekleyin; krep kırıkları ve pirinç patlakları nemle temas ettikçe çıtırlığını kaybeder.

> Kızartma ve pişirme sırasında sıcak yağ ve yüzeylerle çalışırken dikkatli olun; çocuklarla birlikte hazırlanan tariflerde bu adımları bir yetişkin üstlenmelidir.`,
  },
];
