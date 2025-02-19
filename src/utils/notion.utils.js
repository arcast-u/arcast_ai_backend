import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Add this function to check database properties
async function logDatabaseSchema() {
  try {
    const response = await notion.databases.retrieve({
      database_id: DATABASE_ID
    });
    console.log('Database schema:', JSON.stringify(response.properties, null, 2));
    return response.properties;
  } catch (error) {
    console.error('Error retrieving database schema:', error);
    throw error;
  }
}

// Modified createNotionBookingEntry function
export async function createNotionBookingEntry(booking) {
  try {
    // First, let's log the database schema
    const schema = await logDatabaseSchema();
    console.log('Creating entry with booking:', JSON.stringify(booking, null, 2));

    const response = await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        "Name": {
          title: [
            {
              text: {
                content: `${booking.lead.fullName}`
              }
            }
          ]
        },
        "bookingID": {
          rich_text: [
            {
              text: {
                content: booking.id.toString()
              }
            }
          ]
        },
        "location": {
          rich_text: [
            {
              text: {
                content: booking.lead.recordingLocation || ''
              }
            }
          ]
        },
        "Number of guests": {
          number: booking.numberOfSeats
        },
        "Booking Date": {
          date: {
            start: booking.startTime.toISOString(),
            end: booking.endTime.toISOString()
          }
        },
        "Customer Email": {
          email: booking.lead.email
        },
        "Phone Number": {
          phone_number: booking.lead.phoneNumber
        },
        "Setup": {
          select: {
            name: booking.studio.name
          }
        },
        "Package": {
          select: {
            name: booking.package.name || "Recording Only" // Access name from the package relation
          }
        },
        "Additional Services": {
          multi_select: []
        },
        "Department": {
          relation: []
        },
        "Docs": {
          relation: []
        },
        "Tasks": {
          relation: []
        },
        "Payment Method": {
          select: {
            name: "Card" // Default to Card, can be updated later
          }
        },
        "Whatsapp": {
          phone_number: booking.lead.whatsappNumber || booking.lead.phoneNumber // Use whatsappNumber if available, otherwise use phoneNumber
        }
      }
    });

    console.log('Successfully created Notion entry');
    return response;
  } catch (error) {
    console.error('Error creating Notion entry:', error);
    throw error;
  }
} 