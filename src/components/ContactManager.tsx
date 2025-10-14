import { useState } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ContactForm } from "./ContactForm";
import { ContactList } from "./ContactList";
import { CsvImport } from "./CsvImport";
import { BulkPartyInvite } from "./BulkPartyInvite";

export function ContactManager() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedCreatedBy, setSelectedCreatedBy] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkPartyInvite, setShowBulkPartyInvite] = useState(false);

  const {
    results: contacts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.contacts.list,
    {
      search: searchTerm || undefined,
      company: selectedCompany || undefined,
      createdBy: selectedCreatedBy || undefined,
    },
    { initialNumItems: 20 }
  );

  const companies = useQuery(api.contacts.getCompanies) ?? [];
  const createdByUsers = useQuery(api.contacts.getCreatedByUsers) ?? [];
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);
  const batchDeleteContacts = useMutation(api.contacts.batchDelete);

  const handleCreateContact = async (data: any) => {
    try {
      await createContact(data);
      toast.success("Contact created successfully");
      setShowForm(false);
    } catch (error) {
      toast.error("Failed to create contact");
    }
  };

  const handleUpdateContact = async (data: any) => {
    try {
      await updateContact({ id: editingContact._id, ...data });
      toast.success("Contact updated successfully");
      setEditingContact(null);
    } catch (error) {
      toast.error("Failed to update contact");
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      try {
        await deleteContact({ id: id as any });
        toast.success("Contact deleted successfully");
      } catch (error) {
        toast.error("Failed to delete contact");
      }
    }
  };

  const handleSelectContact = (contactId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (isSelected) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = new Set(contacts.map(contact => contact._id));
      setSelectedContacts(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedContacts(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedContacts.size} contacts?`)) {
      try {
        await batchDeleteContacts({ ids: Array.from(selectedContacts) as any[] });
        toast.success(`${selectedContacts.size} contacts deleted successfully`);
        setSelectedContacts(new Set());
        setShowBulkActions(false);
      } catch (error) {
        toast.error("Failed to delete some contacts");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Import Data
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Add Contact
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts or domains..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            <p className="text-xs text-gray-500 mt-1">
              Try searching by name, email, or company domain (e.g., "acme" or "acme.com")
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Added By
            </label>
            <select
              value={selectedCreatedBy}
              onChange={(e) => setSelectedCreatedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">All Users</option>
              {createdByUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  setSelectedContacts(new Set());
                  setShowBulkActions(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkPartyInvite(true)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm"
              >
                Add to Party
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact List */}
      <ContactList
        contacts={contacts}
        onEdit={setEditingContact}
        onDelete={handleDeleteContact}
        onView={(contact) => navigate(`/contacts/${contact._id}`)}
        onLoadMore={loadMore}
        status={status}
        selectedContacts={selectedContacts}
        onSelectContact={handleSelectContact}
        onSelectAll={handleSelectAll}
      />

      {/* Modals */}
      {showForm && (
        <ContactForm
          onSubmit={handleCreateContact}
          onClose={() => setShowForm(false)}
        />
      )}

      {editingContact && (
        <ContactForm
          contact={editingContact}
          onSubmit={handleUpdateContact}
          onClose={() => setEditingContact(null)}
        />
      )}

      {showImport && (
        <CsvImport onClose={() => setShowImport(false)} />
      )}

      {showBulkPartyInvite && (
        <BulkPartyInvite
          selectedContactIds={Array.from(selectedContacts)}
          onClose={() => setShowBulkPartyInvite(false)}
          onSuccess={() => {
            setSelectedContacts(new Set());
            setShowBulkActions(false);
          }}
        />
      )}
    </div>
  );
}
