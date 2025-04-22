import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Script to remove only booking-related data from the database
 * This keeps studios, packages, and perks intact
 */
async function cleanupBookingsOnly() {
  try {
    console.log('Starting bookings cleanup...');

    // Delete booking-related records
    console.log('Deleting booking-related records...');
    await prisma.bookingAdditionalService.deleteMany({});
    
    console.log('Deleting payments for bookings...');
    await prisma.payment.deleteMany({});
    
    console.log('Deleting bookings...');
    await prisma.booking.deleteMany({});
    
    console.log('✅ All booking data has been removed. Studios and packages remain intact.');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup function
cleanupBookingsOnly(); 