import DashboardTitleAccent from "./DashboardTitleAccent";

type DashboardHeaderProps = {
  userName: string;
};

function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  const firstName = getFirstName(userName);

  return (
    <header className="dashboard-header">
      <h1 className="dashboard-header__title-row">
        <span className="dashboard-header__title-text">
          Hello, {firstName}
        </span>
        <DashboardTitleAccent />
      </h1>
    </header>
  );
}
