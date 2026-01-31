export const LoadingSkeleton = ({ count = 1 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-subtitle" />
            <div className="skeleton-line skeleton-price" />
          </div>
        </div>
      ))}
    </>
  )
}

export const LoadingSkeletonList = ({ count = 6 }: { count?: number }) => {
  return (
    <section className="grid-3">
      <LoadingSkeleton count={count} />
    </section>
  )
}

export const LoadingSkeletonCard = () => {
  return (
    <div className="card">
      <div className="skeleton-content">
        <div className="skeleton-line skeleton-title" style={{ width: '60%' }} />
        <div className="skeleton-line skeleton-subtitle" style={{ width: '80%', marginTop: 12 }} />
        <div className="skeleton-line skeleton-subtitle" style={{ width: '70%', marginTop: 8 }} />
      </div>
    </div>
  )
}
