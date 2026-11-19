// Converte endereços em coordenadas (lat/lng) via OpenStreetMap Nominatim (sem API key)

export const BAIRROS_RECIFE = [
  { label: "Boa Viagem", latitude: -8.1189, longitude: -34.8988 },
  { label: "Derby", latitude: -8.0567, longitude: -34.8999 },
  { label: "Casa Forte", latitude: -8.0342, longitude: -34.9226 },
  { label: "Espinheiro", latitude: -8.0439, longitude: -34.8939 },
  { label: "Graças", latitude: -8.0488, longitude: -34.9016 },
  { label: "Pina", latitude: -8.0956, longitude: -34.8842 },
  { label: "Madalena", latitude: -8.0545, longitude: -34.9091 },
];

export async function geocodificarEndereco(endereco) {
  const texto = String(endereco || "").trim();
  if (texto.length < 3) return null;

  // Se o texto bater com um bairro conhecido de Recife, resolve instantaneamente
  const bairroMatch = BAIRROS_RECIFE.find(
    (b) => b.label.toLowerCase() === texto.toLowerCase(),
  );
  if (bairroMatch) {
    return { latitude: bairroMatch.latitude, longitude: bairroMatch.longitude };
  }

  const query = /recife/i.test(texto) ? texto : `${texto}, Recife, PE, Brasil`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FillmoreMobileApp/1.0",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const json = await res.json();
    const primeiro = Array.isArray(json) ? json[0] : null;
    if (!primeiro?.lat || !primeiro?.lon) return null;

    const latitude = Number.parseFloat(primeiro.lat);
    const longitude = Number.parseFloat(primeiro.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
