import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { LoadingSkeletonCard } from '../components/LoadingSkeleton'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabaseClient'

type Item = {
  id: string
  owner_id: string
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

  seller_address: string | null
  seller_address_lat: number | null
  seller_address_lng: number | null
}

type ItemImage = {
  id: string
  public_url: string
  position: number | null
}

type Seller = {
  id: string
  full_name: string | null
  phone: string | null
  kyc_status: string | null
}

export const ItemDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [item, setItem] = useState<Item | null>(null)
  const [images, setImages] = useState<ItemImage[]>([])
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      setLoading(true)
      setError(null)

      const { data: itemData, error: itemError } = await supabase
        .from('items')
.select(
`
id,
owner_id,
title,
description,
category,
condition,
price,
currency,
is_for_rent,
is_for_sale,
is_active,
thumbnail_url,
created_at,
seller_address,
seller_address_lat,
seller_address_lng
`,
)
        .eq('id', id)
        .single()

      if (itemError) {
        setError(itemError.message)
        setLoading(false)
        return
      }

      setItem(itemData as Item)

      const [{ data: imagesData, error: imagesError }, { data: sellerData, error: sellerError }] =
        await Promise.all([
          supabase
            .from('item_images')
            .select('id,public_url,position')
            .eq('item_id', id)
            .order('position', { ascending: true }),
          supabase.from('profiles').select('id,full_name,phone,kyc_status').eq('id', itemData.owner_id).single(),
        ])

      if (imagesError) setError(imagesError.message)
      if (sellerError && sellerError.code !== 'PGRST116') setError(sellerError.message)

      setImages((imagesData as ItemImage[] | null) ?? [])
      setSeller((sellerData as Seller | null) ?? null)
      setLoading(false)
    }

    void load()
  }, [id])

  const listingType = useMemo(() => {
    if (!item) return 'Listing'
    if (item.is_for_rent) return 'Rent'
    if (item.is_for_sale) return 'Sell'
    return 'Listing'
  }, [item])

  if (loading) {
    return (
      <AppLayout>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <p className="error">{error}</p>
      </AppLayout>
    )
  }

  if (!item) return null

  return (
    <AppLayout>
      <section className="hero-card">
        <div className="toolbar">
          <div>
            <h2>{item.title}</h2>
            <p className="subtitle">
              {listingType} • {item.category ?? 'Other'} • {item.condition?.replace('_', ' ') ?? 'good'}
            </p>
          </div>
          <div>
            <div className="muted">Price</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>
              ₹{item.price} {item.currency ?? 'INR'}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Photos</h3>
        {images.length ? (
          <div className="gallery">
            {images.map((img) => (
              <img key={img.id} src={img.public_url} alt={item.title} loading="lazy" />
            ))}
          </div>
        ) : item.thumbnail_url ? (
          <div className="gallery">
            <img src={item.thumbnail_url} alt={item.title} />
          </div>
        ) : (
          <p className="muted">No images found.</p>
        )}
      </section>

      <section className="card">
        <h3>Description</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          {item.description?.trim() ? item.description : 'No description provided.'}
        </p>
      </section>

      <section className="card">
        <h3>Seller info</h3>
        {seller ? (
          <div className="grid-2">
            <div>
              <div className="muted">Name</div>
              <div style={{ fontWeight: 600 }}>{seller.full_name ?? 'Unknown'}</div>
            </div>
            <div>
              <div className="muted">KYC</div>
              <span className={`badge badge-${seller.kyc_status ?? 'pending'}`}>
                {seller.kyc_status ?? 'pending'}
              </span>
            </div>
            <div>
              <div className="muted">Contact</div>
              <div style={{ fontWeight: 600 }}>{seller.phone ?? 'Not shared'}</div>
            </div>
          </div>
        ) : (
          <p className="muted">Seller profile not found.</p>
        )}

<div className="actions-row" style={{ marginTop: 14 }}>
  <button
    className="primary-btn"
    onClick={async () => {
      console.log("CLICKED");

      if (!item) {
        console.log("No item");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      console.log("USER:", user);

      if (!user) {
        alert("Login required");
        navigate("/auth");
        return;
      }

      // ✅ ADD TO CART (no seller dependency)
addItem({
  itemId: item.id,
  title: item.title,
  price: item.price,
  currency: item.currency ?? 'INR',
  thumbnailUrl: item.thumbnail_url,
  sellerId: item.owner_id,

  sellerAddress: item.seller_address ?? '',
  sellerAddressLat: item.seller_address_lat ?? 0,
  sellerAddressLng: item.seller_address_lng ?? 0,
});
      console.log("ITEM ADDED TO CART");

      navigate("/checkout");
    }}
    disabled={!item}
  >
    Add to Cart & Checkout
  </button>

  <Link to="/" className="secondary-btn">
    Back to home
  </Link>
</div>
      </section>
    </AppLayout>
  )
}

