// Converte endereços em coordenadas (lat/lng) e vice-versa via OpenStreetMap Nominatim (sem API key)

export const BAIRROS_RECIFE = [
  { label: "Boa Viagem", latitude: -8.1189, longitude: -34.8988 },
  { label: "Derby", latitude: -8.0567, longitude: -34.8999 },
  { label: "Casa Forte", latitude: -8.0342, longitude: -34.9226 },
  { label: "Espinheiro", latitude: -8.0439, longitude: -34.8939 },
  { label: "Graças", latitude: -8.0488, longitude: -34.9016 },
  { label: "Pina", latitude: -8.0956, longitude: -34.8842 },
  { label: "Madalena", latitude: -8.0545, longitude: -34.9091 },
  { label: "Várzea", latitude: -8.0499, longitude: -34.9598 },
  { label: "Cordeiro", latitude: -8.0518, longitude: -34.9228 },
];

// Verifica se as coordenadas batem com algum bairro preset de Recife (~250m de tolerância)
export function identificarBairroPorCoordenadas(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  let melhor = null;
  let menorDist = Infinity;
  for (const b of BAIRROS_RECIFE) {
    const dist = Math.hypot(lat - b.latitude, lng - b.longitude);
    if (dist < menorDist) {
      menorDist = dist;
      melhor = b;
    }
  }
  if (melhor && menorDist <= 0.0025) {
    return melhor.label;
  }
  return null;
}

// Resolve coordenadas (lat, lng) em um nome de rua/bairro legível para preencher formulários de edição
export async function geocodificarReverso(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";

  const preset = identificarBairroPorCoordenadas(lat, lng);
  if (preset) return preset;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat,
    )}&lon=${encodeURIComponent(lng)}&zoom=17&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FillmoreMobileApp/1.0",
      },
      signal: controller.signal,
    });

    if (res.ok) {
      const json = await res.json();
      const addr = json?.address || {};
      const localEspecifico =
        json?.name || addr.amenity || addr.school || addr.road || "";
      const bairro =
        addr.suburb ||
        addr.neighbourhood ||
        addr.city_district ||
        addr.quarter ||
        "";

      if (localEspecifico && bairro && localEspecifico !== bairro) {
        return `${localEspecifico} - ${bairro}`;
      }
      if (localEspecifico) return localEspecifico;
      if (bairro) return bairro;
    }
  } catch {
    // fallback abaixo
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback offline: encontra o bairro de Recife mais próximo (~3km) ou exibe coordenadas limpas
  let maisProximo = null;
  let menorDist = Infinity;
  for (const b of BAIRROS_RECIFE) {
    const dist = Math.hypot(lat - b.latitude, lng - b.longitude);
    if (dist < menorDist) {
      menorDist = dist;
      maisProximo = b;
    }
  }
  if (maisProximo && menorDist <= 0.03) {
    return `Região de ${maisProximo.label}`;
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

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
