import { NextResponse } from 'next/server';

//* Configuración de permisos por rol
const rolePermissions = {
  "7": ["/inicio-presidente", "/consultas", "/especialista", "/catalogos", "/estadisticas", "/capturas", "/reportes", "/farmacia", "/dashboard", "/cancelaciones"], //* Permisos para presidente
  "6": ["/inicio-servicio-medico", "/consultas", "/catalogos", "/capturas", "/reportes", "/especialista", "/farmacia", "/cancelaciones"], //* Permisos para administrador
  "1": ["/inicio-servicio-medico", "/consultas", "/especialista", "/capturas"], //* Permisos para médico
  "2": ["/inicio-servicio-medico", "/consultas/signos-vitales", "/consultas/face-test", "consultas/signos-vitales-facial"], //* Permisos para enfermera
  "3": ["/inicio-servicio-medico", "/capturas", "/consultas/recetas", "/cancelaciones", "/consultas/components/HistorialMedicamentos"], //* Permisos para capturista
  "8": ["/inicio-servicio-medico", "/reportes", "/catalogos/beneficiarios"], //* Permisos para RRHH
  "9": ["/inicio-servicio-medico", "/farmacia"], //* Permisos para farmacia 
  "10": ["/inicio-servicio-medico", "/farmacia", "/catalogos/usuarios-y-proveedores"], //* Permisos para director de servicios médicos 
};

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Excluir rutas públicas y estáticas
  if (pathname === '/' || pathname === '/login') {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('token');
  const rol = request.cookies.get('rol');

  if (!token || !rol) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const allowedRoutes = rolePermissions[rol] || [];
  const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));

  if (!isAllowed) {
    const defaultRoute = rol === "7" ? "/inicio-presidente" : "/inicio-servicio-medico";
    // Agrega un query param opcional para evitar bucles en caso de errores
    const redirectUrl = new URL(defaultRoute, request.url);
    if (!redirectUrl.searchParams.has("redirected")) {
      redirectUrl.searchParams.set("redirected", "true");
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}


//* Configuración del matcher para que afecte todas las rutas salvo las excluidas
export const config = {
  matcher: ['/((?!api|_next/static|_next/image).*)'],
};
