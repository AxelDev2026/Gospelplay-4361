import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
export * from "./auth-schema";
export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  cover: text("cover").notNull(),
  audio: text("audio").notNull(),
  duration: integer("duration").notNull(),
  genre: text("genre").notNull(),
  license: text("license").notNull(),
  source: text("source").notNull(),
  status: text("status").notNull().default("pending"),
  ownerId: text("owner_id"),
});
export const favorites = sqliteTable(
  "favorites",
  { userId: text("user_id").notNull(), trackId: text("track_id").notNull() },
  (t) => [primaryKey({ columns: [t.userId, t.trackId] })],
);
export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  trackIds: text("track_ids").notNull().default("[]"),
});
export const memberships = sqliteTable("memberships", {
  userId: text("user_id").primaryKey(),
  premium: integer("premium", { mode: "boolean" }).notNull().default(false),
});
