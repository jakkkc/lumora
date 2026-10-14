// One number for everything: calls, WhatsApp and help.
export const PHONE_DISPLAY = "+254 715 461 584";
export const PHONE_TEL = "+254715461584";
export const WHATSAPP_URL = "https://wa.me/254715461584";

export function whatsappLink(message?: string) {
  return message ? `${WHATSAPP_URL}?text=${encodeURIComponent(message)}` : WHATSAPP_URL;
}

export const CREDIT_NAME = "Munene Jackson";
export const CREDIT_URL = "https://jackson-mwaniki.vercel.app";

// Turns a phone number a guest typed into the international digits WhatsApp needs.
export function waNumber(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (d.length === 9 && /^[17]/.test(d)) d = "254" + d;
  return d;
}
