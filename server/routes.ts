import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertEventSchema, insertRsvpSchema, insertSavedEventSchema, insertAdminSettingSchema, insertPaymentSettingSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user;
  if (!user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });



  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const category = req.query.category as string;
      const userId = (req.user as any)?.id;
      const events = await storage.getEvents(userId, category);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      const event = await storage.getEvent(eventId, userId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Creating event with body:", req.body);
      const { days, ...otherData } = req.body;
      
      // Check payment settings to determine pricing
      const paymentSettings = await storage.getPaymentSettings();
      const isPaidMode = paymentSettings?.isPaidVersion || false;
      
      let finalPrice = "0";
      if (isPaidMode) {
        const pricing = await storage.calculateOptimalPrice(days || 1);
        finalPrice = pricing.totalPrice.toString();
      }
      
      const dataToValidate = {
        ...otherData,
        days: days || 1,
        price: finalPrice,
        organizerId: req.user.id,
        date: otherData.date ? new Date(otherData.date) : new Date(),
      };
      
      console.log("Data to validate:", dataToValidate);
      
      const eventData = insertEventSchema.parse(dataToValidate);
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        console.error("Request body:", req.body);
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if user owns the event
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent || existingEvent.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this event" });
      }

      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(eventId, eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if user owns the event
      const existingEvent = await storage.getEvent(eventId);
      if (!existingEvent || existingEvent.organizerId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this event" });
      }

      await storage.deleteEvent(eventId);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // User events
  app.get('/api/my-events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const events = await storage.getUserEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "Failed to fetch user events" });
    }
  });

  // RSVP routes
  app.post('/api/events/:id/rsvp', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id;
      const { status } = req.body;

      const rsvpData = insertRsvpSchema.parse({
        eventId,
        userId,
        status: status || "going",
      });

      await storage.createRsvp(rsvpData);
      res.json({ message: "RSVP created successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid RSVP data", errors: error.errors });
      }
      console.error("Error creating RSVP:", error);
      res.status(500).json({ message: "Failed to create RSVP" });
    }
  });

  app.delete('/api/events/:id/rsvp', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id;
      await storage.deleteRsvp(eventId, userId);
      res.json({ message: "RSVP removed successfully" });
    } catch (error) {
      console.error("Error removing RSVP:", error);
      res.status(500).json({ message: "Failed to remove RSVP" });
    }
  });

  // User RSVPs
  app.get('/api/my-rsvps', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const events = await storage.getUserRsvps(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user RSVPs:", error);
      res.status(500).json({ message: "Failed to fetch user RSVPs" });
    }
  });

  // Saved events routes
  app.post('/api/events/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id;

      const savedEventData = insertSavedEventSchema.parse({
        eventId,
        userId,
      });

      await storage.saveEvent(savedEventData);
      res.json({ message: "Event saved successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid save data", errors: error.errors });
      }
      console.error("Error saving event:", error);
      res.status(500).json({ message: "Failed to save event" });
    }
  });

  app.delete('/api/events/:id/save', isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const userId = req.user.id;
      await storage.unsaveEvent(eventId, userId);
      res.json({ message: "Event unsaved successfully" });
    } catch (error) {
      console.error("Error unsaving event:", error);
      res.status(500).json({ message: "Failed to unsave event" });
    }
  });

  // User saved events
  app.get('/api/saved-events', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const events = await storage.getUserSavedEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching saved events:", error);
      res.status(500).json({ message: "Failed to fetch saved events" });
    }
  });

  // Create admin credentials route (temporary - remove after use)
  app.post('/api/create-admin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Update existing user to be admin
        await storage.updateUser(existingUser.id, { isAdmin: true });
        return res.json({ message: "User updated to admin successfully", email });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create new admin user
      const adminUser = await storage.upsertUser({
        id: `local_admin_${Date.now()}`,
        email,
        firstName: "Admin",
        lastName: "User",
        profileImageUrl: null,
        passwordHash,
        isAdmin: true,
      });
      
      res.json({ 
        message: "Admin user created successfully", 
        email: adminUser.email
      });
    } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  // Admin routes
  app.get('/api/admin/settings', isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      // Don't return sensitive values in the response
      const safeSetting = settings.map(setting => ({
        ...setting,
        value: setting.isEncrypted ? '[ENCRYPTED]' : setting.value
      }));
      res.json(safeSetting);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      res.status(500).json({ message: "Failed to fetch admin settings" });
    }
  });

  app.post('/api/admin/settings', isAdmin, async (req: any, res) => {
    try {
      const { key, value, isEncrypted } = req.body;
      
      const settingData = insertAdminSettingSchema.parse({
        key,
        value,
        isEncrypted: isEncrypted || false
      });

      const setting = await storage.setAdminSetting(settingData);
      res.json({
        ...setting,
        value: setting.isEncrypted ? '[ENCRYPTED]' : setting.value
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      console.error("Error saving admin setting:", error);
      res.status(500).json({ message: "Failed to save admin setting" });
    }
  });

  app.get('/api/admin/payment-settings', async (req, res) => {
    try {
      const settings = await storage.getPaymentSettings();
      if (!settings) {
        return res.json({
          isPaidVersion: false,
          eventPostingPrice: "0",
          paynowMerchantId: "",
          paynowIntegrationId: "",
          paynowIntegrationKey: ""
        });
      }
      
      res.json({
        ...settings,
        paynowIntegrationKey: settings.paynowIntegrationKey ? '[ENCRYPTED]' : ''
      });
    } catch (error) {
      console.error("Error fetching payment settings:", error);
      res.status(500).json({ message: "Failed to fetch payment settings" });
    }
  });

  app.post('/api/admin/payment-settings', isAdmin, async (req: any, res) => {
    try {
      const paymentData = insertPaymentSettingSchema.parse(req.body);
      const settings = await storage.updatePaymentSettings(paymentData);
      
      res.json({
        ...settings,
        paynowIntegrationKey: settings.paynowIntegrationKey ? '[ENCRYPTED]' : ''
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment settings", errors: error.errors });
      }
      console.error("Error updating payment settings:", error);
      res.status(500).json({ message: "Failed to update payment settings" });
    }
  });

  // Listing packages routes
  app.get('/api/listing-packages', async (req: any, res) => {
    try {
      const packages = await storage.getListingPackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching listing packages:", error);
      res.status(500).json({ message: "Failed to fetch listing packages" });
    }
  });

  // Calculate optimal pricing for given days
  app.post('/api/calculate-price', async (req: any, res) => {
    try {
      const { days } = req.body;
      
      if (!days || days < 1) {
        return res.status(400).json({ message: "Invalid number of days" });
      }
      
      const pricing = await storage.calculateOptimalPrice(parseInt(days));
      res.json(pricing);
    } catch (error) {
      console.error("Error calculating price:", error);
      res.status(500).json({ message: "Failed to calculate price" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
