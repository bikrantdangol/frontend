// middleware.js
// import { NextResponse } from 'next/server'

// export function middleware(request) {
//   if (request.nextUrl.pathname === '/login') {
//     return NextResponse.redirect(new URL('/', request.url))
//   }
// }
// middleware.js
export function middleware() {}

export const config = {
  matcher: [],
};
