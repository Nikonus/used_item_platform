import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

type KycDocType =
  | 'aadhaar'
  | 'pan'
  | 'passport'
  | 'voter_id'
  | 'driving_license'

type Profile = {
  full_name: string | null
  phone: string | null
  building_number: string | null
  street: string | null
  landmark: string | null
  city: string | null
  state: string | null
  pincode: string | null
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected' | null
  kyc_document_url: string | null
  kyc_doc_type: KycDocType | null
}

const KYC_DOC_OPTIONS: { value: KycDocType; label: string }[] = [
  { value: 'aadhaar',         label: 'Aadhaar Card' },
  { value: 'pan',             label: 'PAN Card' },
  { value: 'passport',        label: 'Passport' },
  { value: 'voter_id',        label: 'Voter ID (EPIC)' },
  { value: 'driving_license', label: 'Driving Licence' },
]

const kycStatusColor: Record<string, string> = {
  pending:   'badge-pending',
  submitted: 'badge-pending',
  verified:  'badge-verified',
  rejected:  'badge-rejected',
}

// ── Shared sub-components ────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 4px' }}>
    <p
      style={{
        margin: 0,
        fontSize: 11,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 600,
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: 0,
        fontSize: 15,
        lineHeight: 1.5,
        color: '#111827',
        fontWeight: 500,
        wordBreak: 'break-word',
      }}
    >
      {value}
    </p>
  </div>
)

const Divider = () => (
  <div
    style={{
      height: 1,
      background: 'rgba(15,17,16,0.08)',
    }}
  />
)

// ── Profile card (glass view) ────────────────────────────────────────────────

const ProfileCard = ({
  profile,
  onEdit,
}: {
  profile: Profile
  onEdit: () => void
}) => {
  const initials = (profile.full_name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const addressParts = [
    profile.building_number,
    profile.street,
    profile.landmark && `Near ${profile.landmark}`,
    profile.city,
    profile.state,
    profile.pincode,
  ].filter(Boolean) as string[]

  const kycStatus = profile.kyc_status ?? 'pending'
  const kycDocLabel =
    KYC_DOC_OPTIONS.find((o) => o.value === profile.kyc_doc_type)?.label ?? null

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 20,
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.05)',
        padding: '28px 26px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Page title inside card */}
      <div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>My Profile</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9ca3af' }}>Your saved details and KYC status.</p>
      </div>

      <Divider />

      {/* Header — avatar + name + phone + KYC badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--text-main)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 600,
            flexShrink: 0,
            boxShadow: '0 8px 20px rgba(15,17,16,0.28)',
            letterSpacing: '0.04em',
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {profile.full_name}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: 13, color: '#555958' }}>
            {profile.phone}
          </p>
        </div>

        <span className={`badge ${kycStatusColor[kycStatus] ?? 'badge-pending'}`}>
          {kycStatus}
        </span>
      </div>

      <Divider />

      {/* Info rows — flat, divider-separated */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {addressParts.length > 0 && (
          <>
            <InfoRow label="Address" value={addressParts.join(', ')} />
            {(kycDocLabel || profile.kyc_document_url) && <Divider />}
          </>
        )}

        {kycDocLabel && (
          <>
            <InfoRow label="Document Type" value={kycDocLabel} />
            {profile.kyc_document_url && <Divider />}
          </>
        )}

        {profile.kyc_document_url && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '14px 4px' }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
              }}
            >
              Uploaded Document
            </p>
            <a
              href={profile.kyc_document_url}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 15, color: '#2563eb', fontWeight: 500 }}
            >
              View KYC document
            </a>
          </div>
        )}
      </div>

      <Divider />

      <button
        className="primary-btn"
        type="button"
        onClick={onEdit}
        style={{ alignSelf: 'flex-start' }}
      >
        Edit profile
      </button>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export const ProfilePage = () => {
  const { user } = useAuth()

  const [profile, setProfile]     = useState<Profile | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [file, setFile]           = useState<File | null>(null)
  const [editing, setEditing]     = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      setLoading(true)

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'full_name, phone, building_number, street, landmark, city, state, pincode, kyc_status, kyc_document_url, kyc_doc_type',
        )
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        setError(error.message)
      } else {
        setProfile(
          data ?? {
            full_name: '',
            phone: '',
            building_number: '',
            street: '',
            landmark: '',
            city: '',
            state: '',
            pincode: '',
            kyc_status: 'pending',
            kyc_document_url: null,
            kyc_doc_type: null,
          },
        )
      }

      setLoading(false)
    }

    void loadProfile()
  }, [user])

  const setField = <K extends keyof Profile>(key: K, value: Profile[K]) => {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !profile) return

    setSaving(true)
    setError(null)

    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        full_name: profile.full_name,
        phone: profile.phone,
        building_number: profile.building_number,
        street: profile.street,
        landmark: profile.landmark,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
        kyc_status: profile.kyc_status ?? 'pending',
        kyc_document_url: profile.kyc_document_url,
        kyc_doc_type: profile.kyc_doc_type,
      },
      { onConflict: 'id' },
    )

    if (error) {
      setError(error.message)
    } else {
      setEditing(false)
    }

    setSaving(false)
  }

  const handleUploadKyc = async () => {
    if (!user || !file || !profile?.kyc_doc_type) return

    setUploading(true)
    setError(null)

    const filePath = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('kyc_documents')
      .upload(filePath, file)

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('kyc_documents')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        kyc_document_url: publicUrl,
        kyc_status: 'submitted',
        kyc_doc_type: profile.kyc_doc_type,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setProfile((prev) =>
        prev ? { ...prev, kyc_document_url: publicUrl, kyc_status: 'submitted' } : prev,
      )
    }

    setUploading(false)
  }

  if (loading) {
    return (
      <div className="fullscreen-center">
        <div className="card">Loading profile...</div>
      </div>
    )
  }

  if (!profile) return null

  const profileCompleted =
    profile.full_name &&
    profile.phone &&
    profile.building_number &&
    profile.street &&
    profile.city &&
    profile.state &&
    profile.pincode

  // ── Glass card view ──────────────────────────────────────────────────────
  if (profileCompleted && !editing) {
    return (
      <div className="page">
        <main className="page-content narrow profile-layout" style={{ paddingTop: 24, paddingLeft: 16, paddingRight: 16 }}>
          <ProfileCard profile={profile} onEdit={() => setEditing(true)} />
        </main>
      </div>
    )
  }

  // ── Form view ────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <main className="page-content narrow profile-layout">
        <h1>Profile & KYC</h1>
        <p className="subtitle">
          Manage your personal details and upload your identity document.
        </p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSaveProfile} className="card profile-glass form">
          <h2>Profile details</h2>

          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              value={profile.full_name ?? ''}
              onChange={(e) => setField('full_name', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              type="tel"
              value={profile.phone ?? ''}
              onChange={(e) => setField('phone', e.target.value)}
            />
          </label>

          <h3 className="mt-md">Address</h3>

          <label className="field">
            <span>Building / House number</span>
            <input
              type="text"
              value={profile.building_number ?? ''}
              onChange={(e) => setField('building_number', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Street / Area / Colony</span>
            <input
              type="text"
              value={profile.street ?? ''}
              onChange={(e) => setField('street', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Landmark</span>
            <input
              type="text"
              value={profile.landmark ?? ''}
              onChange={(e) => setField('landmark', e.target.value)}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>City</span>
              <input
                type="text"
                value={profile.city ?? ''}
                onChange={(e) => setField('city', e.target.value)}
              />
            </label>

            <label className="field">
              <span>State</span>
              <input
                type="text"
                value={profile.state ?? ''}
                onChange={(e) => setField('state', e.target.value)}
              />
            </label>

            <label className="field">
              <span>Pincode</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={profile.pincode ?? ''}
                onChange={(e) =>
                  setField('pincode', e.target.value.replace(/\D/g, ''))
                }
              />
            </label>
          </div>

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <section
          className="card profile-glass"
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <h2>KYC verification</h2>

          <p>
            Status:{' '}
            <span className={`badge badge-${profile.kyc_status ?? 'pending'}`}>
              {profile.kyc_status ?? 'pending'}
            </span>
          </p>

          <label className="field">
            <span>Document type</span>
            <select
              value={profile.kyc_doc_type ?? ''}
              onChange={(e) =>
                setField(
                  'kyc_doc_type',
                  e.target.value ? (e.target.value as KycDocType) : null,
                )
              }
            >
              <option value="">Select document type</option>
              {KYC_DOC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Identity document</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <button
            type="button"
            className="secondary-btn"
            disabled={!file || uploading || !profile.kyc_doc_type}
            onClick={handleUploadKyc}
          >
            {uploading ? 'Uploading...' : 'Upload KYC document'}
          </button>
        </section>
      </main>
    </div>
  )
}