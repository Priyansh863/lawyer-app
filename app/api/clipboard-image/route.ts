import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (h === "localhost" || h.endsWith(".localhost")) return true
  if (h === "0.0.0.0" || h === "::1" || h === "127.0.0.1") return true
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const m = h.match(ipv4)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 0) return true
  }
  return false
}

/**
 * Server-side fetch so the browser can read image bytes same-origin (for copy / consistency with download).
 * Your separate API backend does not need changes.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url")
  if (!raw?.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(raw)
  } catch {
    try {
      target = new URL(decodeURIComponent(raw))
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
  }

  if (target.protocol !== "https:" && target.protocol !== "http:") {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 })
  }
  if (isBlockedHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 })
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)

  try {
    const upstream = await fetch(target.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent": "LawyerApp-ClipboardProxy/1.0",
      },
      redirect: "follow",
      cache: "no-store",
    })

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Image fetch failed", status: upstream.status },
        { status: 502 }
      )
    }

    const buf = await upstream.arrayBuffer()
    if (buf.byteLength === 0) {
      return NextResponse.json({ error: "Empty body" }, { status: 502 })
    }

    const ct = upstream.headers.get("content-type") || ""
    const contentType = ct.startsWith("image/") ? ct.split(";")[0].trim() : "application/octet-stream"

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=120",
      },
    })
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}
