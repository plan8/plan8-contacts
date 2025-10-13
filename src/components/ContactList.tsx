interface ContactListProps {
  contacts: any[];
  onEdit: (contact: any) => void;
  onDelete: (id: string) => void;
  onView?: (contact: any) => void;
  onLoadMore: (numItems: number) => void;
  status: string;
  selectedContacts?: Set<string>;
  onSelectContact?: (contactId: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
}

export function ContactList({ 
  contacts, 
  onEdit, 
  onDelete, 
  onView,
  onLoadMore, 
  status, 
  selectedContacts = new Set(), 
  onSelectContact, 
  onSelectAll 
}: ContactListProps) {
  if (status === "LoadingFirstPage") {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No contacts found. Add your first contact to get started.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {onSelectAll && (
                  <input
                    type="checkbox"
                    checked={selectedContacts.size === contacts.length && contacts.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {onSelectContact && (
                    <input
                      type="checkbox"
                      checked={selectedContacts.has(contact._id)}
                      onChange={(e) => onSelectContact(contact._id, e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </div>
                    {contact.position && (
                      <div className="text-sm text-gray-500">{contact.position}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {contact.email && (
                      <div>
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div>
                        <a href={`tel:${contact.phone}`} className="text-gray-600">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {contact.company || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {contact.source}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags?.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {onView && (
                    <button
                      onClick={() => onView(contact)}
                      className="text-primary hover:text-primary-hover mr-3"
                    >
                      View
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(contact)}
                    className="text-primary hover:text-primary-hover mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(contact._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {status === "CanLoadMore" && (
        <div className="px-6 py-4 border-t bg-gray-50">
          <button
            onClick={() => onLoadMore(20)}
            className="w-full px-4 py-2 text-sm text-primary hover:text-primary-hover font-medium"
          >
            Load More
          </button>
        </div>
      )}
      
      {status === "LoadingMore" && (
        <div className="px-6 py-4 border-t bg-gray-50 text-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
        </div>
      )}
    </div>
  );
}
