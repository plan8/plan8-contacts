import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ContactFormProps {
  contact?: any;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

export function ContactForm({ contact, onSubmit, onClose }: ContactFormProps) {
  const [formData, setFormData] = useState({
    firstName: contact?.firstName || "",
    lastName: contact?.lastName || "",
    email: contact?.email || "",
    company: contact?.company || "",
    tags: contact?.tags?.join(", ") || "",
    notes: contact?.notes || "",
  });

  const [emailForSuggestion, setEmailForSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Get company suggestion based on email
  const suggestedCompany = useQuery(
    api.contacts.suggestCompanyFromEmail,
    emailForSuggestion && emailForSuggestion.includes('@') ? { email: emailForSuggestion } : "skip"
  );

  useEffect(() => {
    // Only suggest if we don't already have a company and we're not editing
    if (!contact && !formData.company && suggestedCompany) {
      setShowSuggestion(true);
    } else {
      setShowSuggestion(false);
    }
  }, [suggestedCompany, formData.company, contact]);

  const handleEmailChange = (email: string) => {
    setFormData({ ...formData, email });
    setEmailForSuggestion(email);
  };

  const acceptSuggestion = () => {
    if (suggestedCompany) {
      setFormData({ ...formData, company: suggestedCompany });
      setShowSuggestion(false);
    }
  };

  const dismissSuggestion = () => {
    setShowSuggestion(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags ? formData.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean) : [],
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {contact ? "Edit Contact" : "Add Contact"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {showSuggestion && suggestedCompany && (
              <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-primary">
                      💡 Suggested company: <strong>{suggestedCompany}</strong>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={acceptSuggestion}
                      className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary-hover"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={dismissSuggestion}
                      className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="client, prospect, partner"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              {contact ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
