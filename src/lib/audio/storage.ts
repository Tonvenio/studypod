import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import path from 'path';
import os from 'os';

const LOCAL_AUDIO_DIR = path.join(os.tmpdir(), 'studypod-audio');

// Ensure local dir exists
if (!existsSync(LOCAL_AUDIO_DIR)) mkdirSync(LOCAL_AUDIO_DIR, { recursive: true });

interface UploadResult {
  storagePath: string;
  publicUrl: string;
}

/**
 * Upload an audio file. Uses Supabase Storage if configured, otherwise local /tmp.
 */
export async function uploadAudio(
  buffer: Buffer,
  storagePath: string
): Promise<UploadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    // Supabase Storage upload
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase.storage
      .from('audio')
      .upload(storagePath, buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage.from('audio').getPublicUrl(storagePath);

    return { storagePath, publicUrl: data.publicUrl };
  }

  // Local fallback — write to /tmp and serve via /api/audio/
  const filename = path.basename(storagePath);
  const localPath = path.join(LOCAL_AUDIO_DIR, filename);
  writeFileSync(localPath, buffer);

  return {
    storagePath: filename,
    publicUrl: `/api/audio/${filename}`,
  };
}

/**
 * Get the public URL for an audio file.
 */
export function getAudioUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/audio/${storagePath}`;
  }

  // Local fallback
  const filename = path.basename(storagePath);
  return `/api/audio/${filename}`;
}

/**
 * Read audio file buffer (for downloads/ZIP).
 */
export async function readAudioBuffer(storagePath: string): Promise<Buffer> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase.storage
      .from('audio')
      .download(storagePath);

    if (error || !data) throw new Error(`Storage download failed: ${error?.message}`);
    return Buffer.from(await data.arrayBuffer());
  }

  // Local fallback
  const filename = path.basename(storagePath);
  const localPath = path.join(LOCAL_AUDIO_DIR, filename);
  if (!existsSync(localPath)) throw new Error(`Audio not found: ${filename}`);
  return readFileSync(localPath);
}

/**
 * Delete an audio file.
 */
export async function deleteAudio(storagePath: string): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);
    await supabase.storage.from('audio').remove([storagePath]);
    return;
  }

  const filename = path.basename(storagePath);
  const localPath = path.join(LOCAL_AUDIO_DIR, filename);
  try { unlinkSync(localPath); } catch {}
}
