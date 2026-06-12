import { useEffect, useState } from "react";

export default function BranchSelect({ value, onChange }) {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/branches/")
      .then(res => res.json())
      .then(setBranches);
  }, []);

  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="">เลือกสาขา</option>
      {branches.map(b => (
        <option key={b.branch_id} value={b.branch_id}>
          {b.branch_name}
        </option>
      ))}
    </select>
  );
}
