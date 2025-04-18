// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/signin"    // <<< hier
    }
});

export const config = {
    matcher: [
        "/((?!api/auth|_next/static|_next/image|favicon.ico|signin).*)"
    ]
};
