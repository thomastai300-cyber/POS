import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { ActivityLogger } from '@/lib/activityLogger';

type AppRole = 'admin' | 'manager' | 'cashier' | 'super_admin';

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

interface UserPermissions {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface BusinessInfo {
  id: string;
  name: string;
  is_active: boolean;
  is_whitelisted: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  permissions: UserPermissions[];
  isLoading: boolean;
  businessId: string | null;
  business: BusinessInfo | null;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, businessData?: { businessName: string; businessPhone?: string; businessAddress?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasPermission: (module: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessInfo | null>(null);

  const isSuperAdmin = role === 'super_admin';

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as UserProfile);
      }

      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();
      
      if (roleData) {
        const userRole = roleData.role as AppRole;
        setRole(userRole);
        
        // Fetch permissions for role (skip for super_admin who has all)
        if (userRole !== 'super_admin') {
          const { data: permData } = await supabase
            .from('role_permissions')
            .select('module, can_view, can_create, can_edit, can_delete')
            .eq('role', roleData.role);
          
          if (permData) {
            setPermissions(permData);
          }
        }
      }

      // Fetch business membership
      const { data: memberData } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (memberData?.business_id) {
        setBusinessId(memberData.business_id);
        const { data: bizData } = await supabase
          .from('businesses')
          .select('id, name, is_active, is_whitelisted')
          .eq('id', memberData.business_id)
          .single();
        if (bizData) {
          setBusiness(bizData as BusinessInfo);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
          setPermissions([]);
          setBusinessId(null);
          setBusiness(null);
        }
        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      setTimeout(() => ActivityLogger.login(), 100);
    }
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string, 
    password: string, 
    fullName: string,
    businessData?: { businessName: string; businessPhone?: string; businessAddress?: string }
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (error) return { error: error as Error | null };

    // Create business and membership if businessData provided
    if (data.user && businessData?.businessName) {
      try {
        const { data: bizData, error: bizError } = await supabase
          .from('businesses')
          .insert({
            name: businessData.businessName,
            phone: businessData.businessPhone || null,
            address: businessData.businessAddress || null,
            email: email,
            created_by: data.user.id,
            is_active: false,
            is_whitelisted: false,
          })
          .select()
          .single();

        if (!bizError && bizData) {
          await supabase
            .from('business_members')
            .insert({
              business_id: bizData.id,
              user_id: data.user.id,
              role: 'admin',
              is_owner: true,
            });
        }
      } catch (e) {
        console.error('Error creating business:', e);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await ActivityLogger.logout();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setPermissions([]);
    setBusinessId(null);
    setBusiness(null);
  };

  const hasPermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.module === module);
    if (!perm) return false;
    switch (action) {
      case 'view': return perm.can_view;
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      default: return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, session, profile, role, permissions, isLoading,
      businessId, business, isSuperAdmin,
      signIn, signUp, signOut, hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
