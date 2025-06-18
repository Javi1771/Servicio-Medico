import { NextResponse } from 'next/server';

//* Configuración de permisos por rol
const rolePermissions = {
  "7": ["/inicio-presidente", "/consultas", "/especialista", "/catalogos", "/estadisticas", "/capturas", "/reportes", "/farmacia", "/dashboard"], //* Permisos para presidente
  "6": ["/inicio-servicio-medico", "/consultas", "/catalogos", "/capturas", "/reportes", "/especialista", "/farmacia"], //* Permisos para administrador
  "1": ["/inicio-servicio-medico", "/consultas", "/capturas/orden-de-estudio-de-laboratorio"], //* Permisos para médico general
  "2": ["/inicio-servicio-medico", "/consultas/signos-vitales", "/consultas/face-test", "consultas/signos-vitales-facial"], //* Permisos para enfermera
  "3": ["/inicio-servicio-medico", "/capturas", "/consultas/recetas", "/consultas/components/HistorialMedicamentos"], //* Permisos para capturista
  "8": ["/inicio-servicio-medico", "/reportes", "/catalogos/beneficiarios", "/catalogos/historial-incapacidades-completo", "/capturas/incapacidades"], //* Permisos para RRHH
  "9": ["/inicio-servicio-medico", "/farmacia"], //* Permisos para farmacia 
  "10": ["/inicio-servicio-medico", "/farmacia", "/catalogos", "/consultas", "/dashboard", "/especialista", "/estadisticas", "/reportes"], //* Permisos para director de servicios médicos 
  "11": ["/inicio-servicio-medico", "/especialista", "/capturas/orden-de-estudio-de-laboratorio"], //* Permisos para médico especialista
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const lowerPath = pathname.toLowerCase();

  //* Rutas públicas
  if (lowerPath === '/' || lowerPath === '/login') {
    return NextResponse.next();
  }

  //! Excluir rutas especiales
  if (
    lowerPath.startsWith('/_next') ||
    lowerPath.startsWith('/api') ||
    lowerPath.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token');
  const rol = request.cookies.get('rol');

  if (!token || !rol) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('redirected', 'true');
    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  const allowedRoutes = rolePermissions[rol] || [];
  const isAllowed = allowedRoutes.some(route => lowerPath.startsWith(route.toLowerCase()));

  if (!isAllowed) {
    const defaultRoute = "/login";
    const redirectUrl = new URL(defaultRoute, request.url);

    if (!redirectUrl.searchParams.has("redirected")) {
      redirectUrl.searchParams.set("redirected", "true");
    }

    const response = NextResponse.redirect(redirectUrl);
    response.headers.set('x-middleware-cache', 'no-cache');
    return response;
  }

  return NextResponse.next();
}

//* Aplica el middleware a todas las rutas excepto las excluidas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
};
