import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { EmptyState } from '../components/EmptyState'
import { LoadingSkeletonList } from '../components/LoadingSkeleton'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

type OrderRow = {
  id: string
  item_id: string
  status: string
  total_amount: number
  delivery_type: string | null
  created_at: string
  picked_up_at: string | null
  delivered_at: string | null
}

type OrderItem = {
  id: string
  title: string
  thumbnail_url: string | null
}

export const MyOrdersPage = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<(OrderRow & { item: OrderItem | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setLoading(true)
      setError(null)

      const { data, error: ordersError } = await supabase
        .from('orders')
        .select('id,item_id,status,total_amount,delivery_type,created_at,picked_up_at,delivered_at')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (ordersError) {
        setError(ordersError.message)
        setLoading(false)
        return
      }

      const ordersData = (data as OrderRow[] | null) ?? []

      // Load items for each order
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const { data: itemData } = await supabase
            .from('items')
            .select('id,title,thumbnail_url')
            .eq('id', order.item_id)
            .single()
          return { ...order, item: (itemData as OrderItem | null) ?? null }
        }),
      )

      setOrders(ordersWithItems)
      setLoading(false)
    }

    void load()
  }, [user])

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending Payment',
      paid: 'Ordered',
      picked_up: 'Picked Up',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      completed: 'Completed',
    }
    return labels[status] ?? status
  }

  return (
    <AppLayout>
      <section className="hero-card">
        <h2>My orders</h2>
        <p className="subtitle">Track all your orders and deliveries.</p>
      </section>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <LoadingSkeletonList count={4} />
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="📋"
            title="No orders yet"
            description="Start shopping to see your orders and deliveries here. Browse items and add them to your cart."
            action={
              <Link to="/" className="primary-btn">
                Browse items
              </Link>
            }
          />
        </div>
      ) : (
        <section className="grid-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card item-card">
              {order.item?.thumbnail_url && (
                <img className="item-thumb" src={order.item.thumbnail_url} alt={order.item.title} />
              )}
              <div className="item-row">
                <h3 className="item-title">{order.item?.title ?? 'Unknown item'}</h3>
                <strong>₹{order.total_amount}</strong>
              </div>
              <div className="chips">
                <span className="chip">{getStatusLabel(order.status)}</span>
                {order.delivery_type && (
                  <span className="chip">{order.delivery_type === 'express' ? 'Express' : 'Standard'}</span>
                )}
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </section>
      )}
    </AppLayout>
  )
}
