import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { slug: "oto-tamir", nameTr: "Oto Tamir", nameMk: "Авто механичар", nameSq: "Riparim auto" },
  { slug: "ev-temizligi", nameTr: "Ev Temizliği", nameMk: "Чистење на домови", nameSq: "Pastrim shtëpie" },
  { slug: "boyaci-tadilat", nameTr: "Boyacı / Tadilat", nameMk: "Молерофарбар / Реновирање", nameSq: "Lyerës / Rinovim" },
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
