/**
 * useAdminManager Hook
 * 
 * Centralized hook for ALL admin operations across the app.
 * Eliminates direct Supabase calls from admin UI pages.
 * 
 * Features:
 * - Admin authorization check
 * - Package CRUD operations
 * - User management operations
 * - Affiliate management operations
 * - YouTube tokens management
 * - Discount codes management
 * - Settings management
 * 
 * Usage:
 * const { 
 *   isAdmin, 
 *   packages, 
 *   loadPackages, 
 *   createPackage, 
 *   updatePackage, 
 *   deletePackage 
 * } = useAdminManager()
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, DiscountCode } from '@/lib/types'
import { showError, showSuccess } from '@/components/SweetAlert'
import { useAuthContext } from '@/contexts/AuthContext'

interface UseAdminManagerOptions {
  autoLoadPackages?: boolean
  autoLoadUsers?: boolean
  autoLoadAffiliates?: boolean
  autoLoadDiscountCodes?: boolean
  autoLoadSubscriptions?: boolean
}

interface PackageFormData {
  name_ar: string
  name_en: string
  price: number
  max_places: number
  max_product_videos: number
  max_product_images: number
  max_place_videos: number
  priority: number
  card_style: string
  is_featured: boolean
}

interface UserData {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  is_admin: boolean
  is_affiliate: boolean
  created_at: string
}

interface AffiliateData {
  id: string
  user_id: string
  code: string
  discount_percentage: number
  commission_percentage: number
  total_earnings: number
  pending_earnings: number
  paid_earnings: number
  is_active: boolean
  created_at: string
  user?: UserData
}

// Using DiscountCode from types.ts
// Note: DiscountCode uses start_date/end_date, not expires_at

export function useAdminManager(options: UseAdminManagerOptions = {}) {
  const { user, loading: authLoading } = useAuthContext()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Packages state
  const [packages, setPackages] = useState<Package[]>([])
  const [packagesLoading, setPackagesLoading] = useState(false)
  
  // Users state
  const [users, setUsers] = useState<UserData[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  
  // Affiliates state
  const [affiliates, setAffiliates] = useState<AffiliateData[]>([])
  const [affiliatesLoading, setAffiliatesLoading] = useState(false)
  
  // Discount codes state
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [discountCodesLoading, setDiscountCodesLoading] = useState(false)

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false)

  /**
   * Check if the current user has admin privileges.
   * Do not set loading=false when user is null while auth is still loading (avoids redirect before auth is ready).
   */
  const checkAdmin = useCallback(async () => {
    if (!user) {
      setIsAdmin(false)
      // Only set loading false when auth has finished (so we don't redirect before AuthContext is ready)
      if (!authLoading) setLoading(false)
      return false
    }

    try {
      const { data: profileRow, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      const profile = profileRow as { is_admin?: boolean } | null

      if (error) throw error

      const adminStatus = profile?.is_admin || false
      setIsAdmin(adminStatus)
      setLoading(false)
      return adminStatus
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error checking admin status:', error)
      setIsAdmin(false)
      setLoading(false)
      return false
    }
  }, [user, authLoading])

  // Check admin status when user or auth loading state changes
  useEffect(() => {
    if (authLoading) return
    checkAdmin()
  }, [authLoading, checkAdmin])

  // When auth finishes with no user, mark admin check as done
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false)
      setIsAdmin(false)
    }
  }, [authLoading, user])

  // Auto-load data based on options
  useEffect(() => {
    if (!isAdmin) return

    if (options.autoLoadPackages) {
      loadPackages()
    }
    if (options.autoLoadUsers) {
      loadUsers()
    }
    if (options.autoLoadAffiliates) {
      loadAffiliates()
    }
    if (options.autoLoadDiscountCodes) {
      loadDiscountCodes()
    }
    if (options.autoLoadSubscriptions) {
      loadSubscriptions()
    }
  }, [isAdmin, options])

  // ============================================
  // PACKAGES CRUD OPERATIONS
  // ============================================

  /**
   * Load all packages from the database
   */
  const loadPackages = useCallback(async () => {
    if (!isAdmin) return

    setPackagesLoading(true)
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error

      setPackages(data || [])
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error loading packages:', error)
      showError('فشل تحميل الباقات: ' + error.message)
    } finally {
      setPackagesLoading(false)
    }
  }, [isAdmin])

  /**
   * Create a new package
   */
  const createPackage = useCallback(async (formData: PackageFormData) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لإضافة باقة')
      return false
    }

    try {
      const { error } = await supabase
        .from('packages')
        .insert(formData as never)

      if (error) throw error

      showSuccess('تم إضافة الباقة بنجاح')
      await loadPackages() // Reload packages
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error creating package:', error)
      showError('فشل إضافة الباقة: ' + error.message)
      return false
    }
  }, [isAdmin, loadPackages])

  /**
   * Update an existing package
   */
  const updatePackage = useCallback(async (id: string, formData: PackageFormData) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لتعديل الباقة')
      return false
    }

    try {
      const { error } = await supabase
        .from('packages')
        .update(formData as never)
        .eq('id', id)

      if (error) throw error

      showSuccess('تم تحديث الباقة بنجاح')
      await loadPackages() // Reload packages
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error updating package:', error)
      showError('فشل تحديث الباقة: ' + error.message)
      return false
    }
  }, [isAdmin, loadPackages])

  /**
   * Delete a package (only if not used in any subscription)
   */
  const deletePackage = useCallback(async (id: string) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لحذف الباقة')
      return false
    }

    try {
      const { count, error: countError } = await supabase
        .from('user_subscriptions')
        .select('id', { count: 'exact', head: true })
        .eq('package_id', id)

      if (countError) throw countError
      if ((count ?? 0) > 0) {
        showError('لا يمكن حذف الباقة: مستخدمة في اشتراكات حالية. أوقف أو غيّر الاشتراكات أولاً.')
        return false
      }

      const { error } = await supabase
        .from('packages')
        .delete()
        .eq('id', id)

      if (error) throw error

      showSuccess('تم حذف الباقة بنجاح')
      await loadPackages() // Reload packages
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error deleting package:', error)
      showError('فشل حذف الباقة: ' + error.message)
      return false
    }
  }, [isAdmin, loadPackages])

  // ============================================
  // USERS MANAGEMENT OPERATIONS
  // ============================================

  /**
   * Load all users
   */
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return

    setUsersLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error loading users:', error)
      showError('فشل تحميل المستخدمين: ' + error.message)
    } finally {
      setUsersLoading(false)
    }
  }, [isAdmin])

  /**
   * Update user admin status
   */
  const updateUserAdminStatus = useCallback(async (userId: string, isAdmin: boolean) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لتعديل المستخدم')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: isAdmin } as never)
        .eq('id', userId)

      if (error) throw error

      showSuccess('تم تحديث صلاحيات المستخدم بنجاح')
      await loadUsers()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error updating user admin status:', error)
      showError('فشل تحديث صلاحيات المستخدم: ' + error.message)
      return false
    }
  }, [isAdmin, loadUsers])

  /**
   * Update user affiliate status
   */
  const updateUserAffiliateStatus = useCallback(async (userId: string, isAffiliate: boolean) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لتعديل المستخدم')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_affiliate: isAffiliate } as never)
        .eq('id', userId)

      if (error) throw error

      showSuccess('تم تحديث حالة المسوق بنجاح')
      await loadUsers()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error updating user affiliate status:', error)
      showError('فشل تحديث حالة المسوق: ' + error.message)
      return false
    }
  }, [isAdmin, loadUsers])

  // ============================================
  // AFFILIATES MANAGEMENT OPERATIONS
  // ============================================

  /**
   * Load all affiliates with user data
   */
  const loadAffiliates = useCallback(async () => {
    if (!isAdmin) return

    setAffiliatesLoading(true)
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select(`
          *,
          user:user_profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setAffiliates(data || [])
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error loading affiliates:', error)
      showError('فشل تحميل المسوقين: ' + error.message)
    } finally {
      setAffiliatesLoading(false)
    }
  }, [isAdmin])

  /**
   * Create a new affiliate
   */
  const createAffiliate = useCallback(async (data: {
    user_id: string
    code: string
    discount_percentage: number
    commission_percentage: number
  }) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لإضافة مسوق')
      return false
    }

    try {
      const { error } = await supabase
        .from('affiliates')
        .insert(data as never)

      if (error) throw error

      showSuccess('تم إضافة المسوق بنجاح')
      await loadAffiliates()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error creating affiliate:', error)
      showError('فشل إضافة المسوق: ' + error.message)
      return false
    }
  }, [isAdmin, loadAffiliates])

  /**
   * Update affiliate data
   */
  const updateAffiliate = useCallback(async (id: string, data: Partial<AffiliateData>) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لتعديل المسوق')
      return false
    }

    try {
      const { error } = await supabase
        .from('affiliates')
        .update(data as never)
        .eq('id', id)

      if (error) throw error

      showSuccess('تم تحديث بيانات المسوق بنجاح')
      await loadAffiliates()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error updating affiliate:', error)
      showError('فشل تحديث بيانات المسوق: ' + error.message)
      return false
    }
  }, [isAdmin, loadAffiliates])

  /**
   * Delete an affiliate
   */
  const deleteAffiliate = useCallback(async (id: string) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لحذف المسوق')
      return false
    }

    try {
      const { error } = await supabase
        .from('affiliates')
        .delete()
        .eq('id', id)

      if (error) throw error

      showSuccess('تم حذف المسوق بنجاح')
      await loadAffiliates()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error deleting affiliate:', error)
      showError('فشل حذف المسوق: ' + error.message)
      return false
    }
  }, [isAdmin, loadAffiliates])

  // ============================================
  // DISCOUNT CODES MANAGEMENT OPERATIONS
  // ============================================

  /**
   * Load all discount codes
   */
  const loadDiscountCodes = useCallback(async () => {
    if (!isAdmin) return

    setDiscountCodesLoading(true)
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setDiscountCodes(data || [])
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error loading discount codes:', error)
      showError('فشل تحميل أكواد الخصم: ' + error.message)
    } finally {
      setDiscountCodesLoading(false)
    }
  }, [isAdmin])

  /**
   * Create a new discount code
   */
  const createDiscountCode = useCallback(async (data: any) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لإضافة كود خصم')
      return false
    }

    try {
      const { error } = await supabase
        .from('discount_codes')
        .insert(data as never)

      if (error) throw error

      showSuccess('تم إضافة كود الخصم بنجاح')
      await loadDiscountCodes()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error creating discount code:', error)
      showError('فشل إضافة كود الخصم: ' + error.message)
      return false
    }
  }, [isAdmin, loadDiscountCodes])

  /**
   * Update a discount code
   */
  const updateDiscountCode = useCallback(async (id: string, data: Partial<DiscountCode>) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لتعديل كود الخصم')
      return false
    }

    try {
      const { error } = await supabase
        .from('discount_codes')
        .update(data as never)
        .eq('id', id)

      if (error) throw error

      showSuccess('تم تحديث كود الخصم بنجاح')
      await loadDiscountCodes()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error updating discount code:', error)
      showError('فشل تحديث كود الخصم: ' + error.message)
      return false
    }
  }, [isAdmin, loadDiscountCodes])

  /**
   * Delete a discount code
   */
  const deleteDiscountCode = useCallback(async (id: string) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لحذف كود الخصم')
      return false
    }

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', id)

      if (error) throw error

      showSuccess('تم حذف كود الخصم بنجاح')
      await loadDiscountCodes()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error deleting discount code:', error)
      showError('فشل حذف كود الخصم: ' + error.message)
      return false
    }
  }, [isAdmin, loadDiscountCodes])

  // ============================================
  // SUBSCRIPTIONS MANAGEMENT OPERATIONS
  // ============================================

  /**
   * Load all subscriptions with package and user
   */
  const loadSubscriptions = useCallback(async () => {
    if (!isAdmin) return

    setSubscriptionsLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, package:packages(*), user:user_profiles(*)')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSubscriptions(data || [])
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error loading subscriptions:', error)
      showError('فشل تحميل الاشتراكات: ' + error.message)
    } finally {
      setSubscriptionsLoading(false)
    }
  }, [isAdmin])

  /**
   * Approve a subscription
   */
  const approveSubscription = useCallback(async (id: string) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات للموافقة على الاشتراك')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'approved', is_active: true } as never)
        .eq('id', id)

      if (error) throw error

      showSuccess('تم الموافقة على الاشتراك بنجاح')
      await loadSubscriptions()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error approving subscription:', error)
      showError('فشل الموافقة على الاشتراك: ' + error.message)
      return false
    }
  }, [isAdmin, loadSubscriptions])

  /**
   * Reject a subscription
   */
  const rejectSubscription = useCallback(async (id: string) => {
    if (!isAdmin) {
      showError('ليس لديك صلاحيات لرفض الاشتراك')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'rejected', is_active: false } as never)
        .eq('id', id)

      if (error) throw error

      showSuccess('تم رفض الاشتراك بنجاح')
      await loadSubscriptions()
      return true
    } catch (error: any) {
      console.error('❌ [useAdminManager] Error rejecting subscription:', error)
      showError('فشل رفض الاشتراك: ' + error.message)
      return false
    }
  }, [isAdmin, loadSubscriptions])

  return {
    // Admin status
    isAdmin,
    loading,
    checkAdmin,

    // Packages
    packages,
    packagesLoading,
    loadPackages,
    createPackage,
    updatePackage,
    deletePackage,

    // Users
    users,
    usersLoading,
    loadUsers,
    updateUserAdminStatus,
    updateUserAffiliateStatus,

    // Affiliates
    affiliates,
    affiliatesLoading,
    loadAffiliates,
    createAffiliate,
    updateAffiliate,
    deleteAffiliate,

    // Discount codes
    discountCodes,
    discountCodesLoading,
    loadDiscountCodes,
    createDiscountCode,
    updateDiscountCode,
    deleteDiscountCode,

    // Subscriptions
    subscriptions,
    subscriptionsLoading,
    loadSubscriptions,
    approveSubscription,
    rejectSubscription,
  }
}
