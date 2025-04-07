'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/components/providers/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SelectNative } from '@/components/ui/select-native'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Users, Shield, Settings as SettingsIcon, Save, UserPlus, Search, X } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  created_at: string
  last_sign_in: string | null
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

type SettingsTab = 'users' | 'roles' | 'general'

export default function SettingsPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [activeTab, setActiveTab] = useState<SettingsTab>('users')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'users') {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .order('email')

        if (usersError) throw usersError
        setUsers(usersData)
      }

      if (activeTab === 'roles') {
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .order('name')

        if (rolesError) throw rolesError
        setRoles(rolesData)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
    } catch (err) {
      console.error('Error updating user role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update user role')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      setSaving(true)
      setError(null)

      const { error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', roleId)

      if (error) throw error

      // Update local state
      setRoles(roles.map(role => 
        role.id === roleId ? { ...role, ...updates } : role
      ))
    } catch (err) {
      console.error('Error updating role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setSaving(false)
    }
  }

  const handleInviteUser = async () => {
    try {
      setInviting(true)
      setError(null)

      // Create invitation record
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email: inviteEmail,
          role: inviteRole,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'pending'
        })

      if (inviteError) throw inviteError

      // Send invitation email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
        body: { email: inviteEmail, role: inviteRole }
      })

      if (emailError) throw emailError

      setInviteDialogOpen(false)
      setInviteEmail('')
      setInviteRole('')
      
      // Refresh users list
      loadData()
    } catch (err) {
      console.error('Error inviting user:', err)
      setError(err instanceof Error ? err.message : 'Failed to invite user')
    } finally {
      setInviting(false)
    }
  }

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )
    }

    switch (activeTab) {
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="pl-10 w-[300px]"
                />
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </div>

            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <SelectNative
                      value={inviteRole}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInviteRole(e.target.value)}
                      className="w-full"
                    >
                      <option value="">Select a role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))}
                    </SelectNative>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInviteDialogOpen(false)}
                    disabled={inviting}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInviteUser}
                    disabled={!inviteEmail || !inviteRole || inviting}
                  >
                    {inviting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="mr-2 h-4 w-4" />
                    )}
                    {inviting ? 'Sending Invitation...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4">Email</th>
                      <th className="text-left py-3 px-4">Role</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Last Sign In</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 dark:border-gray-700">
                        <td className="py-3 px-4">{user.email}</td>
                        <td className="px-4 py-2">
                          <SelectNative
                            value={user.role}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateUserRole(user.id, e.target.value)}
                            disabled={saving}
                            className="w-full"
                          >
                            {roles.map((role) => (
                              <option key={role.id} value={role.name}>
                                {role.name}
                              </option>
                            ))}
                          </SelectNative>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          {user.last_sign_in
                            ? new Date(user.last_sign_in).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )

      case 'roles':
        return (
          <div className="space-y-6">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <CardTitle>{role.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <Input
                      value={role.description}
                      onChange={(e) => handleUpdateRole(role.id, { description: e.target.value })}
                      placeholder="Role description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Permissions</label>
                    <div className="space-y-2">
                      {role.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={permission}
                            onChange={(e) => {
                              const newPermissions = [...role.permissions]
                              newPermissions[index] = e.target.value
                              handleUpdateRole(role.id, { permissions: newPermissions })
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newPermissions = role.permissions.filter((_, i) => i !== index)
                              handleUpdateRole(role.id, { permissions: newPermissions })
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newPermissions = [...role.permissions, '']
                          handleUpdateRole(role.id, { permissions: newPermissions })
                        }}
                      >
                        Add Permission
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 'general':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Site Name</label>
                  <Input
                    value="MixerAI"
                    onChange={() => {}}
                    placeholder="Enter site name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Support Email</label>
                  <Input
                    value="support@mixerai.com"
                    onChange={() => {}}
                    type="email"
                    placeholder="Enter support email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Default Content Language</label>
                  <SelectNative defaultValue="en" className="w-full">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </SelectNative>
                </div>

                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <div className="flex gap-2">
                    <Input
                      value="••••••••••••••••"
                      type="password"
                      readOnly
                    />
                    <Button variant="outline">
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Use this key to authenticate API requests
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Webhook URL</label>
                  <Input
                    value="https://api.mixerai.com/webhooks"
                    onChange={() => {}}
                    placeholder="Enter webhook URL"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-gray-500">Manage your system configuration</p>
      </div>

      <div className="flex gap-1 border-b dark:border-gray-800">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          className="rounded-none border-b-2 border-transparent px-4 pb-2 pt-1"
          onClick={() => setActiveTab('users')}
        >
          <Users className="mr-2 h-4 w-4" />
          Users
        </Button>
        <Button
          variant={activeTab === 'roles' ? 'default' : 'ghost'}
          className="rounded-none border-b-2 border-transparent px-4 pb-2 pt-1"
          onClick={() => setActiveTab('roles')}
        >
          <Shield className="mr-2 h-4 w-4" />
          Roles
        </Button>
        <Button
          variant={activeTab === 'general' ? 'default' : 'ghost'}
          className="rounded-none border-b-2 border-transparent px-4 pb-2 pt-1"
          onClick={() => setActiveTab('general')}
        >
          <SettingsIcon className="mr-2 h-4 w-4" />
          General
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  )
} 