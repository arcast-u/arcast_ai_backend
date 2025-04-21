# Studio Hours Update

This guide outlines the changes made to update studio operating hours from 9am-9pm to 10am-9pm.

## Changes Made

1. Updated seed.js file to use the new opening time (10:00) for all studios
2. Created a migration script to update existing studios in the database
3. Updated OpenAPI documentation examples in studio.routes.js

## Running the Migration Script

To update existing studios in the database, run the following command:

```bash
node src/scripts/updateStudioHours.js
```

This script will:
- Find all studios with opening time "09:00" and update them to "10:00"
- Display a count of updated studios
- Check if any studios were missed and warn you if needed

## Business Impact

With this change:
- Studios will open at 10am instead of 9am
- The last booking slot will still end at 9pm
- For 1-hour bookings, the latest bookable time is 8pm
- For 2-hour bookings, the latest bookable time is 7pm

## Verification Steps

After running the migration:

1. Check the database to ensure all studios have been updated
2. Verify the API returns the correct time slots
3. Test making a booking at 9am (should be rejected)
4. Test making a booking at 10am (should be accepted)
5. Test making a booking at 8pm for 1 hour (should be accepted)
6. Test making a booking at 8pm for 2 hours (should be rejected)

## Rollback Procedure

If needed, you can revert these changes by:

1. Updating the opening time back to "09:00" in the seed.js file
2. Running a rollback script:

```javascript
// Create a file named rollbackStudioHours.js with this content
import prisma from '../config/db.config.js';

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
  } catch (error) {
    console.error('Error rolling back studio opening hours:', error);
  } finally {
    await prisma.$disconnect();
  }
}

rollbackStudioOpeningHours();
```

Then run:

```bash
node src/scripts/rollbackStudioHours.js
``` 