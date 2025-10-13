import { useState } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ContactForm } from "./ContactForm";
import { ContactList } from "./ContactList";
import { CsvImport } from "./CsvImport";

export function ContactManager() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedSource, setSelectedSource] = useState("");

  const {
    results: contacts,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.contacts.list,
    {
      search: searchTerm || undefined,
      company: selectedCompany || undefined,
      source: selectedSource || undefined,
    },
    { initialNumItems: 20 }
  );

  const companies = useQuery(api.contacts.getCompanies) ?? [];
  const sources = useQuery(api.contacts.getSources) ?? [];
  const createContact = useMutation(api.contacts.create);
  const updateContact = useMutation(api.contacts.update);
  const deleteContact = useMutation(api.contacts.remove);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            >
              <option value="">All Sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <ContactList
        contacts={contacts}
        onEdit={setEditingContact}
        onDelete={handleDeleteContact}
        onLoadMore={loadMore}
        status={status}
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
    </div>
  );
}
