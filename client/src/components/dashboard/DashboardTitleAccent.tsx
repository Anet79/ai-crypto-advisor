/** Inline title accent — fixed 44×44px, no layout shift */
export default function DashboardTitleAccent() {
  return (
    <span className="dashboard-title-accent" aria-hidden>
      <span className="dashboard-title-accent__glow" />
      <span className="dashboard-title-accent__orbit" />
      <span className="dashboard-title-accent__coin">₿</span>
    </span>
  );
}
