import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { restaurantReservation } from './restaurant-reservation';
import type { ToolExecutionOptions } from 'ai';

const mockOptions: ToolExecutionOptions = {
  toolCallId: 'test-call-id',
  messages: [],
};

// Mock Math.random for deterministic confirmation IDs in tests
beforeEach(() => {
  vi.spyOn(Math, 'random').mockImplementation(() => {
    // Return a sequence that generates "AAAAAAAA"
    return 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

type ReservationResult = {
  status: string;
  confirmationId: string;
  platform: string;
  restaurant: {
    name: string;
    location: string;
  };
  reservation: {
    date: string;
    time: string;
    partySize: number;
    specialRequests: string;
  };
  message: string;
};

describe('restaurantReservation tool', () => {
  it('creates a confirmed reservation with all details', async () => {
    const result = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Le Bernardin',
        location: 'Paris',
        date: '2026-06-15',
        time: '19:30',
        partySize: 4,
        specialRequests: 'Window seat, celebrating anniversary',
      },
      mockOptions,
    )) as ReservationResult;

    expect(result).toMatchObject({
      status: 'confirmed',
      confirmationId: 'AAAAAAAA',
      platform: 'TheFork',
      restaurant: {
        name: 'Le Bernardin',
        location: 'Paris',
      },
      reservation: {
        date: '2026-06-15',
        time: '19:30',
        partySize: 4,
        specialRequests: 'Window seat, celebrating anniversary',
      },
    });

    expect(result.message).toContain('Le Bernardin');
    expect(result.message).toContain('4 people');
    expect(result.message).toContain('2026-06-15');
    expect(result.message).toContain('19:30');
  });

  it('handles reservations without special requests', async () => {
    const result = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Sushi Saito',
        location: 'Tokyo, Japan',
        date: '2026-07-20',
        time: '18:00',
        partySize: 2,
      },
      mockOptions,
    )) as ReservationResult;

    expect(result.reservation.specialRequests).toBe('None');
    expect(result.platform).toBe('TableCheck');
  });

  it('uses correct platform for European locations', async () => {
    const resultParis = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Test Restaurant',
        location: 'Paris, France',
        date: '2026-06-01',
        time: '20:00',
        partySize: 2,
      },
      mockOptions,
    )) as ReservationResult;
    expect(resultParis.platform).toBe('TheFork');

    const resultMadrid = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Test Restaurant',
        location: 'Madrid',
        date: '2026-06-01',
        time: '20:00',
        partySize: 2,
      },
      mockOptions,
    )) as ReservationResult;
    expect(resultMadrid.platform).toBe('TheFork');

    const resultRome = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Test Restaurant',
        location: 'Rome, Italy',
        date: '2026-06-01',
        time: '20:00',
        partySize: 2,
      },
      mockOptions,
    )) as ReservationResult;
    expect(resultRome.platform).toBe('TheFork');
  });

  it('uses OpenTable for UK locations', async () => {
    const result = (await restaurantReservation.execute?.(
      {
        restaurantName: 'The Ivy',
        location: 'London, UK',
        date: '2026-06-01',
        time: '19:00',
        partySize: 3,
      },
      mockOptions,
    )) as ReservationResult;
    expect(result.platform).toBe('OpenTable');
  });

  it('uses TableCheck for Japanese locations', async () => {
    const result = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Kikunoi',
        location: 'Kyoto',
        date: '2026-08-10',
        time: '18:30',
        partySize: 4,
      },
      mockOptions,
    )) as ReservationResult;
    expect(result.platform).toBe('TableCheck');
  });

  it('defaults to OpenTable for other locations', async () => {
    const result = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Local Restaurant',
        location: 'Sydney, Australia',
        date: '2026-09-15',
        time: '19:00',
        partySize: 2,
      },
      mockOptions,
    )) as ReservationResult;
    expect(result.platform).toBe('OpenTable');
  });

  it('handles singular party size correctly in message', async () => {
    const result = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Solo Dining',
        location: 'New York',
        date: '2026-06-01',
        time: '20:00',
        partySize: 1,
      },
      mockOptions,
    )) as ReservationResult;
    expect(result.message).toContain('1 person');
  });

  it('handles maximum party size', async () => {
    const result = (await restaurantReservation.execute?.(
      {
        restaurantName: 'Large Group Restaurant',
        location: 'Chicago',
        date: '2026-06-01',
        time: '19:00',
        partySize: 20,
      },
      mockOptions,
    )) as ReservationResult;
    expect(result.reservation.partySize).toBe(20);
    expect(result.message).toContain('20 people');
  });
});
