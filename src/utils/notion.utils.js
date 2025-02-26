import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;
const LEADS_DATABASE_ID = process.env.NOTION_LEADS_DATABASE_ID;

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
            name: booking.package.name || "Recording Only"
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
            name: "Card"
          }
        },
        "Whatsapp": {
          phone_number: booking.lead.whatsappNumber || booking.lead.phoneNumber
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

// Create a lead entry in Notion
export async function createNotionLeadEntry(lead) {
  try {
    if (!LEADS_DATABASE_ID) {
      console.warn('NOTION_LEADS_DATABASE_ID not configured, skipping Notion lead entry');
      return null;
    }

    const response = await notion.pages.create({
      parent: {
        database_id: LEADS_DATABASE_ID,
      },
      properties: {
        "Name": {
          title: [
            {
              text: {
                content: lead.fullName
              }
            }
          ]
        },
        "Email": {
          email: lead.email
        },
        "Phone": {
          phone_number: lead.phoneNumber
        },
        "WhatsApp": {
          phone_number: lead.whatsappNumber || lead.phoneNumber
        },
        "Location": {
          rich_text: [
            {
              text: {
                content: lead.recordingLocation || ''
              }
            }
          ]
        },
        "Status": {
          select: {
            name: "New"
          }
        },
        "Source": {
          select: {
            name: "Website"
          }
        },
        "Created": {
          date: {
            start: lead.createdAt.toISOString()
          }
        }
      }
    });

    console.log('Successfully created Notion lead entry');
    return response;
  } catch (error) {
    console.error('Error creating Notion lead entry:', error);
    throw error;
  }
} 