import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SUPPORTED_LOCALES } from '@/i18n/config';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { t, i18n } = useTranslation('common');
  const { translationsEnabled, setTranslationsEnabled } = useUserPreferencesStore();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // If translations are disabled, show button that enables them
  if (!translationsEnabled) {
    return (
      <Button 
        variant="ghost" 
        size="icon"
        className={className}
        onClick={() => setTranslationsEnabled(true)}
        aria-label="Enable translations"
      >
        <Globe className="h-5 w-5" />
      </Button>
    );
  }

  // If translations are enabled, show language switcher dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className={className}
          aria-label={t('language.switch')}
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => changeLanguage(locale)}
            className={i18n.language === locale ? 'bg-accent' : ''}
          >
            {t(`language.${locale}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

