import { db } from "./db";
import { users, events, rsvps, savedEvents, adminSettings, paymentSettings, listingPackages, UpsertUser, User, Event, EventWithDetails, InsertEvent, InsertRsvp, InsertSavedEvent, AdminSetting, InsertAdminSetting, PaymentSetting, InsertPaymentSetting, ListingPackage, InsertListingPackage } from "../shared/schema";
import { eq, desc, and, count, sql, inArray } from "drizzle-orm";

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
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUser(userData.id);
    if (existing) {
      const updated = await db.update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, userData.id))
        .returning();
      return updated[0];
    } else {
      const user = await db.insert(users).values(userData).returning();
      return user[0];
    }
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const user = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user[0];
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

      if (allEvents.length === 0) {
        return [];
      }

      // Get organizers for all events
      const organizerIds = [...new Set(allEvents.map(event => event.organizerId))];
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
    } catch (error) {
      console.error("Error in getEvents:", error);
      throw error;
    }
  }

  async getEvent(id: number, userId?: string): Promise<EventWithDetails | undefined> {
    try {
      const eventResults = await db.select().from(events).where(eq(events.id, id));
      if (eventResults.length === 0) return undefined;

      const event = eventResults[0];
      
      // Get organizer
      const organizer = await this.getUser(event.organizerId);
      if (!organizer) return undefined;

      // Get attendee count
      const attendeeCountResult = await db
        .select({ count: count(rsvps.id) })
        .from(rsvps)
        .where(and(eq(rsvps.eventId, id), eq(rsvps.status, "going")))
        .groupBy(rsvps.eventId);

      const attendeeCount = attendeeCountResult[0]?.count || 0;

      // Get user's RSVP status if userId provided
      let userRsvpStatus = null;
      let isSaved = false;
      
      if (userId) {
        const userRsvp = await db
          .select({ status: rsvps.status })
          .from(rsvps)
          .where(and(eq(rsvps.eventId, id), eq(rsvps.userId, userId)));
        
        userRsvpStatus = userRsvp[0]?.status || null;

        const savedEvent = await db
          .select()
          .from(savedEvents)
          .where(and(eq(savedEvents.eventId, id), eq(savedEvents.userId, userId)));
        
        isSaved = savedEvent.length > 0;
      }

      return {
        ...event,
        organizer,
        attendeeCount,
        userRsvpStatus,
        isSaved,
      } as EventWithDetails;
    } catch (error) {
      console.error("Error in getEvent:", error);
      throw error;
    }
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(event).returning();
    return result[0];
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event> {
    const result = await db
      .update(events)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return result[0];
  }

  async deleteEvent(id: number): Promise<void> {
    // Delete related RSVPs first
    await db.delete(rsvps).where(eq(rsvps.eventId, id));
    
    // Delete related saved events
    await db.delete(savedEvents).where(eq(savedEvents.eventId, id));
    
    // Now delete the event
    await db.delete(events).where(eq(events.id, id));
  }

  async getUserEvents(userId: string): Promise<EventWithDetails[]> {
    try {
      const userEvents = await db.select().from(events).where(eq(events.organizerId, userId));
      
      if (userEvents.length === 0) {
        return [];
      }

      const organizer = await this.getUser(userId);
      if (!organizer) return [];

      // Get attendee counts
      const attendeeCounts = await db
        .select({
          eventId: rsvps.eventId,
          count: count(rsvps.id),
        })
        .from(rsvps)
        .where(and(
          inArray(rsvps.eventId, userEvents.map(e => e.id)),
          eq(rsvps.status, "going")
        ))
        .groupBy(rsvps.eventId);

      const attendeeCountMap = attendeeCounts.reduce((acc, item) => {
        acc[item.eventId] = item.count;
        return acc;
      }, {} as Record<number, number>);

      return userEvents.map(event => ({
        ...event,
        organizer,
        attendeeCount: attendeeCountMap[event.id] || 0,
        userRsvpStatus: null,
        isSaved: false,
      })) as EventWithDetails[];
    } catch (error) {
      console.error("Error in getUserEvents:", error);
      throw error;
    }
  }

  // RSVP operations
  async createRsvp(rsvp: InsertRsvp): Promise<void> {
    await db.insert(rsvps).values(rsvp);
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
    // Similar to getEvents but filtered by user RSVPs
    const userRsvps = await db.select().from(rsvps).where(eq(rsvps.userId, userId));
    
    if (userRsvps.length === 0) {
      return [];
    }

    const eventIds = userRsvps.map(rsvp => rsvp.eventId);
    const userEvents = await db.select().from(events).where(inArray(events.id, eventIds));

    // Get organizers
    const organizerIds = [...new Set(userEvents.map(event => event.organizerId))];
    const organizers = await db.select().from(users).where(inArray(users.id, organizerIds));

    const organizerMap = organizers.reduce((acc, organizer) => {
      acc[organizer.id] = organizer;
      return acc;
    }, {} as Record<string, typeof organizers[0]>);

    const rsvpMap = userRsvps.reduce((acc, rsvp) => {
      acc[rsvp.eventId] = rsvp.status;
      return acc;
    }, {} as Record<number, string>);

    return userEvents.map(event => ({
      ...event,
      organizer: organizerMap[event.organizerId],
      attendeeCount: 0, // We can calculate this if needed
      userRsvpStatus: rsvpMap[event.id],
      isSaved: false,
    })).filter(event => event.organizer !== undefined) as EventWithDetails[];
  }

  // Saved events operations
  async saveEvent(savedEvent: InsertSavedEvent): Promise<void> {
    await db.insert(savedEvents).values(savedEvent);
  }

  async unsaveEvent(eventId: number, userId: string): Promise<void> {
    await db.delete(savedEvents).where(and(eq(savedEvents.eventId, eventId), eq(savedEvents.userId, userId)));
  }

  async getUserSavedEvents(userId: string): Promise<EventWithDetails[]> {
    const userSavedEvents = await db.select().from(savedEvents).where(eq(savedEvents.userId, userId));
    
    if (userSavedEvents.length === 0) {
      return [];
    }

    const eventIds = userSavedEvents.map(saved => saved.eventId);
    const savedEventsList = await db.select().from(events).where(inArray(events.id, eventIds));

    // Get organizers
    const organizerIds = [...new Set(savedEventsList.map(event => event.organizerId))];
    const organizers = await db.select().from(users).where(inArray(users.id, organizerIds));

    const organizerMap = organizers.reduce((acc, organizer) => {
      acc[organizer.id] = organizer;
      return acc;
    }, {} as Record<string, typeof organizers[0]>);

    return savedEventsList.map(event => ({
      ...event,
      organizer: organizerMap[event.organizerId],
      attendeeCount: 0, // We can calculate this if needed
      userRsvpStatus: null,
      isSaved: true,
    })).filter(event => event.organizer !== undefined) as EventWithDetails[];
  }

  // Admin settings operations
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const result = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return result[0];
  }

  async setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(setting.key);
    if (existing) {
      const updated = await db
        .update(adminSettings)
        .set({ value: setting.value, isEncrypted: setting.isEncrypted })
        .where(eq(adminSettings.key, setting.key))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(adminSettings).values(setting).returning();
      return created[0];
    }
  }

  async getAllAdminSettings(): Promise<AdminSetting[]> {
    return await db.select().from(adminSettings);
  }

  // Payment settings operations
  async getPaymentSettings(): Promise<PaymentSetting | undefined> {
    const result = await db.select().from(paymentSettings);
    return result[0];
  }

  async updatePaymentSettings(settings: Partial<InsertPaymentSetting>): Promise<PaymentSetting> {
    const existing = await this.getPaymentSettings();
    if (existing) {
      const updated = await db
        .update(paymentSettings)
        .set(settings)
        .where(eq(paymentSettings.id, existing.id))
        .returning();
      return updated[0];
    } else {
      const created = await db.insert(paymentSettings).values(settings as InsertPaymentSetting).returning();
      return created[0];
    }
  }

  // Listing packages operations
  async getListingPackages(): Promise<ListingPackage[]> {
    return await db.select().from(listingPackages);
  }

  async createListingPackage(packageData: InsertListingPackage): Promise<ListingPackage> {
    const result = await db.insert(listingPackages).values(packageData).returning();
    return result[0];
  }

  async updateListingPackage(id: number, packageData: Partial<InsertListingPackage>): Promise<ListingPackage> {
    const result = await db
      .update(listingPackages)
      .set(packageData)
      .where(eq(listingPackages.id, id))
      .returning();
    return result[0];
  }

  async deleteListingPackage(id: number): Promise<void> {
    await db.delete(listingPackages).where(eq(listingPackages.id, id));
  }

  async calculateOptimalPrice(days: number): Promise<{ totalPrice: number; breakdown: Array<{ packageName: string; quantity: number; price: number }> }> {
    const packages = await this.getListingPackages();
    
    if (packages.length === 0) {
      return { totalPrice: 0, breakdown: [] };
    }

    // Sort packages by duration (largest first for greedy algorithm)
    const sortedPackages = packages.sort((a, b) => b.duration - a.duration);

    let remainingDays = days;
    const breakdown: Array<{ packageName: string; quantity: number; price: number }> = [];
    let totalPrice = 0;

    // Use greedy algorithm: start with largest packages first
    for (const pkg of sortedPackages) {
      const quantity = Math.floor(remainingDays / pkg.duration);
      if (quantity > 0) {
        const packagePrice = quantity * parseFloat(pkg.price.toString());
        breakdown.push({
          packageName: pkg.name,
          quantity,
          price: packagePrice,
        });
        totalPrice += packagePrice;
        remainingDays -= quantity * pkg.duration;
      }
    }

    return { totalPrice, breakdown };
  }
}

export const storage = new DatabaseStorage();