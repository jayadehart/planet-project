import { tool } from 'ai';
import { z } from 'zod';

export const restaurantReservation = tool({
  description:
    'Make a restaurant reservation at a specific venue. Use this when the user wants to book a table at a named restaurant. Returns confirmation details including reservation ID and booking platform.',
  inputSchema: z.object({
    restaurantName: z.string().min(1).describe('Name of the restaurant'),
    location: z.string().min(1).describe('City or location of the restaurant, e.g. "Paris" or "Tokyo, Japan"'),
    date: z.string().describe('Date for the reservation in YYYY-MM-DD format'),
    time: z.string().describe('Time for the reservation in HH:MM format (24-hour)'),
    partySize: z.number().int().min(1).max(20).describe('Number of people (1-20)'),
    specialRequests: z.string().optional().describe('Optional special requests (dietary restrictions, occasion, seating preferences)'),
  }),
  execute: async ({ restaurantName, location, date, time, partySize, specialRequests }) => {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Determine booking platform based on location (mock logic)
    const platform = getPlatformForLocation(location);

    // Generate confirmation number
    const confirmationId = generateConfirmationId();

    return {
      status: 'confirmed',
      confirmationId,
      platform,
      restaurant: {
        name: restaurantName,
        location,
      },
      reservation: {
        date,
        time,
        partySize,
        specialRequests: specialRequests || 'None',
      },
      message: `Reservation confirmed at ${restaurantName} for ${partySize} ${partySize === 1 ? 'person' : 'people'} on ${date} at ${time}. Confirmation #${confirmationId} via ${platform}.`,
    };
  },
});

function getPlatformForLocation(location: string): string {
  const lowerLocation = location.toLowerCase();

  // Mock platform selection based on region
  if (lowerLocation.includes('france') || lowerLocation.includes('paris') ||
      lowerLocation.includes('spain') || lowerLocation.includes('madrid') ||
      lowerLocation.includes('barcelona') || lowerLocation.includes('italy') ||
      lowerLocation.includes('rome') || lowerLocation.includes('milan')) {
    return 'TheFork';
  } else if (lowerLocation.includes('uk') || lowerLocation.includes('london') ||
             lowerLocation.includes('united kingdom')) {
    return 'OpenTable';
  } else if (lowerLocation.includes('japan') || lowerLocation.includes('tokyo') ||
             lowerLocation.includes('kyoto') || lowerLocation.includes('osaka')) {
    return 'TableCheck';
  } else {
    return 'OpenTable';
  }
}

function generateConfirmationId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
