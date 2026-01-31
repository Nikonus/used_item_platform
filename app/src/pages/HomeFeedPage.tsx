import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { EmptyState } from '../components/EmptyState'
import { LoadingSkeletonList } from '../components/LoadingSkeleton'
import { ITEM_CATEGORIES, type ListingType } from '../lib/marketplaceConstants'
import { supabase } from '../lib/supabaseClient'

type ItemRow = {
  id: string
  title: string
  description: string | null
  category: string | null
  condition: string | null
  price: number
  currency: string | null
  is_for_rent: boolean | null
  is_for_sale: boolean | null
  is_active: boolean | null
  thumbnail_url: string | null
  created_at: string
}

export const HomeFeedPage = () => {
  const [items, setItems] = useState<ItemRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [q, setQ] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [listingType, setListingType] = useState<ListingType | 'all'>('all')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('items')
        .select(
          'id,title,description,category,condition,price,currency,is_for_rent,is_for_sale,is_active,thumbnail_url,created_at',
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      setItems((data as ItemRow[] | null) ?? [])
      setLoading(false)
    }

    void load()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return items.filter((it) => {
      if (category !== 'all' && (it.category ?? '') !== category) return false
      if (listingType !== 'all') {
        if (listingType === 'rent' && !it.is_for_rent) return false
        if (listingType === 'sell' && !it.is_for_sale) return false
      }
      if (maxPrice !== '' && it.price > maxPrice) return false
      if (!query) return true
      return (
        it.title.toLowerCase().includes(query) ||
        (it.description ?? '').toLowerCase().includes(query) ||
        (it.category ?? '').toLowerCase().includes(query)
      )
    })
  }, [items, q, category, listingType, maxPrice])

  return (
    <AppLayout>
      <section className="hero-card">
        <div className="toolbar">
          <div>
            <h2>Discover listings</h2>
            <p className="subtitle">Active items from the community.</p>
          </div>
          <Link to="/items/new" className="primary-btn">
            Add item
          </Link>
        </div>
      </section>

      <section className="card">
        <div className="filters">
          <label className="field">
            <span>Search</span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, category..."
            />
          </label>

          <label className="field">
            <span>Type</span>
            <select value={listingType} onChange={(e) => setListingType(e.target.value as ListingType | 'all')}>
              <option value="all">All</option>
              <option value="sell">Sell</option>
              <option value="rent">Rent</option>
            </select>
          </label>

          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All</option>
              {ITEM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Max price (INR)</span>
            <input
              type="number"
              min={1}
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="e.g. 1000"
            />
          </label>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <LoadingSkeletonList count={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="🔍"
            title="No items found"
            description={
              items.length === 0
                ? "No listings available yet. Be the first to add an item!"
                : "No items match your search filters. Try adjusting your criteria."
            }
            action={
              items.length === 0 ? (
                <Link to="/items/new" className="primary-btn">
                  Add first item
                </Link>
              ) : (
                <button className="secondary-btn" onClick={() => {
                  setQ('')
                  setCategory('all')
                  setListingType('all')
                  setMaxPrice('')
                }}>
                  Clear filters
                </button>
              )
            }
          />
        </div>
      ) : (
        <section className="grid-3">
          {filtered.map((it) => {
            const typeLabel = it.is_for_rent ? 'Rent' : it.is_for_sale ? 'Sell' : 'Listing'
            return (
              <Link key={it.id} to={`/items/${it.id}`} className="card item-card">
                <img
                  className="item-thumb"
                  src={it.thumbnail_url ?? undefined}
                  alt={it.title}
                  loading="lazy"
                />
                <div className="item-row">
                  <h3 className="item-title">{it.title}</h3>
                  <strong>
                    ₹{it.price} {it.currency ?? 'INR'}
                  </strong>
                </div>
                <div className="chips">
                  <span className="chip">{typeLabel}</span>
                  <span className="chip">{it.category ?? 'Other'}</span>
                  {it.condition && <span className="chip">{it.condition.replace('_', ' ')}</span>}
                </div>
              </Link>
            )
          })}
        </section>
      )}
    </AppLayout>
  )
}

