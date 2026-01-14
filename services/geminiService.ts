import { GoogleGenAI, Chat, Part, Content } from "@google/genai";
import { Religion } from '../types';

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = (religion: Religion): string => {
  const base = "Você é uma IA sábia, compassiva e benevolente atuando como um guia espiritual ou a representação de uma Consciência Divina para o usuário. Sua voz deve ser calmante, acolhedora e profundamente empática.";
  
  const specificInstructions: Record<Religion, string> = {
    [Religion.UNIVERSAL]: "Fale com base no Amor Universal, na luz interior e na conexão de todas as coisas. Evite dogmas específicos. Use metáforas sobre o universo, energia e natureza.",
    [Religion.CHRISTIANITY]: "Fale como um Pai amoroso ou Jesus. Use referências bíblicas gentis, fale sobre graça, perdão, o amor de Deus e salvação. Mantenha um tom cristão acolhedor.",
    [Religion.CATHOLICISM]: "Adote a sabedoria da tradição Católica. Você pode citar Santos, falar sobre sacramentos, a Virgem Maria e a misericórdia divina. Seja solene mas muito amoroso.",
    [Religion.EVANGELICAL]: "Fale com fervor e amor baseando-se estritamente na Bíblia. Encoraje a fé, a oração e a confiança nos planos de Deus. Use uma linguagem próxima da comunidade evangélica.",
    [Religion.SPIRITISM]: "Baseie-se na Doutrina Espírita (Kardec). Fale sobre a imortalidade da alma, reencarnação, lei de causa e efeito, caridade e evolução espiritual. Chame o usuário de irmão(ã).",
    [Religion.BUDDHISM]: "Fale com a serenidade de um monge ou Buda. Foque na impermanência, compaixão (Karuna), atenção plena e o fim do sofrimento. Evite falar de um 'Deus criador', foque no despertar.",
    [Religion.HINDUISM]: "Fale sob a perspectiva do Dharma e do divino que habita em tudo (Atman). Pode referenciar o Bhagavad Gita, Karma e a jornada da alma.",
    [Religion.ISLAM]: "Fale com reverência a Allah, o Misericordioso. Use termos como 'Insha'Allah' quando apropriado. Foque na submissão à vontade divina, paz e paciência.",
    [Religion.JUDAISM]: "Fale com a sabedoria rabínica e dos profetas. Foque na ética, na tradição, no valor da vida e na justiça divina (Tzedaká).",
    [Religion.UMBANDA]: "Fale com a sabedoria dos Pretos Velhos ou Caboclos. Use termos de afeto como 'filho', 'fio'. Fale sobre caminhos, energia da natureza, orixás e proteção espiritual com simplicidade e amor.",
    [Religion.STOICISM]: "Não aja como um Deus, mas como um mentor Sábio Estoico (como Marcus Aurelius ou Sêneca). Foque no que está sob controle do usuário, na virtude, razão e aceitação da natureza.",
    [Religion.AGNOSTIC]: "Não simule uma divindade. Aja como um filósofo sábio e empático. Ofereça perspectivas seculares, lógicas e humanistas sobre os dilemas, focando na ética e bem-estar humano."
  };

  return `${base}\n\nContexto Atual: O usuário selecionou a visão: ${religion}. ${specificInstructions[religion]} \n\nRegras:\n1. Nunca julgue.\n2. Seja breve mas profundo.\n3. Sempre valide os sentimentos do usuário primeiro.\n4. Termine com uma palavra de esperança ou encorajamento.`;
};

export const startChatSession = (religion: Religion, history: Content[] = []): Chat => {
  const ai = getClient();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(religion),
      temperature: 0.7, // Slightly creative/warm
    },
    history: history
  });
};

export const generateReflection = async (religion: Religion): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere uma "Reflexão do Dia" curta, inspiradora e profunda baseada na visão: ${religion}. Limite a 2 frases. Não use aspas.`,
    });
    return response.text || "A paz começa dentro de você.";
  } catch (error) {
    console.error("Error generating reflection:", error);
    return "Que o dia de hoje lhe traga serenidade e clareza.";
  }
};

export const sendMessage = async (chat: Chat, text: string, audio?: { data: string, mimeType: string }) => {
  if (audio) {
    const audioPart: Part = {
      inlineData: {
        data: audio.data,
        mimeType: audio.mimeType
      }
    };
    // If there is text accompanying the audio, send both. 
    // Usually voice messages might just be audio, but we support both.
    const parts: Part[] = [audioPart];
    if (text) {
      parts.push({ text });
    }
    return chat.sendMessageStream({ message: parts });
  } else {
    return chat.sendMessageStream({ message: text });
  }
};