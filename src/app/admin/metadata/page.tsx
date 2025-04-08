'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SingleMetadataForm from '@/components/metadata/SingleMetadataForm'
import BulkMetadataForm from '@/components/metadata/BulkMetadataForm'

export default function MetadataPage() {
  const [activeTab, setActiveTab] = useState('single')

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Metadata Generation</CardTitle>
          <CardDescription>
            Generate optimised metadata for your pages using AI and your brand guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single URL</TabsTrigger>
              <TabsTrigger value="bulk">Bulk URLs</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <SingleMetadataForm />
            </TabsContent>
            <TabsContent value="bulk">
              <BulkMetadataForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
} 