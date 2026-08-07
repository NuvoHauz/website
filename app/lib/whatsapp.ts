export const WHATSAPP_NUMBER = "13174486868";

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppMessage(
  generalMessage: string,
  propertyMessageTemplate: string,
  propertyName?: string,
): string {
  if (propertyName) {
    return propertyMessageTemplate.replace("{property}", propertyName);
  }
  return generalMessage;
}
