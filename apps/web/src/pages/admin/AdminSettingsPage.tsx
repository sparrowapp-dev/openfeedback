import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Card, CardTitle, CardDescription, Input, Badge, Spinner } from '../../components/ui';
import { ClipboardIcon, CheckIcon, KeyIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

export function AdminSettingsPage() {
  const { user, accessToken } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [apiKey, setLocalApiKey] = useState<string | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);

  const handleCopyApiKey = () => {
    if (!apiKey) {
      toast.error('No API key available');
      return;
    }
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch API key on mount
  useEffect(() => {
    const fetchApiKey = async () => {
      if (!accessToken || !user?.isAdmin) {
        setIsLoadingKey(false);
        return;
      }

      try {
        const response = await api.get<{ apiKey: string }>(
          '/user/api_key',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setLocalApiKey(response.data.apiKey);
      } catch (error: any) {
        console.error('Failed to fetch API key:', error);
        toast.error('Failed to load API key');
      } finally {
        setIsLoadingKey(false);
      }
    };

    fetchApiKey();
  }, [accessToken, user?.isAdmin]);

  const handleRegenerateApiKey = async () => {
    if (!confirm('Are you sure? This will invalidate your current API key and may break existing integrations.')) {
      return;
    }
    
    setIsRegenerating(true);
    try {
      if (!accessToken) {
        toast.error('You must be logged in to regenerate API key');
        return;
      }

      const response = await api.post<{ apiKey: string; message: string }>(
        '/user/regenerate_api_key',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const newApiKey = response.data.apiKey;
      setLocalApiKey(newApiKey);
      toast.success('API key regenerated successfully!');
    } catch (error: any) {
      console.error('Failed to regenerate API key:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate API key');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <Card className="of-text-center of-py-12">
        <h3 className="of-text-lg of-font-medium of-text-gray-900 of-mb-2">
          Access Denied
        </h3>
        <p className="of-text-gray-600">
          You need admin privileges to access this page.
        </p>
      </Card>
    );
  }

  return (
    <div className="of-space-y-6">
      {/* Header */}
      <div>
        <h1 className="of-text-2xl of-font-bold of-text-gray-900">
          Settings
        </h1>
        <p className="of-text-gray-600 of-mt-1">
          Manage your OpenFeedback configuration.
        </p>
      </div>

      {/* API Key Section */}
      <Card>
        <CardTitle>API Key</CardTitle>
        <CardDescription>
          Use this key for 3rd party integrations and embed widgets. Not needed for logged-in users.
        </CardDescription>
        
        {isLoadingKey ? (
          <div className="of-flex of-justify-center of-py-8">
            <Spinner size="md" />
          </div>
        ) : apiKey ? (
          <>
            <div className="of-mt-4 of-flex of-items-center of-gap-2">
              <div className="of-flex-1 of-relative">
                <Input
                  value={apiKey}
                  readOnly
                  leftIcon={<KeyIcon className="of-w-5 of-h-5" />}
                  className="of-font-mono of-pr-24"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="of-absolute of-right-1 of-top-1/2 of--translate-y-1/2"
                  onClick={handleCopyApiKey}
                >
                  {copied ? (
                    <CheckIcon className="of-w-4 of-h-4 of-text-green-600" />
                  ) : (
                    <ClipboardIcon className="of-w-4 of-h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="of-mt-4 of-flex of-items-center of-justify-between">
              <p className="of-text-sm of-text-gray-500">
                Keep this key secret. Do not share it in public repositories.
              </p>
              {user?.isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerateApiKey}
                  isLoading={isRegenerating}
                  className="of-ml-4"
                >
                  <ArrowPathIcon className="of-w-4 of-h-4 of-mr-2" />
                  Regenerate
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="of-mt-4 of-py-8 of-text-center of-bg-gray-50 of-rounded-lg">
            <p className="of-text-gray-600 of-mb-2">No API key available</p>
            <p className="of-text-sm of-text-gray-500">Please log in again to retrieve your API key</p>
          </div>
        )}
      </Card>

      {/* Widget Embed Section */}
      <Card>
        <CardTitle>Embed Widget</CardTitle>
        <CardDescription>
          Add the feedback widget to your website or app.
        </CardDescription>
        
        <div className="of-mt-4 of-bg-gray-900 of-rounded-lg of-p-4 of-overflow-x-auto">
          <pre className="of-text-sm of-text-green-400 of-font-mono">
{`import { OpenFeedbackProvider, FeedbackBoard } from '@openfeedback/web';
import '@openfeedback/web/styles.css';

function App() {
  return (
    <OpenFeedbackProvider 
      apiUrl="${import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}"
      apiKey="${apiKey}"
    >
      <FeedbackBoard boardId="YOUR_BOARD_ID" />
    </OpenFeedbackProvider>
  );
}`}
          </pre>
        </div>
      </Card>

      {/* Company Settings */}
      <Card>
        <CardTitle>Company Settings</CardTitle>
        <CardDescription>
          Update your company information.
        </CardDescription>
        
        <div className="of-mt-4 of-space-y-4">
          <Input
            label="Company Name"
            defaultValue={user?.companyName || "My Company"}
            placeholder="Enter company name"
            readOnly
          />
          <Input
            label="Support Email"
            type="email"
            defaultValue={user.email}
            placeholder="support@example.com"
          />
          <div className="of-flex of-justify-end">
            <Button onClick={() => toast.success('Settings saved!')}>
              Save Changes
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="of-border-red-200">
        <CardTitle className="of-text-red-600">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible and destructive actions.
        </CardDescription>
        
        <div className="of-mt-4 of-space-y-4">
          <div className="of-flex of-items-center of-justify-between of-p-4 of-bg-red-50 of-rounded-lg">
            <div>
              <h4 className="of-font-medium of-text-gray-900">Delete All Data</h4>
              <p className="of-text-sm of-text-gray-500">
                Permanently delete all boards, posts, and comments.
              </p>
            </div>
            <Button
              variant="danger"
              onClick={() => {
                if (confirm('Are you sure? This cannot be undone.')) {
                  toast.error('This would delete all data');
                }
              }}
            >
              Delete All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
