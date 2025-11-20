import { useState, useEffect } from 'react';
import { X, Cookie, Shield, Settings } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllConsentTypes,
  recordConsent,
  getConsentFromLocalStorage,
  saveConsentToLocalStorage,
  ConsentType,
} from '../lib/consentUtils';

interface CookieConsentBannerProps {
  onConsentGiven?: () => void;
}

export function CookieConsentBanner({ onConsentGiven }: CookieConsentBannerProps) {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consentTypes, setConsentTypes] = useState<ConsentType[]>([]);
  const [selectedConsents, setSelectedConsents] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkConsentStatus();
  }, [user]);

  const checkConsentStatus = async () => {
    const storedConsent = getConsentFromLocalStorage();

    if (storedConsent) {
      setIsVisible(false);
      return;
    }

    const types = await getAllConsentTypes();
    setConsentTypes(types);

    const defaultConsents: Record<string, boolean> = {};
    types.forEach((type) => {
      defaultConsents[type.name] = type.required;
    });
    setSelectedConsents(defaultConsents);

    setIsVisible(true);
  };

  const handleAcceptAll = async () => {
    setIsLoading(true);

    const allConsents: Record<string, boolean> = {};
    consentTypes.forEach((type) => {
      allConsents[type.name] = true;
    });

    saveConsentToLocalStorage(allConsents);

    if (user) {
      for (const type of consentTypes) {
        await recordConsent(user.id, type.name, true, 'cookie_banner');
      }
    }

    setIsVisible(false);
    setIsLoading(false);
    onConsentGiven?.();
  };

  const handleAcceptSelected = async () => {
    setIsLoading(true);

    saveConsentToLocalStorage(selectedConsents);

    if (user) {
      for (const type of consentTypes) {
        await recordConsent(user.id, type.name, selectedConsents[type.name] || false, 'cookie_banner');
      }
    }

    setIsVisible(false);
    setIsLoading(false);
    onConsentGiven?.();
  };

  const handleRejectNonEssential = async () => {
    setIsLoading(true);

    const essentialOnly: Record<string, boolean> = {};
    consentTypes.forEach((type) => {
      essentialOnly[type.name] = type.required;
    });

    saveConsentToLocalStorage(essentialOnly);

    if (user) {
      for (const type of consentTypes) {
        await recordConsent(user.id, type.name, type.required, 'cookie_banner');
      }
    }

    setIsVisible(false);
    setIsLoading(false);
    onConsentGiven?.();
  };

  const toggleConsent = (name: string, required: boolean) => {
    if (required) return;

    setSelectedConsents((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'essential':
        return <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'functional':
        return <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Cookie className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pointer-events-none">
      <div className="w-full max-w-4xl bg-white dark:bg-[#1B1F23] rounded-lg shadow-2xl border border-gray-200 dark:border-[#2A3136] pointer-events-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Cookie className="w-6 h-6 text-[#6B8E65] dark:text-[#8BA888]" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-[#E8EAE7]">
                Cookie & Data Processing Consent
              </h2>
            </div>
          </div>

          {!showDetails ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-[#B7BAAE]">
                We use essential cookies to provide basic functionality and ensure security. We also ask for
                your consent to store preferences and process your business data for tailoring services.
              </p>
              <p className="text-sm text-gray-700 dark:text-[#B7BAAE]">
                You can customize your preferences or accept all to continue. Your choices can be changed
                anytime in Profile & Security settings.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleAcceptAll} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Accept All'}
                </Button>
                <Button variant="secondary" onClick={handleRejectNonEssential} disabled={isLoading}>
                  Accept Essential Only
                </Button>
                <Button variant="secondary" onClick={() => setShowDetails(true)}>
                  Customize
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-[#B7BAAE]">
                Customize your consent preferences below. Required items are necessary for the service to
                function and cannot be disabled.
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {consentTypes.map((type) => (
                  <div
                    key={type.id}
                    className="border border-gray-200 dark:border-[#2A3136] rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getCategoryIcon(type.category)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900 dark:text-[#E8EAE7]">
                              {type.display_name}
                            </h3>
                            {type.required && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-[#B7BAAE] mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleConsent(type.name, type.required)}
                        disabled={type.required}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          selectedConsents[type.name]
                            ? 'bg-[#6B8E65] dark:bg-[#8BA888]'
                            : 'bg-gray-200 dark:bg-[#2A3136]'
                        } ${type.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            selectedConsents[type.name] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200 dark:border-[#2A3136]">
                <Button onClick={handleAcceptSelected} disabled={isLoading}>
                  {isLoading ? 'Processing...' : 'Save Preferences'}
                </Button>
                <Button variant="secondary" onClick={() => setShowDetails(false)}>
                  Back
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-[#8A8E84] mt-4">
            By continuing to use this service, you acknowledge our{' '}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#6B8E65] dark:hover:text-[#8BA888]"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#6B8E65] dark:hover:text-[#8BA888]"
            >
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
