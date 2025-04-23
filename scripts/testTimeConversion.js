import { formatBookingWithDubaiTime, convertToDubaiTime } from '../src/utils/time.utils.js';

// Sample booking with UTC times (matching the example provided in the request)
const sampleBooking = {
  "id": "65f03133-aa23-4733-9a4c-f4763f9b1265",
  "startTime": "2025-04-25T16:00:00.000Z",
  "endTime": "2025-04-25T17:00:00.000Z",
  "numberOfSeats": 3,
  "totalCost": "2",
  "vatAmount": "0",
  "discountAmount": "0",
  "status": "CONFIRMED",
  "studioId": "8ced17f8-24e1-4911-8df1-cad42d9230b4",
  "packageId": "96e844d2-21ed-421d-81ea-e1bc048e9fe9",
  "leadId": "4d653899-8ee2-4127-be30-d4ae8acfaba3",
  "studio": {
    "id": "8ced17f8-24e1-4911-8df1-cad42d9230b4",
    "name": "Setup 1",
    "location": "Dubai",
    "openingTime": "10:00",
    "closingTime": "21:00"
  }
};

console.log("=== Time Conversion Test ===");

// Test direct time conversion
console.log("\n1. Testing direct time conversion:");
const utcTime = new Date(sampleBooking.startTime);
console.log(`Original UTC Time: ${utcTime.toISOString()}`);

const dubaiTime = convertToDubaiTime(utcTime);
console.log(`Dubai Time (UTC+4): ${dubaiTime.toISOString()}`);

// Test booking object conversion
console.log("\n2. Testing booking object conversion:");
console.log("Original booking times (UTC):");
console.log(`  - Start Time: ${sampleBooking.startTime}`);
console.log(`  - End Time: ${sampleBooking.endTime}`);

const convertedBooking = formatBookingWithDubaiTime(sampleBooking);
console.log("\nConverted booking times (Dubai time, UTC+4):");
console.log(`  - Start Time: ${convertedBooking.startTime}`);
console.log(`  - End Time: ${convertedBooking.endTime}`);

// Verify the conversion is correct
const expectedStartTime = "2025-04-25T20:00:00.000Z";
const expectedEndTime = "2025-04-25T21:00:00.000Z";

console.log("\n3. Verification:");
console.log(`Expected start time: ${expectedStartTime}`);
console.log(`Actual start time:   ${convertedBooking.startTime}`);
console.log(`Is correct: ${convertedBooking.startTime === expectedStartTime ? '✅ Yes' : '❌ No'}`);

console.log(`Expected end time: ${expectedEndTime}`);
console.log(`Actual end time:   ${convertedBooking.endTime}`);
console.log(`Is correct: ${convertedBooking.endTime === expectedEndTime ? '✅ Yes' : '❌ No'}`); 