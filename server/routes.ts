import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEventSchema, insertRsvpSchema, insertSavedEventSchema } from "@shared/schema";
import { z } from "zod";

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

  // Firebase authentication endpoint
  app.post('/api/auth/firebase', async (req: any, res) => {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "ID token is required" });
      }

      // For now, we'll create a simple middleware that accepts the Firebase token
      // In production, you would verify the token with Firebase Admin SDK
      // But for development, we'll extract user info from the token payload
      const tokenPayload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      
      const userData = {
        id: `firebase_${tokenPayload.sub}`,
        email: tokenPayload.email,
        firstName: tokenPayload.given_name || null,
        lastName: tokenPayload.family_name || null,
        profileImageUrl: tokenPayload.picture || null,
      };

      // Create or update user in database
      const user = await storage.upsertUser(userData);
      
      // Set up session
      req.login(user, (err: any) => {
        if (err) {
          console.error("Error creating session:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }
        res.json({ success: true, user });
      });
    } catch (error) {
      console.error("Firebase auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
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
      const eventData = insertEventSchema.parse({
        ...req.body,
        organizerId: req.user.id,
      });
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
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

  const httpServer = createServer(app);
  return httpServer;
}
