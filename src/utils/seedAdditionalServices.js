import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

/**
 * Seed the database with initial additional services
 */
async function seedAdditionalServices() {
  try {
    console.log('Starting to seed additional services...');

    // Define the additional services
    const additionalServices = [
      {
        title: 'Standard Edit (Short Form)',
        type: 'STANDARD_EDIT_SHORT_FORM',
        price: 176,
        currency: 'AED',
        count: 1,
        description: 'Short-form video clips optimized for social media, using simple transitions and branding.',
        imageUrls: [
          'https://example.com/images/reels1.jpg',
          'https://example.com/images/reels2.jpg',
          'https://example.com/images/reels3.jpg'
        ]
      },
      {
        title: 'Custom Edit (Short Form)',
        type: 'CUSTOM_EDIT_SHORT_FORM',
        price: 440,
        currency: 'AED',
        count: 1,
        description: 'High-quality, premium reels with advanced editing, motion graphics, and engaging cuts.',
        imageUrls: [
          'https://example.com/images/reels1.jpg',
          'https://example.com/images/reels2.jpg',
          'https://example.com/images/reels3.jpg'
        ]
      },
      {
        title: 'Standard Edit (Long Form)',
        type: 'STANDARD_EDIT_LONG_FORM',
        price: 440,
        currency: 'AED',
        count: 1,
        description: 'Basic podcast episode editing, including noise reduction, filler word removal, and audio balancing.',
        videoUrl: 'https://example.com/videos/expanding-realities.mp4'
      },
      {
        title: 'Custom Edit (Long Form)',
        type: 'CUSTOM_EDIT_LONG_FORM',
        price: 960,
        currency: 'AED',
        count: 1,
        description: 'Professional-grade editing with in-depth sound design, smooth transitions, and high production quality.',
        videoUrl: 'https://example.com/videos/remote-teams.mp4'
      },
      {
        title: 'Live Video Cutting with Synced Audio',
        type: 'LIVE_VIDEO_CUTTING',
        price: 150,
        currency: 'AED',
        count: 1,
        description: 'Real-time video switching and cutting with perfectly synced audio for a polished final content.',
        imageUrls: [
          'https://example.com/images/live1.jpg',
          'https://example.com/images/live2.jpg'
        ]
      },
      {
        title: 'Subtitles (per session)',
        type: 'SUBTITLES',
        price: 440,
        currency: 'AED',
        count: 1,
        description: 'Accurate subtitles and captions to improve accessibility and engagement for video content.'
      },
      {
        title: 'Teleprompter Support',
        type: 'TELEPROMPTER_SUPPORT',
        price: 80,
        currency: 'AED',
        count: 1,
        description: 'On-screen script assistance for seamless delivery, perfect for structured interviews and presentations.',
        imageUrls: [
          'https://example.com/images/teleprompter.jpg'
        ]
      }
    ];

    // Check if services already exist
    const existingServices = await prisma.additionalService.findMany();
    
    if (existingServices.length > 0) {
      console.log(`Found ${existingServices.length} existing additional services. Skipping seeding.`);
      return;
    }

    // Create the additional services
    for (const service of additionalServices) {
      await prisma.additionalService.create({
        data: service
      });
      console.log(`Created additional service: ${service.title}`);
    }

    console.log('Additional services seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding additional services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function if this file is executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedAdditionalServices()
    .then(() => {
      console.log('Seeding completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedAdditionalServices; 