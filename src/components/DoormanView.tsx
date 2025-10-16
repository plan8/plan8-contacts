import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface DoormanViewProps {
  partyId: string;
  onBack: () => void;
}

export function DoormanView({ partyId, onBack }: DoormanViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const party = useQuery(api.parties.getPublic, { partyId: partyId as any });
  const invitations = useQuery(api.invitations.getByParty, { partyId: partyId as any });
  const updateInvitationStatus = useMutation(api.invitations.updateStatus);
  const publicAttend = useMutation(api.invitations.publicAttend);
  const undoCheckIn = useMutation(api.invitations.undoCheckIn);

  // Filter invitations based on search term
  const filteredInvitations = invitations?.filter(invitation => {
    if (!searchTerm) return true;
    if (!invitation.contact) return false;
    
    const fullName = `${invitation.contact.firstName} ${invitation.contact.lastName}`.toLowerCase();
    const email = invitation.contact.email?.toLowerCase() || '';
    const company = invitation.contact.company?.toLowerCase() || '';
    
    return fullName.includes(searchTerm.toLowerCase()) || 
           email.includes(searchTerm.toLowerCase()) || 
           company.includes(searchTerm.toLowerCase());
  }) || [];

  // Calculate attendance statistics
  const stats = invitations?.reduce((acc, invitation) => {
    acc[invitation.status] = (acc[invitation.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const totalInvited = invitations?.length || 0;
  const attended = stats.attended || 0;
  const accepted = stats.accepted || 0;
  const declined = stats.declined || 0;
  const pending = stats.pending || 0;
  const sent = stats.sent || 0;

  const handleCheckIn = async (invitationId: string) => {
    try {
      await updateInvitationStatus({ id: invitationId as any, status: "attended" });
      toast.success("Checked in successfully!");
    } catch (error) {
      toast.error("Failed to check in");
    }
  };

  const handleUndoCheckIn = async (invitationId: string) => {
    try {
      await undoCheckIn({ id: invitationId as any });
      toast.success("Check-in undone!");
    } catch (error) {
      toast.error("Failed to undo check-in");
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddForm.firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    try {
      await publicAttend({
        partyId: partyId as any,
        firstName: quickAddForm.firstName.trim(),
        lastName: quickAddForm.lastName.trim(),
        email: quickAddForm.email.trim() || undefined,
      });
      toast.success("Person added and checked in!");
      setQuickAddForm({ firstName: "", lastName: "", email: "" });
      setShowQuickAdd(false);
    } catch (error) {
      toast.error("Failed to add person");
    }
  };

  if (!party || invitations === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* <div className="bg-white shadow-sm border-b p-4">
        <div className="mx-auto py-4">
          <div className="flex items-center justify-between">
            <div>
              <button onClick={onBack} className="text-primary hover:underline flex items-center gap-1 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Parties
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{party.name} - Doorman</h1>
           
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Invited</div>
              <div className="text-2xl font-bold text-primary">{totalInvited}</div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="mx-auto py-2">
        {/* Statistics Section */}
       

        {/* Search Section */}
        <div className="p-1 mb-2">
          <div className="flex flex-row gap-2 items-center w-full justify-between">
            <div className="flex">
              
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or company..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg"
                autoFocus
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setShowQuickAdd(true)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors font-medium"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">
              {searchTerm ? `Search Results (${filteredInvitations.length})` : "All Invitees"}
            </h2>
          </div> */}

          {filteredInvitations.length === 0 ? (
            <div className="p-8 text-center">
              {searchTerm ? (
                <div>
                  <div className="text-gray-500 mb-4">No one found matching "{searchTerm}"</div>
                  <button
                    onClick={() => setShowQuickAdd(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                  >
                    Add them to the party
                  </button>
                </div>
              ) : (
                <div className="text-gray-500">No invitations found for this party</div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInvitations.map((invitation) => (
                <div key={invitation._id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-lg font-medium text-gray-900 truncate">
                            {invitation.contact?.firstName} {invitation.contact?.lastName}
                          </div>
                          {invitation.contact?.email && (
                            <div className="text-sm text-gray-500 truncate">{invitation.contact.email}</div>
                          )}
                          {invitation.contact?.company && (
                            <div className="text-sm text-gray-500 truncate">{invitation.contact.company}</div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            invitation.status === "attended" 
                              ? "bg-emerald-100 text-emerald-800" 
                              : invitation.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : invitation.status === "declined"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {invitation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {invitation.status === "attended" ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <div className="text-emerald-600 font-medium flex items-center gap-1 text-sm">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden sm:inline">Checked In</span>
                            <span className="sm:hidden">✓</span>
                          </div>
                          <button
                            onClick={() => handleUndoCheckIn(invitation._id)}
                            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                          >
                            Undo
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(invitation._id)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium whitespace-nowrap"
                        >
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 mt-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">{attended}</div>
              <div className="text-sm text-gray-600">Attended</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{declined}</div>
              <div className="text-sm text-gray-600">Declined</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{sent}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{totalInvited}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </div>

        {/* Quick Add Modal */}
        {showQuickAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold mb-4">Add New Attendee</h2>
              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickAddForm.firstName}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={quickAddForm.lastName}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={quickAddForm.email}
                    onChange={(e) => setQuickAddForm({ ...quickAddForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Enter email (optional)"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                  >
                    Add & Check In
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickAdd(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
