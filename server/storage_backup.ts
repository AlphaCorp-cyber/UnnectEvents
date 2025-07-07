import {
  users,
  events,
  rsvps,
  savedEvents,
  adminSettings,
  paymentSettings,
  listingPackages,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type InsertRsvp,
  type InsertSavedEvent,
  type EventWithDetails,
  type AdminSetting,
  type InsertAdminSetting,
  type PaymentSetting,
  type InsertPaymentSetting,
  type ListingPackage,
  type InsertListingPackage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, sql, and, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

  // Admin settings operations
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
  getAllAdminSettings(): Promise<AdminSetting[]>;

  // Payment settings operations
  getPaymentSettings(): Promise<PaymentSetting | undefined>;
  updatePaymentSettings(settings: Partial<InsertPaymentSetting>): Promise<PaymentSetting>;

  // Listing packages operations
  getListingPackages(): Promise<ListingPackage[]>;
  createListingPackage(packageData: InsertListingPackage): Promise<ListingPackage>;
  updateListingPackage(id: number, packageData: Partial<InsertListingPackage>): Promise<ListingPackage>;
  deleteListingPackage(id: number): Promise<void>;
  calculateOptimalPrice(days: number): Promise<{ totalPrice: number; breakdown: Array<{ packageName: string; quantity: number; price: number }> }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Event operations
  async getEvents(userId?: string, category?: string): Promise<EventWithDetails[]> {
    try {
      // Get all events first
      let eventsQuery = db.select().from(events);
      
      if (category && category !== "all") {
        eventsQuery = eventsQuery.where(eq(events.category, category));
      }
      
      const allEvents = await eventsQuery.orderBy(desc(events.date));

      // Get organizers for all events
      const organizerIds = allEvents.map(event => event.organizerId);
      const organizers = await db
        .select()
        .from(users)
        .where(inArray(users.id, organizerIds));

      // Get attendee counts for all events
      const attendeeCounts = await db
        .select({
          eventId: rsvps.eventId,
          count: count(rsvps.id),
        })
        .from(rsvps)
        .where(and(
          inArray(rsvps.eventId, allEvents.map(e => e.id)),
          eq(rsvps.status, "going")
        ))
        .groupBy(rsvps.eventId);

      // If userId is provided, get user's RSVP status and saved status
      let userRsvpMap: Record<number, string> = {};
      let userSavedMap: Record<number, boolean> = {};
      
      if (userId) {
        const userRsvps = await db
          .select({ eventId: rsvps.eventId, status: rsvps.status })
          .from(rsvps)
          .where(eq(rsvps.userId, userId));

        const userSavedEvents = await db
          .select({ eventId: savedEvents.eventId })
          .from(savedEvents)
          .where(eq(savedEvents.userId, userId));

        userRsvpMap = userRsvps.reduce((acc, rsvp) => {
          acc[rsvp.eventId] = rsvp.status;
          return acc;
        }, {} as Record<number, string>);

        userSavedMap = userSavedEvents.reduce((acc, saved) => {
          acc[saved.eventId] = true;
          return acc;
        }, {} as Record<number, boolean>);
      }

      // Create organizer lookup map
      const organizerMap = organizers.reduce((acc, organizer) => {
        acc[organizer.id] = organizer;
        return acc;
      }, {} as Record<string, typeof organizers[0]>);

      // Create attendee count lookup map
      const attendeeCountMap = attendeeCounts.reduce((acc, item) => {
        acc[item.eventId] = item.count;
        return acc;
      }, {} as Record<number, number>);

      // Combine all data
      const result = allEvents.map(event => {
        const organizer = organizerMap[event.organizerId];
        const attendeeCount = attendeeCountMap[event.id] || 0;
        
        return {
          ...event,
          organizer,
          attendeeCount,
          userRsvpStatus: userRsvpMap[event.id] || null,
          isSaved: userSavedMap[event.id] || false,
        };
      }).filter(event => event.organizer !== undefined) as EventWithDetails[];

      return result;

        const rsvpMap = new Map(userRsvps.map(r => [r.eventId, r.status]));
        const savedMap = new Set(userSavedEvents.map(s => s.eventId));

        return validResults.map(result => ({
          ...result,
          organizer: result.organizer!,
          userRsvpStatus: rsvpMap.get(result.id),
          isSaved: savedMap.has(result.id),
        })) as EventWithDetails[];
      }

      return validResults.map(result => ({
        ...result,
        organizer: result.organizer!,
      })) as EventWithDetails[];
    } catch (error) {
      console.error("Error in getEvents:", error);
      throw error;
    }
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

  // Admin settings operations
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, key));
    return setting || undefined;
  }

  async setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const [existingSetting] = await db
      .select()
      .from(adminSettings)
      .where(eq(adminSettings.key, setting.key));

    if (existingSetting) {
      const [updated] = await db
        .update(adminSettings)
        .set({ value: setting.value, updatedAt: new Date() })
        .where(eq(adminSettings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(adminSettings)
        .values(setting)
        .returning();
      return created;
    }
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  // Payment settings operations
  async getPaymentSettings(): Promise<PaymentSetting | undefined> {
    const [settings] = await db
      .select()
      .from(paymentSettings)
      .where(eq(paymentSettings.isActive, true))
      .orderBy(desc(paymentSettings.createdAt));
    return settings || undefined;
  }

  async updatePaymentSettings(settings: Partial<InsertPaymentSetting>): Promise<PaymentSetting> {
    const existingSettings = await this.getPaymentSettings();

    if (existingSettings) {
      const [updated] = await db
        .update(paymentSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(paymentSettings.id, existingSettings.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(paymentSettings)
        .values(settings as InsertPaymentSetting)
        .returning();
      return created;
    }
  }

  async getListingPackages(): Promise<ListingPackage[]> {
    const packages = await db
      .select()
      .from(listingPackages)
      .where(eq(listingPackages.isActive, true))
      .orderBy(asc(listingPackages.duration));
    return packages;
  }

  async createListingPackage(packageData: InsertListingPackage): Promise<ListingPackage> {
    const [newPackage] = await db
      .insert(listingPackages)
      .values(packageData)
      .returning();
    return newPackage;
  }

  async updateListingPackage(id: number, packageData: Partial<InsertListingPackage>): Promise<ListingPackage> {
    const [updatedPackage] = await db
      .update(listingPackages)
      .set(packageData)
      .where(eq(listingPackages.id, id))
      .returning();
    return updatedPackage;
  }

  async deleteListingPackage(id: number): Promise<void> {
    await db
      .update(listingPackages)
      .set({ isActive: false })
      .where(eq(listingPackages.id, id));
  }

  async calculateOptimalPrice(days: number): Promise<{ totalPrice: number; breakdown: Array<{ packageName: string; quantity: number; price: number }> }> {
    const packages = await this.getListingPackages();

    // Sort packages by duration in descending order for optimal calculation
    const sortedPackages = packages.sort((a, b) => b.duration - a.duration);

    let remainingDays = days;
    let totalPrice = 0;
    const breakdown: Array<{ packageName: string; quantity: number; price: number }> = [];

    for (const pkg of sortedPackages) {
      if (remainingDays <= 0) break;

      const quantity = Math.floor(remainingDays / pkg.duration);
      if (quantity > 0) {
        const packagePrice = parseFloat(pkg.price) * quantity;
        totalPrice += packagePrice;
        breakdown.push({
          packageName: pkg.name,
          quantity,
          price: packagePrice
        });
        remainingDays -= quantity * pkg.duration;
      }
    }

    return { totalPrice, breakdown };
  }
}

export const storage = new DatabaseStorage();