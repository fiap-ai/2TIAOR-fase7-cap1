"""Chat endpoint — LLM-powered cardiac assistant (stateless)."""

from fastapi import APIRouter, HTTPException
from openai import AsyncOpenAI, AuthenticationError, APIError

from src.config import LLM_MODEL, OPENROUTER_API_KEY
from src.data.knowledge import get_knowledge_context, search_symptoms
from src.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api", tags=["chat"])

_SYSTEM_PROMPT = """Você é o CardioIA, um assistente cardiológico virtual.
Seu papel é orientar pacientes sobre saúde cardíaca de forma clara e empática.
Responda sempre em português do Brasil.

IMPORTANTE: Você NÃO substitui um médico. Sempre recomende buscar atendimento
profissional para diagnósticos e tratamentos.

Use o seguinte mapa de conhecimento de sintomas e doenças cardíacas como referência:

{knowledge_map}
"""


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="LLM service not configured. Set OPENROUTER_API_KEY in .env",
        )

    knowledge_map = get_knowledge_context()
    system_msg = _SYSTEM_PROMPT.format(knowledge_map=knowledge_map)

    messages = [{"role": "system", "content": system_msg}]
    for msg in body.history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": body.message})

    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

    try:
        completion = await client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
    except AuthenticationError:
        raise HTTPException(
            status_code=502,
            detail="OpenRouter API key is invalid or expired. Update OPENROUTER_API_KEY in .env",
        )
    except APIError as e:
        raise HTTPException(status_code=502, detail=f"LLM provider error: {e.message}")

    response_text = completion.choices[0].message.content or ""

    # Find related diseases from the user message for sources
    matches = search_symptoms(body.message)
    sources = list({m["associated_disease"] for m in matches})

    return ChatResponse(response=response_text, sources=sources)
