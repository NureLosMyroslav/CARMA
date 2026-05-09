export type IssueSeverity = 'critical' | 'warning' | 'info'
export type CarSystem =
  | 'engine'
  | 'transmission'
  | 'brakes'
  | 'suspension'
  | 'electrical'
  | 'exhaust_cooling'
  | 'body'

export interface CarIssue {
  id: string
  system: CarSystem
  title: string
  description: string
  severity: IssueSeverity
  recommendation: string
}

export interface DiagnosticsResult {
  overall_score: number
  issues: CarIssue[]
}

export interface CarInfo {
  make: string
  model: string
  year: number
  mileage: number
  fuelType: string
  transmission: string
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite']

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function callGemini(prompt: string, model: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (response.status === 429) throw Object.assign(new Error('429'), { status: 429 })
  if (response.status === 404) throw Object.assign(new Error('404'), { status: 404 })
  if (!response.ok) throw new Error(`Gemini API помилка: ${response.status}`)

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function analyzeCar(car: CarInfo): Promise<DiagnosticsResult> {
  const prompt = `Ти — експерт автодіагностики. Проаналізуй потенційні проблеми для: ${car.year} ${car.make} ${car.model}, пробіг ${car.mileage} км, паливо: ${car.fuelType}, трансмісія: ${car.transmission}.

Поверни ТІЛЬКИ валідний JSON (без markdown, без коду):
{
  "overall_score": <число 0-100, вище = кращий стан>,
  "issues": [
    {
      "id": "<унікальний рядок>",
      "system": "<одне з: engine, transmission, brakes, suspension, electrical, exhaust_cooling, body>",
      "title": "<короткий заголовок>",
      "description": "<2-3 речення опису>",
      "severity": "<critical|warning|info>",
      "recommendation": "<що зробити власнику>"
    }
  ]
}

Правила:
- 5-6 реалістичних проблем з урахуванням віку, пробігу та відомих особливостей моделі
- Сортуй: critical → warning → info
- critical = негайна увага, warning = найближчим часом, info = варто знати
- description: МАКСИМУМ 1 коротке речення (до 15 слів)
- recommendation: МАКСИМУМ 1 речення (до 12 слів)
- Весь текст українською мовою`

  let lastError: Error = new Error('Невідома помилка')

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const text = await callGemini(prompt, model)
        if (!text) throw new Error('Порожня відповідь від AI')

        console.log('[Gemini] raw response:', text.slice(0, 300))

        // Try direct parse first (responseMimeType: application/json guarantees pure JSON)
        try {
          return JSON.parse(text) as DiagnosticsResult
        } catch {
          // Fallback: strip markdown fences and extract object
          const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim()
          const start = clean.indexOf('{')
          const end = clean.lastIndexOf('}')
          if (start === -1 || end === -1) {
            console.error('[Gemini] no JSON object found in:', clean.slice(0, 200))
            throw new Error('Невірний формат відповіді AI')
          }
          const slice = clean.substring(start, end + 1)
          try {
            return JSON.parse(slice) as DiagnosticsResult
          } catch (e) {
            console.error('[Gemini] JSON.parse failed:', e, '\nSlice:', slice.slice(0, 300))
            throw new Error('Невірний формат відповіді AI')
          }
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        const is429 = (err as { status?: number }).status === 429

        const isRetryable = is429 || (err as { status?: number }).status === 404
        if (is429 && attempt < 3) {
          await sleep(attempt * 3000)
          continue
        }
        if (isRetryable) break // перейти до наступної моделі
        throw lastError        // інша помилка — не повторювати
      }
    }
  }

  throw new Error('Сервіс AI тимчасово перевантажений. Спробуйте за хвилину.')
}
