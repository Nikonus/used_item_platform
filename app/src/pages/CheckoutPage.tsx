import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { EmptyState } from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import {
  calculateDeliveryFee,
  DELIVERY_OPTIONS,
  type DeliveryType,
} from '../lib/deliveryPricing'

import {
  calculateDistance,
  createAutocomplete,
  geocodeAddress,
  type AddressResult,
} from '../lib/mapsUtils'

import { generateOTP } from '../lib/otpUtils'
import { supabase } from '../lib/supabaseClient'

const GOOGLE_MAPS_API_KEY = import.meta.env
  .VITE_GOOGLE_MAPS_API_KEY as string | undefined

type BuyerAddressFields = {
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  landmark: string
}

export const CheckoutPage = () => {
  const { user } = useAuth()
  const { items, clearCart } = useCart()
  const navigate = useNavigate()

  const item = items[0]

  // ── Buyer address: autocomplete + detailed fields ──
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerAddressResult, setBuyerAddressResult] = useState<AddressResult | null>(null)
  const [buyerFields, setBuyerFields] = useState<BuyerAddressFields>({
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
  })

  // ── Seller address kept internally for distance calc, not shown ──
  const [sellerAddressResult] = useState<AddressResult | null>(
    item?.sellerAddress && item?.sellerAddressLat && item?.sellerAddressLng
      ? {
          formatted: item.sellerAddress,
          lat: item.sellerAddressLat,
          lng: item.sellerAddressLng,
        }
      : null,
  )

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('standard')
  const [distance, setDistance] = useState<number | null>(null)
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buyerInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (items.length === 0) navigate('/')
  }, [items, navigate])

  // Autocomplete on the "search" input — populates detailed fields on pick
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured.')
      return
    }

    let cleanup: (() => void) | null = null

    if (buyerInputRef.current) {
      cleanup = createAutocomplete(
        buyerInputRef.current,
        GOOGLE_MAPS_API_KEY,
        (result) => {
          setBuyerAddress(result.formatted)
          setBuyerAddressResult(result)

          // Auto-fill fields from the resolved address if available
          setBuyerFields((prev) => ({
            ...prev,
            line1: result.formatted.split(',')[0]?.trim() ?? prev.line1,
            city:  result.formatted.split(',')[1]?.trim() ?? prev.city,
            state: result.formatted.split(',')[2]?.trim() ?? prev.state,
          }))
        },
      )
    }

    return () => { cleanup?.() }
  }, [])

  // Recompute distance whenever buyer coordinates change
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

  const handleManualGeocode = async (address: string) => {
    if (!GOOGLE_MAPS_API_KEY || !address.trim()) return

    setLoadingAddresses(true)

    const result = await geocodeAddress(address, GOOGLE_MAPS_API_KEY)

    if (result) {
      setBuyerAddressResult(result)
      setBuyerAddress(result.formatted)
    }

    setLoadingAddresses(false)
  }

  const updateField = (field: keyof BuyerAddressFields) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setBuyerFields((prev) => ({ ...prev, [field]: e.target.value }))

  // Full address string assembled from detailed fields
  const assembledAddress = [
    buyerFields.line1,
    buyerFields.line2,
    buyerFields.landmark && `Near ${buyerFields.landmark}`,
    buyerFields.city,
    buyerFields.state,
    buyerFields.pincode,
  ]
    .filter(Boolean)
    .join(', ')

  const deliveryFee = useMemo(
    () => calculateDeliveryFee(deliveryType, distance),
    [deliveryType, distance],
  )

  const itemTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price, 0),
    [items],
  )

  const grandTotal = itemTotal + deliveryFee

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const { line1, city, state, pincode } = buyerFields

    if (!user || items.length === 0 || !line1 || !city || !state || !pincode) {
      setError('Please fill all required address fields.')
      return
    }

    if (!buyerAddressResult || !sellerAddressResult) {
      setError('Could not resolve delivery coordinates. Try searching your address above.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const cartItem = items[0]
      const pickupOTP  = generateOTP()
      const deliveryOTP = generateOTP()

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id:   user.id,
          seller_id:  cartItem.sellerId,
          item_id:    cartItem.itemId,
          status:     'pending',
          quantity:   1,
          total_amount: grandTotal,
          delivery_type: deliveryType,
          delivery_fee:  deliveryFee,
          distance_km:   distance,

          // Detailed buyer address fields
          buyer_address:      assembledAddress,
          buyer_address_line1: buyerFields.line1,
          buyer_address_line2: buyerFields.line2,
          buyer_address_city:  buyerFields.city,
          buyer_address_state: buyerFields.state,
          buyer_address_pincode: buyerFields.pincode,
          buyer_address_landmark: buyerFields.landmark,
          buyer_address_lat:  buyerAddressResult.lat,
          buyer_address_lng:  buyerAddressResult.lng,

          // Seller address kept for logistics, not exposed to buyer
          seller_address:     sellerAddressResult.formatted,
          seller_address_lat: sellerAddressResult.lat,
          seller_address_lng: sellerAddressResult.lng,

          pickup_otp:   pickupOTP,
          delivery_otp: deliveryOTP,
        })
        .select('id')
        .single()

      if (orderError) throw orderError

      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          order_id:    order.id,
          user_id:     user.id,
          amount:      grandTotal,
          direction:   'debit',
          status:      'success',
          gateway_ref: `mock_${Date.now()}`,
        })

      if (txError) throw txError

      await supabase.from('orders').update({ status: 'paid' }).eq('id', order.id)

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
            description="Add items before checkout."
            action={<Link to="/" className="primary-btn">Browse items</Link>}
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

      {/* Order summary */}
      <section className="card">
        <h3>Order summary</h3>

        {items.map((i) => (
          <div key={i.itemId} className="item-row" style={{ marginTop: 8 }}>
            <span>{i.title}</span>
            <strong>₹{i.price}</strong>
          </div>
        ))}

        <div className="item-row" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(15,17,16,0.1)' }}>
          <span>Subtotal</span>
          <strong>₹{itemTotal}</strong>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="card form">
        <h3>Delivery details</h3>

        {/* Delivery type */}
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

        {/* Address search (autocomplete) */}
        <label className="field">
          <span>Search your address</span>
          <input
            ref={buyerInputRef}
            type="text"
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            onBlur={() => buyerAddress && handleManualGeocode(buyerAddress)}
            placeholder="Start typing to search…"
          />
          {loadingAddresses && <span className="muted">Resolving location…</span>}
        </label>

        {/* Detailed buyer address fields */}
        <label className="field">
          <span>Address line 1 <span style={{ color: 'red' }}>*</span></span>
          <input
            type="text"
            value={buyerFields.line1}
            onChange={updateField('line1')}
            placeholder="House / Flat no., Street name"
            required
          />
        </label>

        <label className="field">
          <span>Address line 2</span>
          <input
            type="text"
            value={buyerFields.line2}
            onChange={updateField('line2')}
            placeholder="Apartment, Colony, Area (optional)"
          />
        </label>

        <label className="field">
          <span>Landmark</span>
          <input
            type="text"
            value={buyerFields.landmark}
            onChange={updateField('landmark')}
            placeholder="Near school, mall, etc. (optional)"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="field">
            <span>City <span style={{ color: 'red' }}>*</span></span>
            <input
              type="text"
              value={buyerFields.city}
              onChange={updateField('city')}
              placeholder="City"
              required
            />
          </label>

          <label className="field">
            <span>State <span style={{ color: 'red' }}>*</span></span>
            <input
              type="text"
              value={buyerFields.state}
              onChange={updateField('state')}
              placeholder="State"
              required
            />
          </label>
        </div>

        <label className="field">
          <span>Pincode <span style={{ color: 'red' }}>*</span></span>
          <input
            type="text"
            value={buyerFields.pincode}
            onChange={updateField('pincode')}
            placeholder="6-digit pincode"
            maxLength={6}
            pattern="\d{6}"
            required
          />
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

        <button
          className="primary-btn"
          type="submit"
          disabled={submitting || !buyerAddressResult || !sellerAddressResult}
        >
          {submitting ? 'Processing…' : 'Place order'}
        </button>
      </form>
    </AppLayout>
  )
}