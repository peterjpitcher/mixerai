'use client'

import Link from 'next/link'
import { withRoleProtection } from '@/components/auth/withRoleProtection'

function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">Manage users, brands, and system settings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link 
          href="/admin/users"
          className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all"
        >
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <p className="text-gray-500">Manage user accounts and permissions</p>
        </Link>

        <Link 
          href="/admin/brands"
          className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all"
        >
          <h2 className="text-xl font-semibold mb-2">Brand Management</h2>
          <p className="text-gray-500">Manage and approve brand registrations</p>
        </Link>

        <Link 
          href="/admin/invitations"
          className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all"
        >
          <h2 className="text-xl font-semibold mb-2">Invitations</h2>
          <p className="text-gray-500">Manage user invitations</p>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">System Overview</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Brands</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Invitations</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-gray-500">No recent activity</div>
        </div>
      </div>
    </div>
  )
}

export default withRoleProtection(AdminPage, ['admin']) 