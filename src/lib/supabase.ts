import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. Supabase client will not be initialized.');
}

const makeStub = () => {
  const noop = () => {};

  const chainable = () => {
    const obj: any = {
      data: [],
      error: null,
      select() {
        return obj;
      },
      eq() {
        return obj;
      },
      order() {
        return obj;
      },
      limit() {
        return obj;
      },
      maybeSingle: async () => ({ data: null, error: null }),
      then(resolve: any) {
        return resolve({ data: [], error: null });
      },
    };
    return obj;
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } } }),
      signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ error: { message: 'Supabase not configured' } }),
      signOut: async () => {},
    },
    from: (_: string) => chainable(),
  } as any;
};

const client = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : makeStub();

export const supabase = client as any;
