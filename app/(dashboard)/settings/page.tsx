'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Bell, Shield, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Settings</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
          Manage your account and preferences
        </p>
      </div>

      <Card className="transition-shadow hover:shadow-lg duration-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-base sm:text-lg">Profile</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
            <Input id="name" placeholder="Your name" className="mt-2" />
          </div>
          <div>
            <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" className="mt-2" disabled />
          </div>
          <Button className="w-full sm:w-auto">Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="transition-shadow hover:shadow-lg duration-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-base sm:text-lg">Notifications</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-text-secondary">Notification settings coming soon...</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-base sm:text-lg">Appearance</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-text-secondary">Theme customization coming soon...</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
            <CardTitle className="text-base sm:text-lg">Privacy & Security</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">Manage your data and security settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-text-secondary">Privacy settings coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )
}
