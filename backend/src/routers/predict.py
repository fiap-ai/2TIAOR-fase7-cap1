"""Risk prediction endpoint — direct RF model inference."""

from fastapi import APIRouter

from src.model.predict import FEATURE_COLUMNS, predict_risk
from src.schemas import PatientInput, PredictionResponse

router = APIRouter(prefix="/api", tags=["prediction"])

_SUMMARY_TEMPLATES = {
    "BAIXO": "Paciente {name} apresenta risco BAIXO ({prob:.0%}). Manter acompanhamento de rotina.",
    "MEDIO": "Paciente {name} apresenta risco MÉDIO ({prob:.0%}). Recomenda-se monitoramento regular.",
    "ALTO": "Paciente {name} apresenta risco ALTO ({prob:.0%}). Atenção redobrada e protocolos específicos.",
    "CRITICO": "⚠️ Paciente {name} apresenta risco CRÍTICO ({prob:.0%}). Intervenção imediata necessária!",
}


@router.post("/predict", response_model=PredictionResponse)
async def predict(body: PatientInput):
    patient_data = {col: getattr(body, col) for col in FEATURE_COLUMNS}
    result = predict_risk(patient_data)

    summary_tpl = _SUMMARY_TEMPLATES.get(result["risk_class"], _SUMMARY_TEMPLATES["MEDIO"])
    summary = summary_tpl.format(name=body.patient_name, prob=result["risk_probability"])

    return PredictionResponse(
        patient_name=body.patient_name,
        risk_probability=result["risk_probability"],
        risk_class=result["risk_class"],
        protocols=result["protocols"],
        recommendation_summary=summary,
    )
