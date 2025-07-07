import {
  users,
  events,
  rsvps,
  savedEvents,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type InsertRsvp,
  type InsertSavedEvent,
  type EventWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Event operations
  getEvents(userId?: string, category?: string): Promise<EventWithDetails[]>;
  getEvent(id: number, userId?: string): Promise<EventWithDetails | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;
  getUserEvents(userId: string): Promise<EventWithDetails[]>;

  // RSVP operations
  createRsvp(rsvp: InsertRsvp): Promise<void>;
  updateRsvp(eventId: number, userId: string, status: string): Promise<void>;
  deleteRsvp(eventId: number, userId: string): Promise<void>;
  getUserRsvps(userId: string): Promise<EventWithDetails[]>;

  // Saved events operations
  saveEvent(savedEvent: InsertSavedEvent): Promise<void>;
  unsaveEvent(eventId: number, userId: string): Promise<void>;
  getUserSavedEvents(userId: string): Promise<EventWithDetails[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Event operations
  async getEvents(userId?: string, category?: string): Promise<EventWithDetails[]> {
    const baseQuery = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        category: events.category,
        price: events.price,
        maxAttendees: events.maxAttendees,
        imageUrl: events.imageUrl,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: users,
        attendeeCount: count(rsvps.id),
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(rsvps, and(eq(rsvps.eventId, events.id), eq(rsvps.status, "going")))
      .groupBy(events.id, users.id)
      .orderBy(desc(events.date));

    let query = baseQuery;
    if (category && category !== "all") {
      query = query.where(eq(events.category, category));
    }

    const results = await query;

    // If userId is provided, get user's RSVP status and saved status
    if (userId) {
      const userRsvps = await db
        .select({ eventId: rsvps.eventId, status: rsvps.status })
        .from(rsvps)
        .where(eq(rsvps.userId, userId));

      const userSavedEvents = await db
        .select({ eventId: savedEvents.eventId })
        .from(savedEvents)
        .where(eq(savedEvents.userId, userId));

      const rsvpMap = new Map(userRsvps.map(r => [r.eventId, r.status]));
      const savedMap = new Set(userSavedEvents.map(s => s.eventId));

      return results.map(result => ({
        ...result,
        userRsvpStatus: rsvpMap.get(result.id),
        isSaved: savedMap.has(result.id),
      }));
    }

    return results;
  }

  async getEvent(id: number, userId?: string): Promise<EventWithDetails | undefined> {
    const [result] = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        category: events.category,
        price: events.price,
        maxAttendees: events.maxAttendees,
        imageUrl: events.imageUrl,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: users,
        attendeeCount: count(rsvps.id),
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(rsvps, and(eq(rsvps.eventId, events.id), eq(rsvps.status, "going")))
      .where(eq(events.id, id))
      .groupBy(events.id, users.id);

    if (!result) return undefined;

    if (userId) {
      const [userRsvp] = await db
        .select({ status: rsvps.status })
        .from(rsvps)
        .where(and(eq(rsvps.eventId, id), eq(rsvps.userId, userId)));

      const [savedEvent] = await db
        .select({ id: savedEvents.id })
        .from(savedEvents)
        .where(and(eq(savedEvents.eventId, id), eq(savedEvents.userId, userId)));

      return {
        ...result,
        userRsvpStatus: userRsvp?.status,
        isSaved: !!savedEvent,
      };
    }

    return result;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    const [updatedEvent] = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getUserEvents(userId: string): Promise<EventWithDetails[]> {
    const results = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        category: events.category,
        price: events.price,
        maxAttendees: events.maxAttendees,
        imageUrl: events.imageUrl,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: users,
        attendeeCount: count(rsvps.id),
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(rsvps, and(eq(rsvps.eventId, events.id), eq(rsvps.status, "going")))
      .where(eq(events.organizerId, userId))
      .groupBy(events.id, users.id)
      .orderBy(desc(events.date));

    return results;
  }

  // RSVP operations
  async createRsvp(rsvp: InsertRsvp): Promise<void> {
    await db.insert(rsvps).values(rsvp).onConflictDoUpdate({
      target: [rsvps.eventId, rsvps.userId],
      set: { status: rsvp.status },
    });
  }

  async updateRsvp(eventId: number, userId: string, status: string): Promise<void> {
    await db
      .update(rsvps)
      .set({ status })
      .where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, userId)));
  }

  async deleteRsvp(eventId: number, userId: string): Promise<void> {
    await db.delete(rsvps).where(and(eq(rsvps.eventId, eventId), eq(rsvps.userId, userId)));
  }

  async getUserRsvps(userId: string): Promise<EventWithDetails[]> {
    const results = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        category: events.category,
        price: events.price,
        maxAttendees: events.maxAttendees,
        imageUrl: events.imageUrl,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: users,
        attendeeCount: count(rsvps.id),
        userRsvpStatus: rsvps.status,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(rsvps, and(eq(rsvps.eventId, events.id), eq(rsvps.status, "going")))
      .innerJoin(
        sql`(SELECT * FROM ${rsvps} WHERE ${rsvps.userId} = ${userId}) as user_rsvp`,
        sql`user_rsvp.event_id = ${events.id}`
      )
      .groupBy(events.id, users.id, sql`user_rsvp.status`)
      .orderBy(desc(events.date));

    return results;
  }

  // Saved events operations
  async saveEvent(savedEvent: InsertSavedEvent): Promise<void> {
    await db.insert(savedEvents).values(savedEvent);
  }

  async unsaveEvent(eventId: number, userId: string): Promise<void> {
    await db.delete(savedEvents).where(
      and(eq(savedEvents.eventId, eventId), eq(savedEvents.userId, userId))
    );
  }

  async getUserSavedEvents(userId: string): Promise<EventWithDetails[]> {
    const results = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        location: events.location,
        category: events.category,
        price: events.price,
        maxAttendees: events.maxAttendees,
        imageUrl: events.imageUrl,
        organizerId: events.organizerId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        organizer: users,
        attendeeCount: count(rsvps.id),
        isSaved: sql<boolean>`true`,
      })
      .from(events)
      .leftJoin(users, eq(events.organizerId, users.id))
      .leftJoin(rsvps, and(eq(rsvps.eventId, events.id), eq(rsvps.status, "going")))
      .innerJoin(savedEvents, eq(savedEvents.eventId, events.id))
      .where(eq(savedEvents.userId, userId))
      .groupBy(events.id, users.id)
      .orderBy(desc(events.date));

    return results;
  }
}

export const storage = new DatabaseStorage();
