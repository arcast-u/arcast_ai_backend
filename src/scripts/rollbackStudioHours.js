import prisma from '../config/db.config.js';

/**
 * Rollback script to revert studio opening hours from 10am to 9am
 * Only run this if you need to revert the changes made by updateStudioHours.js
 */
async function rollbackStudioOpeningHours() {
  try {
    console.log('Starting rollback: Reverting studio opening hours from 10:00 to 09:00...');
    
    const result = await prisma.studio.updateMany({
      where: {
        openingTime: "10:00"
      },
      data: {
        openingTime: "09:00"
      }
    });
    
    console.log(`Successfully reverted ${result.count} studios`);
    console.log('Rollback completed successfully!');
  } catch (error) {
    console.error('Error rolling back studio opening hours:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run this script when you need to rollback
// Comment this line out if you don't want to run the rollback immediately
rollbackStudioOpeningHours(); 