import { useEffect, useState } from 'react';
import { Link } from '@/context/RouterContext';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Loader2, User as UserIcon, MapPin, Mail, Phone } from 'lucide-react';
import type { Profile } from '@/types';

export function AccountPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [form, setForm] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Sign in to view your account</h1>
        <Link to="/login" className="text-stone-900 font-medium hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400 mx-auto" />
      </div>
    );
  }

  function update(field: keyof Profile, value: string) {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || !user) return;
    setSaving(true);
    setSaved(false);
    await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        address_line1: form.address_line1,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        country: form.country,
      })
      .eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-stone-900 mb-8">My Account</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
              <UserIcon className="w-8 h-8 text-stone-500" />
            </div>
            <p className="font-semibold text-stone-900">{form.full_name || 'Customer'}</p>
            <p className="text-sm text-stone-500">{user.email}</p>
            {profile?.role === 'admin' && (
              <span className="inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-stone-900 text-white">
                Administrator
              </span>
            )}
            <div className="mt-4 pt-4 border-t border-stone-200 space-y-2">
              <Link to="/orders" className="block text-sm text-stone-600 hover:text-stone-900 transition">
                My Orders
              </Link>
              <button
                onClick={() => signOut()}
                className="block w-full text-sm text-stone-600 hover:text-stone-900 transition text-center"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-stone-900 mb-1">Profile Information</h2>
              <p className="text-sm text-stone-500">Update your personal details and shipping address.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={form.full_name || ''}
                    onChange={(e) => update('full_name', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="tel"
                    value={form.phone || ''}
                    onChange={(e) => update('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200">
              <h3 className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Shipping Address
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={form.address_line1 || ''}
                    onChange={(e) => update('address_line1', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city || ''}
                    onChange={(e) => update('city', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">State</label>
                  <input
                    type="text"
                    value={form.state || ''}
                    onChange={(e) => update('state', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Postal Code</label>
                  <input
                    type="text"
                    value={form.postal_code || ''}
                    onChange={(e) => update('postal_code', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={form.country || ''}
                    onChange={(e) => update('country', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:bg-white focus:border-stone-900 transition"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-stone-900 text-white font-semibold rounded-full hover:bg-stone-700 disabled:opacity-60 transition flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save changes
              </button>
              {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
