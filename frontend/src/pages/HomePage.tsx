import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ActivityTabs from "@/components/ActivityTabs";
import ActivityCard from "@/components/ActivityCard";
import { mockActivities } from "@/lib/mockActivity";
import { useSupabaseSync } from "@/hooks/useSupabaseSync";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("nearby");
  
  useSupabaseSync();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-6 text-foreground">
            Recent Activity
          </h2>
          <ActivityTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {mockActivities.map((activity) => (
            <ActivityCard key={`activity-${activity.id}`} {...activity} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
