import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface InviteContactsProps {
  partyId: string;
  onClose: () => void;
}

export function InviteContacts({ partyId, onClose }: InviteContactsProps) {
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  const {
    results: contacts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.contacts.list,
    { search: searchTerm || undefined },
    { initialNumItems: 20 }
  );

  const bulkInvite = useMutation(api.invitations.bulkInvite);

  const handleToggleContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleInviteSelected = async () => {
    if (selectedContacts.size === 0) {
      toast.error("Please select at least one contact");
      return;
    }

    try {
      await bulkInvite({
        partyId: partyId as any,
        contactIds: Array.from(selectedContacts) as any,
      });
      toast.success(`Invited ${selectedContacts.size} contacts`);
      onClose();
    } catch (error) {
      toast.error("Failed to send invitations");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">Invite Contacts</h2>
        </div>
        
        <div className="p-6">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Selected count */}
          <div className="mb-4 text-sm text-gray-600">
            {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
          </div>

          {/* Contact list */}
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            {status === "LoadingFirstPage" ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No contacts found
              </div>
            ) : (
              <>
                {contacts.map((contact) => (
                  <div
                    key={contact._id}
                    className="flex items-center p-4 border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleToggleContact(contact._id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact._id)}
                      onChange={() => handleToggleContact(contact._id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.email} {contact.company && `• ${contact.company}`}
                      </div>
                    </div>
                  </div>
                ))}
                
                {status === "CanLoadMore" && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => loadMore(20)}
                      className="text-primary hover:text-primary-hover font-medium"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-2">
          <button
            onClick={handleInviteSelected}
            disabled={selectedContacts.size === 0}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            Invite Selected ({selectedContacts.size})
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
