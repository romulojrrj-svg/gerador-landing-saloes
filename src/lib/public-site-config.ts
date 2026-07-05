const WHATSAPP_PHONE_PLACEHOLDER = "5521966558675";
const WHATSAPP_MESSAGE =
  "Ola! Quero solicitar uma previa sem compromisso para a pagina do meu negocio.";

export const PUBLIC_SERVICE_WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE_PLACEHOLDER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`;
