import prisma from "../config/db.config.js";
import { generateAvailableTimeSlots } from "../utils/time.utils.js";

export class StudioController {
    getAllStudios = async (req, res) => {
      try {
        // Get today's date bounds
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get two weeks from now for regular studios
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(today.getDate() + 14);

        // Set target Friday for mobile studio (Feb 21, 2025)
        const targetFriday = new Date('2025-02-21');
        targetFriday.setHours(0, 0, 0, 0);

        const studios = await prisma.studio.findMany({
          include: {
            packages: {
              include: {
                packagePerks: true
              }
            },
            bookings: {
              where: {
                AND: [
                  {
                    status: {
                      not: 'CANCELLED'
                    }
                  },
                  {
                    startTime: {
                      gte: today
                    }
                  }
                ]
              }
            }
          }
        });

        // Add availability information to each studio
        const studiosWithAvailability = studios.map(studio => {
          // Determine the end date based on studio type
          const endDate = studio.name === "Mobile Studio Service" ? targetFriday : twoWeeksFromNow;
          
          // Filter bookings within the relevant date range
          const relevantBookings = studio.bookings.filter(booking => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return (
              // Check if booking overlaps with the date range
              (bookingStart >= today && bookingStart <= endDate) ||
              (bookingEnd >= today && bookingEnd <= endDate) ||
              (bookingStart <= today && bookingEnd >= endDate)
            );
          });

          // Generate time slots with the proper end date
          const timeSlots = generateAvailableTimeSlots(
            studio.openingTime, 
            studio.closingTime, 
            relevantBookings,
            endDate
          );
          
          // Calculate actual availability
          const availableSlots = timeSlots.filter(slot => slot.available).length;
          
          return {
            ...studio,
            // Force isFullyBooked to false for Mobile Studio Service
            isFullyBooked: studio.name === "Mobile Studio Service" ? false : availableSlots === 0,
            // For Mobile Studio Service, we'll show all slots as available
            availableSlots: studio.name === "Mobile Studio Service" ? timeSlots.length : availableSlots,
            totalSlots: timeSlots.length,
            // Exclude bookings from response to reduce payload size
            bookings: undefined
          };
        });

        res.json(studiosWithAvailability);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  
    getStudioAvailability = async (req, res) => {
      const { id } = req.params;
      const { date, view = 'month' } = req.query;
      const { month, year } = req.query;  // Add support for month/year parameters

      try {
        // Determine the date to use
        let targetDate;
        if (date) {
          targetDate = new Date(date);
        } else if (month && year) {
          targetDate = new Date(year, month - 1); // Month is 0-based in JavaScript
        } else {
          targetDate = new Date();
        }

        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({ 
            error: 'Invalid date format',
            details: 'Please provide a valid date or month/year combination'
          });
        }

        // Get studio operating hours
        const studio = await prisma.studio.findUnique({
          where: { id },
          include: {
            bookings: {
              where: {
                AND: [
                  {
                    status: {
                      not: 'CANCELLED'
                    }
                  },
                  view === 'month' ? {
                    // For month view, get all bookings in the month
                    startTime: {
                      gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
                    },
                    endTime: {
                      lt: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1)
                    }
                  } : {
                    // For day view, get bookings for specific date
                    startTime: {
                      gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
                    },
                    endTime: {
                      lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
                    }
                  }
                ]
              }
            }
          }
        });
  
        if (!studio) {
          return res.status(404).json({ error: 'Studio not found' });
        }

        // For Mobile Studio Service, only show availability from next Friday onwards
        const isMobileStudio = studio.name === "Mobile Studio Service";
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate next Friday
        const nextFriday = new Date();
        nextFriday.setDate(nextFriday.getDate() + ((7 - nextFriday.getDay() + 5) % 7));
        nextFriday.setHours(0, 0, 0, 0);

        if (view === 'month') {
          // Get the first and last day of the month
          const firstDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
          const lastDay = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
          const daysInMonth = lastDay.getDate();

          // Generate availability for each day
          const monthAvailability = [];
          for (let day = 1; day <= daysInMonth; day++) {
            // Create date at midnight for consistent comparison
            const currentDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
            currentDate.setHours(0, 0, 0, 0);
            
            // For Mobile Studio Service, mark dates before next Friday as unavailable
            if (currentDate < today || (isMobileStudio && currentDate < nextFriday)) {
              monthAvailability.push({
                date: currentDate.toISOString().split('T')[0],
                status: 'past',
                availableSlots: 0,
                totalSlots: 0,
                metadata: {
                  isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
                }
              });
              continue;
            }

            // For Mobile Studio Service, show all future slots from Friday as available
            if (isMobileStudio && currentDate >= nextFriday) {
              const timeSlots = generateAvailableTimeSlots(
                studio.openingTime,
                studio.closingTime,
                [] // Empty bookings array since we want to show all slots as available
              );

              monthAvailability.push({
                date: currentDate.toISOString().split('T')[0],
                status: 'available',
                availableSlots: timeSlots.length,
                totalSlots: timeSlots.length,
                metadata: {
                  isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
                  bookings: 0
                }
              });
              continue;
            }

            // Get bookings for this day (for non-mobile studios)
            const dayBookings = studio.bookings.filter(booking => {
              const bookingDate = new Date(booking.startTime);
              return bookingDate.getDate() === day &&
                     bookingDate.getMonth() === currentDate.getMonth() &&
                     bookingDate.getFullYear() === currentDate.getFullYear();
            });

            // Generate time slots for the day
            const timeSlots = generateAvailableTimeSlots(
              studio.openingTime,
              studio.closingTime,
              dayBookings
            );

            const availableSlots = timeSlots.filter(slot => slot.available).length;

            monthAvailability.push({
              date: currentDate.toISOString().split('T')[0],
              status: availableSlots === 0 ? 'fully-booked' : 
                     availableSlots < timeSlots.length ? 'partially-booked' : 'available',
              availableSlots,
              totalSlots: timeSlots.length,
              metadata: {
                isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
                bookings: dayBookings.length
              }
            });
          }

          return res.json({
            studioId: studio.id,
            month: firstDay.toISOString().split('T')[0],
            availability: monthAvailability
          });
        } else {
          // Day view - check if the requested date is before next Friday for Mobile Studio
          const requestedDate = new Date(targetDate);
          requestedDate.setHours(0, 0, 0, 0);

          if (isMobileStudio) {
            if (requestedDate < nextFriday) {
              return res.json({
                studioId: studio.id,
                date: targetDate.toISOString().split('T')[0],
                timeSlots: [],
                message: "Mobile Studio Service is only available from Friday onwards"
              });
            }

            // For Mobile Studio Service, show all slots as available
            const timeSlots = generateAvailableTimeSlots(
              studio.openingTime,
              studio.closingTime,
              [] // Empty bookings array since we want to show all slots as available
            );

            return res.json({
              studioId: studio.id,
              date: targetDate.toISOString().split('T')[0],
              timeSlots
            });
          }

          // For non-mobile studios, return detailed time slots with actual bookings
          const timeSlots = generateAvailableTimeSlots(
            studio.openingTime,
            studio.closingTime,
            studio.bookings
          );

          return res.json({
            studioId: studio.id,
            date: targetDate.toISOString().split('T')[0],
            timeSlots
          });
        }
      } catch (error) {
        console.error('Error getting studio availability:', error);
        res.status(500).json({ 
          error: 'Failed to get studio availability',
          details: error.message 
        });
      }
    }

    getStudioById = async (req, res) => {
      // Implementation
    }

    getStudioPackages = async (req, res) => {
      // Implementation
    }

    createStudio = async (req, res) => {
      const {
        name,
        location,
        imageUrl,
        totalSeats,
        openingTime,
        closingTime,
        packages
      } = req.body;

      try {
        const studio = await prisma.$transaction(async (tx) => {
          // 1. Create the studio
          const newStudio = await tx.studio.create({
            data: {
              name,
              location,
              imageUrl,
              totalSeats,
              openingTime,
              closingTime,
            }
          });

          // Get default packages
          const defaultPackages = await tx.studioPackage.findMany({
            where: {
              studioId: null
            }
          });

          // Connect default packages to the studio
          await tx.studio.update({
            where: { id: newStudio.id },
            data: {
              packages: {
                connect: defaultPackages.map(pkg => ({ id: pkg.id }))
              }
            }
          });

          // 2. Create additional custom packages if provided
          if (packages && packages.length > 0) {
            await Promise.all(packages.map(async (pkg) => {
              const newPackage = await tx.studioPackage.create({
                data: {
                  name: pkg.name,
                  price_per_hour: pkg.pricePerHour,
                  currency: pkg.currency || "AED",
                  description: pkg.description,
                  delivery_time: pkg.deliveryTime,
                  studioId: newStudio.id,
                  // Create package perks if provided
                  packagePerks: pkg.perks ? {
                    create: pkg.perks.map(perk => ({
                      name: perk.name,
                      count: perk.count
                    }))
                  } : undefined
                }
              });
              return newPackage;
            }));
          }

          // 3. Return the created studio with its packages
          return tx.studio.findUnique({
            where: { id: newStudio.id },
            include: {
              packages: {
                include: {
                  packagePerks: true
                }
              }
            }
          });
        });

        res.status(201).json(studio);
      } catch (error) {
        console.error('Error creating studio:', error);
        res.status(500).json({
          error: 'Failed to create studio',
          details: error.message
        });
      }
    }
}