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
  // Address fields
  building_number: string | null
  street: string | null
  landmark: string | null
  city: string | null
  state: string | null
  pincode: string | null
  // KYC
  kyc_status: 'pending' | 'verified' | 'rejected' | null
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

export const ProfilePage = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

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

    if (error) setError(error.message)
    setSaving(false)
  }

  // Generic field updater
  const setField = <K extends keyof Profile>(key: K, value: Profile[K]) =>
    setProfile((p) => (p ? { ...p, [key]: value } : p))

  const handleUploadKyc = async () => {
    if (!user || !file) return

    if (!profile?.kyc_doc_type) {
      setError('Please select a document type before uploading.')
      return
    }

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
        kyc_status: 'pending',
        kyc_doc_type: profile.kyc_doc_type,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              kyc_document_url: publicUrl,
              kyc_status: 'pending',
              kyc_doc_type: profile.kyc_doc_type,
            }
          : prev,
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

  return (
    <div className="page">
      <main className="page-content">
        <h1>Profile & KYC</h1>
        <p className="subtitle">
          Yahan se apni personal details manage karo aur identity document upload karo.
        </p>

        {error && <p className="error">{error}</p>}

        {/* ── Personal Details ── */}
        <form onSubmit={handleSaveProfile} className="card form">
          <h2>Profile details</h2>

          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              value={profile.full_name ?? ''}
              onChange={(e) => setField('full_name', e.target.value)}
              placeholder="Your full name"
            />
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              type="tel"
              value={profile.phone ?? ''}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+91-XXXXXXXXXX"
            />
          </label>

          {/* ── Address ── */}
          <h3 className="mt-md">Address</h3>

          <label className="field">
            <span>Building / House number</span>
            <input
              type="text"
              value={profile.building_number ?? ''}
              onChange={(e) => setField('building_number', e.target.value)}
              placeholder="e.g. A-204, Shree Residency"
            />
          </label>

          <label className="field">
            <span>Street / Area / Colony</span>
            <input
              type="text"
              value={profile.street ?? ''}
              onChange={(e) => setField('street', e.target.value)}
              placeholder="e.g. MG Road, Vijay Nagar"
            />
          </label>

          <label className="field">
            <span>Landmark</span>
            <input
              type="text"
              value={profile.landmark ?? ''}
              onChange={(e) => setField('landmark', e.target.value)}
              placeholder="e.g. Near Hanuman Temple"
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>City</span>
              <input
                type="text"
                value={profile.city ?? ''}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="e.g. Jabalpur"
              />
            </label>

            <label className="field">
              <span>State</span>
              <input
                type="text"
                value={profile.state ?? ''}
                onChange={(e) => setField('state', e.target.value)}
                placeholder="e.g. Madhya Pradesh"
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
                placeholder="e.g. 482001"
              />
            </label>
          </div>

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        {/* ── KYC ── */}
        <section className="card">
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
                setField('kyc_doc_type', e.target.value ? (e.target.value as KycDocType) : null)
              }
            >
              <option value="" disabled>
                — Select document type —
              </option>
              {KYC_DOC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field" htmlFor="kyc-file-input">
            <span>Identity document</span>
            <input
              id="kyc-file-input"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="secondary-btn"
              disabled={!file || uploading || !profile.kyc_doc_type}
              onClick={handleUploadKyc}
              style={{ alignSelf: 'flex-start' }}
            >
              {uploading ? 'Uploading...' : 'Upload KYC document'}
            </button>

            {profile.kyc_document_url && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                ✅ Current document:{' '}
                <a
                  href={profile.kyc_document_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  View uploaded file ↗
                </a>
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}