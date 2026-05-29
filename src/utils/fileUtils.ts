import { supabase } from "@/integrations/supabase/client";

/**
 * Sanitizes a filename to be safe for storage and bypass some adblockers.
 * Removes spaces, special characters, and accents.
 * Adds a short timestamp to ensure uniqueness.
 */
export const sanitizeFileName = (fileName: string): string => {
  const fileExt = fileName.split('.').pop();
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  
  // Normalize and remove accents
  const normalized = nameWithoutExt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Remove special characters and spaces, replace with hyphen
  const safeName = normalized
    .replace(/[^a-zA-Z0-9]/g, "-")
    .replace(/-+/g, "-") // Remove multiple hyphens
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .toLowerCase()
    .substring(0, 50); // Limit size
    
  const timestamp = Math.floor(Date.now() / 1000);
  
  return `${safeName}-${timestamp}.${fileExt}`;
};

/**
 * Gets a URL for a file in the methodology-materials bucket.
 * Prefers signed URL if available, fallback to public URL.
 */
export const getFileUrl = async (path: string, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from('methodology-materials')
      .createSignedUrl(path, expiresIn);
      
    if (error) {
      console.error('Error creating signed URL:', error);
      // Fallback to public URL
      const { data: publicData } = supabase.storage
        .from('methodology-materials')
        .getPublicUrl(path);
      return publicData.publicUrl;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Unexpected error getting file URL:', error);
    const { data: publicData } = supabase.storage
      .from('methodology-materials')
      .getPublicUrl(path);
    return publicData.publicUrl;
  }
};
