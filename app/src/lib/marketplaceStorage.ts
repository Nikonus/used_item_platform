import { supabase } from './supabaseClient'

export type UploadedImage = {
  storagePath: string
  publicUrl: string
}

function sanitizeFilename(name: string) {
  return name.replace(/[^\w.\-]+/g, '_')
}

export async function uploadItemImages(opts: {
  ownerId: string
  itemId: string
  files: File[]
}) {
  const { ownerId, itemId, files } = opts
  const uploaded: UploadedImage[] = []

  for (const file of files) {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
    const base = sanitizeFilename(file.name)
    const filePath = `${ownerId}/${itemId}/${Date.now()}-${crypto.randomUUID()}-${base}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('item_images')
      .upload(filePath, file)

    if (uploadError) {
      throw uploadError
    }

    const { data: publicUrlData } = supabase.storage
      .from('item_images')
      .getPublicUrl(filePath)

    uploaded.push({ storagePath: filePath, publicUrl: publicUrlData.publicUrl })
  }

  return uploaded
}

