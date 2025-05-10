'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Pencil, Trash2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface UserOut {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_superuser: boolean;
}

interface UserCreate {
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_superuser: boolean;
  password: string;
}

interface UserUpdate {
  username: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_superuser: boolean;
  password?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserOut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    full_name: '',
    is_admin: false,
    is_superuser: false,
    password: ''
  });
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const getToken = () => {
    const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]*)/);
    console.log('Cookie:', document.cookie);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data: UserOut[] = await res.json();
      setUsers(data);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (user?: UserOut) => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        is_admin: user.is_admin,
        is_superuser: user.is_superuser,
        password: ''
      });
      setCurrentUserId(user.id);
    } else {
      setFormData({
        username: '',
        email: '',
        full_name: '',
        is_admin: false,
        is_superuser: false,
        password: ''
      });
      setCurrentUserId(null);
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = getToken();

    try {
      const url = currentUserId
        ? `http://localhost:89/api/users/${currentUserId}`
        : 'http://localhost:89/api/users';
      const method = currentUserId ? 'PUT' : 'POST';
      const payload = currentUserId
        ? ({ ...formData, password: formData.password || undefined } as UserUpdate)
        : (formData as UserCreate);
      console.log('Deleting user with ID:', formData);
      console.log('Using token:', token);
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Request failed');
      }

      toast({
        title: 'Success',
        description: currentUserId ? 'User updated' : 'User created'
      });

      setIsDialogOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    const token = getToken();
    console.log('Deleting user with ID:', id);
    console.log('Using token:', token);
    try {
      const res = await fetch(`http://localhost:89/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Delete failed');
      }

      toast({ title: 'Deleted', description: 'User deleted' });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage system users and permissions
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <UserPlus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg border shadow overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.is_superuser ? 'default' : user.is_admin ? 'secondary' : 'outline'}>
                      {user.is_superuser ? 'Superuser' : user.is_admin ? 'Admin' : 'User'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(user)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                      disabled={user.is_superuser}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentUserId ? 'Edit User' : 'Add User'}</DialogTitle>
            <DialogDescription>
              {currentUserId ? 'Update user info' : 'Create a new user'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  id="is_admin"
                  name="is_admin"
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_admin">Admin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="is_superuser"
                  name="is_superuser"
                  type="checkbox"
                  checked={formData.is_superuser}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                <Label htmlFor="is_superuser">Superuser</Label>
              </div>
            </div>
            {!currentUserId && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentUserId ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}