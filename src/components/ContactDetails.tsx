import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../convex/_generated/dataModel";

interface ContactDetailsProps {
  contactId: Id<"contacts">;
  onBack: () => void;
}

export function ContactDetails({ contactId, onBack }: ContactDetailsProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const contact = useQuery(api.contacts.get, { id: contactId });
  const invitations = useQuery(api.invitations.getByContact, { contactId });
  const parties = useQuery(api.parties.list) ?? [];
  const createInvitation = useMutation(api.invitations.create);

  const handleInvite = async (partyId: Id<"parties">) => {
    try {
      await createInvitation({
        partyId,
        contactId,
      });
      toast.success("Contact invited to party successfully");
      setShowInviteModal(false);
    } catch (error) {
      toast.error("Failed to invite contact to party");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "maybe":
        return "bg-orange-100 text-orange-800";
      case "attended":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusCounts = () => {
    if (!invitations) return {};
    
    return invitations.reduce((counts, invitation) => {
      counts[invitation.status] = (counts[invitation.status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  if (!contact) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Contacts
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-gray-600">{contact.email}</p>
            {contact.company && (
              <p className="text-sm text-gray-500">{contact.company}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
        >
          Invite to Party
        </button>
      </div>

      {/* Contact Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="text-sm text-gray-900">{contact.email || "Not provided"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="text-sm text-gray-900">{contact.phone || "Not provided"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <p className="text-sm text-gray-900">{contact.company || "Not provided"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <p className="text-sm text-gray-900">{contact.position || "Not provided"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <p className="text-sm text-gray-900 capitalize">{contact.source}</p>
          </div>
          {contact.tags && contact.tags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {contact.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {contact.notes && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <p className="text-sm text-gray-900 mt-1">{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Invitation Summary */}
      {invitations && invitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">Party Invitations Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{statusCounts.sent || 0}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{statusCounts.accepted || 0}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{statusCounts.declined || 0}</div>
              <div className="text-sm text-gray-600">Declined</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{statusCounts.maybe || 0}</div>
              <div className="text-sm text-gray-600">Maybe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{statusCounts.attended || 0}</div>
              <div className="text-sm text-gray-600">Attended</div>
            </div>
          </div>
        </div>
      )}

      {/* Party Invitations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Party Invitations</h2>
            <span className="text-sm text-gray-500">
              {invitations?.length || 0} invitation{invitations?.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {!invitations || invitations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No party invitations yet. Invite this contact to a party to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.party?.name || "Unknown Party"}
                        </div>
                        {invitation.party?.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {invitation.party.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.party?.date ? (
                        <div>
                          <div>{new Date(invitation.party.date).toLocaleDateString()}</div>
                          <div className="text-gray-500">
                            {new Date(invitation.party.date).toLocaleTimeString()}
                          </div>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.party?.location || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invitation.sentAt ? (
                        new Date(invitation.sentAt).toLocaleDateString()
                      ) : (
                        "Not sent"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Invite to Party</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Party
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleInvite(e.target.value as Id<"parties">);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Select a party...</option>
                {parties.map((party) => (
                  <option key={party._id} value={party._id}>
                    {party.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
