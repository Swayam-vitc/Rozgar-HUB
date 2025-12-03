import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { languages } from "@/lib/translations";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = languages[i18n.language as keyof typeof languages];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Globe className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
            {i18n.language.toUpperCase().slice(0, 2)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <ScrollArea className="h-72">
          {Object.entries(languages).map(([code, lang]: [string, any]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => changeLanguage(code)}
              className="flex items-center justify-between"
            >
              <div>
                <span className="font-medium">{lang.nativeName}</span>
                <span className="ml-2 text-xs text-muted-foreground">({lang.name})</span>
              </div>
              {i18n.language === code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
