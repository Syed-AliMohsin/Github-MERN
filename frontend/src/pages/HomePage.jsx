import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import ProfileInfo from "../components/ProfileInfo";
import Repos from "../components/Repos";
import Search from "../components/Search";
import SortRepos from "../components/SortRepos";
import Spinner from "../components/Spinner";

export default function HomePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortType, setSortType] = useState("recent");

  const DEFAULT_USERNAME = "burakorkmez";

  const getUserProfileAndRepos = useCallback(async (username = DEFAULT_USERNAME) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/profile/${username}`);

      if (res.status === 404) {
        const { error } = await res.json();
        toast.error(error); // Display toast for "This user is not registered in our app."
        setUserProfile(null);
        setRepos([]);
        return;
      }

      const data = await res.json();

      if (!data.userProfile) {
        toast.error("User profile not found.");
        setUserProfile(null);
        setRepos([]);
        return;
      }

      data.repos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // descending, recent first
      setRepos(data.repos);
      setUserProfile(data.userProfile);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always load the default username profile on initial load
    getUserProfileAndRepos(DEFAULT_USERNAME);
  }, [getUserProfileAndRepos]);

  const onSearch = async (e, username) => {
    e.preventDefault();
    setLoading(true);
    setRepos([]);
    setUserProfile(null);
    await getUserProfileAndRepos(username);
    setLoading(false);
    setSortType("recent");
  };

  const onSort = (sortType) => {
    if (sortType === "recent") {
      repos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // descending, recent first
    } else if (sortType === "stars") {
      repos.sort((a, b) => b.stargazers_count - a.stargazers_count); // descending, most stars first
    } else if (sortType === "forks") {
      repos.sort((a, b) => b.forks_count - a.forks_count); // descending, most forks first
    }
    setSortType(sortType);
    setRepos([...repos]);
  };

  return (
    <div className="m-4">
      <Search onSearch={onSearch} />
      {repos.length > 0 && <SortRepos onSort={onSort} sortType={sortType} />}
      <div className="flex gap-4 flex-col lg:flex-row justify-center items-start">
        {!loading && userProfile && <ProfileInfo userProfile={userProfile} />}
        {!loading && repos.length > 0 && <Repos repos={repos} />}
        {loading && <Spinner />}
        {!loading && !userProfile && (
          <div className="text-center text-gray-500">No user profile found.</div>
        )}
      </div>
    </div>
  );
}
