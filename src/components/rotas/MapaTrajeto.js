import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { colors } from "../../theme";

const toCoord = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const gerarHtmlMapa = (pontos) => {
  const payload = JSON.stringify(pontos).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; background: #F1F5F9; font-family: system-ui, -apple-system, sans-serif; }
    .marker-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 12px;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.35);
    }
    .pin-inicio { background: #10B981; color: #FFFFFF; }
    .pin-parada { background: #F59E0B; color: #0F172A; }
    .pin-fim { background: #EF4444; color: #FFFFFF; }
    .fallback {
      display: flex; align-items: center; justify-content: center;
      height: 100%; padding: 16px; text-align: center; color: #64748B; font-size: 13px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      const pontos = ${payload};
      const container = document.getElementById("map");
      if (typeof L === "undefined") {
        container.innerHTML = '<div class="fallback">Não foi possível carregar os tiles do mapa. Use o botão do Google Maps abaixo.</div>';
        return;
      }

      const esc = (txt) => String(txt || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

      const map = L.map("map", { zoomControl: true, attributionControl: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      const latLngs = pontos.map((p) => [p.latitude, p.longitude]);

      if (latLngs.length >= 2) {
        L.polyline(latLngs, { color: "#D97706", weight: 4, opacity: 0.9 }).addTo(map);
      }

      pontos.forEach((p) => {
        let cls = "pin-parada";
        let label = String(p.ordem || "•");
        let titulo = p.alunoNome || "Parada";
        let subtitulo = p.endereco || "";

        if (p.tipo === "INICIO") {
          cls = "pin-inicio";
          label = "I";
          titulo = "Início da Rota";
          subtitulo = p.descricao || "Ponto de partida";
        } else if (p.tipo === "FIM") {
          cls = "pin-fim";
          label = "F";
          titulo = "Destino Final";
          subtitulo = p.descricao || "Ponto de chegada";
        }

        const icon = L.divIcon({
          className: "",
          html: '<div class="marker-pin ' + cls + '">' + esc(label) + '</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const popupHtml = "<strong>" + esc(titulo) + "</strong>" +
          (subtitulo ? "<br/><small>" + esc(subtitulo) + "</small>" : "");

        L.marker([p.latitude, p.longitude], { icon }).addTo(map).bindPopup(popupHtml);
      });

      if (latLngs.length === 1) {
        map.setView(latLngs[0], 15);
      } else {
        map.fitBounds(L.latLngBounds(latLngs), { padding: [30, 30], maxZoom: 16 });
      }
    })();
  </script>
</body>
</html>`;
};

export default function MapaTrajeto({ waypoints = [], height = 240 }) {
  const pontosValidos = useMemo(
    () =>
      (waypoints || [])
        .map((w) => ({
          ...w,
          latitude: toCoord(w.latitude),
          longitude: toCoord(w.longitude),
        }))
        .filter((w) => w.latitude !== null && w.longitude !== null),
    [waypoints],
  );

  const html = useMemo(() => gerarHtmlMapa(pontosValidos), [pontosValidos]);

  if (pontosValidos.length === 0) {
    return (
      <Surface style={[styles.emptyBox, { minHeight: Math.min(height, 150) }]} elevation={0}>
        <MaterialCommunityIcons
          name="map-marker-off-outline"
          size={32}
          color={colors.textSecondary}
        />
        <Text variant="titleSmall" style={styles.emptyTitle}>
          Sem coordenadas para o mapa
        </Text>
        <Text variant="bodySmall" style={styles.emptySubtitle}>
          Cadastre latitude e longitude na rota ou nos endereços dos alunos para
          visualizar o trajeto no mapa.
        </Text>
      </Surface>
    );
  }

  return (
    <View>
      <View style={[styles.mapContainer, { height }]}>
        <WebView
          originWhitelist={["*"]}
          source={{ html }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          nestedScrollEnabled
          startInLoadingState
        />
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text variant="labelSmall" style={styles.legendText}>
            Início (I)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text variant="labelSmall" style={styles.legendText}>
            Paradas (#)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
          <Text variant="labelSmall" style={styles.legendText}>
            Destino (F)
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.textSecondary,
    fontWeight: "600",
  },
  emptyBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceVariant,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "700",
    marginTop: 8,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
});

