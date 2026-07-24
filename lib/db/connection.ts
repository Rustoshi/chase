import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Add it to .env.local before starting the server."
  )
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

// In Next.js, module-level variables reset between hot reloads in dev.
// Attaching to globalThis persists the connection across reloads.
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = (globalThis._mongooseCache ??= {
  conn: null,
  promise: null,
})

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  cached.promise ??= mongoose
    .connect(MONGODB_URI as string, { bufferCommands: false })
    .then((m) => {
      console.log("[MongoDB] Connected")
      return m
    })

  cached.conn = await cached.promise
  return cached.conn
}

export default connectDB
