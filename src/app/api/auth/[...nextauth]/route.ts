import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

const handler = NextAuth({
    providers: [
        KeycloakProvider({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: process.env.KEYCLOAK_ISSUER!
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, account }) {
            if (account) token.accessToken = account.access_token;
            return token;
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken as string;
            return session;
        },
        async redirect({ baseUrl }) {
            return baseUrl + "/";
        }
    }
});

export { handler as GET, handler as POST };
