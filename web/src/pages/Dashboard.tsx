import { useState, useEffect, type FormEvent } from "react"
import { Activity, Thermometer, HeartPulse, AlertTriangle, Stethoscope } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  predict,
  getSensorLatest,
  type PatientInput,
  type PredictResponse,
  type SensorReading,
} from "@/services/api"

const DEFAULT_PATIENT: PatientInput = {
  idade: 40,
  frequencia_cardiaca: 85,
  spo2: 96,
  pressao_sistolica: 135,
  pressao_diastolica: 88,
  glicemia: 110,
  carga_sistema: 0.6,
  disponibilidade_recursos: 0.7,
  historico_cardiopatia: 1,
}

function riskBadgeVariant(risk: string) {
  const r = risk.toUpperCase()
  if (r === "BAIXO") return "success" as const
  if (r === "MEDIO") return "warning" as const
  if (r === "ALTO" || r === "CRITICO") return "critical" as const
  return "secondary" as const
}

export function Dashboard() {
  const [form, setForm] = useState<PatientInput>(DEFAULT_PATIENT)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sensors, setSensors] = useState<SensorReading[]>([])

  // Fetch latest sensor data on mount
  useEffect(() => {
    getSensorLatest().then((data) => setSensors(data.readings)).catch(() => {})
  }, [])

  function updateField(field: keyof PatientInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: Number(value) }))
  }

  async function handlePredict(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const data = await predict(form)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed")
    } finally {
      setLoading(false)
    }
  }

  const latestSensor = sensors.length > 0 ? sensors[sensors.length - 1] : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Monitoramento cardíaco e predição de risco</p>
      </div>

      {/* Sensor cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperatura</CardTitle>
            <Thermometer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSensor ? `${latestSensor.temperature.toFixed(1)}°C` : "--.-°C"}
            </div>
            <p className="text-xs text-muted-foreground">Último sensor IoT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freq. Cardíaca</CardTitle>
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSensor ? `${latestSensor.heart_rate} bpm` : "-- bpm"}
            </div>
            <p className="text-xs text-muted-foreground">Último sensor IoT</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerta IoT</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSensor ? (
                latestSensor.alert ? (
                  <Badge variant={riskBadgeVariant(latestSensor.alert)}>
                    {latestSensor.alert}
                  </Badge>
                ) : (
                  <Badge variant="success">NORMAL</Badge>
                )
              ) : (
                <span className="text-muted-foreground">Sem dados</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestSensor?.device_id || "Nenhum dispositivo conectado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Predição de Risco Cardíaco
            </CardTitle>
            <CardDescription>
              Insira os dados do paciente para análise pelo modelo Random Forest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="idade">Idade</Label>
                  <Input id="idade" type="number" value={form.idade} onChange={(e) => updateField("idade", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fc">Freq. Cardíaca</Label>
                  <Input id="fc" type="number" value={form.frequencia_cardiaca} onChange={(e) => updateField("frequencia_cardiaca", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="spo2">SpO₂ (%)</Label>
                  <Input id="spo2" type="number" value={form.spo2} onChange={(e) => updateField("spo2", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ps">Pressão Sist.</Label>
                  <Input id="ps" type="number" value={form.pressao_sistolica} onChange={(e) => updateField("pressao_sistolica", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pd">Pressão Diast.</Label>
                  <Input id="pd" type="number" value={form.pressao_diastolica} onChange={(e) => updateField("pressao_diastolica", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="glic">Glicemia</Label>
                  <Input id="glic" type="number" value={form.glicemia} onChange={(e) => updateField("glicemia", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carga">Carga Sistema</Label>
                  <Input id="carga" type="number" step="0.1" value={form.carga_sistema} onChange={(e) => updateField("carga_sistema", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="disp">Disp. Recursos</Label>
                  <Input id="disp" type="number" step="0.1" value={form.disponibilidade_recursos} onChange={(e) => updateField("disponibilidade_recursos", e.target.value)} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="hist" className="whitespace-nowrap">Histórico Cardiopatia</Label>
                <select
                  id="hist"
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.historico_cardiopatia}
                  onChange={(e) => updateField("historico_cardiopatia", e.target.value)}
                >
                  <option value={0}>Não</option>
                  <option value={1}>Sim</option>
                </select>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={loading}>
                <Activity className="h-4 w-4" />
                {loading ? "Analisando..." : "Analisar Risco"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Análise</CardTitle>
            <CardDescription>Predição do modelo Random Forest (Fase 6)</CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="text-center p-6 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Nível de Risco</p>
                  <Badge variant={riskBadgeVariant(result.risk_class)} className="text-lg px-4 py-1">
                    {result.risk_class}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Probabilidade: {(result.risk_probability * 100).toFixed(1)}%
                  </p>
                </div>

                {result.protocols.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Protocolos Recomendados:</p>
                    <ul className="space-y-2">
                      {result.protocols.map((p, i) => (
                        <li key={i} className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{p.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({p.priority})</span>
                          <p className="text-xs mt-0.5">{p.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendation_summary && (
                  <p className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
                    {result.recommendation_summary}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Preencha os dados e clique em "Analisar Risco"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
