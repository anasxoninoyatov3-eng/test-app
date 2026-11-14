// Rasmdagi test savolini AI orqali matnga aylantiradi.
// .env fayl (Vite):
//   VITE_GEMINI_API_KEY=...
//   VITE_GEMINI_MODEL=gemini-2.5-flash   (ixtiyoriy)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";

const PROMPT = `Bu rasmda test savoli va javob variantlari bor.
Vazifang: rasmdagi matnni AYNAN o'qib chiqarish.
Qoidalar:
- Tilni o'zgartirma, tarjima qilma, matnni qayta yozma.
- Matematik/kimyoviy formulalarni oddiy matnda yoz (masalan: x^2 + 3x, H2O).
- Variant harflarini (A), B), 1., ...) olib tashla, faqat variant matnini ber.
- Savolni O'ZING YECHMA. Agar rasmda to'g'ri javob aniq belgilangan bo'lsa (belgi, ko'chirilgan doira, tagiga chizilgan), correctIndex'ga uning tartib raqamini (0 dan boshlab) yoz, aks holda null.
- Faqat quyidagi JSON'ni qaytar, boshqa hech narsa yozma:
{"question": "savol matni", "options": ["variant 1", "variant 2"], "correctIndex": null}`;

const toBase64 = async (imageUrl) => {
  if (imageUrl.startsWith("data:")) {
    const [meta, data] = imageUrl.split(",");
    const mime = meta.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
    return { mime, data };
  }
  // Oddiy URL bo'lsa: yuklab olib base64 qilamiz (sayt CORS'ga ruxsat bersagina ishlaydi)
  const blob = await (await fetch(imageUrl)).blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    r.readAsDataURL(blob);
  });
  return toBase64(dataUrl);
};

export async function extractQuestionFromImage(imageUrl) {
  if (!API_KEY) {
    throw new Error("API kalit topilmadi. .env faylga VITE_GEMINI_API_KEY qo'shing va serverni qayta ishga tushiring.");
  }

  const { mime, data } = await toBase64(imageUrl);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mime, data } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`AI so'roviga xato (${res.status}). ${errText.slice(0, 160)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  let parsed;
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("AI javobini o'qib bo'lmadi. Rasm aniqroq bo'lsa, qayta urinib ko'ring.");
  }

  const question = String(parsed.question || "").trim();
  const options = Array.isArray(parsed.options)
    ? parsed.options.map((o) => String(o).trim()).filter(Boolean)
    : [];
  if (!question) throw new Error("Rasmdan savol matni topilmadi.");

  const idx = Number.isInteger(parsed.correctIndex) ? parsed.correctIndex : null;
  return {
    question,
    options,
    correctIndex: idx !== null && idx >= 0 && idx < options.length ? idx : null,
  };
}
