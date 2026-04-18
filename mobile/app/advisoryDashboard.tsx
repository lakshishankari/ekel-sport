import { useEffect } from "react";
import { router } from "expo-router";

/**
 * AdvisoryDashboard is now consolidated into advisoryHome.
 * This file redirects any inbound navigations to the single home screen.
 */
export default function AdvisoryDashboard() {
  useEffect(() => {
    router.replace("/advisoryHome");
  }, []);
  return null;
}
