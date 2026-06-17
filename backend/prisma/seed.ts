import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "oto-tamir", nameTr: "Oto Tamir", nameEn: "Auto Repair", nameMk: "Авто механичар", nameSq: "Riparim auto" },
  { slug: "ev-temizligi", nameTr: "Ev Temizliği", nameEn: "House Cleaning", nameMk: "Чистење на домови", nameSq: "Pastrim shtëpie" },
  { slug: "boyaci-tadilat", nameTr: "Tadilat & Dekorasyon", nameEn: "Renovation & Decor", nameMk: "Реновирање и Декорација", nameSq: "Rinovim & Dekorim" },
  { slug: "nakliyat", nameTr: "Nakliye & Eşya Taşıma", nameEn: "Moving & Transport", nameMk: "Транспорт", nameSq: "Transport" },
  { slug: "ozel-ders", nameTr: "Özel Ders", nameEn: "Private Tutoring", nameMk: "Приватни часови", nameSq: "Mësime private" },
  { slug: "tesisat", nameTr: "Tesisat (Su / Elektrik)", nameEn: "Plumbing & Electrical", nameMk: "Водовод и Електрика", nameSq: "Hidraulik & Elektrik" },
  { slug: "fotograf", nameTr: "Fotoğraf & Video", nameEn: "Photography & Video", nameMk: "Фотографирање", nameSq: "Fotografi" },
  { slug: "guzellik", nameTr: "Güzellik & Kuaför", nameEn: "Beauty & Salon", nameMk: "Убавина и Нега", nameSq: "Bukuri & Kujdes" },
  { slug: "bilgisayar", nameTr: "Bilişim & Bilgisayar", nameEn: "IT & Computers", nameMk: "Поправка на компјутери", nameSq: "Riparim kompjuteri" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
