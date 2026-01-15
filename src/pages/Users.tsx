import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AppRole } from '@/types/database';
import { Users, Loader2, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserWithRole extends Profile {
  role?: AppRole | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('teacher');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        const usersWithRoles: UserWithRole[] = [];
        for (const profile of profiles) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id)
            .single();

          usersWithRoles.push({
            ...(profile as Profile),
            role: roleData?.role as AppRole | null,
          });
        }
        setUsers(usersWithRoles);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser) return;
    setFormLoading(true);

    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedUser.user_id)
        .single();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', selectedUser.user_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: selectedUser.user_id, role: newRole });

        if (error) throw error;
      }

      toast.success('Role assigned successfully');
      setIsAssignDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to assign role', { description: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleIcon = (role?: AppRole | null) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert className="h-4 w-4" />;
      case 'teacher':
        return <ShieldCheck className="h-4 w-4" />;
      case 'parent':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleBadgeClass = (role?: AppRole | null) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/15 text-destructive';
      case 'teacher':
        return 'bg-secondary/15 text-secondary';
      case 'parent':
        return 'bg-primary/15 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="mt-1 text-muted-foreground">
            Manage user accounts and role assignments
          </p>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No users found</h3>
              <p className="text-muted-foreground">Users will appear here when they sign up</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                          {user.full_name.charAt(0)}
                        </div>
                        <span className="font-medium text-foreground">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${getRoleBadgeClass(
                          user.role
                        )}`}
                      >
                        {getRoleIcon(user.role)}
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'No Role'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4">
                      <Dialog
                        open={isAssignDialogOpen && selectedUser?.id === user.id}
                        onOpenChange={(open) => {
                          setIsAssignDialogOpen(open);
                          if (!open) setSelectedUser(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewRole(user.role || 'teacher');
                            }}
                          >
                            {user.role ? 'Change Role' : 'Assign Role'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Assign Role</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <p className="text-sm text-muted-foreground">
                              Assign a role to <strong>{selectedUser?.full_name}</strong>
                            </p>
                            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex justify-end gap-3">
                              <Button
                                variant="outline"
                                onClick={() => setIsAssignDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleAssignRole} disabled={formLoading}>
                                {formLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
