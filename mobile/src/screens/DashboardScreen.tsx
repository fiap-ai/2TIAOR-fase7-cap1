import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import {
  Card,
  Text,
  Button,
  TextInput,
  Chip,
  Divider,
} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";
import {
  getSensorLatest,
  predict,
  type SensorReading,
  type PatientInput,
  type PredictResponse,
} from "../services/api";
import { theme } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Dashboard">;

const DEFAULT_PATIENT: PatientInput = {
  idade: 55,
  frequencia_cardiaca: 85,
  spo2: 96,
  pressao_sistolica: 135,
  pressao_diastolica: 88,
  glicemia: 110,
  carga_sistema: 0.6,
  disponibilidade_recursos: 0.7,
  historico_cardiopatia: 1,
};

function alertColor(alert: string | null | undefined): string {
  if (!alert) return theme.colors.tertiary;
  if (alert === "CRITICAL") return theme.colors.error;
  if (alert === "WARNING") return "#F59E0B";
  return theme.colors.tertiary;
}

function riskColor(risk: string): string {
  const r = risk.toUpperCase();
  if (r === "BAIXO") return theme.colors.tertiary;
  if (r === "MEDIO") return "#F59E0B";
  if (r === "ALTO" || r === "CRITICO") return theme.colors.error;
  return "#666";
}

export function DashboardScreen({ navigation }: Props) {
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState(DEFAULT_PATIENT);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [predicting, setPredicting] = useState(false);

  const fetchSensors = useCallback(async () => {
    try {
      const data = await getSensorLatest();
      setSensors(data.readings);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchSensors();
    setRefreshing(false);
  }

  async function handlePredict() {
    setPredicting(true);
    try {
      const data = await predict(form);
      setResult(data);
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Falha na predição");
    } finally {
      setPredicting(false);
    }
  }

  async function handleLogout() {
    await AsyncStorage.multiRemove(["token", "user"]);
    navigation.replace("Login");
  }

  const latest = sensors.length > 0 ? sensors[sensors.length - 1] : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Sensor Cards */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Sensores IoT
      </Text>
      <View style={styles.sensorRow}>
        <Card style={[styles.sensorCard, { flex: 1 }]}>
          <Card.Content style={styles.sensorContent}>
            <Text variant="bodySmall" style={styles.sensorLabel}>
              Temperatura
            </Text>
            <Text variant="headlineMedium" style={styles.sensorValue}>
              {latest ? `${latest.temperature.toFixed(1)}°C` : "--.-°C"}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.sensorCard, { flex: 1 }]}>
          <Card.Content style={styles.sensorContent}>
            <Text variant="bodySmall" style={styles.sensorLabel}>
              Freq. Cardíaca
            </Text>
            <Text variant="headlineMedium" style={styles.sensorValue}>
              {latest ? `${latest.heart_rate} bpm` : "-- bpm"}
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card style={styles.alertCard}>
        <Card.Content
          style={[styles.alertContent, { borderLeftColor: alertColor(latest?.alert) }]}
        >
          <Text variant="bodySmall" style={styles.sensorLabel}>
            Alerta IoT
          </Text>
          <Chip
            style={{ backgroundColor: alertColor(latest?.alert) + "20" }}
            textStyle={{ color: alertColor(latest?.alert), fontWeight: "bold" }}
          >
            {latest ? latest.alert || "NORMAL" : "Sem dados"}
          </Chip>
          <Text variant="bodySmall" style={styles.deviceId}>
            {latest?.device_id || "Nenhum dispositivo"}
          </Text>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      {/* Prediction Form */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Predição de Risco Cardíaco
      </Text>

      <Card style={styles.formCard}>
        <Card.Content style={styles.formContent}>
          <View style={styles.formRow}>
            <TextInput
              label="Idade"
              value={String(form.idade)}
              onChangeText={(v) => setForm((p) => ({ ...p, idade: Number(v) || 0 }))}
              keyboardType="numeric"
              style={styles.formInput}
              dense
            />
            <TextInput
              label="Freq. Cardíaca"
              value={String(form.frequencia_cardiaca)}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, frequencia_cardiaca: Number(v) || 0 }))
              }
              keyboardType="numeric"
              style={styles.formInput}
              dense
            />
          </View>
          <View style={styles.formRow}>
            <TextInput
              label="SpO₂ (%)"
              value={String(form.spo2)}
              onChangeText={(v) => setForm((p) => ({ ...p, spo2: Number(v) || 0 }))}
              keyboardType="numeric"
              style={styles.formInput}
              dense
            />
            <TextInput
              label="P. Sistólica"
              value={String(form.pressao_sistolica)}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, pressao_sistolica: Number(v) || 0 }))
              }
              keyboardType="numeric"
              style={styles.formInput}
              dense
            />
          </View>
          <View style={styles.formRow}>
            <TextInput
              label="P. Diastólica"
              value={String(form.pressao_diastolica)}
              onChangeText={(v) =>
                setForm((p) => ({ ...p, pressao_diastolica: Number(v) || 0 }))
              }
              keyboardType="numeric"
              style={styles.formInput}
              dense
            />
            <TextInput
              label="Glicemia"
              value={String(form.glicemia)}
              onChangeText={(v) => setForm((p) => ({ ...p, glicemia: Number(v) || 0 }))}
              keyboardType="numeric"
              style={styles.formInput}
              dense
            />
          </View>

          <Button
            mode="contained"
            onPress={handlePredict}
            loading={predicting}
            disabled={predicting}
            style={styles.predictButton}
            icon="heart-pulse"
          >
            Analisar Risco
          </Button>
        </Card.Content>
      </Card>

      {/* Result */}
      {result && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              Resultado
            </Text>
            <View style={styles.resultCenter}>
              <Chip
                style={{
                  backgroundColor: riskColor(result.risk_class) + "20",
                  paddingHorizontal: 12,
                }}
                textStyle={{
                  color: riskColor(result.risk_class),
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {result.risk_class}
              </Chip>
              <Text variant="bodyMedium" style={styles.probability}>
                Probabilidade: {(result.risk_probability * 100).toFixed(1)}%
              </Text>
            </View>

            {result.protocols.length > 0 && (
              <View style={styles.protocols}>
                <Text variant="titleSmall" style={{ marginBottom: 8 }}>
                  Protocolos:
                </Text>
                {result.protocols.map((p, i) => (
                  <View key={i} style={styles.protocol}>
                    <Text variant="bodyMedium" style={{ fontWeight: "bold" }}>
                      {p.name}{" "}
                      <Text variant="bodySmall" style={{ color: "#999" }}>
                        ({p.priority})
                      </Text>
                    </Text>
                    <Text variant="bodySmall" style={{ color: "#666" }}>
                      {p.description}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {result.recommendation_summary ? (
              <Text variant="bodySmall" style={styles.recommendation}>
                {result.recommendation_summary}
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      )}

      <Divider style={styles.divider} />

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate("Chat")}
          icon="chat"
          style={{ flex: 1 }}
        >
          Chat IA
        </Button>
        <Button
          mode="outlined"
          onPress={handleLogout}
          icon="logout"
          textColor={theme.colors.error}
          style={{ flex: 1 }}
        >
          Sair
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  sensorRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  sensorCard: {
    elevation: 1,
  },
  sensorContent: {
    alignItems: "center",
    paddingVertical: 12,
  },
  sensorLabel: {
    color: "#888",
    marginBottom: 4,
  },
  sensorValue: {
    fontWeight: "bold",
  },
  alertCard: {
    elevation: 1,
    marginBottom: 8,
  },
  alertContent: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    gap: 6,
  },
  deviceId: {
    color: "#999",
  },
  divider: {
    marginVertical: 16,
  },
  formCard: {
    elevation: 1,
  },
  formContent: {
    gap: 8,
  },
  formRow: {
    flexDirection: "row",
    gap: 8,
  },
  formInput: {
    flex: 1,
    backgroundColor: "transparent",
  },
  predictButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  resultCard: {
    elevation: 1,
    marginTop: 16,
  },
  resultCenter: {
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  probability: {
    color: "#666",
  },
  protocols: {
    marginBottom: 12,
  },
  protocol: {
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primaryContainer,
  },
  recommendation: {
    fontStyle: "italic",
    color: "#666",
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.primary,
    paddingLeft: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
});
