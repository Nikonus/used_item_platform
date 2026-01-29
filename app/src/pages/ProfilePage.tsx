import { type FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

type Profile = {
  full_name: string | null
  phone: string | null
  kyc_status: 'pending' | 'verified' | 'rejected' | null
  kyc_document_url: string | null
}

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
        .select('full_name, phone, kyc_status, kyc_document_url')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        setError(error.message)
      } else {
        setProfile(
          data ?? {
            full_name: '',
            phone: '',
            kyc_status: 'pending',
            kyc_document_url: null,
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
        kyc_status: profile.kyc_status ?? 'pending',
        kyc_document_url: profile.kyc_document_url,
      },
      { onConflict: 'id' },
    )

    if (error) setError(error.message)
    setSaving(false)
  }

  const handleUploadKyc = async () => {
    if (!user || !file) return
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
      <main className="page-content narrow">
        <h1>Profile & KYC</h1>
        <p className="subtitle">
          Yahan se apni personal details manage karo aur identity document upload karo.
        </p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSaveProfile} className="card form">
          <h2>Profile details</h2>
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              value={profile.full_name ?? ''}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, full_name: e.target.value } : p))
              }
              placeholder="Your full name"
            />
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              type="tel"
              value={profile.phone ?? ''}
              onChange={(e) =>
                setProfile((p) => (p ? { ...p, phone: e.target.value } : p))
              }
              placeholder="+91-XXXXXXXXXX"
            />
          </label>

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <section className="card">
          <h2>KYC verification</h2>
          <p>
            Status:{' '}
            <span className={`badge badge-${profile.kyc_status ?? 'pending'}`}>
              {profile.kyc_status ?? 'pending'}
            </span>
          </p>

          <div className="field">
            <span>Identity document</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <button
            type="button"
            className="secondary-btn"
            disabled={!file || uploading}
            onClick={handleUploadKyc}
          >
            {uploading ? 'Uploading...' : 'Upload KYC document'}
          </button>

          {profile.kyc_document_url && (
            <p className="mt-sm">
              Current document:{' '}
              <a href={profile.kyc_document_url} target="_blank" rel="noreferrer">
                View file
              </a>
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

