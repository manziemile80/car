import { PageHeader } from '@/components/layout/PageHeader';
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
import { useAuth } from '@/contexts/AuthContext';
import { Profile, AppRole } from '@/types/database';
import { Users, Loader2, Shield, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserWithRole extends Profile {
  role?: AppRole | null;
}

const roleDisplayNames: Record<AppRole, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
  viewer: 'Viewer (read-only)',
  stock_manager: 'Stock Manager',
  director_of_studies: 'Director of Studies',
  director_of_discipline: 'Director of Discipline',
};

export default function UsersPage() {
  const { role: currentRole, user: currentUser } = useAuth();
  const isAdmin = currentRole === 'admin';
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('teacher');
  const [editName, setEditName] = useState('');
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
      // Update profile name
      if (editName && editName !== selectedUser.full_name) {
        const { error: pErr } = await supabase
          .from('profiles')
          .update({ full_name: editName })
          .eq('user_id', selectedUser.user_id);
        if (pErr) throw pErr;
      }
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

      toast.success('User updated successfully');
      setIsAssignDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error('Failed to update user', { description: error.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (u: UserWithRole) => {
    if (u.user_id === currentUser?.id) return toast.error('You cannot delete your own account');
    if (!confirm(`Delete user "${u.full_name}"? This removes their profile and role assignments.`)) return;
    try {
      await supabase.from('user_roles').delete().eq('user_id', u.user_id);
      const { error } = await supabase.from('profiles').delete().eq('user_id', u.user_id);
      if (error) throw error;
      toast.success('User removed');
      fetchUsers();
    } catch (e: any) {
      toast.error('Failed to delete user', { description: e.message });
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
      case 'student':
        return <ShieldCheck className="h-4 w-4" />;
      case 'viewer':
        return <Shield className="h-4 w-4" />;
      case 'stock_manager':
        return <Shield className="h-4 w-4" />;
      case 'director_of_studies':
        return <ShieldCheck className="h-4 w-4" />;
      case 'director_of_discipline':
        return <ShieldAlert className="h-4 w-4" />;
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
      case 'student':
        return 'bg-info/15 text-info';
      case 'viewer':
        return 'bg-muted text-muted-foreground';
      case 'stock_manager':
        return 'bg-warning/15 text-warning';
      case 'director_of_studies':
        return 'bg-indigo-500/15 text-indigo-400';
      case 'director_of_discipline':
        return 'bg-rose-500/15 text-rose-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          eyebrow="Administration"
          title="User Management"
          description="Manage user accounts and role assignments across the school system."
        />

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
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[640px]">
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
                        {user.role ? roleDisplayNames[user.role] : 'No Role'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4">
                    {isAdmin ? (
                    <div className="flex gap-2">
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
                              setEditName(user.full_name);
                            }}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-sm">
                          <DialogHeader>
                            <DialogTitle>Edit User</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Full Name</Label>
                              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Role</Label>
                            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Administrator</SelectItem>
                                <SelectItem value="teacher">Teacher</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="stock_manager">Stock Manager</SelectItem>
                                <SelectItem value="viewer">Viewer (read-only)</SelectItem>
                                <SelectItem value="director_of_studies">Director of Studies</SelectItem>
                                <SelectItem value="director_of_discipline">Director of Discipline</SelectItem>
                              </SelectContent>
                            </Select>
                            </div>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">View only</span>
                    )}
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
