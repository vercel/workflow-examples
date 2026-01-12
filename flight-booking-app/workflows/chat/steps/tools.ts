import { FatalError, sleep } from 'workflow';
import { z } from 'zod';
import { bookingApprovalHook } from '../hooks/approval';

export const mockAirports: Record<
  string,
  { name: string; city: string; timezone: string }
> = {
  SFO: {
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    timezone: 'PST',
  },
  LAX: {
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    timezone: 'PST',
  },
  JFK: {
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    timezone: 'EST',
  },
  MIA: { name: 'Miami International Airport', city: 'Miami', timezone: 'EST' },
  ATL: {
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    timezone: 'EST',
  },
  ORD: {
    name: "O'Hare International Airport",
    city: 'Chicago',
    timezone: 'CST',
  },
};

/** Search for available flights */
export async function searchFlights({
  from,
  to,
  date,
}: {
  from: string;
  to: string;
  date: string;
}) {
  'use step';

  console.log(`Searching flights from ${from} to ${to} on ${date}`);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Generate 3 flights with different price points and statuses
  const airlines = [
    'United Airlines',
    'American Airlines',
    'Delta Airlines',
    'Southwest Airlines',
    'JetBlue',
  ];
  const statuses = ['On Time', 'Delayed', 'On Time'];
  const priceMultipliers = [1, 1.5, 2.2]; // Budget, mid-range, premium

  // Base price calculation (could be based on distance, popularity, etc.)
  const basePrice = 150 + Math.floor(Math.random() * 200);

  // Generate departure times throughout the day
  const departureHours = [6, 12, 18]; // Morning, afternoon, evening

  const generatedFlights = departureHours.map((hour, index) => {
    const departureTime = new Date(date);
    departureTime.setHours(hour + Math.floor(Math.random() * 4));
    departureTime.setMinutes(Math.floor(Math.random() * 60));

    // Calculate flight duration (1-5 hours)
    const duration = 60 + Math.floor(Math.random() * 240);
    const arrivalTime = new Date(departureTime.getTime() + duration * 60000);

    // Generate flight number
    const airlineCode = ['UA', 'AA', 'DL', 'WN', 'B6'][index % 5];
    const flightNumber = `${airlineCode}${Math.floor(Math.random() * 900) + 100}`;

    return {
      flightNumber,
      from: from.toUpperCase().slice(0, 3), // Convert to 3-letter code format
      to: to.toUpperCase().slice(0, 3),
      departure: departureTime.toISOString(),
      arrival: arrivalTime.toISOString(),
      price: Math.round(basePrice * priceMultipliers[index]),
      airline: airlines[index % airlines.length],
      status: statuses[index],
    };
  });

  return {
    message: `Found ${generatedFlights.length} flights from ${from} to ${to} on ${date}`,
    flights: generatedFlights.sort((a, b) => a.price - b.price), // Sort by price
  };
}

/** Check flight status */
export async function checkFlightStatus({
  flightNumber,
}: {
  flightNumber: string;
}) {
  'use step';

  console.log(`Checking status for flight ${flightNumber}`);

  // 10% chance of error to demonstrate retry
  if (Math.random() < 0.1) {
    throw new Error('Flight status service temporarily unavailable');
  }

  // Generate random flight details
  const airlines = [
    'United Airlines',
    'American Airlines',
    'Delta Airlines',
    'Southwest Airlines',
    'JetBlue',
  ];
  const airports = [
    'LAX',
    'JFK',
    'ORD',
    'ATL',
    'DFW',
    'SFO',
    'MIA',
    'DEN',
    'BOS',
    'SEA',
  ];
  const statuses = [
    'On Time',
    'Delayed',
    'Boarding',
    'Departed',
    'In Flight',
    'Landed',
  ];

  // Random selections
  const fromAirport = airports[Math.floor(Math.random() * airports.length)];
  let toAirport = airports[Math.floor(Math.random() * airports.length)];
  // Ensure different airports
  while (toAirport === fromAirport) {
    toAirport = airports[Math.floor(Math.random() * airports.length)];
  }

  // Generate times
  const now = new Date();
  const departureOffset = (Math.random() - 0.5) * 4 * 60 * 60 * 1000; // +/- 2 hours from now
  const departureTime = new Date(now.getTime() + departureOffset);
  const flightDuration = (60 + Math.floor(Math.random() * 240)) * 60 * 1000; // 1-5 hours
  const arrivalTime = new Date(departureTime.getTime() + flightDuration);

  // Determine gate based on status
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const gate = ['Boarding', 'Departed', 'In Flight', 'Landed'].includes(status)
    ? `${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}${Math.floor(Math.random() * 30) + 1}`
    : Math.random() < 0.7
      ? `${['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]}${Math.floor(Math.random() * 30) + 1}`
      : 'TBD';

  // Add delay information if status is "Delayed"
  const delayMinutes =
    status === 'Delayed' ? Math.floor(Math.random() * 120) + 15 : 0;
  const actualDepartureTime =
    status === 'Delayed'
      ? new Date(departureTime.getTime() + delayMinutes * 60 * 1000)
      : departureTime;
  const actualArrivalTime =
    status === 'Delayed'
      ? new Date(arrivalTime.getTime() + delayMinutes * 60 * 1000)
      : arrivalTime;

  return {
    flightNumber: flightNumber.toUpperCase(),
    status: status + (status === 'Delayed' ? ` (${delayMinutes} minutes)` : ''),
    departure: departureTime.toISOString(),
    arrival: arrivalTime.toISOString(),
    actualDeparture: actualDepartureTime.toISOString(),
    actualArrival: actualArrivalTime.toISOString(),
    from: fromAirport,
    to: toAirport,
    airline: airlines[Math.floor(Math.random() * airlines.length)],
    gate,
    terminal: Math.floor(Math.random() * 4) + 1,
  };
}

/** Get airport information */
export async function getAirportInfo({ airportCode }: { airportCode: string }) {
  'use step';

  console.log(`Getting information for airport ${airportCode}`);

  const airport = mockAirports[airportCode.toUpperCase()];

  if (!airport) {
    return {
      error: `Airport code ${airportCode} not found`,
      suggestion: `Try one of these: ${Object.keys(mockAirports).join(', ')}`,
    };
  }

  return {
    code: airportCode.toUpperCase(),
    ...airport,
    terminals: Math.floor(Math.random() * 4) + 1,
    averageDelay: `${Math.floor(Math.random() * 30)} minutes`,
  };
}

/** Book a flight (mock) */
export async function bookFlight({
  flightNumber,
  passengerName,
  seatPreference,
}: {
  flightNumber: string;
  passengerName: string;
  seatPreference?: string;
}) {
  'use step';

  console.log(`Booking flight ${flightNumber} for ${passengerName}`);

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // 5% chance of seat unavailable
  if (Math.random() < 0.05) {
    throw new FatalError(
      'Selected seat preference not available. Please try a different preference.'
    );
  }

  const confirmationNumber = `BK${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const seatNumber =
    seatPreference === 'window'
      ? `${Math.floor(Math.random() * 30) + 1}A`
      : seatPreference === 'aisle'
        ? `${Math.floor(Math.random() * 30) + 1}C`
        : `${Math.floor(Math.random() * 30) + 1}B`;

  return {
    success: true,
    confirmationNumber,
    passengerName,
    flightNumber,
    seatNumber,
    message: 'Flight booked successfully! Check your email for confirmation.',
  };
}

/** Check baggage allowance */
export async function checkBaggageAllowance({
  airline,
  ticketClass,
}: {
  airline: string;
  ticketClass: string;
}) {
  'use step';

  console.log(`Checking baggage allowance for ${airline} ${ticketClass} class`);

  const allowances = {
    economy: { carryOn: 1, checked: 1, maxWeight: '50 lbs' },
    business: { carryOn: 2, checked: 2, maxWeight: '70 lbs' },
    first: { carryOn: 2, checked: 3, maxWeight: '70 lbs' },
  };

  const classKey = ticketClass.toLowerCase() as keyof typeof allowances;
  const allowance = allowances[classKey] || allowances.economy;

  return {
    airline,
    class: ticketClass,
    carryOnBags: allowance.carryOn,
    checkedBags: allowance.checked,
    maxWeightPerBag: allowance.maxWeight,
    oversizeFee: '$150 per bag',
  };
}

async function executeSleep({ durationMs }: { durationMs: number }) {
  // Note: No "use step" here - sleep is a workflow-level function
  await sleep(durationMs);
  return { message: `Slept for ${durationMs}ms` };
}

async function executeBookingApproval(
  {
    flightNumber,
    passengerName,
    price,
  }: { flightNumber: string; passengerName: string; price: number },
  { toolCallId }: { toolCallId: string }
) {
  // Note: No "use step" here - hooks are workflow-level primitives
  // Use the toolCallId as the hook token so the UI can reference it
  const hook = bookingApprovalHook.create({ token: toolCallId });
  // Workflow pauses here until the hook is resolved
  const { approved, comment } = await hook;
  if (!approved) {
    return `Booking rejected: ${comment || 'No reason provided'}`;
  }
  return `Booking approved for ${passengerName} on flight ${flightNumber} (Price: ${price})${comment ? ` - Note: ${comment}` : ''}`;
}

// Tool definitions
export const flightBookingTools = {
  searchFlights: {
    description:
      'Search for available flights between two cities on a specific date',
    inputSchema: z.object({
      from: z.string().describe('Departure city or airport code'),
      to: z.string().describe('Arrival city or airport code'),
      date: z.string().describe('Travel date in YYYY-MM-DD format'),
    }),
    execute: searchFlights,
  },
  checkFlightStatus: {
    description: 'Check the current status of a specific flight',
    inputSchema: z.object({
      flightNumber: z.string().describe('Flight number (e.g., UA123)'),
    }),
    execute: checkFlightStatus,
  },
  getAirportInfo: {
    description: 'Get information about a specific airport',
    inputSchema: z.object({
      airportCode: z.string().describe('3-letter airport code (e.g., LAX)'),
    }),
    execute: getAirportInfo,
  },
  bookFlight: {
    description: 'Book a flight for a passenger',
    inputSchema: z.object({
      flightNumber: z.string().describe('Flight number to book'),
      passengerName: z.string().describe('Full name of the passenger'),
      seatPreference: z
        .string()
        .optional()
        .describe('Seat preference: window, aisle, or middle'),
    }),
    execute: bookFlight,
  },
  checkBaggageAllowance: {
    description:
      'Check baggage allowance for a specific airline and ticket class',
    inputSchema: z.object({
      airline: z.string().describe('Name of the airline'),
      ticketClass: z
        .string()
        .describe('Ticket class: economy, business, or first'),
    }),
    execute: checkBaggageAllowance,
  },
  sleep: {
    description: 'Pause execution for a specified duration',
    inputSchema: z.object({
      durationMs: z.number().describe('Duration to sleep in milliseconds'),
    }),
    execute: executeSleep,
  },
  bookingApproval: {
    description: 'Request human approval before booking a flight',
    inputSchema: z.object({
      flightNumber: z.string().describe('Flight number to book'),
      passengerName: z.string().describe('Name of the passenger'),
      price: z.number().describe('Total price of the booking'),
    }),
    execute: executeBookingApproval,
  },
};

// System prompt
export const FLIGHT_ASSISTANT_PROMPT = `You are a helpful flight booking assistant. You can help users:
- Search for flights between cities
- Check flight status
- Get airport information
- Book flights
- Check baggage allowances

Be friendly and professional. When searching for flights, always ask for travel dates if not provided.
When booking flights, confirm all details before proceeding.`;
