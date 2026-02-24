import { GoogleGenAI } from "@google/genai";

// Use gemini-2.5-flash for speed and multimodal capabilities (OCR equivalent)
const MODEL_NAME = 'gemini-2.5-flash';
const IMAGE_MODEL_NAME = 'gemini-2.5-flash-image';

// Helper to convert base64 for Gemini
const fileToGenerativePart = (base64Data: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64Data,
      mimeType
    },
  };
};

export const analyzeDocument = async (
  base64File: string, 
  mimeType: string, 
  userPrompt: string
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    return "Error: API Key is missing. Please ensure process.env.API_KEY is set.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const systemInstruction = `
      أنت مساعد قانوني ذكي متخصص في القانون التونسي. 
      دورك هو مساعدة المحامين في تحليل الوثائق القانونية، محاضر الشرطة، والعقود.
      يجب أن تكون إجاباتك باللغة العربية، دقيقة، ومهنية.
      استخرج الثغرات القانونية، التناقضات في الأقوال، والإجراءات الشكلية الباطلة حسب مجلة الإجراءات الجزائية التونسية.
      إذا كان المستند مادة دراسية، قم بتلخيص النقاط القانونية الهامة.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
            fileToGenerativePart(base64File, mimeType),
            { text: userPrompt || "قم بتحليل هذه الوثيقة واستخراج النقاط الهامة." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.3, // Low temperature for factual analysis
      }
    });

    return response.text || "لم يتم استخراج أي نص. يرجى المحاولة مرة أخرى.";

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return `حدث خطأ أثناء التحليل: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const generateCreativeImage = async (prompt: string): Promise<string | null> => {
  if (!process.env.API_KEY) return null;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL_NAME,
      contents: {
        parts: [{ text: prompt }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};

export const chatWithCaseDocument = async (
  base64File: string,
  mimeType: string,
  history: { role: 'user' | 'model', text: string }[],
  newMessage: string
): Promise<string> => {
  if (!process.env.API_KEY) return "Error: API Key missing";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const chatHistory = [
      {
        role: 'user',
        parts: [
          fileToGenerativePart(base64File, mimeType),
          { text: "هذا هو ملف القضية. سأطرح عليك أسئلة بخصوصه. تصرف كمستشار قانوني تونسي خبير." }
        ]
      },
      {
        role: 'model',
        parts: [{ text: "حسناً، لقد اطلعت على الملف. أنا جاهز للإجابة على استفساراتك القانونية واستخراج التفاصيل الدقيقة منه." }]
      },
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    ];

    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: chatHistory,
      config: {
        temperature: 0.4,
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "لم أتمكن من العثور على إجابة.";

  } catch (error) {
    console.error("Chat Error:", error);
    return "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي.";
  }
};

export const generateContract = async (type: string, parties: string, details: string): Promise<string> => {
  if (!process.env.API_KEY) return "Error: API Key missing";

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
      قم بصياغة عقد قانوني رسمي ومتكامل حسب القانون التونسي (مجلة الالتزامات والعقود).
      
      نوع العقد: ${type}
      الأطراف: ${parties}
      تفاصيل وشروط خاصة: ${details}

      يجب أن يكون العقد باللغة العربية الفصحى القانونية، ويحتوي على الفصول اللازمة (الموضوع، الثمن، الالتزامات، الفسخ، النزاعات).
      قم بتنسيق النص باستخدام HTML بسيط (استخدم <h3> للفصول و <p> للفقرات و <ul> للنقاط) ليكون جاهزاً للعرض والطباعة.
      لا تضف أي مقدمات أو خاتمات من عندك، ابدأ بالعنوان "عقد ${type}" مباشرة.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });

    return response.text || "فشل في توليد العقد.";
  } catch (error) {
    console.error("Contract Gen Error:", error);
    return "حدث خطأ أثناء توليد العقد.";
  }
};