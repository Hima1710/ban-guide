import Sidebar from '@/components/m3/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop only */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 lg:mr-[280px]">
        {children}
      </div>
    </div>
  )
}
