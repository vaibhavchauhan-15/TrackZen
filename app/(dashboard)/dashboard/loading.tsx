export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="loader">
        <p className="loader-text">loading</p>
        <span className="load" />
      </div>
    </div>
  )
}
