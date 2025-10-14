import { useState } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { InviteContacts } from "./InviteContacts";
import { QRCodeComponent } from "./QRCode";

interface PartyDetailsProps {
  partyId: string;
  onBack: () => void;
}

export function PartyDetails({ partyId, onBack }: PartyDetailsProps) {
  const navigate = useNavigate();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  const partyData = useQuery(api.parties.getWithInvitations, { partyId: partyId as any });
  const filteredInvitations = useQuery(api.invitations.getByParty, { 
    partyId: partyId as any,
    search: searchTerm || undefined,
    status: selectedStatus || undefined,
  });
  const updateInvitationStatus = useMutation(api.invitations.updateStatus);
  const removeInvitation = useMutation(api.invitations.remove);
  const batchUpdateInvitationStatus = useMutation(api.invitations.batchUpdateStatus);
  const batchDeleteInvitations = useMutation(api.invitations.batchDelete);

  if (!partyData) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { party } = partyData;
  const invitations = filteredInvitations || [];

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

  const handleSelectInvitation = (invitationId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedInvitations);
    if (isSelected) {
      newSelected.add(invitationId);
    } else {
      newSelected.delete(invitationId);
    }
    setSelectedInvitations(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = new Set(invitations.map(inv => inv._id));
      setSelectedInvitations(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedInvitations(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      await batchUpdateInvitationStatus({ 
        ids: Array.from(selectedInvitations) as any[], 
        status 
      });
      toast.success(`${selectedInvitations.size} invitations updated to ${status}`);
      setSelectedInvitations(new Set());
      setShowBulkActions(false);
    } catch (error) {
      toast.error("Failed to update some invitations");
    }
  };

  const handleBulkRemove = async () => {
    if (confirm(`Are you sure you want to remove ${selectedInvitations.size} invitations?`)) {
      try {
        await batchDeleteInvitations({ ids: Array.from(selectedInvitations) as any[] });
        toast.success(`${selectedInvitations.size} invitations removed`);
        setSelectedInvitations(new Set());
        setShowBulkActions(false);
      } catch (error) {
        toast.error("Failed to remove some invitations");
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
      case "attended":
        return "bg-emerald-100 text-emerald-800";
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
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">{statusCounts.attended || 0}</div>
                <div className="text-sm text-gray-600">Attended</div>
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
        
        {/* Public Attendance Link */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Public Attendance</h3>
              <p className="text-xs text-gray-500">Share this link or QR code for public attendance registration</p>
            </div>
            
            {/* Link Section */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/parties/${partyId}/attendance`}
                className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded text-gray-600 flex-1"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/parties/${partyId}/attendance`);
                  toast.success("Link copied to clipboard!");
                }}
                className="px-4 py-2 text-sm bg-primary text-white rounded hover:bg-primary-hover transition-colors whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
            
            {/* QR Code Section */}
            <div className="flex justify-center sm:justify-start">
              <QRCodeComponent 
                text={`${window.location.origin}/parties/${partyId}/attendance`}
                size={120}
                className="border border-gray-200 rounded-lg p-2 bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary">
                {selectedInvitations.size} invitation{selectedInvitations.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  setSelectedInvitations(new Set());
                  setShowBulkActions(false);
                }}
                className="text-sm text-primary hover:text-primary/80"
              >
                Clear selection
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate("attended")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm"
              >
                Mark as Attended
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("accepted")}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                Mark as Accepted
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("declined")}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Mark as Declined
              </button>
              <button
                onClick={() => handleBulkStatusUpdate("sent")}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors text-sm"
              >
                Mark as Sent
              </button>
              <button
                onClick={handleBulkRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Remove Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitations */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">Invitations</h2>
            {(searchTerm || selectedStatus) && (
              <p className="text-sm text-gray-600 mt-1">
                Showing {invitations.length} result{invitations.length !== 1 ? 's' : ''}
                {searchTerm && ` for "${searchTerm}"`}
                {selectedStatus && ` with status "${selectedStatus}"`}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Invite Contacts
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search contacts
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="sm:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="maybe">Maybe</option>
                <option value="attended">Attended</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        
        {invitations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchTerm || selectedStatus ? 
              "No invitations match your current filters. Try adjusting your search or filter criteria." :
              "No invitations sent yet. Start by inviting some contacts."
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedInvitations.size === invitations.length && invitations.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </th>
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
                      <input
                        type="checkbox"
                        checked={selectedInvitations.has(invitation._id)}
                        onChange={(e) => handleSelectInvitation(invitation._id, e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      />
                    </td>
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
                        <option value="attended">Attended</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.invitedBy?.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(invitation._creationTime).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/contacts/${invitation.contactId}`)}
                          className="text-primary hover:text-primary-hover"
                        >
                          View Contact
                        </button>
                        <button
                          onClick={() => handleRemoveInvitation(invitation._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </div>
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
