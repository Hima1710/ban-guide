export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 min-h-0 p-4 md:p-6 overflow-auto">
      {children}
    </div>
  )
}
