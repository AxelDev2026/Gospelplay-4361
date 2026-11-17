import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { authed, admin } from "../middleware/auth";
import { db } from "../database";
import { tracks, favorites, playlists, memberships } from "../database/schema";
const seeds = [
  {
    id: "grace-strings",
    title: "Amazing Grace",
    artist: "USAF Band · Strolling Strings",
    cover: "/images/sunrise.jpg",
    audio: "/audio/amazing-grace.mp3",
    duration: 125,
    genre: "Instrumental",
    license: "Domínio público — obra do governo dos EUA",
    source: "https://commons.wikimedia.org/wiki/File:Amazing_Grace_(USAFB_strings).ogg",
    status: "published",
  },
  {
    id: "grace-acoustic",
    title: "Amazing Grace · Acústico",
    artist: "Rocks From The Garden",
    cover: "/images/mountain.jpg",
    audio: "/audio/amazing-grace-acoustic.mp3",
    duration: 174,
    genre: "Acústico",
    license: "Domínio público — disponibilizado pelo autor",
    source:
      "https://commons.wikimedia.org/wiki/File:Amazing_Grace_with_vocals_and_guitar_by_Rocks_From_The_Garden_-_20060603.ogg",
    status: "published",
  },
  {
    id: "grace-brass",
    title: "Amazing Grace · Celebração",
    artist: "USAF Band · Ceremonial Brass",
    cover: "/images/praise.jpg",
    audio: "/audio/amazing-grace-brass.mp3",
    duration: 169,
    genre: "Hinos",
    license: "Domínio público — obra do governo dos EUA",
    source: "https://commons.wikimedia.org/wiki/File:Amazing_Grace_(USAFB_brass).ogg",
    status: "published",
  },
];
let seeded = false;
async function seed() {
  if (!seeded) {
    await db.insert(tracks).values(seeds).onConflictDoNothing();
    seeded = true;
  }
}
export const music = {
  catalog: base.handler(async () => {
    await seed();
    return db.select().from(tracks).where(eq(tracks.status, "published"));
  }),
  library: authed.handler(async ({ context }) => ({
    favorites: (await db.select().from(favorites).where(eq(favorites.userId, context.user.id))).map(
      (f) => f.trackId,
    ),
    playlists: await db.select().from(playlists).where(eq(playlists.userId, context.user.id)),
    premium:
      (await db.select().from(memberships).where(eq(memberships.userId, context.user.id)))[0]
        ?.premium ?? false,
    isAdmin:
      !!process.env.ADMIN_EMAIL &&
      context.user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
  })),
  favorite: authed
    .input(z.object({ id: z.string(), liked: z.boolean() }))
    .handler(async ({ input, context }) => {
      if (input.liked)
        await db
          .insert(favorites)
          .values({ userId: context.user.id, trackId: input.id })
          .onConflictDoNothing();
      else
        await db
          .delete(favorites)
          .where(and(eq(favorites.userId, context.user.id), eq(favorites.trackId, input.id)));
      return { ok: true };
    }),
  createPlaylist: authed
    .input(
      z.object({ name: z.string().trim().min(1).max(60), trackIds: z.array(z.string()).max(500) }),
    )
    .handler(async ({ context, input }) => {
      const p = {
        id: crypto.randomUUID(),
        userId: context.user.id,
        name: input.name,
        trackIds: JSON.stringify(input.trackIds),
      };
      await db.insert(playlists).values(p);
      return p;
    }),
  demoPremium: authed
    .input(z.object({ enabled: z.boolean() }))
    .handler(async ({ context, input }) => {
      await db
        .insert(memberships)
        .values({ userId: context.user.id, premium: input.enabled })
        .onConflictDoUpdate({ target: memberships.userId, set: { premium: input.enabled } });
      return { premium: input.enabled, demo: true };
    }),
  submissions: authed.handler(async ({ context }) => {
    const isAdmin =
      !!process.env.ADMIN_EMAIL &&
      context.user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
    return isAdmin
      ? db.select().from(tracks)
      : db.select().from(tracks).where(eq(tracks.ownerId, context.user.id));
  }),
  submit: authed
    .input(
      z.object({
        title: z.string().trim().min(1).max(100),
        artist: z.string().trim().min(1).max(100),
        audio: z.url().startsWith("https://"),
        cover: z.url().startsWith("https://"),
        duration: z.number().int().min(1).max(7200),
        genre: z.enum(["Adoração", "Instrumental", "Acústico", "Hinos"]),
        license: z.string().trim().min(15).max(2000),
        source: z.url().startsWith("https://"),
        authorized: z.literal(true),
      }),
    )
    .handler(async ({ context, input }) => {
      const { authorized: _authorized, ...fields } = input;
      const record = {
        ...fields,
        id: crypto.randomUUID(),
        ownerId: context.user.id,
        status: "pending",
      };
      await db.insert(tracks).values(record);
      return record;
    }),
  moderate: admin
    .input(z.object({ id: z.string(), status: z.enum(["published", "rejected", "pending"]) }))
    .handler(async ({ input }) => {
      await db.update(tracks).set({ status: input.status }).where(eq(tracks.id, input.id));
      return { ok: true };
    }),
  weather: base
    .input(
      z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) }),
    )
    .handler(async ({ input }) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${input.latitude}&longitude=${input.longitude}&current=temperature_2m,weather_code`;
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!r.ok) throw new Error();
        const data = await r.json();
        return {
          temperature: Math.round(data.current.temperature_2m),
          code: data.current.weather_code as number,
        };
      } catch {
        throw new ORPCError("BAD_GATEWAY", { message: "Não foi possível carregar o clima." });
      }
    }),
};
