const URL_API = "http://localhost:8080/api";

export interface Configuracion {
  workdayStart: string;
  workdayEnd: string;
}

export async function obtenerConfiguracion(): Promise<Configuracion> {
  const respuesta = await fetch(`${URL_API}/configuracion`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener la configuración.");
  }

  return await respuesta.json();
}

export async function actualizarConfiguracion(
  configuracion: Configuracion,
): Promise<Configuracion> {
  const respuesta = await fetch(`${URL_API}/configuracion`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(configuracion),
  });

  if (!respuesta.ok) {
    const error = await respuesta.text();

    console.error(error);

    throw new Error("No fue posible actualizar la configuración.");
  }

  return await respuesta.json();
}
