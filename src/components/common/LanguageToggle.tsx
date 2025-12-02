import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORTED_LOCALES } from '@/i18n/config';

const LANGUAGES = [
  { code: 'en', labelKey: 'language.en' },
  { code: 'fr-CA', labelKey: 'language.fr-CA' },
] as const;

export function LanguageToggle({ className }: { className?: string }) {
  const { t, i18n } = useTranslation('common');

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  const activeLanguage = LANGUAGES.find((lang) => lang.code === i18n.language);
  const fallbackLanguage = SUPPORTED_LOCALES[0];
  const currentLabel = activeLanguage
    ? t(activeLanguage.labelKey)
    : t(`language.${fallbackLanguage}`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('language.switch')}
          className={className}
        >
          <Globe className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{currentLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
          >
            {t(lang.labelKey)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
