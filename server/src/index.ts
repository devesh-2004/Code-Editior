// server/src/index.ts
import express from "express";
import dotenv from "dotenv";
dotenv.config(); // Load env BEFORE imports

import { createServer } from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes";
import { requireAuth, AuthRequest } from "./middleware/authMiddleware";
import aiRoutes from "./routes/airoutes";

const app = express();
const server = createServer(app);

/**
 * Environment / config
 */
const PORT = Number(process.env.PORT || 5001);
const CLIENT_URL =
  process.env.CLIENT_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
const NODE_ENV = process.env.NODE_ENV || "development";

if (!process.env.JWT_SECRET) {
  console.warn(
    "⚠️ JWT_SECRET is not defined. Tokens will be insecure in production."
  );
}

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// In-memory store: roomId -> File[]
interface FileItem {
  name: string;
  content: string;
}
const rooms = new Map<string, FileItem[]>();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("create_room", ({ roomId, files }: { roomId: string; files: FileItem[] }) => {
    rooms.set(roomId, files);
    socket.join(roomId);
    console.log(`Socket ${socket.id} created room ${roomId} with ${files.length} files`);
  });

  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);

    // If room exists, sync files to the new joiner
    const roomFiles = rooms.get(roomId);
    if (roomFiles) {
      socket.emit("sync_files", roomFiles);
    }
  });

  socket.on("code_change", ({ roomId, fileName, code }: { roomId: string; fileName: string; code: string }) => {
    // Update server memory
    const roomFiles = rooms.get(roomId);
    if (roomFiles) {
      const file = roomFiles.find((f) => f.name === fileName);
      if (file) {
        file.content = code;
      }
    }
    // Broadcast to everyone else in the room
    socket.to(roomId).emit("code_change", { roomId, fileName, code });
  });

  socket.on("file_structure_change", ({ roomId, files }: { roomId: string; files: FileItem[] }) => {
    // Update server memory
    if (rooms.has(roomId)) {
      rooms.set(roomId, files);
    }
    // Broadcast full sync to others
    socket.to(roomId).emit("sync_files", files);
  });

  socket.on(
    "cursor_move",
    ({
      roomId,
      fileName,
      cursor,
      userName,
    }: {
      roomId: string;
      fileName: string;
      cursor: any;
      userName: string;
    }) => {
      // Broadcast cursor position to others in the room
      socket.to(roomId).emit("cursor_move", { roomId, fileName, cursor, userName, socketId: socket.id });
    }
  );

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

/**
 * Start server.
 */
async function startServer() {
  try {
    // Basic security middlewares
    app.use(helmet());

    // Basic rate limiting
    const limiter = rateLimit({
      windowMs: 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);

    // Parse JSON and cookies
    app.use(express.json());
    app.use(cookieParser());

    // CORS
    app.use(
      cors({
        origin: CLIENT_URL,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      })
    );

    /**
     * Routes
     */
    app.use("/api/auth", authRoutes);
    app.use("/api/ai", aiRoutes);

    // Simple healthcheck
    app.get("/api/health", (_req, res) =>
      res.json({ ok: true, env: NODE_ENV })
    );

    // Protected route
    app.get("/api/me", requireAuth, (req, res) => {
      return res.json({ user: (req as AuthRequest).user || null });
    });

    // Fallback 404
    app.use((req, res, next) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: "Not found" });
      }
      next();
    });

    // Error handler
    app.use(
      (
        err: unknown,
        _req: express.Request,
        res: express.Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _next: express.NextFunction
      ) => {
        console.error("Unhandled error:", err);
        const status = (err as { status?: number })?.status || 500;
        const message =
          NODE_ENV === "production"
            ? "Internal server error"
            : (err instanceof Error ? err.message : String(err)) || "Internal server error";
        return res.status(status).json({ error: message });
      }
    );

    server.listen(PORT, () => {
      console.log(
        `✅ Backend server (HTTP + Socket.IO) running on http://localhost:${PORT} (CLIENT_URL=${CLIENT_URL})`
      );
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n⚠️ Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        console.log("HTTP server closed.");
        process.exit(0);
      });

      setTimeout(() => {
        console.error("Forcefully shutting down.");
        process.exit(1);
      }, 10_000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();