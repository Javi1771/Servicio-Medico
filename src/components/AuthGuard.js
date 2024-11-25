import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

const AuthGuard = ({ children }) => {
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const verifyAccess = async () => {
            const token = Cookies.get('token');
            const rol = Cookies.get('rol'); // Obtener el rol desde la cookie

            if (!token) {
                // Si no hay token, redirigir al login
                router.push('/');
                return;
            }

            // Verificar el rol y redirigir al dashboard adecuado
            switch (rol) {
                case '1': // Doctor
                    if (router.pathname !== '/inicio-servicio-medico') {
                        router.push('/dashboard-doctor');
                    } else {
                        setIsVerified(true);
                    }
                    break;
                case '2': // Enfermera
                    if (router.pathname !== '/dashboard-enfermera') {
                        router.push('/dashboard-enfermera');
                    } else {
                        setIsVerified(true);
                    }
                    break;
                case '3': // Administración Pases
                    if (router.pathname !== '/dashboard-administracion-pases') {
                        router.push('/dashboard-administracion-pases');
                    } else {
                        setIsVerified(true);
                    }
                    break;
                case '4': // Contadora
                    if (router.pathname !== '/dashboard-contadora') {
                        router.push('/dashboard-contadora');
                    } else {
                        setIsVerified(true);
                    }
                    break;
                case '5': // Capturista Recetas Generales
                    if (router.pathname !== '/dashboard-capturista') {
                        router.push('/dashboard-capturista');
                    } else {
                        setIsVerified(true);
                    }
                    break;
                case '6': // Administrador
                    if (router.pathname !== '/inicio-servicio-medico') {
                        router.push('/inicio-servicio-medico');
                    } else {
                        setIsVerified(true);
                    }
                    break;
                default:
                    // Si el rol no es reconocido, redirigir al login
                    router.push('/');
            }
        };

        verifyAccess();
    }, [router.pathname, router]);

    if (!isVerified) return null;

    return <>{children}</>;
};

export default AuthGuard;
