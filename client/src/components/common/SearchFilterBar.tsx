import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "./../../styles/searchfilter.scss";

export default function SearchFilterBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [keyword, setKeyword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(keyword.trim());
  };

  return (
    <form className="search-filter-bar" onSubmit={handleSubmit}>
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search LEGO sets..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <button type="submit">Search</button>
    </form>
  );
}
