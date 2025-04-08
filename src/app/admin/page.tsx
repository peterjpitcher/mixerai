'use client'

import Link from 'next/link'
import { withRoleProtection } from '@/components/auth/withRoleProtection'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome to Your Admin Dashboard</h1>
        <p className="text-gray-500">Here's everything you need to manage your organisation</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TooltipProvider>
          <Link 
            href="/admin/users"
            className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">User Management</h2>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage user accounts, roles, and permissions for your organisation</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-gray-500">Organise and customise user access levels</p>
          </Link>

          <Link 
            href="/admin/brands"
            className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Brand Management</h2>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Review and approve brand registrations, manage brand settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-gray-500">Review and customise brand settings</p>
          </Link>

          <Link 
            href="/admin/invitations"
            className="p-6 bg-white rounded-lg shadow dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Invitations</h2>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send and track invitations for new team members</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-gray-500">Invite and onboard new team members</p>
          </Link>
        </TooltipProvider>
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
          <div className="text-gray-500">No recent activity to display</div>
        </div>
      </div>
    </div>
  )
}

export default withRoleProtection(AdminPage, ['admin']) 