import chatHeadIcon from '@/assets/chat_head.svg';

interface ChatbotAvatarProps {
  size?: number;
}

export function ChatbotAvatar({ size = 32 }: ChatbotAvatarProps) {
  return (
    <img
      src={chatHeadIcon}
      width={size}
      height={size}
      alt="CarBOB — your assistant"
      className="rounded-full bg-transparent"
      decoding="async"
      loading="lazy"
    />
  );
}
