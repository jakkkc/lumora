// One number for everything: calls, WhatsApp and help.
export const PHONE_DISPLAY = "+254 757 802 406";
export const PHONE_TEL = "+254757802406";
export const WHATSAPP_URL = "https://wa.me/254757802406";

export function whatsappLink(message?: string) {
  return message ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_URL;
}

export const CREDIT_NAME = "Munene Jackson";
export const CREDIT_URL = "https://jackson-mwaniki.vercel.app";
