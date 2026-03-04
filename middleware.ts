import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // chráníme vše pod /admin
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return new NextResponse("ADMIN_PASSWORD is not set", { status: 500 });

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    });
  }

  const decoded = Buffer.from(auth.slice("Basic ".length), "base64").toString("utf-8");
  const [user, pass] = decoded.split(":");

  // user může být cokoliv, kontrolujeme jen heslo
  if (pass !== pw) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
