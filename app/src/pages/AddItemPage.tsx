import { type FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../context/AuthContext'
import { ITEM_CATEGORIES, ITEM_CONDITIONS, type ListingType } from '../lib/marketplaceConstants'
import { uploadItemImages } from '../lib/marketplaceStorage'
import { supabase } from '../lib/supabaseClient'

export const AddItemPage = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<(typeof ITEM_CATEGORIES)[number]>('Other')
  const [listingType, setListingType] = useState<ListingType>('sell')
  const [condition, setCondition] = useState<(typeof ITEM_CONDITIONS)[number]['value']>('good')
  const [price, setPrice] = useState<number>(0)
  const [images, setImages] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return title.trim().length >= 3 && price > 0 && images.length > 0 && !saving
  }, [title, price, images.length, saving])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError(null)

    const is_for_rent = listingType === 'rent'
    const is_for_sale = listingType === 'sell'

    const { data: item, error: insertError } = await supabase
      .from('items')
      .insert({
        owner_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        condition,
        price,
        currency: 'INR',
        is_for_rent,
        is_for_sale,
        is_active: true,
      })
      .select('id')
      .single()

    if (insertError || !item) {
      setError(insertError?.message ?? 'Failed to create item.')
      setSaving(false)
      return
    }

    try {
      const uploaded = await uploadItemImages({
        ownerId: user.id,
        itemId: item.id,
        files: images,
      })

      const rows = uploaded.map((u, idx) => ({
        item_id: item.id,
        storage_path: u.storagePath,
        public_url: u.publicUrl,
        position: idx,
      }))

      const { error: imgError } = await supabase.from('item_images').insert(rows)
      if (imgError) throw imgError

      const thumbnailUrl = uploaded[0]?.publicUrl ?? null
      if (thumbnailUrl) {
        const { error: thumbError } = await supabase
          .from('items')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', item.id)
        if (thumbError) throw thumbError
      }

      navigate(`/items/${item.id}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image upload failed.'
      setError(msg)
      setSaving(false)
      return
    }
  }

  return (
    <AppLayout>
      <section className="hero-card">
        <h2>Add a new item</h2>
        <p className="subtitle">Multiple photos + correct details = faster responses.</p>
      </section>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="card form">
        <label className="field">
          <span>Title</span>
          <input
            type="text"
            required
            minLength={3}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Engineering Maths book"
          />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition details, pickup location, etc."
          />
        </label>

        <div className="filters">
          <label className="field">
            <span>Rent / Sell</span>
            <select value={listingType} onChange={(e) => setListingType(e.target.value as ListingType)}>
              <option value="sell">Sell</option>
              <option value="rent">Rent</option>
            </select>
          </label>

          <label className="field">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as (typeof ITEM_CATEGORIES)[number])}
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Condition</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value as typeof condition)}>
              {ITEM_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

<label className="field">
  <span>Price (INR)</span>

  <input
    type="number"
    min="1"
    step="1"
    required
    value={price || ""}
    onChange={(e) => setPrice(Number(e.target.value))}
    placeholder="e.g. 499"
  />
</label>
        </div>

        <label className="field">
          <span>Images (select multiple)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
          />
          <span className="muted">{images.length ? `${images.length} selected` : 'At least 1 image required'}</span>
        </label>

        <button className="primary-btn" type="submit" disabled={!canSubmit}>
          {saving ? 'Publishing...' : 'Publish listing'}
        </button>
      </form>
    </AppLayout>
  )
}

