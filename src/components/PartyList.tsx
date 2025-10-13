interface PartyListProps {
  parties: any[];
  onEdit: (party: any) => void;
  onView: (party: any) => void;
}

export function PartyList({ parties, onEdit, onView }: PartyListProps) {
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {parties.map((party) => (
        <div key={party._id} className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{party.name}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(party.status)}`}>
              {party.status}
            </span>
          </div>
          
          {party.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{party.description}</p>
          )}
          
          <div className="space-y-2 text-sm text-gray-500 mb-4">
            {party.date && (
              <div>📅 {new Date(party.date).toLocaleDateString()} at {new Date(party.date).toLocaleTimeString()}</div>
            )}
            {party.location && (
              <div>📍 {party.location}</div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => onView(party)}
              className="flex-1 px-3 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => onEdit(party)}
              className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
