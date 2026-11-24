import { NextResponse } from "next/server";

export function ok(data: unknown = {}) {
  return NextResponse.json({ ok: true, data });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Converts Mongoose docs (ObjectId, Date) into plain JSON-safe objects. */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
