'use client'

import { useEffect, useState } from 'react'
import { Place, Product } from '@/lib/types'
import { getPlaces } from '@/lib/api/places'
import { searchProducts } from '@/lib/api/products'
import { getSiteStats, recordSiteVisit } from '@/lib/api/visits'
import { supabase } from '@/lib/supabase'
import PlaceCard from '@/components/PlaceCard'
import FeaturedPlaces from '@/components/FeaturedPlaces'
import { Search, Eye, TrendingUp, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [places, setPlaces] = useState<Place[]>([])
  const [featuredPlaces, setFeaturedPlaces] = useState<Place[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [siteStats, setSiteStats] = useState({ today: 0, total: 0 })
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
    checkUser()
    recordSiteVisit().catch(err => {
      console.error('Error recording visit:', err)
    })
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('Error getting user:', userError)
        return
      }
      
      setUser(user)
      
      if (user) {
        // Check if profile exists, if not create it
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          // Profile doesn't exist, create it
          if (profileError.code === 'PGRST116' || profileError.message.includes('No rows')) {
            const { data: newProfile, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
                avatar_url: user.user_metadata?.avatar_url || null,
                is_admin: false,
                is_affiliate: false,
              })
              .select()
              .single()
            
            if (insertError) {
              console.error('Error creating profile:', insertError)
            } else {
              setUserProfile(newProfile)
            }
          } else {
            console.error('Error loading profile:', profileError)
          }
        } else {
          setUserProfile(profile)
        }
      }
    } catch (error) {
      console.error('Error in checkUser:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    router.refresh()
  }

  const loadData = async () => {
    try {
      const [allPlaces, featured, stats] = await Promise.all([
        getPlaces().catch(err => {
          console.error('Error loading places:', err)
          return []
        }),
        getPlaces(true).catch(err => {
          console.error('Error loading featured places:', err)
          return []
        }),
        getSiteStats().catch(err => {
          console.error('Error loading stats:', err)
          return { today: 0, total: 0 }
        }),
      ])
      setPlaces(allPlaces)
      setFeaturedPlaces(featured)
      setSiteStats(stats)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await searchProducts(query)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Sort places by priority (from subscription package)
  const sortedPlaces = [...places].sort((a, b) => {
    // Featured places first
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    // Then by views
    return b.total_views - a.total_views
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">دليل المحلات والصيدليات</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <Eye size={14} className="sm:w-4 sm:h-4" />
                <span>اليوم: {siteStats.today}</span>
                <span className="mx-1 sm:mx-2">|</span>
                <TrendingUp size={14} className="sm:w-4 sm:h-4" />
                <span>الإجمالي: {siteStats.total}</span>
              </div>
              {user ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt={userProfile.full_name || user.email}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                        {(userProfile?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs sm:text-sm text-gray-700 truncate max-w-[120px] sm:max-w-none">
                      {userProfile?.full_name || user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      href="/dashboard"
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <User size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">لوحة التحكم</span>
                      <span className="sm:hidden">لوحة</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <LogOut size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">تسجيل الخروج</span>
                      <span className="sm:hidden">خروج</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center text-sm sm:text-base"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن منتج أو خدمة..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mt-3 sm:mt-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="text-center py-4 text-sm sm:text-base text-gray-500">جاري البحث...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((product) => (
                    <Link
                      key={product.id}
                      href={`/places/${product.place_id}?product=${product.id}`}
                      className="block p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0].image_url}
                            alt={product.name_ar}
                            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{product.name_ar}</h3>
                          {product.price && (
                            <p className="text-xs sm:text-sm text-gray-600">
                              {product.price} {product.currency}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm sm:text-base text-gray-500">لا توجد نتائج</div>
              )}
            </div>
          )}
        </div>

        {/* Featured Places */}
        {featuredPlaces.length > 0 && <FeaturedPlaces places={featuredPlaces} />}

        {/* All Places */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-900">جميع الأماكن</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sortedPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} cardStyle={place.is_featured ? 'premium' : 'default'} />
            ))}
          </div>
          {sortedPlaces.length === 0 && (
            <div className="text-center py-12 text-gray-500">لا توجد أماكن متاحة حالياً</div>
          )}
        </div>
      </main>
    </div>
  )
}
