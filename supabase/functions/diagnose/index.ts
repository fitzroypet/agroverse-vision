// Follow this Deno style guide: https://deno.land/manual/references/contributing/style_guide
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Plant disease diagnosis function loaded!")

interface DiagnosisRequest {
  image_url: string;
  top_k?: number;
}

interface DiagnosisResponse {
  success: boolean;
  error?: string;
  details?: string;
  diagnosis?: {
    primary_disease: string;
    confidence: number;
    description: string;
    symptoms: string;
    recommendation: string;
  };
  alternative_diagnoses?: Array<{
    disease_name: string;
    confidence: number;
    description: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { image_url, top_k = 5 } = await req.json() as DiagnosisRequest

    if (!image_url) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameter: image_url"
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Call the Python function via RPC
    const { data, error } = await supabaseClient.rpc('diagnose_plant_disease', {
      image_url,
      top_k
    })

    if (error) {
      throw error
    }

    // Return the diagnosis results
    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 