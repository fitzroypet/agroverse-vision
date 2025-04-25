-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the disease reference images table
CREATE TABLE IF NOT EXISTS disease_reference_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_name TEXT NOT NULL,
    description TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    image_url TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index for vector similarity search
CREATE INDEX IF NOT EXISTS disease_embedding_idx ON disease_reference_images 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_disease_reference_images_updated_at
    BEFORE UPDATE ON disease_reference_images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON disease_reference_images TO authenticated;
GRANT ALL ON disease_reference_images TO service_role; 