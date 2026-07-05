const WHATSAPP_PHONE_PLACEHOLDER = "5500000000000";
const WHATSAPP_MESSAGE =
  "Olá! Quero solicitar uma prévia sem compromisso para a página do meu negócio.";

export const PUBLIC_SERVICE_WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE_PLACEHOLDER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`;
