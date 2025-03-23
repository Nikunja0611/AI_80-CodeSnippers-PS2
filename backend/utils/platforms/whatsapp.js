// Code snippet for WhatsApp integration
const whatsappSender = (phoneNumber, message, media = null) => {
    // Connect to WhatsApp Business API
    return whatsappClient.messages.create({
      to: phoneNumber,
      body: message,
      mediaUrl: media ? [media.url] : []
    });
  };