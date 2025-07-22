import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log("Request pathname:", pathname);

    // Retrieve the token using NextAuth
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    console.log("Token:", token);

    // Example: Redirect unauthenticated users trying to access the dashboard
    if (!token) {
        if(pathname.startsWith("/signup") || pathname.startsWith("/login")) {
            console.log("Allowing access to /signup or /login without authentication");
            return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
}

    // Example: Redirect root ("/") to "/dashboard" if authenticated
    if (pathname === "/") {
        if (token) {
            console.log("Redirecting to /dashboard as user is authenticated");
            return NextResponse.redirect(new URL("/dashboard", request.url));
        } else {
            console.log("Redirecting to /login as user is not authenticated");
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Allow the request to proceed
    console.log("Allowing the request to proceed");
    return NextResponse.next();
}

// Specify the paths where the middleware should run
export const config = {
  matcher: ["/", "/dashboard/:path*"], // Adjust paths as needed
};