#!/bin/bash

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Deploy the Edge Function
echo "Deploying Edge Function..."
supabase functions deploy create-invitation

echo "Edge Function deployed successfully!" 