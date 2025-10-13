interface PartyListProps {
  parties: any[];
  onEdit: (party: any) => void;
  onView: (party: any) => void;
  selectedParties?: Set<string>;
  onSelectParty?: (partyId: string, isSelected: boolean) => void;
  onSelectAll?: (isSelected: boolean) => void;
}

export function PartyList({ 
  parties, 
  onEdit, 
  onView, 
  selectedParties = new Set(), 
  onSelectParty, 
  onSelectAll 
}: PartyListProps) {
  if (parties.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No parties found. Create your first party to get started.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
                    checked={selectedParties.size === parties.length && parties.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Party Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parties.map((party) => (
              <tr key={party._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {onSelectParty && (
                    <input
                      type="checkbox"
                      checked={selectedParties.has(party._id)}
                      onChange={(e) => onSelectParty(party._id, e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{party.name}</div>
                    {party.description && (
                      <div className="text-sm text-gray-500 line-clamp-1">{party.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {party.date ? (
                    <div>
                      <div>{new Date(party.date).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(party.date).toLocaleTimeString()}</div>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {party.location || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(party.status)}`}>
                    {party.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onView(party)}
                    className="text-primary hover:text-primary-hover mr-3"
                  >
                    View
                  </button>
                  <button
                    onClick={() => onEdit(party)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
