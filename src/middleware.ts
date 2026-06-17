import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'dashboard_access';

function isPublicAsset(pathname: string) {
  return (
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

function stripAccessToken(req: NextRequest) {
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
  const forwardedProto = req.headers.get('x-forwarded-proto') || req.nextUrl.protocol.replace(':', '') || 'https';
  const cleanUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, `${forwardedProto}://${forwardedHost}`);
  cleanUrl.searchParams.delete('access_token');
  return cleanUrl;
}

function unauthorised(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Private dashboard token required.' }, { status: 401 });
  }

  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Private Command Centre</title>
    <style>
      :root { color-scheme: dark; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: radial-gradient(circle at 50% 20%, rgba(0, 225, 255, 0.18), transparent 32rem), #02070d;
        color: #dffbff;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(32rem, calc(100vw - 2rem));
        border: 1px solid rgba(93, 230, 255, 0.28);
        border-radius: 1.25rem;
        background: rgba(2, 14, 24, 0.86);
        box-shadow: 0 0 50px rgba(0, 194, 255, 0.16);
        padding: 2rem;
        text-align: center;
      }
      h1 { margin: 0 0 0.75rem; font-size: 1.25rem; letter-spacing: 0.08em; text-transform: uppercase; }
      p { margin: 0; color: rgba(223, 251, 255, 0.76); line-height: 1.6; }
      code { color: #78efff; }
    </style>
  </head>
  <body>
    <main>
      <h1>Private Command Centre</h1>
      <p>This dashboard is token-protected. Open the private access link supplied by JARVIS, or add <code>?access_token=...</code> to a trusted URL once to unlock this device.</p>
    </main>
  </body>
</html>`,
    {
      status: 401,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    },
  );
}

export function middleware(req: NextRequest) {
  const requiredToken = process.env.DASHBOARD_ACCESS_TOKEN;

  if (!requiredToken || isPublicAsset(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const suppliedToken =
    req.nextUrl.searchParams.get('access_token') ||
    req.headers.get('x-dashboard-token') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    req.cookies.get(ACCESS_COOKIE)?.value;

  if (suppliedToken === requiredToken) {
    const hasUrlToken = req.nextUrl.searchParams.has('access_token');
    const response = hasUrlToken ? NextResponse.redirect(stripAccessToken(req)) : NextResponse.next();

    response.cookies.set({
      name: ACCESS_COOKIE,
      value: requiredToken,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  }

  return unauthorised(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
