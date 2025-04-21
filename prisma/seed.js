import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Helper function to generate dates for the next N days
function generateDates(startDate, numberOfDays) {
  const dates = [];
  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

// Helper function to generate time slots for a given date
function generateTimeSlots(date, openingTime, closingTime) {
  const slots = [];
  const [openHour] = openingTime.split(':').map(Number);
  const [closeHour] = closingTime.split(':').map(Number);
  
  for (let hour = openHour; hour < closeHour; hour++) {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    // Only add future slots
    if (startTime > new Date()) {
      slots.push({ startTime, endTime });
    }
  }
  return slots;
}

// Helper function to create bookings for a studio
async function createBookingsForStudio(studioId, packageId, dates, leadId, shouldBeFullyBooked = false) {
  const bookings = [];
  
  for (const date of dates) {
    const timeSlots = generateTimeSlots(date, "10:00", "21:00");
    
    // If shouldBeFullyBooked is true, book all slots
    // Otherwise, only book 2-3 random slots per day to leave some availability
    const slotsToBook = shouldBeFullyBooked ? timeSlots : timeSlots.filter(() => {
      // Randomly select 2-3 slots per day
      return Math.random() < 0.99; // This will book roughly 99% of slots
    });
    
    // Create a booking for each selected time slot
    const bookingPromises = slotsToBook.map(slot => 
      prisma.booking.create({
        data: {
          startTime: slot.startTime,
          endTime: slot.endTime,
          numberOfSeats: 2,
          totalCost: 600.00,
          vatAmount: 30.00,
          status: "CONFIRMED",
          studioId: studioId,
          packageId: packageId,
          leadId: leadId,
        },
      })
    );

    const createdBookings = await Promise.all(bookingPromises);
    bookings.push(...createdBookings);
  }
  return bookings;
}

async function main() {
  // Create a dummy lead for our bookings
  const dummyLead = await prisma.lead.create({
    data: {
      fullName: "Test User",
      email: "test@example.com",
      phoneNumber: "+971500000000"
    }
  });

  // Create another lead with recordingLocation
  const dummyLeadWithLocation = await prisma.lead.create({
    data: {
      fullName: "Test User 2",
      email: "test2@example.com",
      phoneNumber: "+971500000001",
      recordingLocation: "Dubai"
    }
  });

  // Create the basic recording package
  const basicPackage = await prisma.studioPackage.create({
    data: {
      name: "Recording (Video + Audio)",
      price_per_hour: 600.00,
      currency: "AED",
      description: "Professional recording package with multi-camera setup and high-quality audio",
      delivery_time: 24,
      packagePerks: {
        create: [
          { name: "Raw video in multiple resolutions (1080p/4K)" },
          { name: "Audio files in multiple formats (MP3, WAV, MP4)" },
          { name: "Audio/ video syncing" },
          { name: "Color grading" },
          { name: "Noise reduction" },
          { name: "2 revisions" },
          { name: "Transcript" },
          { name: "SEO optimized show notes" }
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
      delivery_time: 72,
      packagePerks: {
        create: [
          { name: "Raw video in multiple resolutions (1080p/4K)" },
          { name: "Audio files in multiple formats (MP3, WAV, MP4)" }
        ]
      }
    }
  });

  // Create all studios
  const studios = await Promise.all([
    // Mobile studio service
    prisma.studio.create({
      data: {
        name: "Mobile Studio Service",
        location: "Anywhere in Dubai",
        imageUrl: "https://example.com/studio-mobile.jpg",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: basicPackage.id },
            { id: proPackage.id }
          ]
        }
      },
      include: {
        packages: {
          include: {
            packagePerks: true
          }
        }
      }
    }),
    // Setup 1
    prisma.studio.create({
      data: {
        name: "Setup 1",
        location: "Dubai",
        imageUrl: "https://example.com/studio-1.jpg",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: basicPackage.id },
            { id: proPackage.id }
          ]
        }
      },
      include: {
        packages: {
          include: {
            packagePerks: true
          }
        }
      }
    }),
    // Setup 2
    prisma.studio.create({
      data: {
        name: "Setup 2",
        location: "Dubai",
        imageUrl: "https://example.com/studio-2.jpg",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: basicPackage.id },
            { id: proPackage.id }
          ]
        }
      },
      include: {
        packages: {
          include: {
            packagePerks: true
          }
        }
      }
    }),
    // Setup 3
    prisma.studio.create({
      data: {
        name: "Setup 3",
        location: "Dubai",
        imageUrl: "https://example.com/studio-3.jpg",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: basicPackage.id },
            { id: proPackage.id }
          ]
        }
      },
      include: {
        packages: {
          include: {
            packagePerks: true
          }
        }
      }
    }),
    // Setup 4
    prisma.studio.create({
      data: {
        name: "Setup 4",
        location: "Dubai",
        imageUrl: "https://example.com/studio-4.jpg",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: basicPackage.id },
            { id: proPackage.id }
          ]
        }
      },
      include: {
        packages: {
          include: {
            packagePerks: true
          }
        }
      }
    }),
    // Setup 5
    prisma.studio.create({
      data: {
        name: "Setup 5",
        location: "Dubai",
        imageUrl: "https://example.com/studio-5.jpg",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: basicPackage.id },
            { id: proPackage.id }
          ]
        }
      },
      include: {
        packages: {
          include: {
            packagePerks: true
          }
        }
      }
    }),
    // Setup 6
    prisma.studio.create({
      data: {
        name: "Setup 6",
        location: "Dubai",
        imageUrl: "https://example.com/studio-6.jpg",
        totalSeats: 4,
        openingTime: "10:00",
        closingTime: "21:00",
        packages: {
          connect: [
            { id: basicPackage.id },
            { id: proPackage.id }
          ]
        }
      },
      include: {
        packages: {
          include: {
            packagePerks: true
          }
        }
      }
    })
  ]);

  // Get today's date and next Friday (21st Feb 2025)
  const today = new Date();
  const targetFriday = new Date('2025-02-21');
  
  // Generate dates for the next 2 weeks
  const twoWeeksFromNow = new Date(today);
  twoWeeksFromNow.setDate(today.getDate() + 14);
  
  // Create bookings for all studios except Mobile studio service
  for (let i = 1; i < studios.length; i++) {
    const dates = generateDates(today, 14); // 2 weeks of dates
    console.log(`Creating bookings for ${studios[i].name} for 2 weeks (fully booked)`);
    await createBookingsForStudio(studios[i].id, basicPackage.id, dates, dummyLead.id, true); // Set to fully booked
  }

  // Create bookings for Mobile studio service only until Friday 21st Feb 2025
  const daysUntilTargetFriday = Math.ceil((targetFriday - today) / (1000 * 60 * 60 * 24));
  const datesUntilFriday = generateDates(today, daysUntilTargetFriday);
  console.log(`Creating bookings for Mobile Setup Service until Friday 21st Feb 2025 (${daysUntilTargetFriday} days)`);
  await createBookingsForStudio(studios[0].id, basicPackage.id, datesUntilFriday, dummyLead.id, true);

  // Create or update discount codes with proper dates
  const yearEnd = new Date(today.getFullYear(), 11, 31);

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
      value: 10,
      startDate: today,
      endDate: yearEnd,
      isActive: true,
      maxUses: 100,
      minAmount: 500
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
      value: 200,
      startDate: today,
      endDate: yearEnd,
      isActive: true,
      maxUses: 50,
      minAmount: 1000
    }
  });

  console.log('Studios created:', studios.map(s => s.name));
  console.log('Bookings created for all studios');
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