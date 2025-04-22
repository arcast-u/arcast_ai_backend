import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');
  
  // Create Studio Packages with their perks
  console.log('Creating studio packages...');
  
  // 1. Recording + Professional Edit Package
  const recordingEditPackage = await prisma.studioPackage.create({
    data: {
      name: "Recording + Professional Edit",
      price_per_hour: 940.00,
      currency: "AED",
      description: "Get high-quality recording with professional editing to enhance your sound",
      delivery_time: 24,
      packagePerks: {
        create: [
          { name: "Raw video in multiple resolutions (1080p/4K)" },
          { name: "Audio files in multiple formats (MP3, WAV, MP4)" },
          { name: "Audio / video syncing" },
          { name: "Color grading" },
          { name: "Noise reduction" },
          { name: "Revisions", count: 2 },
          { name: "Filler words removal" },
          { name: "SEO optimized show notes" }
        ]
      }
    }
  });

  // 2. Recording Only Package
  const recordingOnlyPackage = await prisma.studioPackage.create({
    data: {
      name: "Recording Only",
      price_per_hour: 440.00,
      currency: "AED",
      description: "Get high-quality recording with professional editing to enhance your sound",
      delivery_time: 24,
      packagePerks: {
        create: [
          { name: "Raw video in multiple resolutions (1080p/4K)" },
          { name: "Audio files in multiple formats (MP3, WAV, MP4)" }
        ]
      }
    }
  });

    // 3. Recording + Live Video Cutting Package
    const recordingLiveCuttingPackage = await prisma.studioPackage.create({
      data: {
        name: "Recording + Live Video Cutting with Synced Media",
        price_per_hour: 540.00,
        currency: "AED",
        description: "Get high-quality recording with professional editing to enhance your sound",
        delivery_time: 24,
        packagePerks: {
          create: [
            { name: "Audio / video syncing" },
            { name: "Raw video in multiple resolutions (1080p/4K)" },
            { name: "Audio files in multiple formats (MP3, WAV, MP4)" }
          ]
        }
      }
    });

  console.log('Studio packages created successfully!');

  // Create Studios
  console.log('Creating studios...');
  
  const studios = await Promise.all([
    // Setup 1
    prisma.studio.create({
      data: {
        name: "Setup 1",
        location: "Dubai",
        imageUrl: "https://res.cloudinary.com/dcluqgjqe/image/upload/v1744358650/Frame_1618875659_tkrldb.png",
        totalSeats: 5,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: recordingEditPackage.id },
            { id: recordingOnlyPackage.id },
            { id: recordingLiveCuttingPackage.id }
          ]
        }
      }
    }),
    
    // Setup 2
    prisma.studio.create({
      data: {
        name: "Setup 2",
        location: "Dubai",
        imageUrl: "https://res.cloudinary.com/dcluqgjqe/image/upload/v1744358654/Frame_1618875660_spu27d.png",
        totalSeats: 6,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: recordingEditPackage.id },
            { id: recordingOnlyPackage.id },
            { id: recordingLiveCuttingPackage.id }
          ]
        }
      }
    }),
    
    // Setup 3
    prisma.studio.create({
      data: {
        name: "Setup 3",
        location: "Dubai",
        imageUrl: "https://res.cloudinary.com/dcluqgjqe/image/upload/v1744358657/Frame_1618875661_lzt4cy.png",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: recordingEditPackage.id },
            { id: recordingOnlyPackage.id },
            { id: recordingLiveCuttingPackage.id }
          ]
        }
      }
    }),
    
    // Setup 4
    prisma.studio.create({
      data: {
        name: "Setup 4",
        location: "Dubai",
        imageUrl: "https://res.cloudinary.com/dcluqgjqe/image/upload/v1744358653/Frame_1618875662_woyngq.png",
        totalSeats: 3,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: recordingEditPackage.id },
            { id: recordingOnlyPackage.id },
            { id: recordingLiveCuttingPackage.id }
          ]
        }
      }
    })
  ]);

  console.log('Studios created successfully!');
  
  // Create Additional Services
  console.log('Creating additional services...');
  
  const additionalServices = await Promise.all([
    // Short Form Edit
    prisma.additionalService.create({
      data: {
        title: "Short Form Edit (Instagram/TikTok)",
        type: "STANDARD_EDIT_SHORT_FORM",
        price: 500.00,
        currency: "AED",
        description: "High-quality, premium reels with advanced editing, motion graphics, and engaging cuts.",
        imageUrls: ["https://res.cloudinary.com/deuvbiekl/image/upload/v1741610901/Frame_1618875616_kmnkk0.png"],
        isActive: true
      }
    }),
    
    // Long Form Edit
    prisma.additionalService.create({
      data: {
        title: "Long Form Edit (Youtube)",
        type: "STANDARD_EDIT_LONG_FORM",
        price: 950.00,
        currency: "AED",
        description: "Professional-grade editing with in-depth sound design, smooth transitions, and high production quality per episode.",
        imageUrls: ["https://res.cloudinary.com/deuvbiekl/image/upload/v1741610519/Youtube_player_dtcx8v.png"],
        isActive: true
      }
    }),
    
    // Episode Trailer (Short form)
    prisma.additionalService.create({
      data: {
        title: "Episode Trailer (Short form)",
        type: "EPISODE_TRAILER_SHORT_FORM",
        price: 200.00,
        currency: "AED",
        description: "Quick, impactful trailer editing to capture attention and drive excitement with key highlights in a concise format.",
        imageUrls: [],
        isActive: true
      }
    }),
    
    // Episode Trailer (Long form)
    prisma.additionalService.create({
      data: {
        title: "Episode Trailer (Long form)",
        type: "EPISODE_TRAILER_LONG_FORM",
        price: 200.00,
        currency: "AED",
        description: "Professional editing to create a captivating trailer that highlights key moments, engaging your audience with a polished, cinematic preview.",
        imageUrls: [],
        isActive: true
      }
    }),
    
    // Subtitles
    prisma.additionalService.create({
      data: {
        title: "Subtitles (per session)",
        type: "SUBTITLES",
        price: 440.00,
        currency: "AED",
        description: "Accurate subtitles and captions to improve accessibility and engagement for video content.",
        imageUrls: ["https://res.cloudinary.com/deuvbiekl/image/upload/v1741610687/Frame_1618875174_bdmhcv.png"],
        isActive: true
      }
    }),
    
    // Teleprompter Support
    prisma.additionalService.create({
      data: {
        title: "Teleprompter Support",
        type: "TELEPROMPTER_SUPPORT",
        price: 80.00,
        currency: "AED",
        description: "On-screen script assistance for seamless delivery, perfect for structured interviews and presentations.",
        imageUrls: ["https://res.cloudinary.com/deuvbiekl/image/upload/v1741610730/Frame_1618875174_1_zvq2lz.png"],
        isActive: true
      }
    }),
    
    // Wardrobe Styling Consultation
    prisma.additionalService.create({
      data: {
        title: "Wardrobe Styling Consultation",
        type: "WARDROBE_STYLING_CONSULTATION",
        price: 500.00,
        currency: "AED",
        description: "Expert outfit guidance to enhance your on-camera presence and reflect your personal brand.",
        imageUrls: [],
        isActive: true
      }
    })
  ]);
  
  console.log('Additional services created successfully!');

  // Summary of created data
  console.log('\n--- Seed Summary ---');
  console.log(`Studios created: ${studios.map(s => s.name).join(', ')}`);
  console.log(`Packages created: ${[recordingEditPackage.name, recordingOnlyPackage.name].join(', ')}`);
  console.log(`Additional services created: ${additionalServices.length}`);
  console.log('No bookings created as requested.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
