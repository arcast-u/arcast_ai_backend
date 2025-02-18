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

        // Get next Friday for mobile studio
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + ((7 - today.getDay() + 5) % 7));

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
          const endDate = studio.name === "Mobile studio service" ? nextFriday : twoWeeksFromNow;
          
          // Filter bookings up to the relevant end date
          const relevantBookings = studio.bookings.filter(booking => 
            new Date(booking.startTime) <= endDate
          );

          const timeSlots = generateAvailableTimeSlots(
            studio.openingTime, 
            studio.closingTime, 
            relevantBookings
          );
          
          return {
            ...studio,
            isFullyBooked: !timeSlots.some(slot => slot.available),
            availableSlots: timeSlots.filter(slot => slot.available).length,
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
  
      try {
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
                      gte: new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1)
                    },
                    endTime: {
                      lt: new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 1)
                    }
                  } : {
                    // For day view, get bookings for specific date
                    startTime: {
                      gte: new Date(date)
                    },
                    endTime: {
                      lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1))
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

        if (view === 'month') {
          // Get the first and last day of the month
          const firstDay = new Date(new Date(date).getFullYear(), new Date(date).getMonth(), 1);
          const lastDay = new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 0);
          const daysInMonth = lastDay.getDate();

          // Get today's date at midnight for comparison
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Generate availability for each day
          const monthAvailability = [];
          for (let day = 1; day <= daysInMonth; day++) {
            // Create date at midnight for consistent comparison
            const currentDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), day);
            currentDate.setHours(0, 0, 0, 0);
            
            // Skip dates in the past (before today)
            if (currentDate < today) {
              monthAvailability.push({
                date: currentDate.toISOString().split('T')[0], // Just return the date part
                status: 'past',
                availableSlots: 0,
                totalSlots: 0,
                metadata: {
                  isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
                }
              });
              continue;
            }

            // Get bookings for this day
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
              date: currentDate.toISOString().split('T')[0], // Just return the date part
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
            month: firstDay.toISOString().split('T')[0], // Just return the date part
            availability: monthAvailability
          });
        } else {
          // Day view - return detailed time slots
          const timeSlots = generateAvailableTimeSlots(
            studio.openingTime,
            studio.closingTime,
            studio.bookings
          );

          return res.json({
            studioId: studio.id,
            date: new Date(date).toISOString().split('T')[0], // Just return the date part
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