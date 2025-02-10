import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create the basic recording package
  const basicPackage = await prisma.studioPackage.create({
    data: {
      name: "Recording (Video + Audio)",
      price_per_hour: 950.00,
      currency: "AED",
      description: "Professional recording package with multi-camera setup and high-quality audio",
      delivery_time: 24, // Same day delivery (in hours)
      packagePerks: {
        create: [
          { name: "Organized raw video files" },
          { name: "Multicam recording files" },
          { name: "High-quality audio files" },
          { name: "Basic file organization" },
          { name: "Same-day delivery" }
        ]
      }
    }
  });

  // Create the professional edit package
  const proPackage = await prisma.studioPackage.create({
    data: {
      name: "Recording + Professional Edit",
      price_per_hour: 950.00,
      currency: "AED",
      description: "Complete recording and professional editing package with revisions",
      delivery_time: 72, // 3 days delivery (in hours)
      packagePerks: {
        create: [
          { name: "Complete episode edit" },
          { name: "Filler word removal" },
          { name: "Audio clarity enhancement" },
          { name: "Background noise reduction" },
          { name: "Multi-guest audio sync" },
          { name: "3 revision rounds" },
          { name: "Intro/outro integration" },
          { name: "Custom graphics" }
        ]
      }
    }
  });

  // Create or update discount codes with proper dates
  const today = new Date();
  const yearEnd = new Date(today.getFullYear(), 11, 31); // December 31st of current year

  // Welcome discount (percentage-based)
  const welcomeDiscount = await prisma.discountCode.upsert({
    where: { code: "WELCOME10" },
    update: {
      startDate: today,
      endDate: yearEnd,
      isActive: true
    },
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10, // 10% off
      startDate: today,
      endDate: yearEnd,
      isActive: true,
      maxUses: 100,
      minAmount: 500 // Minimum booking amount of 500 AED
    }
  });

  // Special offer (fixed amount)
  const specialOffer = await prisma.discountCode.upsert({
    where: { code: "SPECIAL200" },
    update: {
      startDate: today,
      endDate: yearEnd,
      isActive: true
    },
    create: {
      code: "SPECIAL200",
      type: "FIXED_AMOUNT",
      value: 200, // 200 AED off
      startDate: today,
      endDate: yearEnd,
      isActive: true,
      maxUses: 50,
      minAmount: 1000 // Minimum booking amount of 1000 AED
    }
  });

  console.log('Default packages created:', { basicPackage, proPackage });
  console.log('Discount codes updated:', { welcomeDiscount, specialOffer });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 