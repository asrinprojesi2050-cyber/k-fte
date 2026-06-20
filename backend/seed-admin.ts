import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@kofte.com";
  const password = "admin";
  const name = "Sistem Yöneticisi";

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin hesabı zaten var!");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });

  console.log("Admin hesabı oluşturuldu.");
  console.log("Email:", email);
  console.log("Şifre:", password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
