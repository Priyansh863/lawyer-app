import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log("Request pathname:", pathname);

    // Example: Redirect unauthenticated users trying to access the dashboard
    const isAuthenticated = request.cookies.get("authToken"); // Replace with your auth logic
    console.log("Is authenticated:", isAuthenticated);

    if (!isAuthenticated && pathname.startsWith("/dashboard")) {
        console.log("Redirecting to /login due to unauthenticated access to /dashboard");
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Example: Redirect root ("/") to "/dashboard" if authenticated
    if (pathname === "/") {
        if (isAuthenticated) {
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