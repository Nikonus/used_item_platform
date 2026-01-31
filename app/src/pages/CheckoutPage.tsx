import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { calculateDeliveryFee, DELIVERY_OPTIONS, type DeliveryType } from '../lib/deliveryPricing'
import { calculateDistance, createAutocomplete, geocodeAddress, type AddressResult } from '../lib/mapsUtils'
import { generateOTP } from '../lib/otpUtils'
import { supabase } from '../lib/supabaseClient'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

export const CheckoutPage = () => {
  const { user } = useAuth()
  const { items, clearCart } = useCart()
  const navigate = useNavigate()

  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerAddressResult, setBuyerAddressResult] = useState<AddressResult | null>(null)
  const [sellerAddress, setSellerAddress] = useState('')
  const [sellerAddressResult, setSellerAddressResult] = useState<AddressResult | null>(null)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('standard')
  const [distance, setDistance] = useState<number | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buyerInputRef = useRef<HTMLInputElement>(null)
  const sellerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (items.length === 0) {
      navigate('/')
      return
    }

    // In real app, you'd fetch seller's saved address from a separate addresses table
    // For now, we'll let them enter it manually
  }, [items, navigate])

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in .env')
      return
    }

    let cleanupBuyer: (() => void) | null = null
    let cleanupSeller: (() => void) | null = null

    if (buyerInputRef.current) {
      cleanupBuyer = createAutocomplete(buyerInputRef.current, GOOGLE_MAPS_API_KEY, (result) => {
        setBuyerAddress(result.formatted)
        setBuyerAddressResult(result)
      })
    }

    if (sellerInputRef.current) {
      cleanupSeller = createAutocomplete(sellerInputRef.current, GOOGLE_MAPS_API_KEY, (result) => {
        setSellerAddress(result.formatted)
        setSellerAddressResult(result)
      })
    }

    return () => {
      cleanupBuyer?.()
      cleanupSeller?.()
    }
  }, [])

  useEffect(() => {
    const computeDistance = async () => {
      if (!buyerAddressResult || !sellerAddressResult || !GOOGLE_MAPS_API_KEY) {
        setDistance(null)
        return
      }

      setLoadingAddresses(true)
      const dist = await calculateDistance(
        { lat: buyerAddressResult.lat, lng: buyerAddressResult.lng },
        { lat: sellerAddressResult.lat, lng: sellerAddressResult.lng },
        GOOGLE_MAPS_API_KEY,
      )
      setDistance(dist)
      setLoadingAddresses(false)
    }

    void computeDistance()
  }, [buyerAddressResult, sellerAddressResult])

  const handleManualGeocode = async (address: string, type: 'buyer' | 'seller') => {
    if (!GOOGLE_MAPS_API_KEY || !address.trim()) return

    setLoadingAddresses(true)
    const result = await geocodeAddress(address, GOOGLE_MAPS_API_KEY)
    if (result) {
      if (type === 'buyer') {
        setBuyerAddressResult(result)
        setBuyerAddress(result.formatted)
      } else {
        setSellerAddressResult(result)
        setSellerAddress(result.formatted)
      }
    }
    setLoadingAddresses(false)
  }

  const deliveryFee = useMemo(() => calculateDeliveryFee(deliveryType, distance), [deliveryType, distance])
  const itemTotal = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items])
  const grandTotal = itemTotal + deliveryFee

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || items.length === 0 || !buyerAddressResult || !sellerAddressResult) {
      setError('Please fill all required fields')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // For now, create one order per item (can be extended to support multiple items in one order)
      const item = items[0]
      const sellerId = item.sellerId

      const pickupOTP = generateOTP()
      const deliveryOTP = generateOTP()

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: sellerId,
          item_id: item.itemId,
          status: 'pending',
          quantity: 1,
          total_amount: grandTotal,
          delivery_type: deliveryType,
          delivery_fee: deliveryFee,
          distance_km: distance,
          buyer_address: buyerAddressResult.formatted,
          buyer_address_lat: buyerAddressResult.lat,
          buyer_address_lng: buyerAddressResult.lng,
          seller_address: sellerAddressResult.formatted,
          seller_address_lat: sellerAddressResult.lat,
          seller_address_lng: sellerAddressResult.lng,
          pickup_otp: pickupOTP,
          delivery_otp: deliveryOTP,
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      // Create transaction record (mock payment)
      const { error: txError } = await supabase.from('transactions').insert({
        order_id: order.id,
        user_id: user.id,
        amount: grandTotal,
        direction: 'debit',
        status: 'success', // Mock: assume payment succeeds
        gateway_ref: `mock_${Date.now()}`,
      })

      if (txError) throw txError

      // Update order status to paid
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id)

      if (updateError) throw updateError

      clearCart()
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="card">
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            description="Add items to your cart before checkout."
            action={
              <Link to="/" className="primary-btn">
                Browse items
              </Link>
            }
          />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <section className="hero-card">
        <h2>Checkout</h2>
        <p className="subtitle">Review your order and delivery details.</p>
      </section>

      {error && <p className="error">{error}</p>}

      <section className="card">
        <h3>Order summary</h3>
        {items.map((item) => (
          <div key={item.itemId} className="item-row" style={{ marginTop: 8 }}>
            <span>{item.title}</span>
            <strong>
              ₹{item.price} {item.currency}
            </strong>
          </div>
        ))}
        <div className="item-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(15,17,16,0.1)' }}>
          <span>Subtotal</span>
          <strong>₹{itemTotal}</strong>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="card form">
        <h3>Delivery details</h3>

        <div className="field">
          <span>Delivery type</span>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {(['standard', 'express'] as const).map((type) => (
              <label key={type} style={{ flex: 1 }}>
                <input
                  type="radio"
                  name="deliveryType"
                  value={type}
                  checked={deliveryType === type}
                  onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                  style={{ marginRight: 6 }}
                />
                {DELIVERY_OPTIONS[type].label}
              </label>
            ))}
          </div>
        </div>

        <label className="field">
          <span>Buyer address (pickup location)</span>
          <input
            ref={buyerInputRef}
            type="text"
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            onBlur={() => buyerAddress && handleManualGeocode(buyerAddress, 'buyer')}
            placeholder="Enter your address"
            required
          />
          {loadingAddresses && <span className="muted">Geocoding...</span>}
        </label>

        <label className="field">
          <span>Seller address (delivery location)</span>
          <input
            ref={sellerInputRef}
            type="text"
            value={sellerAddress}
            onChange={(e) => setSellerAddress(e.target.value)}
            onBlur={() => sellerAddress && handleManualGeocode(sellerAddress, 'seller')}
            placeholder="Enter seller address"
            required
          />
          {loadingAddresses && <span className="muted">Geocoding...</span>}
        </label>

        {distance !== null && (
          <div className="field">
            <span className="muted">Distance: {distance.toFixed(2)} km</span>
          </div>
        )}

        <div className="item-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(15,17,16,0.1)' }}>
          <span>Delivery fee</span>
          <strong>₹{deliveryFee}</strong>
        </div>

        <div className="item-row" style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>
          <span>Total</span>
          <strong>₹{grandTotal}</strong>
        </div>

        <button className="primary-btn" type="submit" disabled={submitting || !buyerAddressResult || !sellerAddressResult}>
          {submitting ? 'Processing...' : 'Place order'}
        </button>
      </form>
    </AppLayout>
  )
}
