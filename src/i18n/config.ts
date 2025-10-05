import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Auth
      "auth.signIn": "Sign In",
      "auth.signUp": "Sign Up",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.forgotPassword": "Forgot Password?",
      "auth.noAccount": "Don't have an account?",
      "auth.hasAccount": "Already have an account?",
      
      // Navigation
      "nav.dashboard": "Dashboard",
      "nav.leads": "Leads",
      "nav.inventory": "Inventory",
      "nav.quotes": "Quotes",
      "nav.creditApps": "Credit Applications",
      "nav.inbox": "Inbox",
      "nav.compliance": "Compliance",
      "nav.settings": "Settings",
      
      // Dashboard
      "dashboard.title": "Dashboard",
      "dashboard.newLeads": "New Leads",
      "dashboard.activeQuotes": "Active Quotes",
      "dashboard.soldVehicles": "Sold This Month",
      "dashboard.conversionRate": "Conversion Rate",
      
      // Leads
      "leads.title": "Leads",
      "leads.newLead": "New Lead",
      "leads.search": "Search leads...",
      "leads.status.new": "New",
      "leads.status.contacted": "Contacted",
      "leads.status.qualified": "Qualified",
      "leads.status.quoted": "Quoted",
      "leads.status.sold": "Sold",
      "leads.status.lost": "Lost",
      
      // Consent
      "consent.marketing": "I consent to receive marketing communications",
      "consent.sms": "I consent to receive SMS messages",
      "consent.calls": "I consent to receive phone calls",
      "consent.privacy": "I have read and accept the Privacy Policy",
      "consent.terms": "I accept the Terms of Service",
      "consent.required": "This consent is required",
      
      // AI Assistant
      "ai.greeting": "Hello! I'm AutoRepAi, {{dealer}}'s assistant. How can I help you today?",
      "ai.placeholder": "Type your message...",
      "ai.send": "Send",
      "ai.thinking": "Thinking...",
      
      // Common
      "common.save": "Save",
      "common.cancel": "Cancel",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.view": "View",
      "common.close": "Close",
      "common.loading": "Loading...",
      "common.error": "An error occurred",
      "common.success": "Success",
    }
  },
  fr: {
    translation: {
      // Auth
      "auth.signIn": "Se connecter",
      "auth.signUp": "S'inscrire",
      "auth.email": "Courriel",
      "auth.password": "Mot de passe",
      "auth.forgotPassword": "Mot de passe oublié?",
      "auth.noAccount": "Vous n'avez pas de compte?",
      "auth.hasAccount": "Vous avez déjà un compte?",
      
      // Navigation
      "nav.dashboard": "Tableau de bord",
      "nav.leads": "Prospects",
      "nav.inventory": "Inventaire",
      "nav.quotes": "Soumissions",
      "nav.creditApps": "Demandes de crédit",
      "nav.inbox": "Messagerie",
      "nav.compliance": "Conformité",
      "nav.settings": "Paramètres",
      
      // Dashboard
      "dashboard.title": "Tableau de bord",
      "dashboard.newLeads": "Nouveaux prospects",
      "dashboard.activeQuotes": "Soumissions actives",
      "dashboard.soldVehicles": "Vendus ce mois",
      "dashboard.conversionRate": "Taux de conversion",
      
      // Leads
      "leads.title": "Prospects",
      "leads.newLead": "Nouveau prospect",
      "leads.search": "Rechercher des prospects...",
      "leads.status.new": "Nouveau",
      "leads.status.contacted": "Contacté",
      "leads.status.qualified": "Qualifié",
      "leads.status.quoted": "Soumis",
      "leads.status.sold": "Vendu",
      "leads.status.lost": "Perdu",
      
      // Consent
      "consent.marketing": "Je consens à recevoir des communications marketing",
      "consent.sms": "Je consens à recevoir des messages SMS",
      "consent.calls": "Je consens à recevoir des appels téléphoniques",
      "consent.privacy": "J'ai lu et j'accepte la Politique de confidentialité",
      "consent.terms": "J'accepte les Conditions d'utilisation",
      "consent.required": "Ce consentement est requis",
      
      // AI Assistant
      "ai.greeting": "Bonjour! Je suis AutoRepAi, l'assistant de {{dealer}}. Comment puis-je vous aider aujourd'hui?",
      "ai.placeholder": "Tapez votre message...",
      "ai.send": "Envoyer",
      "ai.thinking": "Réflexion...",
      
      // Common
      "common.save": "Enregistrer",
      "common.cancel": "Annuler",
      "common.delete": "Supprimer",
      "common.edit": "Modifier",
      "common.view": "Voir",
      "common.close": "Fermer",
      "common.loading": "Chargement...",
      "common.error": "Une erreur s'est produite",
      "common.success": "Succès",
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['navigator'],
      caches: []
    }
  });

export default i18n;
