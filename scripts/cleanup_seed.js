// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// /**
//  * Script to remove all seeded data from the database
//  */
// async function cleanupSeedData() {
//   try {
//     console.log('Starting database cleanup...');

//     // Delete in the correct order to respect foreign key constraints
//     // First delete the dependent records
//     console.log('Deleting booking-related records...');
//     await prisma.bookingAdditionalService.deleteMany({});
    
//     console.log('Deleting payments...');
//     await prisma.payment.deleteMany({});
    
//     console.log('Deleting payment links...');
//     await prisma.paymentLink.deleteMany({});

//     console.log('Deleting webhook events...');
//     await prisma.webhookEvent.deleteMany({});
    
//     console.log('Deleting bookings...');
//     await prisma.booking.deleteMany({});
    
//     // Then delete the main entities
//     console.log('Deleting discount codes...');
//     await prisma.discountCode.deleteMany({});
    
//     console.log('Deleting additional services...');
//     await prisma.additionalService.deleteMany({});
    
//     console.log('Deleting leads...');
//     await prisma.lead.deleteMany({});
    
//     // Delete studio packages and their related records
//     console.log('Deleting package perks...');
//     await prisma.packagePerk.deleteMany({});
    
//     // This will clear the many-to-many relation between studios and packages
//     console.log('Deleting studio packages...');
//     await prisma.studioPackage.deleteMany({});
    
//     console.log('Deleting studios...');
//     await prisma.studio.deleteMany({});
    
//     console.log('✅ All seeded data has been removed.');
//   } catch (error) {
//     console.error('Error during cleanup:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Run the cleanup function
// cleanupSeedData(); 