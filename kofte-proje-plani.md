# Köfte — Kuzey Makedonya Yerel Hizmet Platformu
> Armut'un Makedonya versiyonu. Oto tamir, ev hizmetleri ve ustalar için güvenilir bir pazar yeri.

---

## 1. Proje Özeti

| | |
|---|---|
| **Ürün adı** | Köfte |
| **Pazar** | Kuzey Makedonya (başlangıç), Balkanlar (ölçekleme) |
| **Model** | İki taraflı pazar yeri (müşteri ↔ usta) |
| **Referans** | Armut.com (Türkiye) |
| **MVP süresi** | 16 hafta |
| **Hedef** | İlk 10 işi tamamla, para kazan, büyüt |

---

## 2. Problem

Kuzey Makedonya'da güvenilir usta/hizmet bulmak hâlâ WhatsApp grupları üzerinden yürüyor.

- 1000+ kişilik gruplar dolup taşıyor
- Tavsiye üzerine gidiliyor, güvence yok
- Oto tamir başta olmak üzere acil hizmetlerde hızlı çözüm bulunamıyor
- Ödeme nakit, euro veya MKD — platform yok, güvence yok
- Rakip dijital platform: **yok**

---

## 3. Çözüm — Köfte Nasıl Çalışır?

```
Müşteri → Talep oluşturur
         → Platform yakındaki ustalarla eşleştirir
         → Ustalar teklif verir
         → Müşteri seçer, işi onaylar
         → İş tamamlanır, para ödenir
         → Yorum & puan bırakılır
```

---

## 4. Armut'tan Farkı (Rekabet Avantajı)

### Armut'un sorunları → Köfte'nin çözümleri

| Sorun | Köfte Çözümü |
|---|---|
| Teklif başına ücret — iş kapanmasa da para gidiyor | İlk 3 ay sıfır komisyon, sonra sadece tamamlanan işten |
| Sahte talepler, para boşa gidiyor | Telefon + kimlik doğrulama zorunlu |
| Para direkt ustaya gidiyor, iş yapılmazsa kayıp | Escrow sistemi — para platformda bekler |
| Hesap askıya alınıyor, günlerce cevap yok | Max 24 saat SLA, WhatsApp destek hattı |
| Haksız yorum sililemiyor | Sadece gerçek işten yorum, itiraz mekanizması |

---

## 5. Pazar Araştırması Bulguları

- Makedonya'da WhatsApp grupları 1000+ üyeli ve hızlı doluyor
- En çok aranan: **oto tamir & araç hizmetleri**
- Ev hizmetlerinde ev sahibi yönlendiriyor (güven ağı kurulu)
- Ödeme: nakit euro veya MKD
- Dijital rakip: **henüz yok**

---

## 6. Hedef Kategoriler (MVP)

Başlangıçta sadece 3 kategori:

1. **Oto tamir** — en yüksek talep, acil ihtiyaç
2. **Ev temizliği** — tekrar eden iş, sadık müşteri
3. **Boyacı / tadilat** — yüksek bilet bedeli

---

## 7. Kullanıcı Akışları

### 7.1 Müşteri Akışı

```
1. Uygulama aç
2. Kategori seç (oto tamir, temizlik, boyacı)
3. Detay anlat (ne, ne zaman, bütçe)
4. Fotoğraf ekle (isteğe bağlı)
5. Konum paylaş
6. Teklifleri bekle (max 24 saat)
7. Teklifi karşılaştır, ustayı seç
8. İş tamamlanınca onayla
9. Yorum & puan bırak
```

### 7.2 Usta Akışı

```
1. Kayıt ol (ad, telefon, kategori, bölge)
2. Kimlik yükle (zorunlu)
3. Sertifika yükle (isteğe bağlı, öne çıkarır)
4. Onay bekle (max 24 saat)
5. Yakındaki talepleri gör
6. Teklif ver
7. Müşteriyle iletişime geç
8. İşi tamamla
9. Ödemeyi al (komisyon düşülür)
```

---

## 8. Ödeme Sistemi

### Escrow Akışı

```
Müşteri parayı platforma yatırır
         ↓
Para Köfte kasasında bekler
         ↓
İş tamamlanır, müşteri onaylar
         ↓
Para ustaya aktarılır (komisyon düşülmüş)
```

### Para Birimleri

- **MKD (Makedonyalı denar)** — yerel bankalar, nakit uyumlu
- **EUR (Euro)** — zaten gruplardan kullanılıyor, Stripe destekli

### MVP'de Ödeme Yöntemi

| Aşama | Yöntem |
|---|---|
| MVP (1–3. ay) | Nakit — kullanıcı direkt ustaya öder, Köfte komisyonu fatura keser |
| Büyüme (4. ay+) | Stripe / Adyen ile kart ödeme |
| Opsiyonel | Banka havalesi (yaşlı nüfus için) |

### Komisyon Modeli

| Aşama | Oran |
|---|---|
| İlk 3 ay | %0 — usta ağı büyümesi için |
| Sonrasında | %8–10 — sadece tamamlanan işten |
| Abonelik (opsiyonel) | 500 MKD/ay — öne çıkarma avantajı |

### Örnek Hesap

```
İş bedeli       : 4.000 MKD (~65 EUR)
Platform (%10)  :   400 MKD
İşlem ücreti(%2):    80 MKD
Ustanın eli̇ne  : 3.520 MKD (~57 EUR)
```

---

## 9. Usta Rozet Sistemi

| Rozet | Koşul |
|---|---|
| ✅ Onaylı | Kimlik doğrulandı |
| 🔶 Uzman | Sertifika yüklendi |
| ⭐ Süper Usta | 4.8+ puan, 20+ tamamlanan iş |

---

## 10. Teknik Stack

| Katman | Teknoloji | Neden |
|---|---|---|
| Mobil uygulama | React Native | iOS + Android tek codebase |
| Backend | Node.js | En yaygın, freelancer bulması kolay |
| Veritabanı | PostgreSQL | Ücretsiz, kurumsal seviye |
| Sunucu | Railway.app | AWS gibi karmaşık değil, ~20$/ay |
| Push bildirim | Firebase | Google servisi, ücretsiz |
| Ödeme (sonra) | Stripe / Adyen | MKD + EUR desteği |

### Veritabanı Tabloları (Temel)

```
users         — müşteri hesapları
providers     — usta hesapları
categories    — hizmet kategorileri
requests      — müşteri talepleri
offers        — usta teklifleri
jobs          — tamamlanan işler
reviews       — yorumlar ve puanlar
payments      — ödeme kayıtları
```

---

## 11. MVP Planı — 16 Hafta

### Aşama 1 — Temel Altyapı (Hafta 1–4)
- [ ] React Native proje kurulumu
- [ ] Giriş / kayıt ekranları
- [ ] 3 kategori
- [ ] Usta kayıt formu + kimlik yükleme
- [ ] Müşteri talep formu (4 adım)
- [ ] PostgreSQL veritabanı kurulumu
- [ ] Firebase push bildirim

### Aşama 2 — Eşleştirme & İletişim (Hafta 5–10)
- [ ] Müşteri–usta mesajlaşma
- [ ] Teklif sistemi
- [ ] Yorum & puan sistemi
- [ ] Konum bazlı filtreleme
- [ ] İş tamamlama akışı
- [ ] Usta profil sayfası

### Aşama 3 — Cila & Yayın (Hafta 11–16)
- [ ] Makedonca + Arnavutça dil desteği
- [ ] Güvenlik testleri
- [ ] App Store başvurusu (3–7 gün inceleme)
- [ ] Google Play başvurusu (1–3 gün)
- [ ] Analitik entegrasyonu
- [ ] İlk 20 usta manuel onboarding

### MVP'de OLMAYACAKLAR
- ❌ Online ödeme / Stripe (nakit yeterli)
- ❌ Yapay zeka / öneri algoritması
- ❌ Admin paneli
- ❌ 10'dan fazla kategori
- ❌ Abonelik sistemi
- ❌ Web sitesi

---

## 12. Ekip

| Rol | Kişi | Görev |
|---|---|---|
| Kurucu / Ürün | Sen | Ürün kararları, Makedonya ilişkileri, usta bulma |
| Geliştirici | TBD | React Native + Node.js + PostgreSQL |
| Saha (opsiyonel) | Makedonya'daki arkadaş | Ustalarla yüz yüze, yerel operasyon |

---

## 13. Gelir Modeli (Uzun Vadeli)

| Kaynak | Açıklama |
|---|---|
| Komisyon | Her işlemden %8–10 |
| Usta aboneliği | Aylık 500 MKD sabit |
| Öne çıkarma | Arama sıralaması ücreti |
| Premium rozet | Süper Usta statüsü için |

---

## 14. Büyüme Yol Haritası

```
Ay 1–4   → MVP, 3 kategori, Üsküp merkez
Ay 5–8   → Online ödeme, 5+ kategori, tüm Üsküp
Ay 9–12  → Diğer Makedonya şehirleri
Yıl 2    → Sırbistan, Arnavutluk, Bosna
```

---

## 15. Kritik Kararlar & Notlar

1. **Pazar küçük ama boş** — 2 milyon nüfus, dijital rakip yok. İlk giren avantajı büyük.
2. **Oto tamir önce** — WhatsApp gruplarındaki en yüksek talep buradan geliyor.
3. **Nakit ile başla** — Stripe karmaşık, önce işleri döndür.
4. **WhatsApp destek zorunlu** — Makedonya'da insanlar sorun yaşayınca WhatsApp'tan yazar.
5. **Çift dil şart** — Makedonca + Arnavutça. Nüfusun ~%25'i Arnavut.
6. **Escrow = güven** — Para güvencesi Armut'tan en büyük fark.

---

*Son güncelleme: Haziran 2026 — Claude ile hazırlandı*
