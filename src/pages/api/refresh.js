import jwt from "jsonwebtoken";
import { parse } from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  //console.log("Cookies recibidas:", req.headers.cookie);

  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  const refreshToken = cookies.refreshToken;

  if (!refreshToken) {
    console.error("No se encontró la cookie 'refreshToken'");
    return res.status(401).json({ message: "No hay refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, "clave_secreta_refresh");
    const newToken = jwt.sign(
      { rol: decoded.rol, nombreproveedor: decoded.nombreproveedor },
      "clave_secreta",
      { expiresIn: "1h" }
    );
    const secureFlag = process.env.NODE_ENV === "production" ? "; Secure" : "";
    const tokenMaxAge = 60 * 60;
    res.setHeader("set-cookie", [
      `token=${newToken}; Path=/; HttpOnly; SameSite=Lax${secureFlag}; Max-Age=${tokenMaxAge}`,
      `rol=${decoded.rol}; Path=/; SameSite=Lax${secureFlag}; Max-Age=${tokenMaxAge}`,
    ]);
    return res.status(200).json({ success: true, rol: decoded.rol });
  } catch (error) {
    console.error("Error al procesar refresh token:", error);
    return res.status(401).json({ message: "Refresh token inválido o expirado" });
  }
}
