import prisma from '../config/db.config.js';

/**
 * Migration script to update studio opening hours from 9am to 10am
 * Run this script if you have existing studios in the database
 */
async function updateStudioOpeningHours() {
  try {
    console.log('Starting migration: Updating studio opening hours from 09:00 to 10:00...');
    
    const result = await prisma.studio.updateMany({
      where: {
        openingTime: "09:00"
      },
      data: {
        openingTime: "10:00"
      }
    });
    
    console.log(`Successfully updated ${result.count} studios`);
    console.log('Migration completed successfully!');
    
    // Count how many studios still have the old opening time
    const remainingStudios = await prisma.studio.count({
      where: {
        openingTime: "09:00"
      }
    });
    
    if (remainingStudios > 0) {
      console.warn(`Warning: ${remainingStudios} studios still have an opening time of 09:00`);
    }
  } catch (error) {
    console.error('Error updating studio opening hours:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
updateStudioOpeningHours(); 