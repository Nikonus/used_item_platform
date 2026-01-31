import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { LoadingSkeletonCard } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { verifyOTP } from '../lib/otpUtils'
import { supabase } from '../lib/supabaseClient'

type Order = {
  id: string
  buyer_id: string
  seller_id: string
  item_id: string
  status: 'pending' | 'paid' | 'picked_up' | 'delivered' | 'cancelled' | 'completed'
  total_amount: number
  delivery_type: 'standard' | 'express' | null
  delivery_fee: number
  distance_km: number | null
  buyer_address: string | null
  seller_address: string | null
  pickup_otp: string | null
  delivery_otp: string | null
  pickup_otp_verified: boolean | null
  delivery_otp_verified: boolean | null
  picked_up_at: string | null
  delivered_at: string | null
  created_at: string
}

type OrderItem = {
  id: string
  title: string
  price: number
  currency: string | null
  thumbnail_url: string | null
}

type OrderStatus = Order['status']

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending Payment',
  paid: 'Ordered',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const STATUS_STEPS: OrderStatus[] = ['paid', 'picked_up', 'delivered']

export const OrderTrackingPage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [item, setItem] = useState<OrderItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [isSeller, setIsSeller] = useState(false)

  useEffect(() => {
    const load = async () => {
      if (!id || !user) return
      setLoading(true)
      setError(null)

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()

      if (orderError) {
        setError(orderError.message)
        setLoading(false)
        return
      }

      const orderRow = orderData as Order
      setIsSeller(orderRow.seller_id === user.id)

      // Verify user has access
      if (orderRow.buyer_id !== user.id && orderRow.seller_id !== user.id) {
        setError('You do not have access to this order')
        setLoading(false)
        return
      }

      setOrder(orderRow)

      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('id,title,price,currency,thumbnail_url')
        .eq('id', orderRow.item_id)
        .single()

      if (itemError) {
        setError(itemError.message)
      } else {
        setItem(itemData as OrderItem)
      }

      setLoading(false)
    }

    void load()
  }, [id, user])

  const handleVerifyOTP = async (type: 'pickup' | 'delivery') => {
    if (!order || !otpInput.trim()) return

    const expectedOTP = type === 'pickup' ? order.pickup_otp : order.delivery_otp
    if (!expectedOTP) {
      setError('OTP not found')
      return
    }

    if (!verifyOTP(otpInput, expectedOTP)) {
      setError('Invalid OTP')
      return
    }

    setVerifying(true)
    setError(null)

    try {
      if (type === 'pickup') {
        // Seller verifies pickup OTP
        if (order.status === 'paid') {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'picked_up',
              pickup_otp_verified: true,
              picked_up_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (updateError) throw updateError
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'picked_up',
                  pickup_otp_verified: true,
                  picked_up_at: new Date().toISOString(),
                }
              : null,
          )
        }
      } else {
        // Buyer verifies delivery OTP
        if (order.status === 'picked_up') {
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'delivered',
              delivery_otp_verified: true,
              delivered_at: new Date().toISOString(),
            })
            .eq('id', order.id)

          if (updateError) throw updateError
          setOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: 'delivered',
                  delivery_otp_verified: true,
                  delivered_at: new Date().toISOString(),
                }
              : null,
          )
        }
      }

      setOtpInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
        <LoadingSkeletonCard />
      </AppLayout>
    )
  }

  if (error && !order) {
    return (
      <AppLayout>
        <p className="error">{error}</p>
        <Link to="/" className="secondary-btn" style={{ marginTop: 12 }}>
          Back to home
        </Link>
      </AppLayout>
    )
  }

  if (!order || !item) return null

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)
  const canVerifyPickup = isSeller && order.status === 'paid' && !order.pickup_otp_verified
  const canVerifyDelivery = !isSeller && order.status === 'picked_up' && !order.delivery_otp_verified

  return (
    <AppLayout>
      <section className="hero-card">
        <h2>Order tracking</h2>
        <p className="subtitle">Order #{order.id.slice(0, 8)}</p>
      </section>

      <section className="card">
        <h3>Item</h3>
        <div className="item-row">
          <span>{item.title}</span>
          <strong>
            ₹{item.price} {item.currency ?? 'INR'}
          </strong>
        </div>
      </section>

      <section className="card">
        <h3>Order status</h3>
        <div style={{ marginTop: 16 }}>
          {STATUS_STEPS.map((step, idx) => {
            const isActive = idx <= currentStepIndex
            const isCurrent = idx === currentStepIndex
            return (
              <div
                key={step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 0',
                  borderLeft: isActive ? '3px solid var(--text-main)' : '3px solid rgba(15,17,16,0.1)',
                  paddingLeft: 12,
                  marginLeft: 8,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: isActive ? 'var(--text-main)' : 'rgba(15,17,16,0.1)',
                    color: isActive ? '#fff' : '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isCurrent ? 600 : 400 }}>{STATUS_LABELS[step]}</div>
                  {step === 'picked_up' && order.picked_up_at && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {new Date(order.picked_up_at).toLocaleString()}
                    </div>
                  )}
                  {step === 'delivered' && order.delivered_at && (
                    <div className="muted" style={{ fontSize: 12 }}>
                      {new Date(order.delivered_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {(canVerifyPickup || canVerifyDelivery) && (
        <section className="card">
          <h3>{canVerifyPickup ? 'Verify pickup' : 'Verify delivery'}</h3>
          <p className="muted" style={{ marginTop: 8 }}>
            {canVerifyPickup
              ? 'Enter the pickup OTP to confirm item has been collected.'
              : 'Enter the delivery OTP to confirm item has been delivered.'}
          </p>
          {error && <p className="error" style={{ marginTop: 8 }}>{error}</p>}
          <div className="field" style={{ marginTop: 12 }}>
            <input
              type="text"
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              style={{ fontFamily: 'monospace', letterSpacing: 4, fontSize: 18, textAlign: 'center' }}
            />
          </div>
          <button
            className="primary-btn"
            onClick={() => handleVerifyOTP(canVerifyPickup ? 'pickup' : 'delivery')}
            disabled={verifying || otpInput.length !== 6}
            style={{ marginTop: 8 }}
          >
            {verifying ? 'Verifying...' : 'Verify OTP'}
          </button>
        </section>
      )}

      <section className="card">
        <h3>Delivery details</h3>
        <div className="grid-2" style={{ marginTop: 12 }}>
          <div>
            <div className="muted">Type</div>
            <div style={{ fontWeight: 600 }}>
              {order.delivery_type === 'express' ? 'Express (2h)' : 'Standard (6h)'}
            </div>
          </div>
          {order.distance_km && (
            <div>
              <div className="muted">Distance</div>
              <div style={{ fontWeight: 600 }}>{order.distance_km.toFixed(2)} km</div>
            </div>
          )}
          <div>
            <div className="muted">Delivery fee</div>
            <div style={{ fontWeight: 600 }}>₹{order.delivery_fee}</div>
          </div>
          <div>
            <div className="muted">Total</div>
            <div style={{ fontWeight: 600 }}>₹{order.total_amount}</div>
          </div>
        </div>
        {order.buyer_address && (
          <div style={{ marginTop: 12 }}>
            <div className="muted">Buyer address</div>
            <div>{order.buyer_address}</div>
          </div>
        )}
        {order.seller_address && (
          <div style={{ marginTop: 8 }}>
            <div className="muted">Seller address</div>
            <div>{order.seller_address}</div>
          </div>
        )}
      </section>

      <div className="actions-row">
        <Link to="/" className="secondary-btn">
          Back to home
        </Link>
      </div>
    </AppLayout>
  )
}
