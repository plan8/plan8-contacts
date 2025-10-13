import { useState } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { InviteContacts } from "./InviteContacts";

interface PartyDetailsProps {
  partyId: string;
  onBack: () => void;
}

export function PartyDetails({ partyId, onBack }: PartyDetailsProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const partyData = useQuery(api.parties.getWithInvitations, { partyId: partyId as any });
  const updateInvitationStatus = useMutation(api.invitations.updateStatus);
  const removeInvitation = useMutation(api.invitations.remove);

  if (!partyData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { party, invitations } = partyData;

  const handleStatusUpdate = async (invitationId: string, status: string) => {
    try {
      await updateInvitationStatus({ id: invitationId as any, status });
      toast.success("Invitation status updated");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleRemoveInvitation = async (invitationId: string) => {
    if (confirm("Are you sure you want to remove this invitation?")) {
      try {
        await removeInvitation({ id: invitationId as any });
        toast.success("Invitation removed");
      } catch (error) {
        toast.error("Failed to remove invitation");
      }
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
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const statusCounts = invitations.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{party.name}</h1>
      </div>

      {/* Party Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Party Details</h2>
            {party.description && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Description:</span>
                <p className="text-gray-600">{party.description}</p>
              </div>
            )}
            {party.date && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Date & Time:</span>
                <p className="text-gray-600">
                  {new Date(party.date).toLocaleDateString()} at {new Date(party.date).toLocaleTimeString()}
                </p>
              </div>
            )}
            {party.location && (
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Location:</span>
                <p className="text-gray-600">{party.location}</p>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Invitation Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{invitations.length}</div>
                <div className="text-sm text-gray-600">Total Invited</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{statusCounts.accepted || 0}</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{statusCounts.declined || 0}</div>
                <div className="text-sm text-gray-600">Declined</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invitations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Invitations</h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Invite Contacts
          </button>
        </div>
        
        {invitations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No invitations sent yet. Start by inviting some contacts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => (
                  <tr key={invitation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.contact?.firstName} {invitation.contact?.lastName}
                        </div>
                        {invitation.contact?.email && (
                          <div className="text-sm text-gray-500">{invitation.contact.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={invitation.status}
                        onChange={(e) => handleStatusUpdate(invitation._id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${getStatusColor(invitation.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="sent">Sent</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                        <option value="maybe">Maybe</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.invitedBy?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation._creationTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleRemoveInvitation(invitation._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
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
        <InviteContacts
          partyId={partyId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
