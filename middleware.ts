import authConfig from "@/auth.config";
import NextAuth from "next-auth";
import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes
} from "@/routes"

const {auth} = NextAuth(authConfig)
 
export default auth((req) => {
    const {nextUrl} = req
    const isLoggedIn = !!req.auth

    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    if(isApiAuthRoute){
      return 
    }

    if(isAuthRoute){
      if(isLoggedIn){
        return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
      }
      return 
    }

    if(!isLoggedIn && !isPublicRoute){
      let callbackUrl = nextUrl.pathname
      if(nextUrl.search){
        callbackUrl += nextUrl.search
      }

      const encodedCallbackUrl = encodeURIComponent(callbackUrl)
      return Response.redirect(new URL(`/auth/login?callbackUrl${encodedCallbackUrl}`, nextUrl))
    }

    return 
})
 
// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}


// import authConfig from "@/auth.config";
// import NextAuth from "next-auth";
// import {
//   DEFAULT_LOGIN_REDIRECT,
//   apiAuthPrefix,
//   authRoutes,
//   publicRoutes,
// } from "@/routes";

// const { auth } = NextAuth(authConfig);

// export default auth(async (req) => {
//   // Destructure query parameters without potential undefined error
//   const { nextUrl } = req

//   // Authentication state check (avoid double negation)
//   const isLoggedIn = req.auth?.user !== null;

//   // Route checks with optimized logic
//   const isApiAuthRoute = nextUrl?.pathname?.startsWith(apiAuthPrefix);
//   const isPublicRoute = publicRoutes.includes(nextUrl?.pathname || '/'); // Handle root path
//   const isAuthRoute = authRoutes.includes(nextUrl?.pathname);

//   // Conditional logic for redirects (avoid unnecessary null returns)
//   if (isApiAuthRoute) {
//     // Handle API authentication routes as needed
//     return undefined; // Or return specific response for API
//   }

//   if (isAuthRoute) {
//     if (isLoggedIn) {
//       // Redirect from authenticated routes when logged in
//       return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.url));
//     }
//   }

//   if (!isLoggedIn && !isPublicRoute) {
//     // Redirect to login for non-public routes when not logged in
//     let callbackUrl = nextUrl?.pathname || '/'; // Handle root path
//     if (nextUrl?.search) {
//       callbackUrl += nextUrl.search;
//     }

//     const encodedCallbackUrl = encodeURIComponent(callbackUrl);
//     return Response.redirect(new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, req.url));
//   }

//   // No redirect needed for valid routes
//   return undefined;
// });

// // Optionally, don't invoke Middleware on some paths
// export const config = {
//   matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
// };
