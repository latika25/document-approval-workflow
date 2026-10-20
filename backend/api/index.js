// Vercel picks up functions from api/. vercel.json rewrites /api/* to this file.
import { handler } from "../dist/vercel.js";

export default handler;
