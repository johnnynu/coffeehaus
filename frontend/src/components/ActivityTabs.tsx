interface ActivityTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ActivityTabs({
  activeTab,
  onTabChange,
}: ActivityTabsProps) {
  const tabs = ["nearby", "friends", "following"];

  return (
    <div className="flex justify-center space-x-8 mb-8">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`pb-2 px-1 text-lg font-medium capitalize transition-colors ${
            activeTab === tab
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
