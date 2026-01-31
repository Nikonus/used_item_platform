import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { useAuth } from '../context/AuthContext'
import {
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  type ItemCondition,
  type ListingType,
} from '../lib/marketplaceConstants'
import { uploadItemImages } from '../lib/marketplaceStorage'
import { supabase } from '../lib/supabaseClient'

type Item = {
  id: string
  owner_id: string
  title: string
  description: string | null
  category: string | null
  condition: ItemCondition | null
  price: number
  is_for_rent: boolean | null
  is_for_sale: boolean | null
  is_active: boolean | null
  thumbnail_url: string | null
}

export const EditItemPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [item, setItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<(typeof ITEM_CATEGORIES)[number]>('Other')
  const [listingType, setListingType] = useState<ListingType>('sell')
  const [condition, setCondition] = useState<ItemCondition>('good')
  const [price, setPrice] = useState<number>(0)
  const [newImages, setNewImages] = useState<File[]>([])

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('items')
        .select('id,owner_id,title,description,category,condition,price,is_for_rent,is_for_sale,is_active,thumbnail_url')
        .eq('id', id)
        .single()

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const row = data as Item
      if (row.owner_id !== user.id) {
        setError('You can only edit your own listings.')
        setLoading(false)
        return
      }

      setItem(row)
      setTitle(row.title)
      setDescription(row.description ?? '')
      setCategory((row.category as (typeof ITEM_CATEGORIES)[number]) ?? 'Other')
      setCondition((row.condition as ItemCondition) ?? 'good')
      setPrice(row.price)
      setListingType(row.is_for_rent ? 'rent' : 'sell')
      setLoading(false)
    }
    void load()
  }, [id, user])

  const canSubmit = useMemo(() => title.trim().length >= 3 && price > 0 && !saving, [title, price, saving])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !id) return
    setSaving(true)
    setError(null)

    const is_for_rent = listingType === 'rent'
    const is_for_sale = listingType === 'sell'

    const { error: updateError } = await supabase
      .from('items')
      .update({
        title: title.trim(),
        description: description.trim() || null,
        category,
        condition,
        price,
        is_for_rent,
        is_for_sale,
      })
      .eq('id', id)
      .eq('owner_id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    // Optional: append new images
    if (newImages.length) {
      try {
        const { count } = await supabase
          .from('item_images')
          .select('*', { count: 'exact', head: true })
          .eq('item_id', id)

        const startPos = count ?? 0
        const uploaded = await uploadItemImages({ ownerId: user.id, itemId: id, files: newImages })
        const rows = uploaded.map((u, idx) => ({
          item_id: id,
          storage_path: u.storagePath,
          public_url: u.publicUrl,
          position: startPos + idx,
        }))
        const { error: imgError } = await supabase.from('item_images').insert(rows)
        if (imgError) throw imgError

        if (!item?.thumbnail_url && uploaded[0]?.publicUrl) {
          await supabase.from('items').update({ thumbnail_url: uploaded[0].publicUrl }).eq('id', id)
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Image upload failed.'
        setError(msg)
        setSaving(false)
        return
      }
    }

    navigate(`/items/${id}`)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="card">Loading item...</div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <section className="hero-card">
        <h2>Edit item</h2>
        <p className="subtitle">Update details, and optionally add more images.</p>
      </section>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit} className="card form">
        <label className="field">
          <span>Title</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} required />
        </label>

        <label className="field">
          <span>Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
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
            <select value={condition} onChange={(e) => setCondition(e.target.value as ItemCondition)}>
              {ITEM_CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Price (INR)</span>
            <input type="number" min={1} step="1" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </label>
        </div>

        <label className="field">
          <span>Add more images (optional)</span>
          <input type="file" accept="image/*" multiple onChange={(e) => setNewImages(Array.from(e.target.files ?? []))} />
          <span className="muted">{newImages.length ? `${newImages.length} selected` : 'No new images selected'}</span>
        </label>

        <div className="actions-row">
          <button className="primary-btn" type="submit" disabled={!canSubmit}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
          <Link className="secondary-btn" to={item ? `/items/${item.id}` : '/'}>
            Cancel
          </Link>
        </div>
      </form>
    </AppLayout>
  )
}

