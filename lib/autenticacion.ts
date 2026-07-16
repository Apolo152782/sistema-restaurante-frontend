const URL_API = "http://localhost:8080/api";

export async function iniciarSesion(correo: string, contrasena: string) {
  const respuesta = await fetch(`${URL_API}/autenticacion/iniciar-sesion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      correo,
      contrasena,
    }),
  });

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(datos.mensaje || "Error al iniciar sesión.");
  }

  return datos;
}
