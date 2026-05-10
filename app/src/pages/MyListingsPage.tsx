import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { EmptyState } from '../components/EmptyState'
import { LoadingSkeletonList } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

type MyItem = {
  id: string
  title: string
  price: number
  currency: string | null
  category: string | null
  is_for_rent: boolean | null
  is_for_sale: boolean | null
  is_active: boolean | null
  thumbnail_url: string | null
  created_at: string
seller_address: string | null
seller_address_lat: number | null
seller_address_lng: number | null
}

export const MyListingsPage = () => {
  const { user } = useAuth()
  const [items, setItems] = useState<MyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('items')
      .select(`
  id,
  title,
  price,
  currency,
  category,
  is_for_rent,
  is_for_sale,
  is_active,
  thumbnail_url,
  created_at,
  seller_address,
  seller_address_lat,
  seller_address_lng
`)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    setItems((data as MyItem[] | null) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    setBusyId(itemId)
    setError(null)

    // delete DB rows first (images are ON DELETE CASCADE)
    const { error } = await supabase.from('items').delete().eq('id', itemId)
    if (error) setError(error.message)
    await load()
    setBusyId(null)
  }

  const handleToggleActive = async (itemId: string, next: boolean) => {
    setBusyId(itemId)
    setError(null)
    const { error } = await supabase.from('items').update({ is_active: next }).eq('id', itemId)
    if (error) setError(error.message)
    await load()
    setBusyId(null)
  }

  return (
    <AppLayout>
      <section className="hero-card">
        <div className="toolbar">
          <div>
            <h2>My listings</h2>
            <p className="subtitle">Edit, deactivate, or delete your posted items.</p>
          </div>
          <Link to="/items/new" className="primary-btn">
            Add item
          </Link>
        </div>
      </section>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <LoadingSkeletonList count={4} />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="📦"
            title="No listings yet"
            description="Create your first listing to appear on the home feed and start selling or renting items."
            action={
              <Link to="/items/new" className="primary-btn">
                Add your first item
              </Link>
            }
          />
        </div>
      ) : (
        <section className="grid-3">
          {items.map((it) => {
            const typeLabel = it.is_for_rent ? 'Rent' : it.is_for_sale ? 'Sell' : 'Listing'
            return (
              <div key={it.id} className="card item-card">
                <img className="item-thumb" src={it.thumbnail_url ?? undefined} alt={it.title} />
                <div className="item-row">
                  <h3 className="item-title">{it.title}</h3>
                  <strong>
                    ₹{it.price} {it.currency ?? 'INR'}
                  </strong>
                </div>
                <div className="chips">
                  <span className="chip">{typeLabel}</span>
                  <span className="chip">{it.category ?? 'Other'}</span>
                  <span className="chip">{it.is_active ? 'Active' : 'Inactive'}</span>
                </div>

                <div className="actions-row" style={{ marginTop: 8 }}>
                  <Link className="secondary-btn" to={`/items/${it.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    className="secondary-btn"
                    onClick={() => handleToggleActive(it.id, !it.is_active)}
                    disabled={busyId === it.id}
                  >
                    {it.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={() => handleDelete(it.id)}
                    disabled={busyId === it.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </section>
      )}
    </AppLayout>
  )
}

