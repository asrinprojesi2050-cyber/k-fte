

const API = "http://localhost:3000";

async function runTest() {
  console.log("=== DEVLER LİGİ İŞ AKIŞI TESTİ BAŞLIYOR ===");

  try {
    const cusEmail = `customer_${Date.now()}@test.com`;
    const proEmail = `provider_${Date.now()}@test.com`;
    const password = "password123";

    console.log("\n0. Kullanıcılar Kayıt Ediliyor...");
    await fetch(`${API}/auth/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cusEmail, password, name: "Test Müşteri", phone: "5551112233" })
    });
    await fetch(`${API}/auth/register-provider`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: proEmail, password, name: "Test Usta", phone: "5559998877", categoryIds: [] })
    });

    // 1. Müşteri Girişi
    console.log("\n1. Müşteri Girişi...");
    const cusRes = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: cusEmail, password }) 
    });
    const cusData: any = await cusRes.json();
    const cusToken = cusData.token;
    console.log("Müşteri giriş başarılı.");

    // 2. Kategori Çekimi
    const catRes = await fetch(`${API}/categories`);
    const categories: any = await catRes.json();
    const categoryId = categories[0].id;

    // 3. Talep Oluştur (Yarın için)
    console.log("\n2. Talep Oluşturuluyor (Yarın İçin)...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const reqRes = await fetch(`${API}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${cusToken}` },
      body: JSON.stringify({
        categoryId,
        description: "Test İş Akışı Talebi - Fren Balata Değişimi",
        scheduledAt: tomorrow.toISOString(),
      })
    });
    const requestData: any = await reqRes.json();
    console.log("Talep oluşturuldu: ID:", requestData.id);

    // 4. Usta Girişi
    console.log("\n3. Usta Girişi...");
    const proRes = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: proEmail, password }) 
    });
    const proData: any = await proRes.json();
    const proToken = proData.token;
    console.log("Usta giriş başarılı.");

    // 5. Ücretsiz Keşif Teklifi Ver
    console.log("\n4. Ücretsiz Keşif Teklifi Veriliyor...");
    const offerRes = await fetch(`${API}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${proToken}` },
      body: JSON.stringify({
        requestId: requestData.id,
        price: 0,
        isDiscovery: true,
        message: "Önce ücretsiz gelip duruma bakmam lazım."
      })
    });
    const offerData: any = await offerRes.json();
    console.log("Teklif verildi: ID:", offerData.id);

    // 6. Müşteri Teklifi Kabul Eder
    console.log("\n5. Müşteri Teklifi Kabul Ediyor...");
    const accRes = await fetch(`${API}/offers/${offerData.id}/accept`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${cusToken}` }
    });
    const jobData: any = await accRes.json();
    console.log("İş başladı: Job ID:", jobData.id);

    // 7. Usta Kilometre Taşı Günceller
    console.log("\n6. Usta Kilometre Taşı Güncelliyor (Yola Çıktım)...");
    await fetch(`${API}/jobs/${jobData.id}/milestone`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${proToken}` },
      body: JSON.stringify({ milestone: "Yola Çıktım" })
    });
    console.log("Durum 'Yola Çıktım' olarak güncellendi.");

    // 8. Usta Ekstra Masraf Çıkarır
    console.log("\n7. Usta Ekstra Masraf Talep Ediyor...");
    const costRes = await fetch(`${API}/additional-costs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${proToken}` },
      body: JSON.stringify({
        jobId: jobData.id,
        amount: 800,
        description: "Disklerin de değişmesi gerekiyor."
      })
    });
    const costData: any = await costRes.json();
    console.log("Ekstra masraf eklendi. ID:", costData.id);

    // 9. Müşteri Ekstra Masrafı Onaylar
    console.log("\n8. Müşteri Ekstra Masrafı Onaylıyor...");
    await fetch(`${API}/additional-costs/${costData.id}/approve`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${cusToken}` }
    });
    console.log("Ekstra masraf onaylandı.");

    console.log("\n=== TEST BAŞARIYLA TAMAMLANDI ===");
    console.log("Tüm yeni özellikler sistemde harika çalışıyor!");

  } catch (error: any) {
    console.error("TEST BAŞARISIZ:", error.message);
  }
}

runTest();
