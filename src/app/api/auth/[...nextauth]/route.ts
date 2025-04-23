import NextAuth from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';
import CredentialsProvider from 'next-auth/providers/credentials';

const {
    ADMIN_USER: rawAdminUser,
    ADMIN_PASSWORD: rawAdminPassword,
    KEYCLOAK_CLIENT_ID,
    KEYCLOAK_CLIENT_SECRET,
    KEYCLOAK_ISSUER,
} = process.env;

const hasKeycloak =
    !!KEYCLOAK_CLIENT_ID &&
    !!KEYCLOAK_CLIENT_SECRET &&
    !!KEYCLOAK_ISSUER;

let adminUser = rawAdminUser;
let adminPassword = rawAdminPassword;
if (!rawAdminUser || !rawAdminPassword) {
    adminUser = 'admin';
    adminPassword = 'admin';
}

const includeCredentials =
    (rawAdminUser && rawAdminPassword) ||
    !hasKeycloak;

const providers = [
    includeCredentials &&
    CredentialsProvider({
        name: 'Local',
        credentials: {
            username: { label: 'Username', type: 'text' },
            password: { label: 'Password', type: 'password' },
        },
        async authorize(credentials) {
            if (
                credentials?.username === adminUser &&
                credentials?.password === adminPassword
            ) {
                return { id: 'admin', name: 'Administrator', role: 'admin' };
            }
            return null;
        },
    }),

    hasKeycloak &&
    KeycloakProvider({
        clientId: KEYCLOAK_CLIENT_ID!,
        clientSecret: KEYCLOAK_CLIENT_SECRET!,
        issuer: KEYCLOAK_ISSUER!,
    }),
].filter(Boolean);

export const handler = NextAuth({
    // @ts-ignore
    providers,
    session: { strategy: 'jwt' },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.user = user;
                if (account?.access_token) token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }: any) {
            session.user = token.user;
            if (token.accessToken) session.accessToken = token.accessToken;
            return session;
        },
        async redirect({ baseUrl }) {
            return `${baseUrl}/projects`;
        },
    },
});

export { handler as GET, handler as POST };
