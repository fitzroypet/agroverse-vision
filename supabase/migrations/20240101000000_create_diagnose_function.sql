-- Create a function to diagnose plant diseases
CREATE OR REPLACE FUNCTION diagnose_plant_disease(
  image_url TEXT,
  top_k INTEGER DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpython3u
AS $$
  import sys
  import os
  import json
  
  # Add the scripts directory to the Python path
  sys.path.append(os.path.join(os.path.dirname(__file__), '../../scripts'))
  
  # Import the diagnose function
  from diagnose import diagnose_plant_disease as diagnose
  
  # Call the function and return the result as JSON
  result = diagnose(image_url, top_k)
  return json.dumps(result)
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION diagnose_plant_disease(TEXT, INTEGER) TO authenticated;

-- Create a function to match diseases using vector similarity
CREATE OR REPLACE FUNCTION match_disease_images(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  disease_name text,
  description text,
  symptoms text,
  recommendation text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    disease_reference_images.id,
    disease_reference_images.disease_name,
    disease_reference_images.description,
    disease_reference_images.symptoms,
    disease_reference_images.recommendation,
    1 - (disease_reference_images.embedding <=> query_embedding) AS similarity
  FROM
    disease_reference_images
  WHERE
    1 - (disease_reference_images.embedding <=> query_embedding) > match_threshold
  ORDER BY
    disease_reference_images.embedding <=> query_embedding
  LIMIT
    match_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION match_disease_images(vector(768), float, int) TO authenticated; 