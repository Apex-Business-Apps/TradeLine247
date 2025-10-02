interface ChatbotAvatarProps {
  size?: number;
}

export function ChatbotAvatar({ size = 32 }: ChatbotAvatarProps) {
  const src =
    size <= 64 ? "/icons/chatbot-64.png" :
    size <= 128 ? "/icons/chatbot-128.png" :
    size <= 256 ? "/icons/chatbot-256.png" : "/icons/chatbot-512.png";
  
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt="CarBOB — your assistant"
      className="rounded-full bg-transparent"
      decoding="async"
      loading="lazy"
    />
  );
}
