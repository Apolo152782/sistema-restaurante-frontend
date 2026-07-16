const URL_API = "http://localhost:8080/api";

export async function obtenerIngredientes() {
  const respuesta = await fetch(`${URL_API}/ingredientes`);

  if (!respuesta.ok) {
    throw new Error("No fue posible obtener los ingredientes.");
  }

  return await respuesta.json();
}

export async function crearIngrediente(ingrediente: any) {
  const respuesta = await fetch(`${URL_API}/ingredientes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingrediente),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible crear el ingrediente.");
  }

  return await respuesta.json();
}

export async function actualizarIngrediente(id: string, ingrediente: any) {
  const respuesta = await fetch(`${URL_API}/ingredientes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingrediente),
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible actualizar el ingrediente.");
  }

  return await respuesta.json();
}

export async function eliminarIngrediente(id: string) {
  const respuesta = await fetch(`${URL_API}/ingredientes/${id}`, {
    method: "DELETE",
  });

  if (!respuesta.ok) {
    throw new Error("No fue posible eliminar el ingrediente.");
  }
}
